<?php
// backend/admin/collections.php — GET /admin/collections | DELETE /admin/collections/{id} | PATCH /admin/collections/{id}/status

header('Content-Type: application/json');

session_start();
require_once __DIR__ . '/../admin/auth-check.php';
require_once __DIR__ . '/../helpers/audit-logger.php';

$targetCollectionId = $uriParts[2] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    // -------------------------------------------------------------------------
    // GET /admin/collections — paginated collection list
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
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
        exit;
    }

    // -------------------------------------------------------------------------
    // DELETE /admin/collections/{id} — permanently delete a collection
    // -------------------------------------------------------------------------
    if ($method === 'DELETE') {
        if (empty($targetCollectionId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Collection ID is required.']);
            exit;
        }

        $checkStmt = $pdo->prepare("SELECT id, name, userId FROM `Collection` WHERE id = ? LIMIT 1");
        $checkStmt->execute([$targetCollectionId]);
        $collection = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$collection) {
            http_response_code(404);
            echo json_encode(['error' => 'Collection not found.']);
            exit;
        }

        logAuditAction(
            $pdo,
            $_SESSION['user_id'],
            'COLLECTION_DELETED',
            'COLLECTION',
            $targetCollectionId,
            ['deleted' => true, 'name' => $collection['name']]
        );

        $pdo->prepare("DELETE FROM `Collection` WHERE id = ?")->execute([$targetCollectionId]);

        echo json_encode(['status' => 'OK']);
        exit;
    }

    // -------------------------------------------------------------------------
    // PATCH /admin/collections/{id}/status — update collection status
    // -------------------------------------------------------------------------
    if ($method === 'PATCH') {
        if (empty($targetCollectionId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Collection ID is required.']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $validStatuses = ['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'ARCHIVED'];

        if (empty($data['status']) || !in_array($data['status'], $validStatuses, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or missing status value.']);
            exit;
        }

        $beforeStmt = $pdo->prepare("SELECT id, status, name FROM `Collection` WHERE id = ? LIMIT 1");
        $beforeStmt->execute([$targetCollectionId]);
        $before = $beforeStmt->fetch(PDO::FETCH_ASSOC);

        if (!$before) {
            http_response_code(404);
            echo json_encode(['error' => 'Collection not found.']);
            exit;
        }

        $pdo->prepare("UPDATE `Collection` SET status = ?, updatedAt = ? WHERE id = ?")
            ->execute([$data['status'], date('Y-m-d H:i:s.v'), $targetCollectionId]);

        logAuditAction(
            $pdo,
            $_SESSION['user_id'],
            'COLLECTION_STATUS_CHANGED',
            'COLLECTION',
            $targetCollectionId,
            ['status' => ['before' => $before['status'], 'after' => $data['status']]]
        );

        $updated = $pdo->prepare("SELECT id, name, status, createdAt, userId FROM `Collection` WHERE id = ? LIMIT 1");
        $updated->execute([$targetCollectionId]);

        echo json_encode(['status' => 'OK', 'collection' => $updated->fetch(PDO::FETCH_ASSOC)]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
