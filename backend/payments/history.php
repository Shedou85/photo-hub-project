<?php
// GET /payments/history
// Returns the current user's payment history

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$sessionValid = startSessionWithTimeout();
if (!$sessionValid || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("
        SELECT id, amount, currency, status, plan, description, createdAt
        FROM `Payment`
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 50
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format dates
    foreach ($payments as &$p) {
        if (!empty($p['createdAt'])) {
            $p['createdAt'] = (new DateTime($p['createdAt']))->format('c');
        }
        $p['amount'] = (int) $p['amount'];
    }

    echo json_encode(['payments' => $payments]);

} catch (Throwable $e) {
    error_log('Payment history error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load payment history']);
}
