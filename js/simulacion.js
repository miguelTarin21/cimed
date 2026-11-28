let preguntas = [];
let preguntaActual = 0;
let respuestasSeleccionadas = [];
let mostrarExplicacion = false;
let bloqueado = false;

// ═══════════════════════════════════════════════════════
//  Signos vitales globales y estado del Monitor
// ═══════════════════════════════════════════════════════
let ecgVitals = { FC: 75, FR: 16, CO2: 38, TA: '120/80', Temperatura: 37.0, SAT: 98, ritmo: 'sinusal' };
let isPatientConnected = true;
let isMonitorTabActive = false;
let connectionSeconds = 0;
let connectionTimerInterval = null;
let wasCardiacArrest = false;

// Helper para obtener presión sistólica y diastólica respetando el 0
function parseTA(taStr) {
    const parts = String(taStr ?? '120/80').split('/');
    const rawSis = parseInt(parts[0]);
    const rawDia = parseInt(parts[1]);
    return {
        sys: !isNaN(rawSis) ? rawSis : 120,
        dia: !isNaN(rawDia) ? rawDia : 80
    };
}

// Determina si el paciente está en paro circulatorio (sin pulso o presión en 0)
function isCardiacArrest() {
    const rhythm = ecgVitals.ritmo || 'sinusal';
    const fc = ecgVitals.FC ?? 0;
    const { sys } = parseTA(ecgVitals.TA);
    return rhythm === 'asistole' || rhythm === 'fv' || fc <= 0 || sys <= 0;
}

