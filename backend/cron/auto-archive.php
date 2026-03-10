<?php
/**
 * Cron job: Auto-archive collections after download grace period.
 *
 * Finds collections where autoArchiveAt <= NOW() and status = 'DOWNLOADED',
 * transitions them to ARCHIVED status, and sets deleteAt for FREE_TRIAL users.
 *
 * Plan-based auto-archive delays (set at download time):
 *   - FREE_TRIAL: 7 days after DOWNLOADED
 *   - STANDARD:   30 days after DOWNLOADED
 *   - PRO:        never (autoArchiveAt is NULL)
 *
 * Usage:  php /path/to/backend/cron/auto-archive.php
 * Cron:   0 * * * * php /path/to/backend/cron/auto-archive.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

$startTime = microtime(true);
$totalArchived = 0;

try {
    $pdo = getDbConnection();

    // Find collections ready for auto-archive
    $stmt = $pdo->prepare("
        SELECT c.id, u.plan
        FROM `Collection` c
        JOIN `User` u ON c.userId = u.id
        WHERE c.autoArchiveAt IS NOT NULL
          AND c.autoArchiveAt <= NOW()
          AND c.status = 'DOWNLOADED'
    ");
    $stmt->execute();
    $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($collections)) {
        echo "[auto-archive] No collections to archive.\n";
        exit(0);
    }

    echo "[auto-archive] Found " . count($collections) . " collection(s) to archive.\n";

    $now = date('Y-m-d H:i:s.v');

    foreach ($collections as $col) {
        $collectionId = $col['id'];
        $plan = $col['plan'];

        // FREE_TRIAL: set deleteAt = 14 days from now
        if ($plan === 'FREE_TRIAL') {
            $deleteAt = date('Y-m-d H:i:s', strtotime('+14 days'));
            $updateStmt = $pdo->prepare("
                UPDATE `Collection`
                SET status = 'ARCHIVED', archivedAt = ?, autoArchiveAt = NULL, deleteAt = ?, updatedAt = ?
                WHERE id = ? AND status = 'DOWNLOADED'
            ");
            $updateStmt->execute([$now, $deleteAt, $now, $collectionId]);
        } else {
            $updateStmt = $pdo->prepare("
                UPDATE `Collection`
                SET status = 'ARCHIVED', archivedAt = ?, autoArchiveAt = NULL, updatedAt = ?
                WHERE id = ? AND status = 'DOWNLOADED'
            ");
            $updateStmt->execute([$now, $now, $collectionId]);
        }

        if ($updateStmt->rowCount() > 0) {
            $totalArchived++;
            $deleteInfo = $plan === 'FREE_TRIAL' ? " (deleteAt set)" : "";
            echo "[auto-archive] Collection {$collectionId} archived ({$plan}){$deleteInfo}.\n";
        }
    }

    $elapsed = round(microtime(true) - $startTime, 2);
    echo "[auto-archive] Done. Archived {$totalArchived} collection(s) in {$elapsed}s.\n";

} catch (Throwable $e) {
    error_log("[auto-archive] Fatal error: " . $e->getMessage());
    echo "[auto-archive] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
