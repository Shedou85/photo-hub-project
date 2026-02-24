<?php
// backend/admin/users.php — GET /admin/users  |  PATCH /admin/users/{id}

header('Content-Type: application/json');

session_start();
require_once __DIR__ . '/../admin/auth-check.php';
require_once __DIR__ . '/../helpers/audit-logger.php';

// Parse target user ID from the URI: /admin/users/{id}
$uriParts    = explode('/', ltrim($requestUri, '/'));
// uriParts: ['admin', 'users', ?userId]
$targetUserId = $uriParts[2] ?? '';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    // -------------------------------------------------------------------------
    // GET /admin/users — paginated user list
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
        $search = trim($_GET['search'] ?? '');
        $role   = $_GET['role']   ?? '';
        $status = $_GET['status'] ?? '';
        $plan   = $_GET['plan']   ?? '';
        $page   = max(1, (int) ($_GET['page']  ?? 1));
        $limit  = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
        $offset = (int) (($page - 1) * $limit);

        // Allowed enum values for filter parameters
        $allowedRoles    = ['USER', 'ADMIN'];
        $allowedStatuses = ['ACTIVE', 'SUSPENDED'];
        $allowedPlans    = ['FREE_TRIAL', 'STANDARD', 'PRO'];

        $conditions = [];
        $params     = [];

        if ($search !== '') {
            $conditions[] = '(u.name LIKE ? OR u.email LIKE ?)';
            $params[]     = '%' . $search . '%';
            $params[]     = '%' . $search . '%';
        }

        if ($role !== '' && in_array($role, $allowedRoles, true)) {
            $conditions[] = 'u.role = ?';
            $params[]     = $role;
        }

        if ($status !== '' && in_array($status, $allowedStatuses, true)) {
            $conditions[] = 'u.status = ?';
            $params[]     = $status;
        }

        if ($plan !== '' && in_array($plan, $allowedPlans, true)) {
            $conditions[] = 'u.plan = ?';
            $params[]     = $plan;
        }

        $whereClause = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        // Count total matching rows
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `User` u $whereClause");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Fetch paginated results
        $dataParams   = $params;
        $dataParams[] = $limit;
        $dataParams[] = $offset;

        $dataStmt = $pdo->prepare("
            SELECT
                u.id,
                u.email,
                u.name,
                u.role,
                u.plan,
                u.status,
                u.createdAt,
                u.collectionsCreatedCount
            FROM `User` u
            $whereClause
            ORDER BY u.createdAt DESC
            LIMIT ? OFFSET ?
        ");

        // PDO requires explicit int binding for LIMIT / OFFSET
        $paramIndex = 1;
        foreach ($params as $paramValue) {
            $dataStmt->bindValue($paramIndex++, $paramValue, PDO::PARAM_STR);
        }
        $dataStmt->bindValue($paramIndex++, $limit,  PDO::PARAM_INT);
        $dataStmt->bindValue($paramIndex,   $offset, PDO::PARAM_INT);
        $dataStmt->execute();

        $users = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'users' => $users,
            'pagination' => [
                'total'      => $total,
                'page'       => $page,
                'limit'      => $limit,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // PATCH /admin/users/{id} — update role / status / plan
    // -------------------------------------------------------------------------
    if ($method === 'PATCH') {
        if ($targetUserId === '') {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required.']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $allowedRoles    = ['USER', 'ADMIN'];
        $allowedStatuses = ['ACTIVE', 'SUSPENDED'];
        $allowedPlans    = ['FREE_TRIAL', 'STANDARD', 'PRO'];

        // Self-suspension guard
        if (
            isset($data['status']) &&
            $data['status'] === 'SUSPENDED' &&
            $targetUserId === $_SESSION['user_id']
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'You cannot suspend your own account.']);
            exit;
        }

        // Self-demotion guard
        if (
            isset($data['role']) &&
            $data['role'] === 'USER' &&
            $targetUserId === $_SESSION['user_id']
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'You cannot remove your own admin role.']);
            exit;
        }

        // Fetch current values for audit diff
        $beforeStmt = $pdo->prepare("SELECT role, status, plan, email FROM `User` WHERE id = ? LIMIT 1");
        $beforeStmt->execute([$targetUserId]);
        $beforeUser = $beforeStmt->fetch(PDO::FETCH_ASSOC);

        if (!$beforeUser) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
            exit;
        }

        $setParts = [];
        $params   = [];

        if (isset($data['role'])) {
            if (!in_array($data['role'], $allowedRoles, true)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid role value.']);
                exit;
            }
            $setParts[] = '`role` = ?';
            $params[]   = $data['role'];
        }

        if (isset($data['status'])) {
            if (!in_array($data['status'], $allowedStatuses, true)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid status value.']);
                exit;
            }
            $setParts[] = '`status` = ?';
            $params[]   = $data['status'];
        }

        if (isset($data['plan'])) {
            if (!in_array($data['plan'], $allowedPlans, true)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid plan value.']);
                exit;
            }
            $setParts[] = '`plan` = ?';
            $params[]   = $data['plan'];
        }

        if (empty($setParts)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update.']);
            exit;
        }

        $setParts[] = '`updatedAt` = ?';
        $params[]   = date('Y-m-d H:i:s.v');
        $params[]   = $targetUserId;

        $updateStmt = $pdo->prepare(
            'UPDATE `User` SET ' . implode(', ', $setParts) . ' WHERE id = ?'
        );
        $updateStmt->execute($params);

        if ($updateStmt->rowCount() === 0) {
            // Check whether the user actually exists
            $existsStmt = $pdo->prepare("SELECT id FROM `User` WHERE id = ? LIMIT 1");
            $existsStmt->execute([$targetUserId]);
            if (!$existsStmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found.']);
                exit;
            }
        }

        $fetchStmt = $pdo->prepare("
            SELECT id, email, name, role, plan, status, createdAt, collectionsCreatedCount
            FROM `User`
            WHERE id = ?
            LIMIT 1
        ");
        $fetchStmt->execute([$targetUserId]);
        $user = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        // Audit log — record each changed field
        $auditChanges = [];
        foreach (['role', 'status', 'plan'] as $field) {
            if (isset($data[$field]) && $data[$field] !== $beforeUser[$field]) {
                $auditChanges[$field] = ['before' => $beforeUser[$field], 'after' => $data[$field]];
            }
        }
        if (!empty($auditChanges)) {
            logAuditAction(
                $pdo,
                $_SESSION['user_id'],
                'USER_UPDATED',
                'USER',
                $targetUserId,
                $auditChanges,
                $beforeUser['email']
            );
        }

        echo json_encode(['status' => 'OK', 'user' => $user]);
        exit;
    }

    // -------------------------------------------------------------------------
    // DELETE /admin/users/{id} — permanently delete a user account
    // -------------------------------------------------------------------------
    if ($method === 'DELETE') {
        if ($targetUserId === '') {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required.']);
            exit;
        }

        // Self-deletion guard
        if ($targetUserId === $_SESSION['user_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'You cannot delete your own account.']);
            exit;
        }

        // Fetch target user to verify existence and role
        $checkStmt = $pdo->prepare("SELECT id, email, role FROM `User` WHERE id = ? LIMIT 1");
        $checkStmt->execute([$targetUserId]);
        $targetUser = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$targetUser) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
            exit;
        }

        // Block deletion of any ADMIN — demote first, then delete
        if ($targetUser['role'] === 'ADMIN') {
            http_response_code(400);
            echo json_encode(['error' => 'Admin accounts cannot be deleted. Demote the user to USER first.']);
            exit;
        }

        // Audit log — record before deletion (FK CASCADE will remove this user's data)
        logAuditAction(
            $pdo,
            $_SESSION['user_id'],
            'USER_DELETED',
            'USER',
            $targetUserId,
            ['deleted' => true],
            $targetUser['email']
        );

        // Perform deletion — CASCADE constraints handle Collections, Photos, etc.
        $deleteStmt = $pdo->prepare("DELETE FROM `User` WHERE id = ?");
        $deleteStmt->execute([$targetUserId]);

        echo json_encode(['status' => 'OK']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
