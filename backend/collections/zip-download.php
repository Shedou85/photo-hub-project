<?php
/**
 * Streaming ZIP download endpoint for delivery tokens.
 *
 * Route: GET /deliver/{deliveryToken}/zip
 * Auth: Public — delivery token verification
 * Returns: ZIP file stream containing all edited photos for the collection
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/download-tracker.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';
require_once __DIR__ . '/../utils.php';

use ZipStream\ZipStream;
use ZipStream\CompressionMethod;

// Extract delivery token from route: /deliver/{deliveryToken}/zip
$routeParts = parseRouteParts();
// routeParts: ['deliver', deliveryToken, 'zip']
$deliveryToken = $routeParts[1] ?? '';

// Validate delivery token presence
if (empty($deliveryToken)) {
    http_response_code(400);
    echo json_encode(['error' => 'Delivery token is required']);
    exit;
}

// Only allow GET method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Rate limit: 10 ZIP downloads per 15 minutes per IP
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit('zip_dl:' . $clientIp, 10, 900)) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many download requests. Please try again later.']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify delivery token exists
    $stmt = $pdo->prepare("SELECT id, name, status, expiresAt FROM Collection WHERE deliveryToken = ?");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found']);
        exit;
    }

    // Check collection status — must be DELIVERED or DOWNLOADED
    if ($collection['status'] !== 'DELIVERED' && $collection['status'] !== 'DOWNLOADED') {
        http_response_code(403);
        echo json_encode(['error' => 'Collection is not available for download']);
        exit;
    }

    // Check collection expiration
    if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
        http_response_code(410);
        echo json_encode(['error' => 'This collection has expired.']);
        exit;
    }

    $collectionId = $collection['id'];
    $collectionName = $collection['name'] ?? 'collection';

    // Fetch all edited photos for this collection
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath
        FROM EditedPhoto
        WHERE collectionId = ?
        ORDER BY filename ASC
    ");
    $stmt->execute([$collectionId]);
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($photos)) {
        http_response_code(404);
        echo json_encode(['error' => 'No photos found in this collection']);
        exit;
    }

    // Track download BEFORE streaming begins (while we can still send JSON errors)
    $isNewDownload = trackDownload($pdo, $collectionId, 'ZIP', null);
    error_log("ZIP download tracked for collection {$collectionId}: " . ($isNewDownload ? 'new' : 'duplicate'));

    // Transition to DOWNLOADED status on first download (idempotent)
    if ($collection['status'] === 'DELIVERED') {
        $updateStmt = $pdo->prepare("
            UPDATE Collection
            SET status = 'DOWNLOADED', updatedAt = NOW(3)
            WHERE id = ? AND status = 'DELIVERED'
        ");
        $updateStmt->execute([$collectionId]);
        if ($updateStmt->rowCount() > 0) {
            error_log("Collection {$collectionId} transitioned to DOWNLOADED status via ZIP download");
        }
    }

    // --- POINT OF NO RETURN: Headers will be sent, no more JSON responses ---

    // Disable output buffering
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    // Configure PHP for streaming
    ini_set('display_errors', 0);
    set_time_limit(180); // Hostinger limit
    ignore_user_abort(true);
    ini_set('zlib.output_compression', 0);

    // Sanitize collection name for ZIP filename
    $safeCollectionName = preg_replace('/[^A-Za-z0-9_\-\. ]/', '', $collectionName);
    if (empty($safeCollectionName)) {
        $safeCollectionName = 'collection';
    }
    $zipFilename = $safeCollectionName . '.zip';

    // Send headers BEFORE ZipStream initialization
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipFilename . '"');
    header('Content-Transfer-Encoding: binary');
    header('Accept-Ranges: bytes');
    header('X-Accel-Buffering: no'); // Nginx compatibility
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Initialize ZipStream (headers already sent manually)
    $zip = new ZipStream(
        outputName: $zipFilename,
        sendHttpHeaders: false, // We send headers manually above
        enableZip64: true,
        defaultCompressionMethod: CompressionMethod::STORE // JPEGs are pre-compressed
    );

    // Stream each photo into the ZIP
    $filesAdded = 0;
    $uploadsBase = realpath(__DIR__ . '/../uploads');
    foreach ($photos as $photo) {
        $filePath = realpath(__DIR__ . '/../' . $photo['storagePath']);

        // Skip files outside uploads directory or missing files
        if (!$filePath || !$uploadsBase || strpos($filePath, $uploadsBase) !== 0 || !file_exists($filePath)) {
            error_log("ZIP download: Missing file {$filePath} for photo {$photo['id']}, skipping");
            continue;
        }

        try {
            $zip->addFileFromPath(
                fileName: $photo['filename'],
                path: $filePath
            );
            $filesAdded++;
        } catch (\Exception $e) {
            error_log("ZIP download: Failed to add {$photo['filename']}: " . $e->getMessage());
            // Continue adding remaining files
        }
    }

    error_log("ZIP download complete for collection {$collectionId}: {$filesAdded} files added");

    // Finalize the ZIP stream
    $zip->finish();

} catch (\Exception $e) {
    // If headers haven't been sent yet, return JSON error
    if (!headers_sent()) {
        http_response_code(500);
        error_log('ZIP download error: ' . $e->getMessage());
        echo json_encode(['error' => 'ZIP generation failed.']);
    } else {
        // Headers already sent — can only log
        error_log("ZIP download error after streaming started: " . $e->getMessage());
    }
}

exit;
