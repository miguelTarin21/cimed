/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOTOR DEL MONITOR CLÍNICO HOSPITALARIO (CIMED - PROTOTIPO)
 * Generación de ondas de barrido (Sweep line), Audio Sintetizado y Telemetría
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Estado fisiológico global del paciente
const patientState = {
    HR: 75,
    SpO2: 98,
    Pulse: 75,
    PI: 4.2,
    Sys: 120,
    Dia: 80,
    MAP: 93,
    CO2: 38,
    RR: 16,
    Temp: 36.8,
    rhythm: 'sinusal', // sinusal, taquicardia, fa, fv, asistole, bloqueo1, bloqueo2, bloqueo3, st_elevacion, st_depresion
    isFrozen: false,
    isMuted: false,
    alarmsPaused: false
};

// ═════════════════════════════════════════════════════════════
// 1. MOTOR DE CANALES DE ONDA (CANVAS SWEEP ANIMATION)
// ═════════════════════════════════════════════════════════════
class ClinicalWaveChannel {
    constructor(canvasId, type, color, sweepSpeed = 2.0) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.type = type;
        this.color = color;
        this.sweepSpeed = sweepSpeed;
        
        this.width = 0;
        this.height = 0;
        this.writeX = 0;
        this.lastY = null;
        this.phase = 0;
        
        // Parámetros específicos para ritmos de bloqueo
        this.beatCount = 0;
        this.blockEscapePhase = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = Math.floor(rect.width);
        this.height = Math.floor(rect.height);
        
