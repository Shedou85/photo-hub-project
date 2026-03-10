<?php
/**
 * Cron job: Delete expired archived collections.
 *
 * Finds ARCHIVED collections where deleteAt <= NOW() and permanently deletes them:
 *   - All EditedPhoto files from R2 storage
 *   - The Collection row (CASCADE deletes EditedPhoto, Download rows)
 *
 * This applies to FREE_TRIAL users whose archived collections have passed
 * the 14-day retention period.
 *
 * Usage:  php /path/to/backend/cron/cleanup-archived.php
 * Cron:   0 4 * * * php /path/to/backend/cron/cleanup-archived.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/r2.php';

// Autoload Composer dependencies (needed for R2 SDK)
require_once __DIR__ . '/../vendor/autoload.php';

$startTime = microtime(true);
$totalDeleted = 0;
$totalFilesDeleted = 0;

try {
    $pdo = getDbConnection();

    // Find archived collections past their delete date
    $stmt = $pdo->prepare("
        SELECT id FROM `Collection`
        WHERE deleteAt IS NOT NULL
          AND deleteAt <= NOW()
          AND status = 'ARCHIVED'
    ");
    $stmt->execute();
    $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($collections)) {
        echo "[cleanup-archived] No collections to delete.\n";
        exit(0);
    }

    echo "[cleanup-archived] Found " . count($collections) . " collection(s) to delete.\n";

    foreach ($collections as $col) {
        $collectionId = $col['id'];
        $filesDeleted = 0;

        // Collect all R2 keys for batch deletion (edited photos only — originals already cleaned)
        $r2Keys = [];

        $editedStmt = $pdo->prepare("SELECT storagePath, thumbnailPath FROM `EditedPhoto` WHERE collectionId = ?");
        $editedStmt->execute([$collectionId]);
        foreach ($editedStmt->fetchAll(PDO::FETCH_ASSOC) as $edited) {
            if (!empty($edited['storagePath'])) $r2Keys[] = $edited['storagePath'];
            if (!empty($edited['thumbnailPath'])) $r2Keys[] = $edited['thumbnailPath'];
        }

        // Also check for any remaining Photo files (edge case: originals cleanup didn't run)
        $photoStmt = $pdo->prepare("SELECT id, storagePath, thumbnailPath FROM `Photo` WHERE collectionId = ?");
        $photoStmt->execute([$collectionId]);
        foreach ($photoStmt->fetchAll(PDO::FETCH_ASSOC) as $photo) {
            if (!empty($photo['storagePath'])) $r2Keys[] = $photo['storagePath'];
            if (!empty($photo['thumbnailPath'])) $r2Keys[] = $photo['thumbnailPath'];
            $r2Keys[] = 'collections/' . $collectionId . '/watermarked/' . $photo['id'] . '_wm.jpg';
            $r2Keys[] = 'collections/' . $collectionId . '/watermarked/' . $photo['id'] . '_wm_full.jpg';
        }

        $filesDeleted = count($r2Keys);

        // Batch delete all R2 objects
        if (!empty($r2Keys)) {
            r2DeleteBatch($r2Keys);
        }

        // Clear coverPhotoId to avoid circular FK constraint during cascade delete
        $pdo->prepare("UPDATE `Collection` SET coverPhotoId = NULL WHERE id = ?")->execute([$collectionId]);

        // Delete Collection row (CASCADE deletes Photo, EditedPhoto, Selection, Download, PromotionalPhoto)
        $pdo->prepare("DELETE FROM `Collection` WHERE id = ?")->execute([$collectionId]);

        $totalDeleted++;
        $totalFilesDeleted += $filesDeleted;

        echo "[cleanup-archived] Collection {$collectionId}: deleted ({$filesDeleted} R2 files).\n";
    }

    $elapsed = round(microtime(true) - $startTime, 2);
    echo "[cleanup-archived] Done. Deleted {$totalDeleted} collection(s), {$totalFilesDeleted} R2 files in {$elapsed}s.\n";

} catch (Throwable $e) {
    error_log("[cleanup-archived] Fatal error: " . $e->getMessage());
    echo "[cleanup-archived] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
