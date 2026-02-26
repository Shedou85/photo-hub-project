<?php
// backend/admin/download-stats.php — GET /admin/download-stats
// Returns per-collection download analytics with optional date range filtering.

header('Content-Type: application/json');

require_once __DIR__ . '/../admin/auth-check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Optional query params: ?collectionId=xxx&from=2026-01-01&to=2026-02-28&limit=50&offset=0
    $collectionId = $_GET['collectionId'] ?? null;
    $from         = $_GET['from'] ?? null;
    $to           = $_GET['to'] ?? null;
    $limit        = min((int) ($_GET['limit'] ?? 50), 200);
    $offset       = max((int) ($_GET['offset'] ?? 0), 0);

    // --- Per-collection summary ---
    $summaryWhere = [];
    $summaryParams = [];

    if ($collectionId) {
        $summaryWhere[] = "d.collectionId = ?";
        $summaryParams[] = $collectionId;
    }
    if ($from) {
        $summaryWhere[] = "d.downloadedAt >= ?";
        $summaryParams[] = $from;
    }
    if ($to) {
        $summaryWhere[] = "d.downloadedAt <= ?";
        $summaryParams[] = $to . ' 23:59:59';
    }

    $whereClause = $summaryWhere ? 'WHERE ' . implode(' AND ', $summaryWhere) : '';

    $summaryStmt = $pdo->prepare("
        SELECT
            d.collectionId,
            c.name AS collectionName,
            c.clientName,
            c.status,
            COUNT(*) AS totalDownloads,
            SUM(d.downloadType = 'ZIP') AS zipDownloads,
            SUM(d.downloadType = 'INDIVIDUAL') AS individualDownloads,
            MIN(d.downloadedAt) AS firstDownload,
            MAX(d.downloadedAt) AS lastDownload
        FROM `Download` d
        JOIN `Collection` c ON c.id = d.collectionId
        $whereClause
        GROUP BY d.collectionId, c.name, c.clientName, c.status
        ORDER BY lastDownload DESC
        LIMIT $limit OFFSET $offset
    ");
    $summaryStmt->execute($summaryParams);
    $collections = $summaryStmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast numeric fields
    foreach ($collections as &$row) {
        $row['totalDownloads'] = (int) $row['totalDownloads'];
        $row['zipDownloads'] = (int) $row['zipDownloads'];
        $row['individualDownloads'] = (int) $row['individualDownloads'];
    }
    unset($row);

    // --- Totals ---
    $totalStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS totalDownloads,
            SUM(downloadType = 'ZIP') AS totalZip,
            SUM(downloadType = 'INDIVIDUAL') AS totalIndividual,
            COUNT(DISTINCT collectionId) AS collectionsWithDownloads
        FROM `Download` d
        $whereClause
    ");
    $totalStmt->execute($summaryParams);
    $totals = $totalStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'totals' => [
            'totalDownloads'          => (int) $totals['totalDownloads'],
            'totalZip'                => (int) ($totals['totalZip'] ?? 0),
            'totalIndividual'         => (int) ($totals['totalIndividual'] ?? 0),
            'collectionsWithDownloads' => (int) $totals['collectionsWithDownloads'],
        ],
        'collections' => $collections,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log("Download stats error: " . $e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
