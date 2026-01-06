<?php

// =====================
// CORS
// =====================
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: https://pixelforge.pro");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Preflight (OPTIONS) užklausos
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// =====================
// DB
// =====================
require_once __DIR__ . '/db.php';

try {
    $pdo = getDbConnection();

    // Testinė užklausa (saugiausia)
    $stmt = $pdo->query("SELECT DATABASE() AS db_name");
    $dbInfo = $stmt->fetch();

    echo json_encode([
        "status" => "OK",
        "db_connection" => "connected",
        "database" => $dbInfo['db_name'],
        "time" => date("Y-m-d H:i:s")
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "status" => "ERROR",
        "message" => "Database connection failed",
        "error" => $e->getMessage() // prod aplinkoj – ŠITĄ IŠIMTI
    ]);
}