        // Ajustar resolución para pantallas de alta densidad (Retina / 4K)
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        // Limpiar fondo
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.writeX = 0;
        this.lastY = this.height / 2;
    }

    // Funciones matemáticas de morfología de ondas
    sampleECG(t) {
        const rhythm = patientState.rhythm;
        const g = (center, amp, width) => amp * Math.exp(-Math.pow((t - center) / width, 2));

        // 1. Asistolia (Línea casi plana con mínimo ruido eléctrico)
        if (rhythm === 'asistole' || patientState.HR === 0) {
            return 0.5 + (Math.random() - 0.5) * 0.02;
        }

        // 2. Fibrilación Ventricular (FV) - Caótica
        if (rhythm === 'fv') {
            const now = Date.now() / 1000;
            return 0.5 + (Math.sin(now * 7.5) * 0.28 + Math.sin(now * 14.2) * 0.20 + Math.sin(now * 23.1) * 0.12 + (Math.random() - 0.5) * 0.08);
        }

        // 3. Fibrilación Auricular (FA) - Sin onda P, línea isoeléctrica fibrilatoria + QRS estrecho
        if (rhythm === 'fa') {
            const fWaves = (Math.sin(t * 38) * 0.04 + Math.sin(t * 55) * 0.03 + (Math.random() - 0.5) * 0.03);
            const qrs = g(0.48, 1.0, 0.013) - g(0.53, 0.25, 0.012);
            const tWave = g(0.72, 0.25, 0.05);
            return 0.5 - (qrs + tWave + fWaves) * 0.42;
        }

        // 4. Taquicardia Ventricular (TV) - QRS ancho y bizarro
        if (rhythm === 'taquicardia') {
            const tvWave = g(0.35, 0.35, 0.06) + g(0.48, 0.95, 0.048) - g(0.62, 0.45, 0.06) - g(0.78, 0.30, 0.06);
            return 0.5 - tvWave * 0.45;
        }

        // 5. Bloqueo AV Grado 1 (Intervalo PR prolongado > 0.20s)
        if (rhythm === 'bloqueo1') {
            const p = g(0.12, 0.20, 0.045); // P más temprana / PR largo
            const q = -g(0.44, 0.08, 0.012);
            const r = g(0.48, 1.00, 0.013);
            const s = -g(0.53, 0.26, 0.012);
            const tW = g(0.72, 0.30, 0.055);
            return 0.5 - (p + q + r + s + tW) * 0.42;
        }

        // 6. Bloqueo AV Mobitz II (Onda P sin conducir intermitente)
        if (rhythm === 'bloqueo2') {
            const isDropped = (this.beatCount % 3 === 0); // Cada 3er latido se bloquea el QRS
            const p = g(0.20, 0.22, 0.045);
            if (isDropped) {
                return 0.5 - p * 0.42; // Solo onda P, sin QRS
            }
            const qrs = -g(0.44, 0.08, 0.012) + g(0.48, 1.00, 0.013) - g(0.53, 0.26, 0.012) + g(0.72, 0.30, 0.055);
            return 0.5 - (p + qrs) * 0.42;
        }

        // 7. Bloqueo AV Grado 3 (Disociación AV completa)
        if (rhythm === 'bloqueo3') {
            // Ondas P regulares a 80 lpm + QRS ancho de escape a 35 lpm
            const pWave = Math.sin(t * Math.PI * 4) > 0.85 ? 0.22 : 0;
            const qrsEscape = g(0.5, 0.85, 0.04) - g(0.6, 0.3, 0.04);
            return 0.5 - (pWave + qrsEscape) * 0.42;
        }

        // 8. ST Elevación (Infarto Agudo STEMI)
        if (rhythm === 'st_elevacion') {
            const p = g(0.18, 0.18, 0.042);
            const r = g(0.47, 0.95, 0.014);
            const stElev = g(0.64, 0.52, 0.075) + g(0.78, 0.48, 0.055); // Elevación marcada
            return 0.5 - (p + r + stElev) * 0.42;
        }

        // 9. ST Depresión (Isquemia subendocárdica)
        if (rhythm === 'st_depresion') {
            const p = g(0.18, 0.18, 0.042);
            const q = -g(0.43, 0.10, 0.013);
            const r = g(0.48, 1.00, 0.013);
            const s = -g(0.53, 0.26, 0.013);
            const stDep = -g(0.63, 0.26, 0.055) - g(0.76, 0.18, 0.048); // Depresión y T negativa
            return 0.5 - (p + q + r + s + stDep) * 0.42;
        }

        // 10. Ritmo Sinusal Normal
        const p = g(0.20, 0.20, 0.042);
        const q = -g(0.43, 0.09, 0.013);
        const r = g(0.48, 1.00, 0.013);
        const s = -g(0.53, 0.26, 0.013);
        const tWave = g(0.71, 0.30, 0.055);
        return 0.5 - (p + q + r + s + tWave) * 0.42;
    }

    sampleSPO2(t) {
        if (patientState.HR === 0 || patientState.rhythm === 'asistole') {
            return 0.5 + (Math.random() - 0.5) * 0.01;
        }
        // Curva pletismográfica con muesca dícrota
        const main = Math.pow(Math.sin(Math.PI * t), 2) * 0.75;
        const notch = (t > 0.55 && t < 0.68) ? -0.09 * Math.sin(Math.PI * (t - 0.55) / 0.13) : 0;
        return 0.85 - (main + notch) * 0.75;
    }

    sampleCO2(t) {
        if (patientState.RR === 0) return 0.88;
        // Capnograma: Fase 1 (línea de base), Fase 2 (ascenso rápido), Fase 3 (meseta alveolar EtCO2), Fase 4 (descenso inspiratorio)
        if (t < 0.10) return 0.88; // Inspiración 0 mmHg
        if (t < 0.22) return 0.88 - ((t - 0.10) / 0.12) * 0.65; // Ascenso
        if (t < 0.65) return 0.23 - (t - 0.22) * 0.06; // Meseta alveolar
        if (t < 0.75) return 0.21 + ((t - 0.65) / 0.10) * 0.67; // Descenso
        return 0.88;
    }

    sampleResp(t) {
        if (patientState.RR === 0) return 0.5;
        // Onda sinusoidal suave de impedancia respiratoria
        return 0.5 - Math.sin(2 * Math.PI * t) * 0.35;
    }

    step() {
        if (patientState.isFrozen) return;

        // Ancho del borrador de barrido (sweep bar)
        const eraseBarWidth = 14;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.writeX, 0, eraseBarWidth, this.height);

        // Frecuencia de ciclo según parámetro
        let freqHz = 1.25; // 75 bpm default
        if (this.type === 'ecg' || this.type === 'spo2') {
            freqHz = Math.max(patientState.HR, 0) / 60;
            if (patientState.rhythm === 'bloqueo3') freqHz = 35 / 60; // Frecuencia de escape en BAV completo
        } else if (this.type === 'co2' || this.type === 'resp') {
            freqHz = Math.max(patientState.RR, 0) / 60;
        }

        // Avanzar fase del ciclo
        const dt = (1 / 60); // 60 FPS aprox
        this.phase += freqHz * dt;
        if (this.phase >= 1.0) {
            this.phase -= 1.0;
            this.beatCount++;
        }

        // Obtener muestra normalizada (0.0 a 1.0)
        let sampleNorm = 0.5;
        switch (this.type) {
            case 'ecg': sampleNorm = this.sampleECG(this.phase); break;
            case 'spo2': sampleNorm = this.sampleSPO2(this.phase); break;
            case 'co2': sampleNorm = this.sampleCO2(this.phase); break;
            case 'resp': sampleNorm = this.sampleResp(this.phase); break;
        }

        // Calcular coordenada Y en píxeles
        const currentY = sampleNorm * this.height;

        // Dibujar trazo con brillo clínico
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 2.0;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.writeX === 0 ? this.writeX : this.writeX - this.sweepSpeed, this.lastY || currentY);
        this.ctx.lineTo(this.writeX, currentY);
        this.ctx.stroke();

        this.lastY = currentY;
        this.writeX += this.sweepSpeed;

        if (this.writeX >= this.width) {
            this.writeX = 0;
            this.lastY = null;
        }
    }
}

