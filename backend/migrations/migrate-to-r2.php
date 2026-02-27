<?php
/**
 * One-time migration: upload existing local photos to Cloudflare R2.
 *
 * Uploads files using the SAME storagePath/thumbnailPath keys already in the DB,
 * so no database updates are needed.
 *
 * Usage (SSH): php migrations/migrate-to-r2.php
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/r2.php';

// Mime type detection
function detectMime(string $path): string {
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $map = [
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'webp' => 'image/webp',
    ];
    return $map[$ext] ?? 'application/octet-stream';
}

$pdo = getDbConnection();
$backendDir = realpath(__DIR__ . '/..');
$uploaded = 0;
$skipped = 0;
$failed = 0;

echo "=== R2 Migration Start ===\n\n";

// --- Migrate Photo table (storagePath + thumbnailPath) ---
echo "--- Migrating Photo table ---\n";
$stmt = $pdo->query("SELECT id, storagePath, thumbnailPath FROM Photo");
$photos = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Found " . count($photos) . " photos\n";

foreach ($photos as $photo) {
    // Upload original
    $localPath = $backendDir . '/' . $photo['storagePath'];
    if (file_exists($localPath)) {
        try {
            r2Upload($localPath, $photo['storagePath'], detectMime($localPath));
            $uploaded++;
            echo "  [OK] {$photo['storagePath']}\n";
        } catch (\Exception $e) {
            $failed++;
            echo "  [FAIL] {$photo['storagePath']}: {$e->getMessage()}\n";
        }
    } else {
        $skipped++;
        echo "  [SKIP] {$photo['storagePath']} (file not found)\n";
    }

    // Upload thumbnail
    if (!empty($photo['thumbnailPath'])) {
        $thumbLocal = $backendDir . '/' . $photo['thumbnailPath'];
        if (file_exists($thumbLocal)) {
            try {
                r2Upload($thumbLocal, $photo['thumbnailPath'], 'image/jpeg');
                $uploaded++;
                echo "  [OK] {$photo['thumbnailPath']}\n";
            } catch (\Exception $e) {
                $failed++;
                echo "  [FAIL] {$photo['thumbnailPath']}: {$e->getMessage()}\n";
            }
        } else {
            $skipped++;
            echo "  [SKIP] {$photo['thumbnailPath']} (file not found)\n";
        }
    }
}

// --- Migrate EditedPhoto table (storagePath only) ---
echo "\n--- Migrating EditedPhoto table ---\n";
$stmt = $pdo->query("SELECT id, storagePath FROM EditedPhoto");
$editedPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Found " . count($editedPhotos) . " edited photos\n";

foreach ($editedPhotos as $photo) {
    $localPath = $backendDir . '/' . $photo['storagePath'];
    if (file_exists($localPath)) {
        try {
            r2Upload($localPath, $photo['storagePath'], detectMime($localPath));
            $uploaded++;
            echo "  [OK] {$photo['storagePath']}\n";
        } catch (\Exception $e) {
            $failed++;
            echo "  [FAIL] {$photo['storagePath']}: {$e->getMessage()}\n";
        }
    } else {
        $skipped++;
        echo "  [SKIP] {$photo['storagePath']} (file not found)\n";
    }
}

echo "\n=== R2 Migration Complete ===\n";
echo "Uploaded: {$uploaded}\n";
echo "Skipped:  {$skipped}\n";
echo "Failed:   {$failed}\n";
