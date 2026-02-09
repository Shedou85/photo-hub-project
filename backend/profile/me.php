<?php
require_once __DIR__ . '/../db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$name = $data['name'] ?? null;
$bio = $data['bio'] ?? null;

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        UPDATE `User`
        SET name = ?, bio = ?
        WHERE id = ?
    ");
    $stmt->execute([$name, $bio, $_SESSION['user_id']]);

    $stmt = $pdo->prepare("
        SELECT name, email, bio, createdAt
        FROM `User`
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    echo json_encode([
        "status" => "OK",
        "user" => $user
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
