<?php
// backend/admin/collections.php — GET /admin/collections

header('Content-Type: application/json');

session_start();
require_once __DIR__ . '/../admin/auth-check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    $status = $_GET['status'] ?? '';
    $userId = $_GET['userId'] ?? '';
    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
    $offset = (int) (($page - 1) * $limit);

    $allowedStatuses = ['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED', 'ARCHIVED'];

    $conditions = [];
    $params     = [];

    if ($status !== '' && in_array($status, $allowedStatuses, true)) {
        $conditions[] = 'c.status = ?';
        $params[]     = $status;
    }

    if ($userId !== '') {
        $conditions[] = 'c.userId = ?';
        $params[]     = $userId;
    }

    $whereClause = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    // Total count
    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM `Collection` c
        INNER JOIN `User` u ON u.id = c.userId
        $whereClause
    ");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Paginated data
    $dataParams   = $params;
    $dataParams[] = $limit;
    $dataParams[] = $offset;

    $dataStmt = $pdo->prepare("
        SELECT
            c.id,
            c.name,
            c.status,
            c.createdAt,
            c.userId,
            u.email AS userEmail,
            u.name  AS userName,
            c.clientName,
            c.clientEmail,
            (SELECT COUNT(*) FROM `Photo` p WHERE p.collectionId = c.id) AS photoCount
        FROM `Collection` c
        INNER JOIN `User` u ON u.id = c.userId
        $whereClause
        ORDER BY c.createdAt DESC
        LIMIT ? OFFSET ?
    ");

    // Bind filter params as strings, then LIMIT/OFFSET as ints
    $paramIndex = 1;
    foreach ($params as $paramValue) {
        $dataStmt->bindValue($paramIndex++, $paramValue, PDO::PARAM_STR);
    }
    $dataStmt->bindValue($paramIndex++, $limit,  PDO::PARAM_INT);
    $dataStmt->bindValue($paramIndex,   $offset, PDO::PARAM_INT);
    $dataStmt->execute();

    $collections = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast photoCount to int for clean JSON output
    foreach ($collections as &$collection) {
        $collection['photoCount'] = (int) $collection['photoCount'];
    }
    unset($collection);

    echo json_encode([
        'collections' => $collections,
        'pagination'  => [
            'total'      => $total,
            'page'       => $page,
            'limit'      => $limit,
            'totalPages' => (int) ceil($total / $limit),
        ],
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
