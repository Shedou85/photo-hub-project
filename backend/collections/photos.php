<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Parse URI: /collections/{collectionId}/photos[/{photoId}]
$parts = parseRouteParts();
$collectionId = $parts[1] ?? '';
$photoId = $parts[3] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

// Validate ID formats to prevent path traversal
if (!isValidId($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid collection ID format."]);
    exit;
}
if (!empty($photoId) && !isValidId($photoId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid photo ID format."]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    // Verify collection ownership
    $stmt = $pdo->prepare("SELECT id FROM `Collection` WHERE id = ? AND userId = ? LIMIT 1");
    $stmt->execute([$collectionId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, filename, storagePath, createdAt FROM `Photo` WHERE collectionId = ? ORDER BY createdAt ASC");
        $stmt->execute([$collectionId]);
        $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT id, filename, storagePath, createdAt FROM `EditedPhoto` WHERE collectionId = ? ORDER BY createdAt ASC");
        $stmt->execute([$collectionId]);
        $editedPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "OK", "photos" => $photos, "editedPhotos" => $editedPhotos]);
        exit;
    }

    if ($method === 'POST') {
        if (empty($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(["error" => "No file uploaded."]);
            exit;
        }

        $result = handleFileUpload($_FILES['file'], $collectionId);
        if (!$result['ok']) {
            http_response_code($result['code']);
            echo json_encode(["error" => $result['error']]);
            exit;
        }

        $createdAt = date('Y-m-d H:i:s.v');
        $stmt = $pdo->prepare("INSERT INTO `Photo` (id, filename, storagePath, collectionId, createdAt) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$result['id'], $result['filename'], $result['storagePath'], $collectionId, $createdAt]);

        echo json_encode([
            "status" => "OK",
            "photo" => [
                "id" => $result['id'],
                "filename" => $result['filename'],
                "storagePath" => $result['storagePath'],
                "createdAt" => $createdAt
            ]
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        if (empty($photoId)) {
            http_response_code(400);
            echo json_encode(["error" => "Photo ID is required."]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, storagePath FROM `Photo` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoId, $collectionId]);
        $photo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$photo) {
            http_response_code(404);
            echo json_encode(["error" => "Photo not found."]);
            exit;
        }

        // Delete file from disk (validates path is within uploads directory)
        safeDeleteUploadedFile($photo['storagePath']);

        $pdo->prepare("DELETE FROM `Photo` WHERE id = ? AND collectionId = ?")->execute([$photoId, $collectionId]);

        echo json_encode(["status" => "OK"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    error_log("Photo handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