// ═══════════════════════════════════════════════════════
//  WaveformChannel — motor de canales del Monitor
// ═══════════════════════════════════════════════════════
class WaveformChannel {
    constructor(canvas, type, color) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type;
        this.color = color;
        this.width = 0;
        this.height = canvas.height || 100;
        this.data = null;
        this.writePos = 0;
        this.phase = Math.random();
        this.speed = 2;
        this._raf = null;
    }

    resize(w, h) {
        this.width = Math.max(w, 50);
        this.height = Math.max(h || this.canvas.parentElement?.clientHeight || 95, 45);
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.data = new Float32Array(this.width).fill(this.height / 2);
        this.writePos = 0;
    }

    flattenBuffer() {
        if (!this.data) return;
        this.data.fill(this.height / 2);
    }

    // ── Formas de onda ──────────────────────────────
    _ecgSample(t) {
        const rhythm = ecgVitals.ritmo || 'sinusal';
        const fc = ecgVitals.FC ?? 0;
        const { sys } = parseTA(ecgVitals.TA);

        if (rhythm === 'asistole' || (fc <= 0 && rhythm !== 'fv') || (sys <= 0 && rhythm !== 'fv')) {
            return 0.5;
        }

        if (rhythm === 'fv') {
            const nowSec = Date.now() / 1000;
            const env = 0.70 + 0.30 * Math.abs(Math.sin(nowSec * 0.05 * Math.PI));
            return 0.5 + (Math.sin(nowSec * 7.3) * 0.30
                        + Math.sin(nowSec * 13.9) * 0.22
                        + Math.sin(nowSec * 21.5) * 0.14
                        + Math.sin(nowSec * 37.1) * 0.08
                        + (Math.random() - 0.5) * 0.12) * env;
        }

        const g = (c, a, s) => a * Math.exp(-Math.pow((t - c) / s, 2));

        if (rhythm === 'st_elevacion') {
            return g(0.18, 0.20, 0.042)
                + g(0.42, -0.08, 0.012)
                + g(0.47, 1.00, 0.013)
                + g(0.52, -0.12, 0.011)
                + g(0.63, 0.55, 0.075)
                + g(0.78, 0.50, 0.055);
        }

        if (rhythm === 'st_depresion') {
            return g(0.18, 0.20, 0.042)
                + g(0.42, -0.10, 0.013)
                + g(0.47, 1.00, 0.013)
                + g(0.52, -0.28, 0.013)
                + g(0.61, -0.28, 0.055)
                + g(0.75, -0.18, 0.048);
        }

        if (rhythm === 'taquicardia') {
            return g(0.28, 0.30, 0.060)
                + g(0.42, 0.95, 0.050)
                + g(0.56, -0.50, 0.060)
                + g(0.73, -0.30, 0.060);
        }

        return g(0.20, 0.22, 0.045)
            + g(0.43, -0.18, 0.014)
            + g(0.48, 1.00, 0.014)
            + g(0.53, -0.32, 0.014)
            + g(0.70, 0.34, 0.050);
    }

    _spo2Sample(t) {
        if (isCardiacArrest() || (ecgVitals.SAT ?? 0) <= 0) {
            return 0.5;
        }
        if (t < 0.28) {
            return Math.sin((t / 0.28) * (Math.PI / 2));
        } else if (t < 0.52) {
            const p = (t - 0.28) / 0.24;
            return 1.0 - p * 0.65;
        } else if (t < 0.72) {
            const p = (t - 0.52) / 0.20;
            return 0.35 + Math.sin(p * Math.PI) * 0.16 - p * 0.15;
        } else {
            const p = (t - 0.72) / 0.28;
            return Math.max(0, 0.20 * (1 - p));
        }
    }

    _co2Sample(t) {
        const fr = ecgVitals.FR ?? 0;
        const co2 = ecgVitals.CO2 ?? 38;
        if (fr <= 0 || co2 <= 0 || isCardiacArrest()) return 0;
        const scale = Math.min(1.0, Math.max(0.15, co2 / 45));
        if (t < 0.07) return 0;
        if (t < 0.17) return ((t - 0.07) / 0.10) * scale;
        if (t < 0.58) return (1.0 - (t - 0.17) / 0.41 * 0.07) * scale;
        if (t < 0.66) return Math.max(0, 0.93 - (t - 0.58) / 0.08 * 0.93) * scale;
        return 0;
    }

    _respSample(t) {
        const fr = ecgVitals.FR ?? 0;
        if (fr <= 0 || isCardiacArrest()) return 0.5;
        const wave = Math.sin(t * 2 * Math.PI - Math.PI / 2) * 0.5 + 0.5;
        return Math.pow(wave, 1.35);
    }

    sample(t) {
        switch (this.type) {
            case 'ecg': return this._ecgSample(t);
            case 'spo2': return this._spo2Sample(t);
            case 'co2': return this._co2Sample(t);
            case 'resp': return this._respSample(t);
            default: return 0.5;
        }
    }

    pixelsPerCycle() {
        const fc = Math.max(ecgVitals.FC || 0, 1);
        const fr = Math.max(ecgVitals.FR || 0, 1);
        switch (this.type) {
            case 'ecg':
            case 'spo2':
                return (120 * 60) / fc;
            case 'co2':
            case 'resp':
                return (95 * 60) / fr;
            default:
                return 100;
        }
    }

    isChannelFlat() {
        const rhythm = ecgVitals.ritmo || 'sinusal';
        const arrest = isCardiacArrest();
        if (this.type === 'ecg') return arrest && rhythm !== 'fv';
        if (this.type === 'spo2') return arrest || (ecgVitals.SAT ?? 0) <= 0;
        if (this.type === 'co2') return arrest || (ecgVitals.FR ?? 0) <= 0 || (ecgVitals.CO2 ?? 38) <= 0;
        if (this.type === 'resp') return arrest || (ecgVitals.FR ?? 0) <= 0;
        return false;
    }

    update() {
        if (!this.data || !this.width) return;

        this.phase += this.speed / this.pixelsPerCycle();
        if (this.phase >= 1) this.phase -= 1;

        const val = this.sample(this.phase);
        const cx = this.height / 2;
        const amp = this.height * 0.36;
        const rhythm = ecgVitals.ritmo || 'sinusal';
        const arrest = isCardiacArrest();
        const isFV = (this.type === 'ecg' && rhythm === 'fv');

        if (this.type === 'co2') {
            if ((ecgVitals.FR ?? 0) <= 0 || (ecgVitals.CO2 ?? 38) <= 0 || arrest) {
                this.data[this.writePos] = cx;
            } else {
                this.data[this.writePos] = (this.height - 12) - val * (this.height - 26);
            }
        } else if (this.type === 'resp') {
            if ((ecgVitals.FR ?? 0) <= 0 || arrest) {
                this.data[this.writePos] = cx;
            } else {
                this.data[this.writePos] = (this.height - 14) - val * (this.height - 28);
            }
        } else if (this.type === 'spo2') {
            if (arrest || (ecgVitals.SAT ?? 0) <= 0) {
                this.data[this.writePos] = cx;
            } else {
                this.data[this.writePos] = (this.height - 16) - val * (this.height - 30);
            }
        } else if (isFV) {
            this.data[this.writePos] = cx - (val - 0.5) * amp * 2.3;
        } else if (arrest) {
            this.data[this.writePos] = cx;
        } else {
            this.data[this.writePos] = (cx + amp * 0.35) - val * amp * 1.15;
        }
        this.writePos = (this.writePos + 1) % this.width;
    }

    draw() {
        const ctx = this.ctx;
        if (!this.width || !this.height) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.width, this.height);

        const flat = this.isChannelFlat();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        if (flat) {
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(this.width, this.height / 2);
            ctx.stroke();
            return;
        }

        for (let i = 0; i < this.width; i++) {
            const y = this.data[i];
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();

        const xW = (this.writePos === 0 ? this.width - 1 : this.writePos - 1);
        ctx.fillStyle = '#000000';
        ctx.fillRect(xW, 0, 18, this.height);
    }

    tick() {
        this.update();
        this.draw();
        this._raf = requestAnimationFrame(() => this.tick());
    }

    start() {
        if (!this._raf) {
            this._raf = requestAnimationFrame(() => this.tick());
        }
    }

    stop() {
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
    }
}

