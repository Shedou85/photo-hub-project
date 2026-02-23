<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Parse URI: /collections/{collectionId}/edited[/{editedPhotoId}]
$parts = parseRouteParts();
$collectionId = $parts[1] ?? '';
$editedPhotoId = $parts[3] ?? '';

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
if (!empty($editedPhotoId) && !isValidId($editedPhotoId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid edited photo ID format."]);
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
        $stmt = $pdo->prepare("SELECT id, filename, storagePath, createdAt FROM `EditedPhoto` WHERE collectionId = ? ORDER BY createdAt ASC");
        $stmt->execute([$collectionId]);
        $editedPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "OK", "editedPhotos" => $editedPhotos]);
        exit;
    }

    if ($method === 'POST') {
        if (empty($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(["error" => "No file uploaded."]);
            exit;
        }

        $result = handleFileUpload($_FILES['file'], $collectionId, 'edited');
        if (!$result['ok']) {
            http_response_code($result['code']);
            echo json_encode(["error" => $result['error']]);
            exit;
        }

        try {
            $createdAt = date('Y-m-d H:i:s.v');
            $stmt = $pdo->prepare("INSERT INTO `EditedPhoto` (id, filename, storagePath, collectionId, createdAt) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$result['id'], $result['filename'], $result['storagePath'], $collectionId, $createdAt]);

            echo json_encode([
                "status" => "OK",
                "editedPhoto" => [
                    "id" => $result['id'],
                    "filename" => $result['filename'],
                    "storagePath" => $result['storagePath'],
                    "createdAt" => $createdAt
                ]
            ]);
            exit;
        } catch (Throwable $e) {
            // CLEANUP: Remove uploaded file if DB insert failed
            safeDeleteUploadedFile($result['storagePath']);
            throw $e;
        }
    }

    if ($method === 'DELETE') {
        if (empty($editedPhotoId)) {
            http_response_code(400);
            echo json_encode(["error" => "Edited photo ID is required."]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, storagePath FROM `EditedPhoto` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$editedPhotoId, $collectionId]);
        $editedPhoto = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$editedPhoto) {
            http_response_code(404);
            echo json_encode(["error" => "Edited photo not found."]);
            exit;
        }

        // Delete file from disk (validates path is within uploads directory)
        safeDeleteUploadedFile($editedPhoto['storagePath']);

        $pdo->prepare("DELETE FROM `EditedPhoto` WHERE id = ? AND collectionId = ?")->execute([$editedPhotoId, $collectionId]);

        echo json_encode(["status" => "OK"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    error_log("Edited photo handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
