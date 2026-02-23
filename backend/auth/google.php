<?php
// backend/auth/google.php

header('Content-Type: application/json');

session_start();

$config = require __DIR__ . '/../config.php';

try {
    $body = json_decode(file_get_contents('php://input'), true);
    $credential = $body['credential'] ?? '';

    if (empty($credential)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing credential']);
        exit();
    }

    // Verify token with Google tokeninfo endpoint
    $tokeninfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);

    $ch = curl_init($tokeninfoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $tokenInfo = json_decode($response, true);

    if (
        $httpCode !== 200 ||
        ($tokenInfo['aud'] ?? '') !== $config['google_client_id'] ||
        ($tokenInfo['email_verified'] ?? '') !== 'true'
    ) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid Google token']);
        exit();
    }

    $googleId = $tokenInfo['sub'];
    $email    = $tokenInfo['email'];
    $name     = $tokenInfo['name'] ?? '';
    $picture  = $tokenInfo['picture'] ?? null;

    $pdo = getDbConnection();

    // Look up existing Account by Google provider
    $stmt = $pdo->prepare(
        "SELECT userId FROM Account WHERE provider='google' AND providerAccountId=? LIMIT 1"
    );
    $stmt->execute([$googleId]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($account) {
        // Account found — fetch the associated User
        $stmt = $pdo->prepare(
            "SELECT id, email, name, role, plan, status, subscriptionStatus, createdAt, bio
             FROM `User` WHERE id=? LIMIT 1"
        );
        $stmt->execute([$account['userId']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        // No Account found — check if a User with this email already exists
        $stmt = $pdo->prepare(
            "SELECT id, email, name, role, plan, status, subscriptionStatus, createdAt, bio
             FROM `User` WHERE email=? LIMIT 1"
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // User exists — link by inserting an Account record (single INSERT, no transaction needed)
            $accountId = generateCuid();
            $stmt = $pdo->prepare(
                "INSERT INTO Account (id, userId, provider, providerAccountId) VALUES (?, ?, 'google', ?)"
            );
            $stmt->execute([$accountId, $user['id'], $googleId]);
        } else {
            // No User and no Account — create both inside a transaction
            $pdo->beginTransaction();
            try {
                $userId    = generateCuid();
                $accountId = generateCuid();

                $stmt = $pdo->prepare(
                    "INSERT INTO `User` (id, email, name, password, profileImageUrl, createdAt, updatedAt)
                     VALUES (?, ?, ?, NULL, ?, NOW(3), NOW(3))"
                );
                $stmt->execute([$userId, $email, $name, $picture]);

                $stmt = $pdo->prepare(
                    "INSERT INTO Account (id, userId, provider, providerAccountId) VALUES (?, ?, 'google', ?)"
                );
                $stmt->execute([$accountId, $userId, $googleId]);

                $pdo->commit();

                // Fetch the newly created User
                $stmt = $pdo->prepare(
                    "SELECT id, email, name, role, plan, status, subscriptionStatus, createdAt, bio
                     FROM `User` WHERE id=? LIMIT 1"
                );
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (Throwable $txEx) {
                $pdo->rollBack();
                throw $txEx;
            }
        }
    }

    if (!$user || ($user['status'] ?? '') !== 'ACTIVE') {
        http_response_code(403);
        echo json_encode(['error' => 'Account is not active']);
        exit();
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role']    = $user['role'];
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

    echo json_encode([
        'status' => 'OK',
        'user'   => [
            'id'                 => $user['id'],
            'email'              => $user['email'],
            'name'               => $user['name'],
            'role'               => $user['role'],
            'plan'               => $user['plan'],
            'subscriptionStatus' => $user['subscriptionStatus'],
            'createdAt'          => $user['createdAt'],
            'bio'                => $user['bio'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('Google OAuth error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
