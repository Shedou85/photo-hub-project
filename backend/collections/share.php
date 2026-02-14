<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

// This is a PUBLIC endpoint — no session/auth check required

$requestMethod = $_SERVER['REQUEST_METHOD'];

if (!in_array($requestMethod, ['GET', 'PATCH'])) {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Parse shareId from URL: /share/{shareId}
$parts = parseRouteParts();
$shareId = $parts[1] ?? '';

if (empty($shareId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Share ID is required.']);
    exit;
}

$pdo = getDbConnection();

if ($requestMethod === 'PATCH') {
    // Handle status update: SELECTING → REVIEWING
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $newStatus = $data['status'] ?? '';

        if ($newStatus !== 'REVIEWING') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status transition. Only REVIEWING is allowed.']);
            exit;
        }

        // Query collection by shareId
        $stmt = $pdo->prepare("
            SELECT id, status
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

        // Validate status transition: Only allow SELECTING → REVIEWING
        if ($collection['status'] !== 'SELECTING') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status transition. Collection must be in SELECTING status.']);
            exit;
        }

        // Update status
        $stmt = $pdo->prepare("
            UPDATE `Collection`
            SET status = ?, updatedAt = NOW(3)
            WHERE id = ?
        ");
        $stmt->execute(['REVIEWING', $collection['id']]);

        // Return updated collection
        $stmt = $pdo->prepare("
            SELECT id, name, status, clientName, shareId, coverPhotoId, createdAt
            FROM `Collection`
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$collection['id']]);
        $updatedCollection = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'OK', 'collection' => $updatedCollection]);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
    }

} else {
    // GET request — return collection details
    try {
        // Query collection by shareId — explicitly exclude sensitive fields
        $stmt = $pdo->prepare("
            SELECT id, name, status, clientName, shareId, coverPhotoId, deliveryToken, createdAt
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

        // Query selections for this collection
        $stmt = $pdo->prepare("
            SELECT id, photoId, createdAt
            FROM `Selection`
            WHERE collectionId = ?
            ORDER BY createdAt ASC
        ");
        $stmt->execute([$collection['id']]);
        $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach selections to collection
        $collection['selections'] = $selections;

        echo json_encode(['status' => 'OK', 'collection' => $collection]);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
    }
}
