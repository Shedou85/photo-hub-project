<?php
/**
 * Download tracking helper with session-based deduplication.
 *
 * Tracks download events in the Download table. Uses a composite UNIQUE key
 * (collectionId, downloadType, sessionId, downloadedAt) to prevent double-counting
 * from browser resume requests within the same hour.
 *
 * Usage (in download endpoints):
 *   require_once __DIR__ . '/../helpers/download-tracker.php';
 *   $isNew = trackDownload($pdo, $collectionId, 'ZIP');
 *   // Continue with file download regardless of tracking result
 */

/**
 * Track a download event with session-based deduplication.
 *
 * @param PDO $pdo Database connection
 * @param string $collectionId Collection ID (CUID)
 * @param string $downloadType 'ZIP' or 'INDIVIDUAL'
 * @param string|null $photoId EditedPhoto ID for individual downloads (null for ZIP)
 * @return bool True if new download tracked, false if duplicate or error
 */
function trackDownload($pdo, $collectionId, $downloadType, $photoId = null) {
    // Ensure session is started for session_id()
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $sessionId = session_id();

    // Bucket timestamp to nearest hour for deduplication window
    // Same session + same collection + same type + same hour = duplicate
    $bucketedTime = date('Y-m-d H:00:00', time());

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `Download` (id, collectionId, downloadType, photoId, sessionId, downloadedAt, userAgent, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))
        ");

        // Generate CUID for download record
        // Re-implement inline to avoid dependency on index.php's generateCuid()
        $timestamp = round(microtime(true) * 1000);
        $random = bin2hex(random_bytes(8));
        $counter = uniqid();
        $downloadId = 'cl' . substr(md5($timestamp . $random . $counter), 0, 22);

        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500);

        $stmt->execute([
            $downloadId,
            $collectionId,
            $downloadType,
            $photoId,
            $sessionId,
            $bucketedTime,
            $userAgent ?: null
        ]);

        return true; // New download tracked

    } catch (\PDOException $e) {
        // Duplicate key violation (MySQL error code 23000) = expected duplicate
        if ($e->getCode() == 23000) {
            return false; // Resume request or duplicate within same hour
        }

        // Unexpected error: log but don't block download
        error_log("Download tracking error: " . $e->getMessage());
        return false;
    }
}