// ═══════════════════════════════════════════════════════
//  Clasificación de signos vitales
// ═══════════════════════════════════════════════════════
function getVitalClass(type, value) {
    if (type === 'fc') {
        if (value < 40 || value > 150) return 'critical';
        if (value < 60 || value > 100) return 'warning';
        return 'normal';
    }
    if (type === 'fr') {
        if (value < 8 || value > 30) return 'critical';
        if (value < 12 || value > 20) return 'warning';
        return 'normal';
    }
    if (type === 'sat') {
        if (value < 90) return 'critical';
        if (value < 95) return 'warning';
        return 'normal';
    }
    if (type === 'temp') {
        if (value < 35 || value > 39) return 'critical';
        if (value < 36.0 || value > 37.5) return 'warning';
        return 'normal';
    }
    if (type === 'ta') {
        if (value <= 60 || value >= 180) return 'critical';
        if (value < 90 || value >= 130) return 'warning';
        return 'normal';
    }
    if (type === 'co2') {
        if (value < 25 || value > 55) return 'critical';
        if (value < 35 || value > 45) return 'warning';
        return 'normal';
    }
    return 'normal';
}

function setVitalCard(cardId, displayId, value, displayText, type) {
    const card = document.getElementById(cardId);
    const disp = document.getElementById(displayId);
    if (!card || !disp) return;
    const cls = getVitalClass(type, value);
    const base = card.dataset.baseClass || card.className.split(' ')[0];
    card.dataset.baseClass = base;
    card.className = base + (cls !== 'normal' ? ' mv-' + cls : '');
    disp.textContent = displayText;
}

// ═══════════════════════════════════════════════════════
//  Actualizar UI del monitor con signos vitales
// ═══════════════════════════════════════════════════════
function updateVitalsUI(signos) {
    if (signos) {
        const rawFc = parseInt(signos.FC);
        const rawFr = parseInt(signos.FR);
        const rawCo2 = parseInt(signos.CO2);
        const rawSat = parseInt(signos.SAT);
        const rawTemp = parseFloat(signos.Temperatura);

        const fc = !isNaN(rawFc) ? rawFc : 0;
        const fr = !isNaN(rawFr) ? rawFr : 0;
        const co2 = !isNaN(rawCo2) ? rawCo2 : 38;
        const sat = !isNaN(rawSat) ? rawSat : 0;
        const temp = !isNaN(rawTemp) ? rawTemp : 37.0;
        const ta = (signos.TA !== null && signos.TA !== undefined && signos.TA !== '') ? String(signos.TA) : '0/0';
        const ritmo = signos.ritmo || 'sinusal';

        ecgVitals = { FC: fc, FR: fr, CO2: co2, TA: ta, Temperatura: temp, SAT: sat, ritmo: ritmo };

        const arrestNow = isCardiacArrest();
        if (arrestNow && !wasCardiacArrest) {
            (window._channels || []).forEach(ch => ch.flattenBuffer());
        }
        wasCardiacArrest = arrestNow;

        // Textos estáticos de la pestaña Caso
        const _set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        _set('fr-paciente', fr);
        _set('fc-paciente', fc);
        _set('ta-paciente', ta);
        _set('temp-paciente', temp ? temp.toFixed(1) : '0.0');
        _set('sat-paciente', sat);
    }

    renderMonitorValues();
    if (window._monitorAudio) {
        window._monitorAudio.onVitalsUpdated();
    }
}