// ═════════════════════════════════════════════════════════════
// 2. SÍNTESIS DE AUDIO MÉDICO (WEB AUDIO API)
// ═════════════════════════════════════════════════════════════
class ClinicalAudioMonitor {
    constructor() {
        this.ctx = null;
        this.beepTimer = null;
        this.flatlineOsc = null;
        this.flatlineGain = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Tono del pitido dependiente de la saturación de oxígeno (SpO2 Acústico Real)
    getFrequencyForSpO2(sat) {
        // Mapea SpO2 de 70 a 100% en un tono audible de 400Hz a 880Hz
        const clamped = Math.max(70, Math.min(100, sat));
        return 400 + (clamped - 70) * 16;
    }

    playHeartbeatBeep() {
        if (patientState.isMuted || !this.ctx) return;
        if (patientState.HR === 0 || patientState.rhythm === 'asistole') return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            const now = this.ctx.currentTime;
            const freq = this.getFrequencyForSpO2(patientState.SpO2);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    startFlatlineTone() {
        if (patientState.isMuted || !this.ctx || this.flatlineOsc) return;
        try {
            this.flatlineOsc = this.ctx.createOscillator();
            this.flatlineGain = this.ctx.createGain();
            this.flatlineOsc.connect(this.flatlineGain);
            this.flatlineGain.connect(this.ctx.destination);

            const now = this.ctx.currentTime;
            this.flatlineOsc.type = 'sine';
            this.flatlineOsc.frequency.setValueAtTime(450, now); // 450Hz estándar hospitalario de flatline

            this.flatlineGain.gain.setValueAtTime(0.001, now);
            this.flatlineGain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);

            this.flatlineOsc.start(now);
        } catch (e) {}
    }

    stopFlatlineTone() {
        if (this.flatlineOsc) {
            try {
                this.flatlineGain.gain.setValueAtTime(this.flatlineGain.gain.value, this.ctx.currentTime);
                this.flatlineGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                const osc = this.flatlineOsc;
                setTimeout(() => { try { osc.stop(); } catch(e){} }, 60);
            } catch (e) {}
            this.flatlineOsc = null;
            this.flatlineGain = null;
        }
    }

    schedule() {
        if (this.beepTimer) clearInterval(this.beepTimer);

        if (patientState.HR === 0 || patientState.rhythm === 'asistole') {
            this.startFlatlineTone();
            return;
        } else {
            this.stopFlatlineTone();
        }

        const intervalMs = Math.max(250, Math.round(60000 / Math.max(patientState.HR, 1)));
        this.beepTimer = setInterval(() => {
            this.playHeartbeatBeep();
        }, intervalMs);
    }
}

// ═════════════════════════════════════════════════════════════
// 3. INICIALIZACIÓN Y VINCULACIÓN CON LA INTERFAZ
// ═════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    
    // Crear canales de ondas
    const channels = [
        new ClinicalWaveChannel('canvasECG', 'ecg', '#00ff66', 2.2),
        new ClinicalWaveChannel('canvasSPO2', 'spo2', '#00e5ff', 2.2),
        new ClinicalWaveChannel('canvasCO2', 'co2', '#ffd600', 1.8),
        new ClinicalWaveChannel('canvasRESP', 'resp', '#e0f2fe', 1.8)
    ];

    setTimeout(() => {
        channels.forEach(ch => ch.resize());
    }, 100);

