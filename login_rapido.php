<?php
session_start();

$email_admin = "admin@cimed.uabc.mx";
$hashed = hash('sha256', $email_admin);

// Activar sesión inmediatamente
$_SESSION['loggedin'] = true;
$_SESSION['correo'] = $email_admin;
$_SESSION['superadmin'] = 1;

// Intentar asegurar el usuario y casos en la BD si la conexión está disponible
try {
    @include_once __DIR__ . '/BE/connection.php';
    if (isset($conn) && !$conn->connect_error) {
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
        if ($stmt) {
            $stmt->bind_param("s", $hashed);
            $stmt->execute();
            $res = $stmt->get_result();

            if ($res && $res->num_rows == 0) {
                $dummyPass = password_hash("admin123", PASSWORD_DEFAULT);
                $ins = $conn->prepare("INSERT INTO usuarios (nombre, correo, contraseña, superadmin) VALUES ('Administrador Demo', ?, ?, 1)");
                if ($ins) {
                    $ins->bind_param("ss", $hashed, $dummyPass);
                    $ins->execute();
                    $newId = $ins->insert_id;
                    // Asignar los casos existentes al nuevo admin para que aparezcan en su panel
                    $conn->query("UPDATE casos SET id_usuario_creador = $newId WHERE id_usuario_creador IS NULL OR id_usuario_creador = 0");
                }
            } else if ($res && $res->num_rows > 0) {
                $row = $res->fetch_assoc();
                $userId = $row['id'];
                $checkCases = $conn->query("SELECT id FROM casos WHERE id_usuario_creador = $userId LIMIT 1");
                if ($checkCases && $checkCases->num_rows == 0) {
                    $conn->query("UPDATE casos SET id_usuario_creador = $userId LIMIT 5");
                }
            }
        }
    }
} catch (Throwable $e) {
    // Si la BD no está levantada o da error, la sesión de todos modos queda iniciada
}

// Redireccionar al panel docente
header('Location: admin-panel.php');
exit;