function renderMonitorValues() {
    const _set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    const fc = ecgVitals.FC ?? 0;
    const fr = ecgVitals.FR ?? 0;
    const co2 = ecgVitals.CO2 ?? 38;
    const sat = ecgVitals.SAT ?? 0;
    const temp = ecgVitals.Temperatura ?? 37.0;
    const { sys, dia } = parseTA(ecgVitals.TA);
    const arrest = isCardiacArrest();

    // Presión arterial media (MAP): 0 si la presión es 0/0
    const map = (sys <= 0 && dia <= 0) ? 0 : Math.round(dia + (sys - dia) / 3);

    // Capnografía CO2 (etCO2 en mmHg): valor controlado desde el panel (0 si FR=0, CO2=0 o paro cardíaco)
    const etco2 = (fr <= 0 || co2 <= 0 || arrest) ? 0 : co2;

    // Pulso periférico: 0 si hay paro circulatorio (FC=0 o TA=0/0)
    const pulseVal = arrest ? 0 : fc;

    setVitalCard('card-fc', 'vi-fc', fc, arrest ? 0 : fc, 'fc');
    setVitalCard('card-sat', 'vi-sat', sat, (arrest || sat <= 0) ? 0 : sat, 'sat');
    setVitalCard('card-co2', 'vi-etco2', etco2, etco2, 'co2');
    setVitalCard('card-fr', 'vi-fr', fr, (arrest || fr <= 0) ? 0 : fr, 'fr');
    setVitalCard('card-temp', 'vi-temp', temp, temp.toFixed(1), 'temp');

    _set('vi-ta', `${sys}/${dia}`);
    _set('vi-map', `(${map})`);
    _set('vi-pulse', pulseVal);

    // Actualizar primera fila del historial NBP con la presión actual
    const histEl = document.getElementById('vi-nbp-history');
    if (histEl && histEl.firstElementChild) {
        const spans = histEl.firstElementChild.querySelectorAll('span');
        if (spans.length === 2) {
            spans[1].textContent = `${sys}/${dia} (${map})`;
        }
    }
}

// ═══════════════════════════════════════════════════════
//  Reloj del Monitor
// ═══════════════════════════════════════════════════════
function startMonitorClock() {
    if (connectionTimerInterval) return;
    const clockEl = document.getElementById('vi-clock');
    connectionTimerInterval = setInterval(() => {
        connectionSeconds++;
        const mins = Math.floor(connectionSeconds / 60);
        const secs = connectionSeconds % 60;
        if (clockEl) {
            clockEl.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;
        }
    }, 1000);
}

// ═══════════════════════════════════════════════════════
//  Sincronización en tiempo real (0ms entre pestañas + Polling 1s sin caché)
// ═══════════════════════════════════════════════════════
function handleLiveBroadcast(payload) {
    if (!payload || !payload.signos) return;
    if (payload.casoId && parseInt(payload.casoId) !== caseId) {
        caseId = parseInt(payload.casoId);
    }
    updateVitalsUI(payload.signos);
}

if (typeof BroadcastChannel !== 'undefined') {
    const liveChannel = new BroadcastChannel('cimed_live_vitals');
    liveChannel.onmessage = (ev) => {
        handleLiveBroadcast(ev.data);
    };
}

window.addEventListener('storage', (ev) => {
    if (ev.key === 'cimed_live_vitals' && ev.newValue) {
        try {
            handleLiveBroadcast(JSON.parse(ev.newValue));
        } catch (e) {}
    }
});

function updateMonitorTopbar(paciente) {
    if (!paciente) return;
    const _set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    const edad = parseInt(paciente.edad);
    let category = 'Adult';
    if (!isNaN(edad)) {
        if (edad < 1) category = 'Neonate';
        else if (edad < 15) category = 'Pediatric';
    }

    const sexoStr = String(paciente.sexo || '').trim();
    const sexoShort = /^m(ujer|f)/i.test(sexoStr) || /^f/i.test(sexoStr) ? 'F'
                    : (/^h(ombre)|^m(asc)/i.test(sexoStr) ? 'M' : '');
    const edadInfo = !isNaN(edad) ? `${edad}a${sexoShort ? ' • ' + sexoShort : ''}` : '';

    _set('vsm-top-patient-name', paciente.nombre || category);
    _set('vsm-top-bed', caseId ? `ICU ${caseId}` : 'ICU 1');
    _set('vsm-top-category', edadInfo ? `${category} (${edadInfo})` : category);
    _set('vsm-top-profile', paciente.peso ? `${category} (${paciente.peso} kg)` : category);
}

