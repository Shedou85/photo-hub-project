<?php
// backend/auth/reset-password.php

header('Content-Type: application/json');

$data     = json_decode(file_get_contents('php://input'), true);
$rawToken = trim($data['token'] ?? '');
$password = $data['password'] ?? '';

if (empty($rawToken)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_or_expired_token']);
    exit();
}

if (strlen($password) < 8 || strlen($password) > 72) {
    http_response_code(400);
    echo json_encode(['error' => 'password_too_short']);
    exit();
}

try {
    $pdo = getDbConnection();

    $hashedToken = hash('sha256', $rawToken);

    $stmt = $pdo->prepare(
        "SELECT id FROM `User` WHERE passwordResetToken = ? AND passwordResetExpires > NOW() LIMIT 1"
    );
    $stmt->execute([$hashedToken]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_or_expired_token']);
        exit();
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        "UPDATE `User` SET password = ?, passwordResetToken = NULL, passwordResetExpires = NULL, updatedAt = NOW(3) WHERE id = ?"
    );
    $stmt->execute([$hashedPassword, $user['id']]);

    echo json_encode(['status' => 'OK']);

} catch (PDOException $e) {
    error_log('reset-password error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'server_error']);
}
