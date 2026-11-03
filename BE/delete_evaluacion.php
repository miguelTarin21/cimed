<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/connection.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$id = 0;
if ($data && isset($data['id'])) {
    $id = (int)$data['id'];
} else if (isset($_POST['id'])) {
    $id = (int)$_POST['id'];
} else if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];
}

if ($id > 0) {
    // eliminar evaluacion
    $stmt = $conn->prepare("DELETE FROM evaluaciones WHERE id = ?");
    if ($stmt) {
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();
    }

    // eliminar integrantes asociados
    $stmtStu = $conn->prepare("DELETE FROM integrantes_evaluacion WHERE id_evaluacion = ?");
    if ($stmtStu) {
        $stmtStu->bind_param("i", $id);
        $stmtStu->execute();
        $stmtStu->close();
    }

    echo json_encode(['success' => true, 'message' => 'Evaluacion eliminada correctamente']);
} else {
    echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
}
exit;

