<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

// This is a PUBLIC endpoint — no session/auth check required

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    // Parse shareId from URL: /share/{shareId}
    $parts = parseRouteParts();
    $shareId = $parts[1] ?? '';

    if (empty($shareId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Share ID is required.']);
        exit;
    }

    $pdo = getDbConnection();

    // Query collection by shareId — explicitly exclude sensitive fields
    $stmt = $pdo->prepare("
        SELECT id, name, status, clientName, shareId, coverPhotoId, createdAt
        FROM `Collection`
        WHERE shareId = ?
        LIMIT 1
    ");
    $stmt->execute([$shareId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found.']);
        exit;
    }

    // Query photos for this collection
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath, thumbnailPath, createdAt
        FROM `Photo`
        WHERE collectionId = ?
        ORDER BY createdAt ASC
    ");
    $stmt->execute([$collection['id']]);
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Attach photos to collection
    $collection['photos'] = $photos;

    echo json_encode(['status' => 'OK', 'collection' => $collection]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
