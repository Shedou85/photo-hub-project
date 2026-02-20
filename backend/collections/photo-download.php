<?php
/**
 * Individual photo download endpoint for delivery tokens.
 *
 * Route: GET /deliver/{deliveryToken}/photo/{photoId}
 * Auth: Public — delivery token verification
 * Returns: Single photo file with Content-Disposition attachment header
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/download-tracker.php';
require_once __DIR__ . '/../utils.php';

// Extract deliveryToken and photoId from route: /deliver/{deliveryToken}/photo/{photoId}
$routeParts = parseRouteParts();
// routeParts: ['deliver', deliveryToken, 'photo', photoId]
$deliveryToken = $routeParts[1] ?? '';
$photoId = $routeParts[3] ?? '';

if (empty($deliveryToken) || empty($photoId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Delivery token and photo ID required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify delivery token and get collection
    $stmt = $pdo->prepare("SELECT id, status FROM Collection WHERE deliveryToken = ?");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found']);
        exit;
    }

    // Allow downloads from DELIVERED and DOWNLOADED statuses
    if ($collection['status'] !== 'DELIVERED' && $collection['status'] !== 'DOWNLOADED') {
        http_response_code(403);
        echo json_encode(['error' => 'Collection not available for download']);
        exit;
    }

    $collectionId = $collection['id'];

    // Fetch the specific edited photo
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath
        FROM EditedPhoto
        WHERE id = ? AND collectionId = ?
        LIMIT 1
    ");
    $stmt->execute([$photoId, $collectionId]);
    $photo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$photo) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo not found']);
        exit;
    }

    $filePath = __DIR__ . '/../' . $photo['storagePath'];

    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo file not found on disk']);
        exit;
    }

    // Track download BEFORE streaming (while we can still send JSON errors)
    $isNewDownload = trackDownload($pdo, $collectionId, 'INDIVIDUAL', $photoId);
    error_log("Individual photo download: collection={$collectionId}, photo={$photoId}, new=" . ($isNewDownload ? 'true' : 'false'));

    // Transition to DOWNLOADED status on first download (idempotent)
    if ($collection['status'] === 'DELIVERED') {
        $updateStmt = $pdo->prepare("
            UPDATE Collection
            SET status = 'DOWNLOADED', updatedAt = NOW(3)
            WHERE id = ? AND status = 'DELIVERED'
        ");
        $updateStmt->execute([$collectionId]);
        if ($updateStmt->rowCount() > 0) {
            error_log("Collection {$collectionId} transitioned to DOWNLOADED status via individual download");
        }
    }

    // --- POINT OF NO RETURN: Headers will be sent ---

    // Disable output buffering
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    // Send download headers
    $safeFilename = $photo['filename'];
    $fileSize = filesize($filePath);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $filePath) ?: 'application/octet-stream';
    finfo_close($finfo);

    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . addslashes($safeFilename) . '"');
    header('Content-Length: ' . $fileSize);
    header('Content-Transfer-Encoding: binary');
    header('Accept-Ranges: bytes');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Stream file to browser (memory-efficient, 8KB chunks)
    readfile($filePath);

} catch (\Exception $e) {
    if (!headers_sent()) {
        http_response_code(500);
        error_log('Photo download error: ' . $e->getMessage());
        echo json_encode(['error' => 'Download failed.']);
    } else {
        error_log("Photo download error after streaming started: " . $e->getMessage());
    }
}

exit;
