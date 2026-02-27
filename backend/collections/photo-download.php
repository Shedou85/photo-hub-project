<?php
/**
 * Individual photo download endpoint for delivery tokens.
 *
 * Route: GET /deliver/{deliveryToken}/photo/{photoId}
 * Auth: Public — delivery token verification
 * Returns: Single photo file with Content-Disposition attachment header
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/download-tracker.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';
require_once __DIR__ . '/../helpers/r2.php';
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

// Rate limit: 60 individual photo downloads per 15 minutes per IP
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit('photo_dl:' . $clientIp, 60, 900)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many download requests. Please try again later.']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify delivery token and get collection
    $stmt = $pdo->prepare("SELECT id, status, expiresAt FROM Collection WHERE deliveryToken = ?");
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

    // Check collection expiration
    if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
        http_response_code(410);
        echo json_encode(['error' => 'This collection has expired.']);
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

    $objectKey = $photo['storagePath'];
    if (empty($objectKey)) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo file not found']);
        exit;
    }

    // Verify the object exists in R2 and get its size
    try {
        $fileSize = r2GetSize($objectKey);
    } catch (\RuntimeException $e) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo file not found in storage']);
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

    // Determine MIME type from the object key extension
    $ext = strtolower(pathinfo($objectKey, PATHINFO_EXTENSION));
    $mimeMap = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    $mimeType = $mimeMap[$ext] ?? 'application/octet-stream';

    // Send download headers
    $safeFilename = preg_replace('/[^A-Za-z0-9._\- ]/', '_', $photo['filename']);
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
    header('Content-Length: ' . $fileSize);
    header('Content-Transfer-Encoding: binary');
    header('Accept-Ranges: bytes');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Stream from R2 to browser
    $stream = r2GetStream($objectKey);
    $resource = $stream->detach();
    fpassthru($resource);
    fclose($resource);

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