function pollVitals() {
    fetch(`./BE/get-case-info.php?id=${caseId}&_t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (data.paciente) updateMonitorTopbar(data.paciente);
            if (data.success && data.signos_paciente) updateVitalsUI(data.signos_paciente);
        })
        .catch(() => { });
}

// ═══════════════════════════════════════════════════════
//  Redimensionar canales del monitor
// ═══════════════════════════════════════════════════════
function resizeMonitorChannels() {
    let monitorStarted = window._monitorStarted || false;
    (window._channels || []).forEach(ch => {
        const parent = ch.canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const w = Math.max(Math.floor(rect.width), 50);
        const h = Math.max(Math.floor(rect.height), 45);
        ch.resize(w, h);
        if (!monitorStarted) ch.start();
    });
    window._monitorStarted = true;
}

// ═══════════════════════════════════════════════════════
//  Tabs
// ═══════════════════════════════════════════════════════
function initTabs() {
    const tabs = document.querySelectorAll('.sim-tab');
    const panels = document.querySelectorAll('.sim-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panelId = 'panel-' + tab.dataset.tab;
            const panel = document.getElementById(panelId);
            if (panel) panel.classList.add('active');

            if (tab.dataset.tab === 'monitor') {
                isMonitorTabActive = true;
                startMonitorClock();
                if (window._monitorAudio) window._monitorAudio.onConnectStateChange(true);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resizeMonitorChannels();
                    });
                });
            } else {
                isMonitorTabActive = false;
                if (window._monitorAudio) window._monitorAudio.onConnectStateChange(false);
            }
        });
    });
}

// ═══════════════════════════════════════════════════════
//  Inicialización
// ═══════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", function () {

    initTabs();

    try {
        const savedLive = localStorage.getItem('cimed_live_vitals');
        if (savedLive) {
            const parsed = JSON.parse(savedLive);
            if (parsed && parsed.casoId && parsed.ts && (Date.now() - parsed.ts < 3600000)) {
                caseId = parseInt(parsed.casoId);
            }
        }
    } catch (e) {}

    fetch(`./BE/get-case-info.php?id=${caseId}&_t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            const _set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

            _set('nombre-paciente', data.paciente.nombre);
            updateMonitorTopbar(data.paciente);
            _set('nombre-caso', data.caso.nombre);
            _set('descripcion-caso', data.caso.descripcion);
            _set('sexo-paciente', data.paciente.sexo);
            _set('edad-paciente', data.paciente.edad);
            _set('peso-paciente', data.paciente.peso);
            _set('altura-paciente', data.paciente.altura);
            _set('motivo-consulta', data.caso.motivoConsulta);

            const enf = document.getElementById('enfermedades-paciente');
            if (enf) enf.textContent = data.paciente.enfermedades;

            const fechaContainer = document.getElementById('fecha-actualizacion-container');
            const fechaElement = document.getElementById('fecha-actualizacion');
            if (data.caso.fecha_actualizacion) {
                if (fechaElement) fechaElement.textContent = data.caso.fecha_actualizacion;
                if (fechaContainer) fechaContainer.style.display = 'flex';
            } else {
                if (fechaContainer) fechaContainer.style.display = 'none';
            }

            // ══ Videos → lista + preview inline ══
            const videosList = document.getElementById('videos-list');
            const videos = data.videos || [];
            if (videosList) {
                if (videos.length === 0) {
                    videosList.innerHTML = '<p class="text-muted">No hay videos disponibles para este caso.</p>';
                } else {
                    const listEl = document.createElement('ul');
                    listEl.className = 'sim-item-list';
                    videos.forEach((v, i) => {
                        const li = document.createElement('li');
                        li.className = 'sim-item-list-row';
                        li.innerHTML = `<i class="bi bi-play-circle-fill me-2" style="color:#e44;"></i>
                                        <span>${v.nombre || 'Video ' + (i + 1)}</span>`;
                        li.addEventListener('click', () => {
                            const isActive = li.classList.contains('active');
                            listEl.querySelectorAll('.sim-item-list-row').forEach(r => r.classList.remove('active'));
                            if (isActive) {
                                previewEl.innerHTML = '';
                                previewEl.style.display = 'none';
                            } else {
                                li.classList.add('active');
                                previewEl.innerHTML = `
                                    <video class="sim-preview-video" controls autoplay>
                                        <source src="${v.ruta}" type="video/mp4">
                                        Tu navegador no soporta video HTML5.
                                    </video>`;
                                previewEl.style.display = 'block';
                            }
                        });
                        listEl.appendChild(li);
                    });

                    const previewEl = document.createElement('div');
                    previewEl.className = 'sim-preview-area';
                    previewEl.style.display = 'none';

                    videosList.innerHTML = '';
                    videosList.appendChild(listEl);
                    videosList.appendChild(previewEl);
                }
            }

            if (data.signos_paciente) updateVitalsUI(data.signos_paciente);

            // ══ Estudios → lista + preview inline ══
            const estudiosContainer = document.getElementById('estudios-container');
            if (estudiosContainer) {
                estudiosContainer.innerHTML = '';
                estudiosContainer.className = '';

                if (!data.archivos || data.archivos.length === 0) {
                    estudiosContainer.innerHTML = '<p class="text-muted">No hay estudios disponibles.</p>';
                } else {
                    const listEl = document.createElement('ul');
                    listEl.className = 'sim-item-list';

                    const previewEl = document.createElement('div');
                    previewEl.className = 'sim-preview-area';
                    previewEl.style.display = 'none';

                    data.archivos.forEach((archivo, index) => {
                        const li = document.createElement('li');
                        li.className = 'sim-item-list-row';
                        li.innerHTML = `<i class="bi bi-file-earmark-text me-2" style="color:#2f50ff;"></i>
                                        <span>${archivo.nombre || 'Archivo ' + (index + 1)}</span>`;
                        li.addEventListener('click', () => {
                            const isActive = li.classList.contains('active');
                            listEl.querySelectorAll('.sim-item-list-row').forEach(r => r.classList.remove('active'));
                            if (isActive) {
                                previewEl.innerHTML = '';
                                previewEl.style.display = 'none';
                            } else {
                                li.classList.add('active');
                                previewEl.innerHTML = `<iframe src="${archivo.ruta}" class="sim-preview-iframe"></iframe>`;
                                previewEl.style.display = 'block';
                            }
                        });
                        listEl.appendChild(li);
                    });

                    estudiosContainer.appendChild(listEl);
                    estudiosContainer.appendChild(previewEl);
                }
            }

            preguntas = data.preguntas || [];
            respuestasSeleccionadas = Array(preguntas.length).fill(null);

            // ── 4 Canales de onda de RF-02: II (verde), Pleth (azul/cian), CO2 (amarillo), Resp (blanco) ──
            const channelDefs = [
                { id: 'canvas-ecg', type: 'ecg', color: '#25e500' },
                { id: 'canvas-spo2', type: 'spo2', color: '#1ec8ff' },
                { id: 'canvas-co2', type: 'co2', color: '#ffee00' },
                { id: 'canvas-resp', type: 'resp', color: '#cceeff' },
            ];
            window._channels = [];
            channelDefs.forEach(cfg => {
                const canvas = document.getElementById(cfg.id);
                if (!canvas) return;
                const ch = new WaveformChannel(canvas, cfg.type, cfg.color);
                window._channels.push(ch);
            });
        })
        .catch(err => console.error('Error al obtener datos:', err));

    // Polling cada 1 segundo sin caché
    setInterval(pollVitals, 1000);

    window.addEventListener('resize', () => {
        const monitorPanel = document.getElementById('panel-monitor');
        if (!monitorPanel || !monitorPanel.classList.contains('active')) return;
        resizeMonitorChannels();
    });
});

