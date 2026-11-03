<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/connection.php';

// crear tablas si no existen
$conn->query("
CREATE TABLE IF NOT EXISTS `evaluaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_caso` int(11) NOT NULL,
  `subgrupo` varchar(50) NOT NULL,
  `equipo` varchar(50) NOT NULL,
  `nota_final` decimal(5,2) NOT NULL DEFAULT 0.00,
  `debriefing` tinyint(1) NOT NULL DEFAULT 0,
  `fortalezas` text DEFAULT NULL,
  `debilidades` text DEFAULT NULL,
  `puntajes_rubrica` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
");

$conn->query("
CREATE TABLE IF NOT EXISTS `integrantes_evaluacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int(11) NOT NULL,
  `nombre_alumno` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
");

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'datos invalidos']);
    exit;
}

// validar id de evaluacion
$id = (isset($data['id']) && is_numeric($data['id']) && (int)$data['id'] < 1000000000) ? (int)$data['id'] : 0;
$id_caso = isset($data['caseId']) && is_numeric($data['caseId']) ? (int)$data['caseId'] : 1;
$subgrupo = isset($data['subgroup']) ? trim($data['subgroup']) : 'N/A';
$equipo = isset($data['team']) ? trim($data['team']) : 'N/A';
$nota_final = isset($data['total']) ? (float)$data['total'] : 0.00;
$debriefing = !empty($data['debriefing']) ? 1 : 0;
$fortalezas = isset($data['strengths']) ? trim($data['strengths']) : '';
$debilidades = isset($data['weaknesses']) ? trim($data['weaknesses']) : '';
$puntajes_rubrica = isset($data['scores']) ? (is_array($data['scores']) ? json_encode($data['scores'], JSON_UNESCAPED_UNICODE) : (string)$data['scores']) : '{}';
$students = isset($data['students']) && is_array($data['students']) ? $data['students'] : [];

// verificar si existe el registro antes de actualizar
$evalExists = false;
if ($id > 0) {
    $chk = $conn->prepare("SELECT id FROM evaluaciones WHERE id = ?");
    if ($chk) {
        $chk->bind_param("i", $id);
        $chk->execute();
        $chkRes = $chk->get_result();
        if ($chkRes && $chkRes->num_rows > 0) {
            $evalExists = true;
        }
        $chk->close();
    }
}

if ($evalExists) {
    // actualizar evaluacion
    $stmt = $conn->prepare("UPDATE evaluaciones SET id_caso = ?, subgrupo = ?, equipo = ?, nota_final = ?, debriefing = ?, fortalezas = ?, debilidades = ?, puntajes_rubrica = ? WHERE id = ?");
    $stmt->bind_param("issdisssi", $id_caso, $subgrupo, $equipo, $nota_final, $debriefing, $fortalezas, $debilidades, $puntajes_rubrica, $id);
    $stmt->execute();
    $stmt->close();
    $evalId = $id;

    // actualizar integrantes
    $del = $conn->prepare("DELETE FROM integrantes_evaluacion WHERE id_evaluacion = ?");
    $del->bind_param("i", $evalId);
    $del->execute();
    $del->close();
} else {
    // insertar evaluacion
    $stmt = $conn->prepare("INSERT INTO evaluaciones (id_caso, subgrupo, equipo, nota_final, debriefing, fortalezas, debilidades, puntajes_rubrica, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("issdisss", $id_caso, $subgrupo, $equipo, $nota_final, $debriefing, $fortalezas, $debilidades, $puntajes_rubrica);
    $stmt->execute();
    $evalId = $stmt->insert_id;
    $stmt->close();
}

// guardar integrantes
if ($evalId && count($students) > 0) {
    $insStu = $conn->prepare("INSERT INTO integrantes_evaluacion (id_evaluacion, nombre_alumno) VALUES (?, ?)");
    foreach ($students as $stuName) {
        $cleanName = trim($stuName);
        if ($cleanName !== '') {
            $insStu->bind_param("is", $evalId, $cleanName);
            $insStu->execute();
        }
    }
    $insStu->close();
}

echo json_encode([
    'success' => true,
    'id' => $evalId,
    'message' => 'Evaluacion guardada correctamente'
]);
exit;
