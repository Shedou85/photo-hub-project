<?php
// backend/admin/audit-log.php — GET /admin/audit-log

header('Content-Type: application/json');

require_once __DIR__ . '/../admin/auth-check.php';
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    $action = trim($_GET['action'] ?? '');
    $from   = trim($_GET['from']   ?? '');
    $to     = trim($_GET['to']     ?? '');
    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
    $offset = (int) (($page - 1) * $limit);

    $conditions = [];
    $params     = [];

    if ($action !== '') {
        $conditions[] = 'al.action = ?';
        $params[]     = $action;
    }

    if ($from !== '') {
        $conditions[] = 'al.createdAt >= ?';
        $params[]     = $from . ' 00:00:00';
    }

    if ($to !== '') {
        $conditions[] = 'al.createdAt <= ?';
        $params[]     = $to . ' 23:59:59';
    }

    $whereClause = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    // Total count
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `AuditLog` al $whereClause");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Paginated data
    $dataParams   = $params;
    $dataParams[] = $limit;
    $dataParams[] = $offset;

    $dataStmt = $pdo->prepare("
        SELECT
            al.id,
            al.action,
            al.targetEntityType,
            al.targetEntityId,
            al.targetEmail,
            al.changes,
            al.ipAddress,
            al.createdAt,
            u.email AS adminEmail,
            u.name  AS adminName
        FROM `AuditLog` al
        LEFT JOIN `User` u ON u.id = al.adminUserId
        $whereClause
        ORDER BY al.createdAt DESC
        LIMIT ? OFFSET ?
    ");

    $paramIndex = 1;
    foreach ($params as $paramValue) {
        $dataStmt->bindValue($paramIndex++, $paramValue, PDO::PARAM_STR);
    }
    $dataStmt->bindValue($paramIndex++, $limit,  PDO::PARAM_INT);
    $dataStmt->bindValue($paramIndex,   $offset, PDO::PARAM_INT);
    $dataStmt->execute();

    $logs = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode changes JSON
    foreach ($logs as &$log) {
        $log['changes'] = json_decode($log['changes'], true);
    }
    unset($log);

    echo json_encode([
        'logs' => $logs,
        'pagination' => [
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