// ═══════════════════════════════════════════════════════
//  Quiz / Preguntas
// ═══════════════════════════════════════════════════════
function iniciarPreguntas() {
    document.getElementById('seccionBienvenida').style.display = 'none';
    document.getElementById('seccionPrincipal').style.display = 'block';
    mostrarPregunta();
}

function mostrarPregunta() {
    if (preguntaActual >= preguntas.length) { mostrarFinalizacion(); return; }
    const pregunta = preguntas[preguntaActual];
    document.getElementById('preguntaTexto').textContent = pregunta.texto_pregunta;
    document.getElementById('opcionesContainer').innerHTML = pregunta.incisos.map(op => {
        const sel = respuestasSeleccionadas[preguntaActual] === op.texto ? 'selected' : '';
        const disabled = bloqueado ? 'disabled' : '';
        return `<button class="btn btn-outline-secondary w-100 mb-2 ${sel} ${disabled}"
                    onclick="seleccionarRespuesta('${op.texto}')" ${disabled}>
                    ${op.texto}
                </button>`;
    }).join('');

    const expEl = document.getElementById('explicacionIncorrecta');
    if (mostrarExplicacion) {
        expEl.textContent = pregunta.feedback;
    } else {
        expEl.textContent = '';
    }
}

function seleccionarRespuesta(opcionSeleccionada) {
    if (!bloqueado) {
        respuestasSeleccionadas[preguntaActual] = opcionSeleccionada;
        mostrarExplicacion = false;
        mostrarPregunta();
    }
}

