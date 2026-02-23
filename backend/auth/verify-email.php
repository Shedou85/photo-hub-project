<?php
// backend/auth/verify-email.php — GET /verify-email?token=xxx

header('Content-Type: application/json');

require_once __DIR__ . '/../db.php';

$token = trim($_GET['token'] ?? '');

if (empty($token)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_token']);
    exit();
}

try {
    $pdo = getDbConnection();

    $hashedToken = hash('sha256', $token);

    $stmt = $pdo->prepare("SELECT id FROM `User` WHERE emailVerificationToken = ? AND emailVerificationTokenExpires > NOW() LIMIT 1");
    $stmt->execute([$hashedToken]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_token']);
        exit();
    }

    $stmt = $pdo->prepare(
        "UPDATE `User` SET emailVerified = true, emailVerificationToken = NULL, emailVerificationTokenExpires = NULL, updatedAt = NOW(3) WHERE id = ?"
    );
    $stmt->execute([$user['id']]);

    echo json_encode(['status' => 'OK']);

} catch (Throwable $e) {
    error_log('verify-email error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'server_error']);
}
