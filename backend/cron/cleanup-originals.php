<?php
/**
 * Cron job: Clean up original photos after delivery.
 *
 * Finds collections where originalsCleanupAt <= NOW() and removes:
 *   - Original Photo files from R2 (storagePath, thumbnailPath, watermarks)
 *   - Photo DB rows (CASCADE deletes Selection rows)
 *   - Resets coverPhotoId and originalsCleanupAt on the Collection
 *
 * EditedPhoto rows and their files are preserved.
 *
 * Usage:  php /path/to/backend/cron/cleanup-originals.php
 * Cron:   0 3 * * * php /path/to/backend/cron/cleanup-originals.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/r2.php';

// Autoload Composer dependencies (needed for R2 SDK)
require_once __DIR__ . '/../vendor/autoload.php';

$startTime = microtime(true);
$totalFilesDeleted = 0;
$totalCollectionsCleaned = 0;

try {
    $pdo = getDbConnection();

    // Find collections ready for cleanup
    $stmt = $pdo->prepare("
        SELECT id FROM `Collection`
        WHERE originalsCleanupAt IS NOT NULL
          AND originalsCleanupAt <= NOW()
    ");
    $stmt->execute();
    $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($collections)) {
        echo "[cleanup] No collections to clean up.\n";
        exit(0);
    }

    echo "[cleanup] Found " . count($collections) . " collection(s) to clean up.\n";

    foreach ($collections as $col) {
        $collectionId = $col['id'];
        $filesDeleted = 0;

        // Get all Photo rows for this collection
        $photoStmt = $pdo->prepare("SELECT id, storagePath, thumbnailPath FROM `Photo` WHERE collectionId = ?");
        $photoStmt->execute([$collectionId]);
        $photos = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($photos as $photo) {
            // Delete original file from R2
            if (!empty($photo['storagePath'])) {
                r2Delete($photo['storagePath']);
                $filesDeleted++;
            }

            // Delete thumbnail from R2
            if (!empty($photo['thumbnailPath'])) {
                r2Delete($photo['thumbnailPath']);
                $filesDeleted++;
            }

            // Delete watermarked versions from R2
            r2Delete('collections/' . $collectionId . '/watermarked/' . $photo['id'] . '_wm.jpg');
            r2Delete('collections/' . $collectionId . '/watermarked/' . $photo['id'] . '_wm_full.jpg');
            $filesDeleted += 2;
        }

        // Delete all Photo DB rows (CASCADE deletes Selection rows)
        $deleteStmt = $pdo->prepare("DELETE FROM `Photo` WHERE collectionId = ?");
        $deleteStmt->execute([$collectionId]);
        $deletedRows = $deleteStmt->rowCount();

        // Clear coverPhotoId (FK ON DELETE SET NULL should handle this,
        // but explicit reset ensures consistency) and mark cleanup as done
        $updateStmt = $pdo->prepare("
            UPDATE `Collection`
            SET coverPhotoId = NULL, originalsCleanupAt = NULL, updatedAt = ?
            WHERE id = ?
        ");
        $updateStmt->execute([date('Y-m-d H:i:s.v'), $collectionId]);

        $totalFilesDeleted += $filesDeleted;
        $totalCollectionsCleaned++;

        echo "[cleanup] Collection {$collectionId}: deleted {$deletedRows} photo rows, {$filesDeleted} R2 files.\n";
    }

    $elapsed = round(microtime(true) - $startTime, 2);
    echo "[cleanup] Done. Cleaned {$totalCollectionsCleaned} collection(s), {$totalFilesDeleted} files in {$elapsed}s.\n";

} catch (Throwable $e) {
    error_log("[cleanup-originals] Fatal error: " . $e->getMessage());
    echo "[cleanup] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
