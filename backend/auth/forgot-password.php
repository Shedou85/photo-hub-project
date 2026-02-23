<?php
// backend/auth/forgot-password.php

header('Content-Type: application/json');

require_once __DIR__ . '/../helpers/rate-limiter.php';

$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit('forgot-password:' . $clientIp, 3, 3600)) {
    http_response_code(429);
    echo json_encode(['error' => 'too_many_requests']);
    exit();
}

$data  = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'valid_email_required']);
    exit();
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("SELECT id, email, name FROM `User` WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Always return 200 to avoid leaking email existence
    if (!$user) {
        echo json_encode(['status' => 'OK']);
        exit();
    }

    $rawToken    = bin2hex(random_bytes(32));
    $hashedToken = hash('sha256', $rawToken);
    $expires     = date('Y-m-d H:i:s', time() + 3600); // 1 hour

    $stmt = $pdo->prepare(
        "UPDATE `User` SET passwordResetToken = ?, passwordResetExpires = ?, updatedAt = NOW(3) WHERE id = ?"
    );
    $stmt->execute([$hashedToken, $expires, $user['id']]);

    $resetUrl = 'https://pixelforge.pro/reset-password?token=' . urlencode($rawToken);
    $toName   = $user['name'] ?? $user['email'];

    require_once __DIR__ . '/../helpers/mailer.php';
    sendPasswordResetEmail($user['email'], $toName, $resetUrl);

    echo json_encode(['status' => 'OK']);

} catch (Exception $e) {
    // Log but don't expose error
    error_log('forgot-password error: ' . $e->getMessage());
    // Still return OK to avoid leaking info
    echo json_encode(['status' => 'OK']);
}
