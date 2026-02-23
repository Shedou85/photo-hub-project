<?php
// backend/auth/resend-verification.php — POST /resend-verification

header('Content-Type: application/json');

require_once __DIR__ . '/../helpers/rate-limiter.php';

$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit('resend-verify:' . $clientIp, 3, 3600)) {
    http_response_code(429);
    echo json_encode(['error' => 'too_many_requests']);
    exit();
}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/mailer.php';

$data  = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'valid_email_required']);
    exit();
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("SELECT id, emailVerified FROM `User` WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Always return OK to avoid leaking email existence
    if (!$user || $user['emailVerified']) {
        echo json_encode(['status' => 'OK']);
        exit();
    }

    $rawToken    = bin2hex(random_bytes(32));
    $hashedToken = hash('sha256', $rawToken);
    $tokenExpiresAt = date('Y-m-d H:i:s.v', strtotime('+24 hours'));

    $stmt = $pdo->prepare(
        "UPDATE `User` SET emailVerificationToken = ?, emailVerificationTokenExpires = ?, updatedAt = NOW(3) WHERE id = ?"
    );
    $stmt->execute([$hashedToken, $tokenExpiresAt, $user['id']]);

    $verifyUrl = 'https://pixelforge.pro/verify-email?token=' . urlencode($rawToken);
    sendVerificationEmail($email, $verifyUrl);

    echo json_encode(['status' => 'OK']);

} catch (Throwable $e) {
    error_log('resend-verification error: ' . $e->getMessage());
    // Still return OK to avoid leaking info
    echo json_encode(['status' => 'OK']);
}
