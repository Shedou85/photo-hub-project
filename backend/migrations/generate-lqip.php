<?php
/**
 * LQIP Backfill Migration Script
 *
 * Generates LQIP (Low Quality Image Placeholder) base64 data URIs for all
 * Photo and EditedPhoto rows that don't have one yet.
 *
 * Downloads the thumbnail (or original if no thumbnail) from R2 to a temp file,
 * generates the LQIP, and updates the DB row.
 *
 * Usage: php backend/migrations/generate-lqip.php
 *
 * Non-destructive — only fills NULL lqip values. Safe to re-run.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/r2.php';

$pdo = getDbConnection();
$batchSize = 50;
$totalProcessed = 0;
$totalFailed = 0;

function processTable(PDO $pdo, string $table, int $batchSize, int &$totalProcessed, int &$totalFailed): void
{
    echo "\n=== Processing {$table} ===\n";

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `{$table}` WHERE lqip IS NULL");
    $countStmt->execute();
    $remaining = (int) $countStmt->fetchColumn();
    echo "Found {$remaining} rows without LQIP\n";

    if ($remaining === 0) {
        echo "Nothing to do.\n";
        return;
    }

    $offset = 0;
    while (true) {
        $stmt = $pdo->prepare(
            "SELECT id, storagePath, thumbnailPath FROM `{$table}` WHERE lqip IS NULL LIMIT {$batchSize}"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) {
            break;
        }

        foreach ($rows as $row) {
            $objectKey = $row['thumbnailPath'] ?? $row['storagePath'];
            if (empty($objectKey)) {
                echo "  SKIP {$row['id']}: no storage path\n";
                $totalFailed++;
                continue;
            }

            $tmpPath = null;
            try {
                // Download from R2 to temp file
                $stream = r2GetStream($objectKey);
                $tmpPath = sys_get_temp_dir() . '/lqip_' . uniqid('', true) . '.jpg';
                file_put_contents($tmpPath, (string) $stream);

                // Detect MIME type
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mimeType = $finfo->file($tmpPath);

                // Generate LQIP
                $lqip = generateLqip($tmpPath, $mimeType);

                if ($lqip !== null) {
                    $updateStmt = $pdo->prepare("UPDATE `{$table}` SET lqip = ? WHERE id = ?");
                    $updateStmt->execute([$lqip, $row['id']]);
                    $totalProcessed++;
                    echo "  OK {$row['id']} (" . strlen($lqip) . " bytes)\n";
                } else {
                    echo "  FAIL {$row['id']}: generateLqip returned null\n";
                    $totalFailed++;
                }
            } catch (Throwable $e) {
                echo "  ERROR {$row['id']}: {$e->getMessage()}\n";
                $totalFailed++;
            } finally {
                if ($tmpPath !== null) {
                    @unlink($tmpPath);
                }
            }
        }

        $offset += count($rows);
        echo "  Batch complete. Processed {$offset}/{$remaining}\n";
    }
}

processTable($pdo, 'Photo', $batchSize, $totalProcessed, $totalFailed);
processTable($pdo, 'EditedPhoto', $batchSize, $totalProcessed, $totalFailed);

echo "\n=== Done ===\n";
echo "Processed: {$totalProcessed}\n";
echo "Failed: {$totalFailed}\n";
