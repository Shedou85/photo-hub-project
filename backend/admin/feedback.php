<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/auth-check.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    if ($method === 'GET') {
        $stmt = $pdo->query(
            "SELECT f.id, f.type, f.subject, f.description, f.status, f.createdAt,
                    u.email AS userEmail, u.name AS userName
             FROM `FeedbackReport` f
             JOIN `User` u ON u.id = f.userId
             ORDER BY f.createdAt DESC"
        );
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($reports as &$r) {
            $r['createdAt'] = (new DateTime($r['createdAt']))->format('c');
        }

        echo json_encode(['status' => 'OK', 'reports' => $reports]);
        exit;
    }

    if ($method === 'PATCH') {
        $parts = parseRouteParts();
        $reportId = $parts[2] ?? '';

        if (empty($reportId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Report ID required']);
            exit;
        }

        $data   = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? '';

        if (!in_array($status, ['OPEN', 'IN_PROGRESS', 'RESOLVED'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE `FeedbackReport` SET status = ? WHERE id = ?");
        $stmt->execute([$status, $reportId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Report not found']);
            exit;
        }

        echo json_encode(['status' => 'OK']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (Throwable $e) {
    error_log('Admin feedback error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
