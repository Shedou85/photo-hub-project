<?php
require_once __DIR__ . '/../db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Extract collection ID from URL: /collections/{id}/delivery
$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$requestUri = rtrim($requestUri, '/');
$parts = explode('/', ltrim($requestUri, '/'));
$collectionId = $parts[1] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify ownership and fetch delivery info
    $stmt = $pdo->prepare("
        SELECT id, name, status, deliveryToken, shareId
        FROM `Collection`
        WHERE id = ? AND userId = ?
        LIMIT 1
    ");
    $stmt->execute([$collectionId, $userId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    // Return delivery info
    echo json_encode([
        "status" => "OK",
        "delivery" => [
            "collectionId" => $collection['id'],
            "collectionName" => $collection['name'],
            "collectionStatus" => $collection['status'],
            "deliveryToken" => $collection['deliveryToken'],
            "hasDeliveryToken" => !empty($collection['deliveryToken'])
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(["error" => "Internal server error."]);
}
