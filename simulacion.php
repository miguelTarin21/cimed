<?php
$caseId = isset($_GET['id']) ? intval($_GET['id']) : 0;
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CIMED - Simulación</title>
    <link rel="icon" type="image/png" href="images/CimarronMedicoIndexIcon.png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/simulacion-styles.css" />
</head>

<script>
    let caseId = <?= $caseId ?>;
</script>

<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="./">
                <span class="brand-name">
                    <span class="brand-ci">CI</span><span class="brand-med">MED</span>
                </span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse justify-content-center" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="iniciar-simulacion.php" style="margin-left:120px;">Casos</a>
                    </li>
                </ul>
            </div>
            <a href="iniciar-simulacion.php" class="btn btn-primary btn-exit d-flex align-items-center">
                <i class="bi bi-box-arrow-left me-2"></i> Regresar
            </a>
        </div>
    </nav>

    <!-- ═══════════════════ TAB BAR ═══════════════════ -->
    <div class="sim-tab-bar">
        <button class="sim-tab active" data-tab="caso">
            <i class="bi bi-file-medical"></i>
            <span>Caso</span>
        </button>
        <button class="sim-tab" data-tab="estudios">
            <i class="bi bi-folder2-open"></i>
            <span>Estudios</span>
        </button>
        <button class="sim-tab" data-tab="videos">
            <i class="bi bi-play-circle"></i>
            <span>Maniobras</span>
        </button>
        <button class="sim-tab" data-tab="quiz">
            <i class="bi bi-patch-question"></i>
            <span>Quiz</span>
        </button>
        <button class="sim-tab" data-tab="monitor">
            <i class="bi bi-heart-pulse"></i>
            <span>Monitor</span>
        </button>
    </div>

    <main class="sim-main">

        <!-- ══════════════ PESTAÑA 1: CASO ══════════════ -->
        <div class="sim-panel active" id="panel-caso">
            <div class="sim-card">
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <img src="images/clave (1).png" alt="clave" style="width:28px;height:auto;">
                        <h2 class="sim-card-title mb-0">
                            Nombre del Caso: <span id="nombre-caso" class="text-success"></span>
                        </h2>
                    </div>
                    <div id="fecha-actualizacion-container" class="sim-fecha-badge" style="display:none;">
                        <i class="bi bi-calendar-check me-1"></i>
                        Última actualización: <span id="fecha-actualizacion"></span>
                    </div>
                </div>

                <p class="sim-descripcion" id="descripcion-caso"></p>

                <!-- Datos del paciente -->
                <div class="sim-section-header">
                    <img src="images/infpaciente-removebg-preview.png" alt="paciente" style="width:26px;height:auto;">
                    <h4 class="text-primary mb-0">Datos del Paciente</h4>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6">
                        <ul class="sim-list">
                            <li><strong>Nombre:</strong> <span id="nombre-paciente"></span></li>
                            <li><strong>Sexo:</strong> <span id="sexo-paciente"></span></li>
                            <li><strong>Motivo de consulta:</strong>
                                <div id="motivo-consulta" class="mt-1"></div>
                            </li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="sim-list">
                            <li><strong>Edad:</strong> <span id="edad-paciente"></span> años</li>
                            <li><strong>Peso:</strong> <span id="peso-paciente"></span> kg</li>
                            <li><strong>Altura:</strong> <span id="altura-paciente"></span> cm</li>
                        </ul>
                    </div>
                    <div class="col-12 mt-2">
                        <ul class="sim-list">
                            <li><strong>Antecedentes de importancia:</strong>
                                <div id="enfermedades-paciente" class="mt-1"></div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Signos vitales (resumen estático) -->
                <div class="sim-section-header mt-3">
                    <img src="images/signos-paciente.png" alt="signos" style="width:26px;height:auto;">
                    <h4 class="text-primary mb-0">Signos del Paciente</h4>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6">
                        <ul class="sim-list">
                            <li><strong>FR:</strong> <span id="fr-paciente"></span> rpm</li>
                            <li><strong>FC:</strong> <span id="fc-paciente"></span> lpm</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="sim-list">
                            <li><strong>TA:</strong> <span id="ta-paciente"></span> mmHg</li>
                            <li><strong>Temp:</strong> <span id="temp-paciente"></span> °C</li>
                            <li><strong>SAT:</strong> <span id="sat-paciente"></span> %</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════════════ PESTAÑA 2: ESTUDIOS ══════════════ -->
        <div class="sim-panel" id="panel-estudios">
            <div class="sim-card">
                <h4 class="sim-panel-title">
                    <i class="bi bi-folder2-open text-primary me-2"></i> Estudios Disponibles
                </h4>
                <p class="text-muted" style="font-size:.88rem;">Selecciona un estudio para visualizarlo.</p>
                <div class="row justify-content-start" id="estudios-container">
                    <!-- Se llena desde JS -->
                </div>
                <div id="detalleEstudio" class="mt-4" style="display:none;"></div>
            </div>
        </div>

        <!-- ══════════════ PESTAÑA 3: VIDEOS ══════════════ -->
        <div class="sim-panel" id="panel-videos">
            <div class="sim-card sim-card-dark">
                <h4 class="sim-panel-title text-white">
                    <i class="bi bi-play-circle-fill text-danger me-2"></i> Maniobras de Propedéutica
                </h4>
                <div id="videos-list" class="mt-3">
                    <p class="text-muted">No hay videos disponibles para este caso.</p>
                </div>
            </div>
        </div>

        <!-- ══════════════ PESTAÑA 4: QUIZ ══════════════ -->
        <div class="sim-panel" id="panel-quiz">
            <div id="seccionBienvenida" class="sim-card text-center">
                <div class="sim-quiz-start-icon">🩺</div>
                <h3 class="fw-bold mt-3">¿Listo para empezar?</h3>
                <p class="text-muted">Responde las preguntas del caso clínico.</p>
                <button class="btn sim-btn-start mt-2" onclick="iniciarPreguntas()">
                    <i class="bi bi-play-fill me-1"></i> Empezar quiz
                </button>
            </div>

            <div id="seccionPrincipal" class="sim-card" style="display:none;">
                <div id="preguntaContainer">
                    <h3 id="preguntaTexto" class="sim-pregunta-texto"></h3>
                    <div id="opcionesContainer" class="mt-3 mb-2"></div>
                    <div id="explicacionIncorrecta" class="text-dangerss mt-2"></div>
                    <button class="btn sim-btn-next mt-3" onclick="cambiarPregunta()">
                        Siguiente <i class="bi bi-arrow-right ms-1"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- ══════════════ PESTAÑA 5: MONITOR ══════════════ -->
        <div class="sim-panel" id="panel-monitor">
            <div id="seccionECG">
                <div class="vsm-monitor connected" id="vsm-monitor-root">
                    <!-- Barra superior estilo plantilla hospitalaria -->
                    <div class="vsm-topbar">
                        <div class="vsm-patient-btn" id="btn-connect-patient">
                            <i class="bi bi-person-fill vsm-patient-icon"></i>
                            <span class="vsm-patient-label" id="vsm-top-patient-name">Adult</span>
                        </div>
                        <div class="vsm-top-cell">
                            <span class="vsm-top-lbl">Bed</span>
                            <span class="vsm-top-val" id="vsm-top-bed">ICU 1</span>
                        </div>
                        <div class="vsm-top-cell">
                            <span class="vsm-top-lbl">Patient category</span>
                            <span class="vsm-top-val" id="vsm-top-category">Adult</span>
                        </div>
                        <div class="vsm-top-cell">
                            <span class="vsm-top-lbl">Paced mode</span>
                            <span class="vsm-top-val">Non-paced</span>
                        </div>
                        <div class="vsm-top-cell vsm-top-cell-bar">
                            <span class="vsm-top-lbl vsm-lbl-accent">ECG</span>
                            <div class="vsm-status-bar-indicator"></div>
                            <span class="vsm-top-sub">Standard</span>
                        </div>
                        <div class="vsm-top-cell">
                            <span class="vsm-top-lbl">NBP</span>
                            <span class="vsm-top-val" id="vsm-top-nbp-mode">Manual</span>
                        </div>
                        <div class="vsm-top-cell vsm-top-cell-bar">
                            <span class="vsm-top-lbl">Alarms</span>
                            <div class="vsm-status-bar-indicator"></div>
                            <span class="vsm-top-sub" id="vsm-top-alarm-state">On</span>
                        </div>
                        <div class="vsm-top-cell">
                            <span class="vsm-top-lbl">Profile</span>
                            <span class="vsm-top-val" id="vsm-top-profile">Adult</span>
                        </div>
                        <div class="vsm-top-icons">
                            <i class="bi bi-plug-fill" title="Corriente AC"></i>
                            <i class="bi bi-battery-full" title="Batería"></i>
                        </div>
                    </div>

                    <!-- Cuerpo del Monitor -->
                    <div class="vsm-body-grid">
                        <!-- Zona Izquierda y Central (Ondas + Numéricos + NBP abajo) -->
                        <div class="vsm-left-area">
                            <div class="vsm-channels-and-nums">
                                <!-- Columna de 4 canales de ondas (II, Pleth, CO2, Resp) -->
                                <div class="vsm-waves-col">
                                    <!-- Canal 1: II (Ritmo cardíaco / ECG - Verde) -->
                                    <div class="vsm-wave-box">
                                        <div class="vsm-wave-header" style="color:#25e500;">
                                            <span class="vsm-wave-title">II</span>
                                            <span class="vsm-wave-meta">×1 25 mm/s</span>
                                        </div>
                                        <canvas id="canvas-ecg" class="vsm-canvas"></canvas>
                                    </div>
                                    <!-- Canal 2: Pleth (Oxigenación SpO2 - Azul/Cian) -->
                                    <div class="vsm-wave-box">
                                        <div class="vsm-wave-header" style="color:#1ec8ff;">
                                            <span class="vsm-wave-title">Pleth</span>
                                        </div>
                                        <canvas id="canvas-spo2" class="vsm-canvas"></canvas>
                                    </div>
                                    <!-- Canal 3: CO2 (Capnografía - Amarillo) -->
                                    <div class="vsm-wave-box">
                                        <div class="vsm-wave-header" style="color:#ffee00;">
                                            <span class="vsm-wave-title">CO<sub>2</sub></span>
                                            <span class="vsm-wave-meta">Capno</span>
                                        </div>
                                        <canvas id="canvas-co2" class="vsm-canvas"></canvas>
                                    </div>
                                    <!-- Canal 4: Resp (Respiración - Blanco) -->
                                    <div class="vsm-wave-box vsm-wave-box-last">
                                        <div class="vsm-wave-header" style="color:#cceeff;">
                                            <span class="vsm-wave-title">Resp</span>
                                        </div>
                                        <div class="vsm-wave-footer" style="color:#cceeff;">Impedance</div>
                                        <canvas id="canvas-resp" class="vsm-canvas"></canvas>
                                    </div>
                                </div>

                                <!-- Columna de bloques numéricos -->
                                <div class="vsm-nums-col">
                                    <!-- 1. HR (Verde) -->
                                    <div class="vsm-num-box" id="card-fc">
                                        <div class="vsm-num-header" style="color:#25e500;">
                                            <span>HR</span>
                                            <span class="vsm-num-unit">bpm</span>
                                        </div>
                                        <div class="vsm-num-content">
                                            <div class="vsm-num-limits" style="color:#25e500;">
                                                <span>120</span>
                                                <span>50</span>
                                            </div>
                                            <div class="vsm-num-value" id="vi-fc" style="color:#25e500;">--</div>
                                        </div>
                                    </div>

                                    <!-- 2. SpO2 (Azul/Cian) -->
                                    <div class="vsm-num-box" id="card-sat">
                                        <div class="vsm-num-header" style="color:#1ec8ff;">
                                            <span>SpO<sub>2</sub></span>
                                            <span class="vsm-num-unit">%</span>
                                        </div>
                                        <div class="vsm-num-content">
                                            <div class="vsm-num-limits" style="color:#1ec8ff;">
                                                <span>100</span>
                                                <span>90</span>
                                            </div>
                                            <div class="vsm-num-value" id="vi-sat" style="color:#1ec8ff;">--</div>
                                        </div>
                                    </div>

                                    <!-- 3. CO2 Capnografía (Amarillo) -->
                                    <div class="vsm-num-box" id="card-co2">
                                        <div class="vsm-num-header" style="color:#ffee00;">
                                            <span>CO<sub>2</sub></span>
                                            <span class="vsm-num-unit">mmHg</span>
                                        </div>
                                        <div class="vsm-num-content">
                                            <div class="vsm-num-limits" style="color:#ffee00;">
                                                <span>45</span>
                                                <span>35</span>
                                            </div>
                                            <div class="vsm-num-value" id="vi-etco2" style="color:#ffee00;">--</div>
                                        </div>
                                    </div>

                                    <!-- 4. RR Respiración (Blanco) -->
                                    <div class="vsm-num-box" id="card-fr">
                                        <div class="vsm-num-header" style="color:#cceeff;">
                                            <span>RR</span>
                                            <span class="vsm-num-unit">rpm</span>
                                        </div>
                                        <div class="vsm-num-content">
                                            <div class="vsm-num-limits" style="color:#cceeff;">
                                                <span>30</span>
                                                <span>8</span>
                                            </div>
                                            <div class="vsm-num-value" id="vi-fr" style="color:#cceeff;">--</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Barra Inferior: NBP -->
                            <div class="vsm-nbp-panel" id="card-ta">
                                <div class="vsm-nbp-left">
                                    <div class="vsm-nbp-title">
                                        <span class="vsm-nbp-lbl">NBP</span>
                                        <span class="vsm-nbp-unit">mmHg</span>
                                    </div>
                                    <div class="vsm-nbp-main-row">
                                        <div class="vsm-nbp-limits">
                                            <span>SYS</span>
                                            <span>160</span>
                                            <span>90</span>
                                        </div>
                                        <div class="vsm-nbp-sysdia" id="vi-ta">-- / --</div>
                                    </div>
                                </div>

                                <div class="vsm-nbp-center">
                                    <div class="vsm-nbp-manual-lbl">Manual</div>
                                    <div class="vsm-nbp-map-val" id="vi-map">--</div>
                                </div>

                                <div class="vsm-nbp-map-limits">
                                    <span>MAP</span>
                                    <span>100</span>
                                    <span>60</span>
                                </div>

                                <div class="vsm-nbp-history" id="vi-nbp-history">
                                    <div class="vsm-hist-row"><span>8:33</span><span>133/41 (63)</span></div>
                                    <div class="vsm-hist-row"><span>8:28</span><span>129/43 (65)</span></div>
                                    <div class="vsm-hist-row"><span>8:23</span><span>135/46 (68)</span></div>
                                    <div class="vsm-hist-row"><span>8:18</span><span>131/45 (66)</span></div>
                                    <div class="vsm-hist-row"><span>8:13</span><span>128/42 (64)</span></div>
                                    <div class="vsm-hist-row"><span>8:08</span><span>130/44 (66)</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Columna Derecha: Pulse, Temp (verde menta, siempre visible), Code, Reloj y Botón Silence -->
                        <div class="vsm-right-col">
                            <div class="vsm-right-box">
                                <div class="vsm-pulse-section">
                                    <div class="vsm-pulse-header">
                                        <span>Pulse</span>
                                        <span class="vsm-pulse-unit">bpm</span>
                                    </div>
                                    <div class="vsm-pulse-val" id="vi-pulse">--</div>
                                </div>

                                <!-- HU-03 / RF-02: Temperatura fija y siempre visible (verde menta) -->
                                <div class="vsm-temp-section" id="card-temp">
                                    <div class="vsm-temp-header">
                                        <span>Temp</span>
                                        <span class="vsm-temp-unit">°C</span>
                                    </div>
                                    <div class="vsm-temp-row">
                                        <div class="vsm-temp-limits">
                                            <span>37.5</span>
                                            <span>36.0</span>
                                        </div>
                                        <div class="vsm-temp-val" id="vi-temp">--</div>
                                    </div>
                                </div>

                                <div class="vsm-code-section">
                                    <div class="vsm-code-lbl">Code</div>
                                    <div class="vsm-code-signs">- +</div>
                                    <div class="vsm-clock-val" id="vi-clock">0:00</div>
                                </div>
                            </div>

                            <div class="vsm-silence-container">
                                <button type="button" class="vsm-silence-btn" id="btn-mute" title="Silenciar / Activar sonido de alarmas y monitor">
                                    <i class="bi bi-bell-slash" id="silence-icon"></i>
                                    <span>Silence</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Elementos ocultos para compatibilidad -->
            <canvas id="ecgCanvas" style="display:none"></canvas>
            <div id="vitals-indicators" style="display:none"></div>
        </div>

    </main>

    <!-- Modal PDF/Imagen -->
    <div class="modal fade" id="archivoModal" tabindex="-1" aria-labelledby="archivoModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="archivoModalLabel">Vista del Archivo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <iframe id="archivoIframe" src="" frameborder="0" style="width:100%;height:80vh;"></iframe>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="container text-center">
            <span class="text-muted">Cuarta Generación de Ingeniería en Software © 2024</span>
        </div>
    </footer>

    <script src="js/simulacion.js?v=<?= time() ?>"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>