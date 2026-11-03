<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    echo json_encode([]);
    exit;
}

require_once __DIR__ . '/connection.php';

$id_caso = isset($_GET['id_caso']) && is_numeric($_GET['id_caso']) ? (int)$_GET['id_caso'] : 0;

// verificar si existe la tabla
$tableCheck = $conn->query("SHOW TABLES LIKE 'evaluaciones'");
if (!$tableCheck || $tableCheck->num_rows == 0) {
    echo json_encode([]);
    exit;
}

if ($id_caso > 0) {
    $stmt = $conn->prepare("SELECT e.*, c.nombre as nombre_caso FROM evaluaciones e LEFT JOIN casos c ON e.id_caso = c.id WHERE e.id_caso = ? ORDER BY e.id DESC");
    $stmt->bind_param("i", $id_caso);
} else {
    $stmt = $conn->prepare("SELECT e.*, c.nombre as nombre_caso FROM evaluaciones e LEFT JOIN casos c ON e.id_caso = c.id ORDER BY e.id DESC");
}

$stmt->execute();
$res = $stmt->get_result();

$evaluations = [];

while ($row = $res->fetch_assoc()) {
    $evalId = (int)$row['id'];
    
    // obtener integrantes
    $stuStmt = $conn->prepare("SELECT nombre_alumno FROM integrantes_evaluacion WHERE id_evaluacion = ? ORDER BY id ASC");
    $stuStmt->bind_param("i", $evalId);
    $stuStmt->execute();
    $stuRes = $stuStmt->get_result();
    $students = [];
    while ($stuRow = $stuRes->fetch_assoc()) {
        $students[] = $stuRow['nombre_alumno'];
    }
    $stuStmt->close();
    
    $scores = json_decode($row['puntajes_rubrica'] ?? '{}', true);

    $evaluations[] = [
        'id' => (string)$evalId,
        'caseId' => (string)$row['id_caso'],
        'caseName' => $row['nombre_caso'] ?? 'Caso Clinico',
        'date' => date('d/m/Y', strtotime($row['fecha_creacion'])),
        'subgroup' => $row['subgrupo'],
        'team' => $row['equipo'],
        'students' => $students,
        'scores' => $scores,
        'total' => (float)$row['nota_final'],
        'strengths' => $row['fortalezas'] ?? '',
        'weaknesses' => $row['debilidades'] ?? '',
        'debriefing' => (bool)$row['debriefing']
    ];
}
$stmt->close();

echo json_encode($evaluations, JSON_UNESCAPED_UNICODE);
exit;

