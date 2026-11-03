<?php
$caseId = isset($_GET['id']) ? intval($_GET['id']) : 0;
header("Location: evaluaciones.php" . ($caseId > 0 ? "?id=" . $caseId : ""));
exit;