    // Bucle de animación a 60 FPS
    function renderLoop() {
        channels.forEach(ch => ch.step());
        requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    // Sistema de audio
    const audioMonitor = new ClinicalAudioMonitor();

    // Arrancar audio con el primer clic del usuario (política del navegador)
    document.addEventListener('click', () => {
        audioMonitor.init();
        audioMonitor.schedule();
    }, { once: true });

    // Actualizar reloj en tiempo real
    function updateLiveClock() {
        const now = new Date();
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        document.getElementById('liveClock').textContent = now.toLocaleDateString('es-MX', options);
    }
    setInterval(updateLiveClock, 1000);
    updateLiveClock();

    // Actualizar visualización numérica en pantalla
    function updateUI() {
        document.getElementById('valHR').textContent = patientState.HR;
        document.getElementById('valPulse').textContent = patientState.HR > 0 ? patientState.HR : '--';
        document.getElementById('valSPO2').textContent = patientState.SpO2;
        document.getElementById('valCO2').textContent = patientState.CO2;
        document.getElementById('valRR').textContent = patientState.RR;
        document.getElementById('valTEMP').textContent = patientState.Temp.toFixed(1);

        // NIBP y MAP
        if (patientState.Sys === 0 && patientState.Dia === 0) {
            document.getElementById('valNBP').textContent = '0/0';
            document.getElementById('valMAP').textContent = '(0)';
        } else {
            patientState.MAP = Math.round(patientState.Dia + (patientState.Sys - patientState.Dia) / 3);
            document.getElementById('valNBP').textContent = `${patientState.Sys}/${patientState.Dia}`;
            document.getElementById('valMAP').textContent = `(${patientState.MAP})`;
        }

        // Evaluar alertas clínicas
        const banner = document.getElementById('alarmBanner');
        const bannerText = document.getElementById('alarmBannerText');

        if (patientState.HR === 0 || patientState.rhythm === 'asistole') {
            banner.className = 'alarm-banner critical';
            bannerText.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> ASISTOLIA / PARO CARDÍACO';
        } else if (patientState.rhythm === 'fv') {
            banner.className = 'alarm-banner critical';
            bannerText.innerHTML = '<i class="bi bi-lightning-charge-fill"></i> FIBRILACIÓN VENTRICULAR';
        } else if (patientState.HR > 130) {
            banner.className = 'alarm-banner critical';
            bannerText.innerHTML = 'TAQUICARDIA SEVERA';
        } else if (patientState.SpO2 < 88) {
            banner.className = 'alarm-banner critical';
            bannerText.innerHTML = 'HIPOXEMIA GRAVE';
        } else if (patientState.Sys >= 180) {
            banner.className = 'alarm-banner warning';
            bannerText.innerHTML = 'CRISIS HIPERTENSIVA';
        } else {
            banner.className = 'alarm-banner';
            bannerText.textContent = 'MONITOREO ESTABLE';
        }

        audioMonitor.schedule();
    }

    // ═════════════════════════════════════════════════════════
    // CONTROLES DE LA BARRA INFERIOR
    // ═════════════════════════════════════════════════════════
    
    // Silenciar
    const btnSilence = document.getElementById('btnSilence');
    btnSilence.addEventListener('click', () => {
        patientState.isMuted = !patientState.isMuted;
        btnSilence.classList.toggle('muted', patientState.isMuted);
        document.getElementById('silenceBtnLabel').textContent = patientState.isMuted ? 'Muted' : 'Silence';
        if (patientState.isMuted) audioMonitor.stopFlatlineTone();
        else audioMonitor.schedule();
    });

    // Congelar Ondas (Freeze)
    const btnFreeze = document.getElementById('btnFreeze');
    btnFreeze.addEventListener('click', () => {
        patientState.isFrozen = !patientState.isFrozen;
        btnFreeze.classList.toggle('btn-primary-act', patientState.isFrozen);
        document.getElementById('freezeBtnLabel').textContent = patientState.isFrozen ? 'Resume Waves' : 'Freeze Waves';
    });

    // Simular toma NIBP
    const btnNbpStart = document.getElementById('btnNbpStart');
    btnNbpStart.addEventListener('click', () => {
        const timeEl = document.getElementById('nbpLastTime');
        timeEl.textContent = 'Midiendo...';
        btnNbpStart.style.opacity = '0.5';
        setTimeout(() => {
            timeEl.textContent = 'Justo ahora';
            btnNbpStart.style.opacity = '1';
            updateUI();
        }, 1500);
    });

    // Pantalla completa (Para proyector / TV de laboratorio)
    const btnFullscreen = document.getElementById('btnFullscreen');
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    // Abrir/Cerrar cajón de pruebas (Drawer)
    const drawer = document.getElementById('controlDrawer');
    document.getElementById('btnToggleDrawer').addEventListener('click', () => drawer.classList.add('open'));
    document.getElementById('btnCloseDrawer').addEventListener('click', () => drawer.classList.remove('open'));

    // ═════════════════════════════════════════════════════════
    // VINCULACIÓN DE SLIDERS DEL PANEL DE PRUEBAS
    // ═════════════════════════════════════════════════════════
    const bindSlider = (sliderId, lblId, stateKey) => {
        const slider = document.getElementById(sliderId);
        const lbl = document.getElementById(lblId);
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            patientState[stateKey] = val;
            lbl.textContent = val;
            updateUI();
        });
    };

    bindSlider('sliderHR', 'lblSliderHR', 'HR');
    bindSlider('sliderSPO2', 'lblSliderSPO2', 'SpO2');
    bindSlider('sliderSys', 'lblSliderSys', 'Sys');
    bindSlider('sliderDia', 'lblSliderDia', 'Dia');
    bindSlider('sliderCO2', 'lblSliderCO2', 'CO2');
    bindSlider('sliderRR', 'lblSliderRR', 'RR');
    bindSlider('sliderTemp', 'lblSliderTemp', 'Temp');

    // Selección de ritmos ECG
    document.querySelectorAll('.btn-rhythm').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-rhythm').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            patientState.rhythm = btn.dataset.rhythm;

            // Auto-ajuste de variables según ritmo
            if (patientState.rhythm === 'asistole') {
                patientState.HR = 0;
                patientState.Sys = 0;
                patientState.Dia = 0;
                document.getElementById('sliderHR').value = 0;
                document.getElementById('lblSliderHR').textContent = 0;
                document.getElementById('sliderSys').value = 0;
                document.getElementById('lblSliderSys').textContent = 0;
                document.getElementById('sliderDia').value = 0;
                document.getElementById('lblSliderDia').textContent = 0;
            } else if (patientState.rhythm === 'taquicardia') {
                patientState.HR = 160;
                document.getElementById('sliderHR').value = 160;
                document.getElementById('lblSliderHR').textContent = 160;
            } else if (patientState.rhythm === 'fa') {
                patientState.HR = 118;
                document.getElementById('sliderHR').value = 118;
                document.getElementById('lblSliderHR').textContent = 118;
            } else if (patientState.rhythm === 'bloqueo3') {
                patientState.HR = 36;
                document.getElementById('sliderHR').value = 36;
                document.getElementById('lblSliderHR').textContent = 36;
            }

            updateUI();
        });
    });

    // Presets rápidos
    document.getElementById('presetNorma').addEventListener('click', () => {
        setPresetValues(75, 98, 120, 80, 38, 16, 36.8, 'sinusal');
    });

    document.getElementById('presetCrisisHTA').addEventListener('click', () => {
        setPresetValues(92, 97, 190, 115, 39, 18, 36.7, 'sinusal');
    });

    document.getElementById('presetAsma').addEventListener('click', () => {
        setPresetValues(124, 88, 135, 88, 48, 28, 37.1, 'sinusal');
    });

    document.getElementById('presetParo').addEventListener('click', () => {
        setPresetValues(0, 50, 0, 0, 10, 0, 35.0, 'asistole');
    });

    function setPresetValues(hr, spo2, sys, dia, co2, rr, temp, rhythm) {
        patientState.HR = hr;
        patientState.SpO2 = spo2;
        patientState.Sys = sys;
        patientState.Dia = dia;
        patientState.CO2 = co2;
        patientState.RR = rr;
        patientState.Temp = temp;
        patientState.rhythm = rhythm;

        document.getElementById('sliderHR').value = hr;
        document.getElementById('lblSliderHR').textContent = hr;
        document.getElementById('sliderSPO2').value = spo2;
        document.getElementById('lblSliderSPO2').textContent = spo2;
        document.getElementById('sliderSys').value = sys;
        document.getElementById('lblSliderSys').textContent = sys;
        document.getElementById('sliderDia').value = dia;
        document.getElementById('lblSliderDia').textContent = dia;
        document.getElementById('sliderCO2').value = co2;
        document.getElementById('lblSliderCO2').textContent = co2;
        document.getElementById('sliderRR').value = rr;
        document.getElementById('lblSliderRR').textContent = rr;
        document.getElementById('sliderTemp').value = temp;
        document.getElementById('lblSliderTemp').textContent = temp;

        document.querySelectorAll('.btn-rhythm').forEach(b => {
            b.classList.toggle('active', b.dataset.rhythm === rhythm);
        });

        updateUI();
    }

    updateUI();
});
