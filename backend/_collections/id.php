<?php
require_once __DIR__ . '/../db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Extract collection ID from the URL (e.g., /backend/collections/cl123...)
$requestUri = $_SERVER['REQUEST_URI'];
// Assuming the ID is the last segment of the URL after /backend/collections/
$parts = explode('/', $requestUri);
$collectionId = end($parts);

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT id, name, createdAt, updatedAt
        FROM `Collection`
        WHERE id = ? AND userId = ?
        LIMIT 1
    ");
    $stmt->execute([$collectionId, $userId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found or you don't have permission to access it."]);
        exit;
    }

    echo json_encode([
        "status" => "OK",
        "collection" => $collection
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Server error",
        "details" => $e->getMessage()
    ]);
}
