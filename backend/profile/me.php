<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
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

if (!is_array($data) || empty($data)) {
    http_response_code(400);
    echo json_encode(["error" => "No data provided"]);
    exit;
}

$setParts = [];
$params = [];

if (array_key_exists('name', $data)) {
    $name = $data['name'];
    if ($name !== null && mb_strlen($name) > 100) {
        http_response_code(400);
        echo json_encode(["error" => "Name must be 100 characters or less"]);
        exit;
    }
    $setParts[] = "name = ?";
    $params[] = $name;
}

if (array_key_exists('bio', $data)) {
    $bio = $data['bio'];
    if ($bio !== null && mb_strlen($bio) > 1000) {
        http_response_code(400);
        echo json_encode(["error" => "Bio must be 1000 characters or less"]);
        exit;
    }
    $setParts[] = "bio = ?";
    $params[] = $bio;
}

if (empty($setParts)) {
    http_response_code(400);
    echo json_encode(["error" => "No valid fields to update"]);
    exit;
}

try {
    $pdo = getDbConnection();

    $params[] = $_SESSION['user_id'];
    $stmt = $pdo->prepare("
        UPDATE `User`
        SET " . implode(', ', $setParts) . "
        WHERE id = ?
    ");
    $stmt->execute($params);

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
