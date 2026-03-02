<?php
/**
 * POST /admin/cleanup-originals
 *
 * Admin-only endpoint to manually trigger original photo cleanup.
 * Runs the same logic as the cron job but returns JSON results.
 */

require_once __DIR__ . '/auth-check.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/r2.php';
require_once __DIR__ . '/../helpers/audit-logger.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

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

    $results = [];
    $totalFilesDeleted = 0;
    $totalPhotoRowsDeleted = 0;

    foreach ($collections as $col) {
        $collectionId = $col['id'];
        $filesDeleted = 0;

        $photoStmt = $pdo->prepare("SELECT id, storagePath, thumbnailPath FROM `Photo` WHERE collectionId = ?");
        $photoStmt->execute([$collectionId]);
        $photos = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($photos as $photo) {
            if (!empty($photo['storagePath'])) {
                r2Delete($photo['storagePath']);
                $filesDeleted++;
            }
            if (!empty($photo['thumbnailPath'])) {
                r2Delete($photo['thumbnailPath']);
                $filesDeleted++;
            }
            r2Delete('collections/' . $collectionId . '/watermarked/' . $photo['id'] . '_wm.jpg');
            r2Delete('collections/' . $collectionId . '/watermarked/' . $photo['id'] . '_wm_full.jpg');
            $filesDeleted += 2;
        }

        $deleteStmt = $pdo->prepare("DELETE FROM `Photo` WHERE collectionId = ?");
        $deleteStmt->execute([$collectionId]);
        $deletedRows = $deleteStmt->rowCount();

        $updateStmt = $pdo->prepare("
            UPDATE `Collection`
            SET coverPhotoId = NULL, originalsCleanupAt = NULL, updatedAt = ?
            WHERE id = ?
        ");
        $updateStmt->execute([date('Y-m-d H:i:s.v'), $collectionId]);

        $totalFilesDeleted += $filesDeleted;
        $totalPhotoRowsDeleted += $deletedRows;

        $results[] = [
            'collectionId' => $collectionId,
            'photoRowsDeleted' => $deletedRows,
            'filesDeleted' => $filesDeleted,
        ];
    }

    // Log the admin action
    if (!empty($results)) {
        logAuditAction(
            $pdo,
            $_SESSION['user_id'],
            'ORIGINALS_CLEANUP',
            'SYSTEM',
            'cleanup',
            [
                'collectionsProcessed' => count($results),
                'totalPhotoRowsDeleted' => $totalPhotoRowsDeleted,
                'totalFilesDeleted' => $totalFilesDeleted,
            ]
        );
    }

    echo json_encode([
        'status' => 'OK',
        'collectionsProcessed' => count($results),
        'totalPhotoRowsDeleted' => $totalPhotoRowsDeleted,
        'totalFilesDeleted' => $totalFilesDeleted,
        'details' => $results,
    ]);

} catch (Throwable $e) {
    error_log("[admin/cleanup] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