function cambiarPregunta() {
    const pregunta = preguntas[preguntaActual];
    let respuesta = respuestasSeleccionadas[preguntaActual];
    if (!respuesta) {
        const incorrecta = pregunta.incisos.find(o => o.correcto === 0);
        respuesta = incorrecta ? incorrecta.texto : 'Respuesta no válida';
        respuestasSeleccionadas[preguntaActual] = respuesta;
    }
    const opcion = pregunta.incisos.find(o => o.texto === respuesta);
    if (!mostrarExplicacion && opcion && opcion.correcto === 0) {
        mostrarExplicacion = true;
        bloqueado = true;
        mostrarPregunta();
    } else {
        preguntaActual++;
        mostrarExplicacion = false;
        bloqueado = false;
        mostrarPregunta();
    }
}

// ═══════════════════════════════════════════════════════
//  RF-04: Sonido de signos vitales (beeps y alarma continua de paro)
// ═══════════════════════════════════════════════════════
(function initBeep() {
    let audioCtx = null;
    let beepInterval = null;
    let muted = false;
    let lastStatus = 'normal';
    let lastFc = 75;
    let flatlineOsc = null;
    let flatlineGain = null;

    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function getStatus() {
        const fc = ecgVitals.FC ?? 0;
        const sat = ecgVitals.SAT ?? 0;
        const { sys } = parseTA(ecgVitals.TA);
        const fr = ecgVitals.FR ?? 0;

        if (fc < 40 || fc > 150 || sat < 90 || sys <= 60 || sys >= 180 || fr < 8 || fr > 30)
            return 'critical';
        if (fc < 60 || fc > 100 || sat < 95 || sys < 90 || sys >= 130 || fr < 12 || fr > 20)
            return 'warning';
        return 'normal';
    }

    function getPitchFreq() {
        const sat = ecgVitals.SAT ?? 98;
        return Math.max(380, Math.min(900, 400 + (sat - 70) * 15));
    }

    function getBeepConfig(status) {
        const baseFreq = getPitchFreq();
        switch (status) {
            case 'critical':
                return {
                    freq1: baseFreq * 1.25,
                    freq2: baseFreq * 0.75,
                    volume: 0.28,
                    duration: 0.12,
                    dual: true
                };
            case 'warning':
                return {
                    freq1: baseFreq * 1.15,
                    freq2: null,
                    volume: 0.20,
                    duration: 0.10,
                    dual: false
                };
            default:
                return {
                    freq1: baseFreq,
                    freq2: null,
                    volume: 0.14,
                    duration: 0.08,
                    dual: false
                };
        }
    }

    function startFlatline() {
        if (!isMonitorTabActive || muted) return;
        if (flatlineOsc) return;
        try {
            const ctx = getAudioCtx();
            if (ctx.state === 'suspended') ctx.resume();
            flatlineOsc = ctx.createOscillator();
            flatlineGain = ctx.createGain();
            flatlineOsc.connect(flatlineGain);
            flatlineGain.connect(ctx.destination);
            flatlineOsc.type = 'sine';
            flatlineOsc.frequency.setValueAtTime(820, ctx.currentTime);
            flatlineGain.gain.setValueAtTime(0.001, ctx.currentTime);
            flatlineGain.gain.exponentialRampToValueAtTime(0.24, ctx.currentTime + 0.04);
            flatlineOsc.start();
        } catch (e) {}
    }

    function stopFlatline() {
        if (flatlineOsc) {
            try {
                const ctx = getAudioCtx();
                flatlineGain.gain.setValueAtTime(flatlineGain.gain.value, ctx.currentTime);
                flatlineGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
                const osc = flatlineOsc;
                setTimeout(() => { try { osc.stop(); } catch (e) {} }, 50);
            } catch (e) {}
            flatlineOsc = null;
            flatlineGain = null;
        }
    }

    function playBeep() {
        if (!isMonitorTabActive) {
            stopBeeps();
            stopFlatline();
            return;
        }

        if (isCardiacArrest()) {
            stopBeeps();
            startFlatline();
            return;
        }

        stopFlatline();

        if (muted) return;
        try {
            const ctx = getAudioCtx();
            if (ctx.state === 'suspended') ctx.resume();
            const status = getStatus();
            const cfg = getBeepConfig(status);

            function tone(freq, delayMs) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                const t0 = ctx.currentTime + delayMs / 1000;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t0);

                gain.gain.setValueAtTime(0.001, t0);
                gain.gain.exponentialRampToValueAtTime(cfg.volume, t0 + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, t0 + cfg.duration);

                osc.start(t0);
                osc.stop(t0 + cfg.duration + 0.01);
            }

            tone(cfg.freq1, 0);
            if (cfg.dual) tone(cfg.freq2, 140);
        } catch (e) {}
    }

    function getMsPerBeat() {
        const fc = Math.max(ecgVitals.FC || 0, 1);
        const status = getStatus();
        if (status === 'critical') return Math.min(Math.round(60000 / fc), 400);
        return Math.round(60000 / fc);
    }

    function stopBeeps() {
        if (beepInterval) {
            clearInterval(beepInterval);
            beepInterval = null;
        }
    }

    function scheduleBeeps() {
        if (!isMonitorTabActive) {
            stopBeeps();
            stopFlatline();
            return;
        }

        if (isCardiacArrest()) {
            stopBeeps();
            startFlatline();
            return;
        }

        stopFlatline();
        if (beepInterval) clearInterval(beepInterval);
        lastFc = ecgVitals.FC || 75;
        playBeep();
        beepInterval = setInterval(playBeep, getMsPerBeat());
    }

    function evaluateAudioStateImmediate() {
        if (!isMonitorTabActive) {
            stopBeeps();
            stopFlatline();
            return;
        }

        if (isCardiacArrest()) {
            stopBeeps();
            if (!muted) startFlatline();
            else stopFlatline();
        } else {
            stopFlatline();
            const status = getStatus();
            const currentFc = ecgVitals.FC || 75;
            if (status !== lastStatus || Math.abs(currentFc - lastFc) >= 3 || !beepInterval) {
                lastStatus = status;
                lastFc = currentFc;
                scheduleBeeps();
            }
        }
    }

    setInterval(evaluateAudioStateImmediate, 500);

    window._monitorAudio = {
        onConnectStateChange(active) {
            if (active) {
                const ctx = getAudioCtx();
                if (ctx && ctx.state === 'suspended') ctx.resume();
                evaluateAudioStateImmediate();
            } else {
                stopBeeps();
                stopFlatline();
            }
        },
        onVitalsUpdated() {
            evaluateAudioStateImmediate();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('btn-mute');
        const alarmStateEl = document.getElementById('vsm-top-alarm-state');
        if (btn) {
            btn.addEventListener('click', () => {
                muted = !muted;
                btn.classList.toggle('is-muted', muted);
                if (alarmStateEl) {
                    alarmStateEl.textContent = muted ? 'Silenced' : 'On';
                }
                if (!muted && audioCtx?.state === 'suspended') {
                    audioCtx.resume();
                }

                if (!isMonitorTabActive) return;

                if (isCardiacArrest()) {
                    if (muted) stopFlatline();
                    else startFlatline();
                }
            });
        }
    });
})();

function mostrarFinalizacion() {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                    height:100vh;text-align:center;background:#050a06;">
            <div style="font-size:3rem;color:#00ff9f;margin-bottom:16px;">✓</div>
            <h2 style="color:#fff;font-family:monospace">Simulación terminada</h2>
            <button onclick="window.location.href='iniciar-simulacion.php'"
                style="margin-top:24px;background:#00ff9f;color:#000;border:none;
                       padding:12px 28px;border-radius:6px;font-size:1rem;
                       font-weight:700;cursor:pointer;letter-spacing:1px;">
                VOLVER
            </button>
        </div>`;
}
