<?php
require_once __DIR__ . '/../db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Parse URI: /collections/{collectionId}/photos[/{photoId}]
$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$requestUri = rtrim($requestUri, '/');

$parts = explode('/', ltrim($requestUri, '/'));
// parts: ['collections', collectionId, 'photos', ?photoId]
$collectionId = $parts[1] ?? '';
$photoId = $parts[3] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
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

        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["error" => "File upload error: " . $file['error']]);
            exit;
        }

        // Validate file type
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, $allowedMimes, true)) {
            http_response_code(400);
            echo json_encode(["error" => "Only JPEG, PNG, and WEBP files are allowed."]);
            exit;
        }

        // Validate file size (max 20 MB)
        $maxSize = 20 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(["error" => "File size exceeds 20 MB limit."]);
            exit;
        }

        $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $ext = $extMap[$mimeType];
        $newId = generateCuid();
        $storagePath = "uploads/{$collectionId}/{$newId}.{$ext}";

        $uploadDir = __DIR__ . '/../uploads/' . $collectionId;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], __DIR__ . '/../' . $storagePath)) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to save file."]);
            exit;
        }

        $originalFilename = basename($file['name']);
        $createdAt = date('Y-m-d H:i:s.v');

        $stmt = $pdo->prepare("INSERT INTO `Photo` (id, filename, storagePath, collectionId, createdAt) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$newId, $originalFilename, $storagePath, $collectionId, $createdAt]);

        echo json_encode([
            "status" => "OK",
            "photo" => [
                "id" => $newId,
                "filename" => $originalFilename,
                "storagePath" => $storagePath,
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

        // Delete file from disk
        $filePath = __DIR__ . '/../' . $photo['storagePath'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $pdo->prepare("DELETE FROM `Photo` WHERE id = ? AND collectionId = ?")->execute([$photoId, $collectionId]);

        echo json_encode(["status" => "OK"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error", "details" => $e->getMessage()]);
}
