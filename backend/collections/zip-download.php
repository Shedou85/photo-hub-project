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

try {
    $pdo = getDbConnection();

    // Verify delivery token exists
    $stmt = $pdo->prepare("SELECT id, name, status FROM Collection WHERE deliveryToken = ?");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found']);
        exit;
    }

    // Check collection status — must be DELIVERED
    if ($collection['status'] !== 'DELIVERED') {
        http_response_code(403);
        echo json_encode(['error' => 'Collection is not available for download']);
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

    // Initialize ZipStream
    $zip = new ZipStream(
        outputName: $zipFilename,
        sendHttpHeaders: true,
        enableZip64: true,
        compressionMethod: CompressionMethod::STORE // JPEGs are pre-compressed
    );

    // Add extra headers for streaming compatibility
    header('Accept-Ranges: bytes');
    header('X-Accel-Buffering: no'); // Nginx compatibility

    // Stream each photo into the ZIP
    $filesAdded = 0;
    foreach ($photos as $photo) {
        $filePath = __DIR__ . '/../' . $photo['storagePath'];

        // Skip missing files (log and continue with partial ZIP)
        if (!file_exists($filePath)) {
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
        echo json_encode(['error' => 'ZIP generation failed: ' . $e->getMessage()]);
    } else {
        // Headers already sent — can only log
        error_log("ZIP download error after streaming started: " . $e->getMessage());
    }
}

exit;
