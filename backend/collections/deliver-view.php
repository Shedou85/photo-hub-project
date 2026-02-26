<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

// This is a PUBLIC endpoint — no session/auth check required
// Delivery token IS the credential

header('Content-Type: application/json');

$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Parse deliveryToken from URL: /deliver/{deliveryToken}
$parts = parseRouteParts();
$deliveryToken = $parts[1] ?? '';

if (empty($deliveryToken)) {
    http_response_code(400);
    echo json_encode(['error' => 'Delivery token is required.']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Query collection by deliveryToken
    $stmt = $pdo->prepare("
        SELECT id, name, clientName, status, expiresAt, createdAt
        FROM `Collection`
        WHERE deliveryToken = ?
        LIMIT 1
    ");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found.']);
        exit;
    }

    // Validate status — only DELIVERED or DOWNLOADED collections are accessible
    if (!in_array($collection['status'], ['DELIVERED', 'DOWNLOADED'])) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Collection not ready for delivery',
            'status' => $collection['status']
        ]);
        exit;
    }

    // Check collection expiration
    if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
        http_response_code(410);
        echo json_encode(['error' => 'This collection has expired.']);
        exit;
    }

    // Query EditedPhoto table (NOT Photo table) — only final/edited photos
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath, createdAt
        FROM `EditedPhoto`
        WHERE collectionId = ?
        ORDER BY filename ASC
    ");
    $stmt->execute([$collection['id']]);
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build response
    $response = [
        'status' => 'OK',
        'collection' => [
            'id' => $collection['id'],
            'name' => $collection['name'],
            'clientName' => $collection['clientName'],
            'collectionStatus' => $collection['status'],
            'createdAt' => $collection['createdAt'],
            'photoCount' => count($photos),
            'photos' => $photos
        ]
    ];

    echo json_encode($response);

} catch (Throwable $e) {
    http_response_code(500);
    error_log('Deliver-view error: ' . $e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
