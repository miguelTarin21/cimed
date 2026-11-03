<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: ./');
    exit;
}
include './BE/connection.php';

$caseId = isset($_GET['id']) ? intval($_GET['id']) : 0;
$nombreCaso = "Caso Clínico";
$descripcionCaso = "";

if ($caseId > 0) {
    $stmt = $conn->prepare("SELECT nombre, descripcion FROM casos WHERE id = ?");
    $stmt->bind_param("i", $caseId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result && $row = $result->fetch_assoc()) {
        $nombreCaso = $row['nombre'];
        $descripcionCaso = $row['descripcion'];
    }
    $stmt->close();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CIMED - Evaluaciones: <?= htmlspecialchars($nombreCaso) ?></title>
  <link rel="icon" type="image/png" href="images/CimarronMedicoIndexIcon.png">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link rel="stylesheet" href="css/evaluaciones.css">
</head>
<body style="margin:0; background:#f4f6f9;">

<script>
  const currentCaseId = <?= $caseId ?>;
  const currentCaseName = <?= json_encode($nombreCaso) ?>;
</script>

<div class="eval-overlay eval-active">
  <div id="history-view" class="eval-modal view-active">
    <div class="modal-header-simple">
      <button class="btn-text" id="btn-back-cases">← Volver al Panel de Casos</button>
      <button type="button" class="btn-close" onclick="cerrarModalEvaluaciones()" aria-label="Close"></button>
    </div>
    <div class="history-title-container">
      <h2>Historial de Evaluaciones</h2>
      <p>Caso: <?= htmlspecialchars($nombreCaso) ?></p>
    </div>

    <div class="history-toolbar">
      <input type="text" placeholder="Q Buscar por equipo o alumno..." class="search-input">
      <select class="filter-select">
        <option value="">Todos los subgrupos</option>
      </select>
      <button class="btn-primary" id="btn-new-eval">Calificar Nuevo Equipo</button>
    </div>

    <table class="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Subgrupo</th>
          <th>Equipo</th>
          <th>Integrantes</th>
          <th>Calificación</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="history-tbody">
      </tbody>
    </table>
    <div class="history-footer">
      <span id="eval-count">Mostrando 0 equipos evaluados</span>
      <button class="btn-text">Limpiar todas las evaluaciones del semestre</button>
    </div>
  </div>

  <div id="eval-view" class="eval-modal">
    <div class="header">
      <button class="btn-back" id="btn-back-history">← Volver al Historial</button>
      <div>
        <h1>Evaluación de Simulación Clínica</h1>
        <p>Caso: <?= htmlspecialchars($nombreCaso) ?></p>
      </div>
      <div class="status-badge" onclick="switchView('history')">Evaluación en curso</div>
    </div>
    
    <div class="toolbar">
      <input type="text" id="input-subgroup" placeholder="Subgrupo (ej. 441-1)" class="form-input">
      <input type="text" id="input-team" placeholder="Equipo (ej. 3)" class="form-input">
      
      <div class="tag-container" id="student-tags"></div>
      <input type="text" id="input-student" placeholder="+ Escribir alumno y presionar Enter..." class="form-input student-input">
    </div>

    <div class="content">
      <div class="left-panel">
        <div class="rubric-header">
          <h3>Rúbrica de evaluación</h3>
          <span id="criteria-count">0 de 10 criterios evaluados</span>
        </div>
        
        <div id="rubric-container"></div>
        
        <div class="feedback-section">
          <div class="feedback-box">
            <strong>Fortalezas</strong>
            <textarea id="text-strengths" placeholder="Escribe las fortalezas..."></textarea>
          </div>
          <div class="feedback-box">
            <strong>Áreas de Oportunidad</strong>
            <textarea id="text-weaknesses" placeholder="Escribe las áreas de oportunidad..."></textarea>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="score-section">
          <div class="score-circle" id="total-score-circle">
            <div><span class="score-label">Puntaje</span><span id="circle-score-val">0</span></div>
          </div>
          <div class="score-text">
            <h4>Puntaje Obtenido</h4>
            <h2 id="total-score-text">0 puntos</h2>
            <p id="status-text">Pendiente</p>
          </div>
        </div>

        <table class="summary-table" id="summary-table">
          <thead>
            <tr>
              <th>Criterio</th>
              <th>Ponderación</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>

        <div class="action-buttons">
          <button class="btn-dark" id="btn-save-eval">Guardar Evaluación</button>
          <button class="btn-outline" onclick="switchView('history')">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script src="js/evaluaciones.js"></script>
</body>
</html>
