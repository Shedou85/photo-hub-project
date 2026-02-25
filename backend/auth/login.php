<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';

header('Content-Type: application/json');
session_start();

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Parse JSON input first (needed for email rate limiting)
$input = json_decode(file_get_contents("php://input"), true);

$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

// Rate limit: 5 attempts per 15 minutes per IP
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit('login:' . $clientIp, 5, 900)) {
    http_response_code(429);
    echo json_encode(["error" => "Too many login attempts. Please try again later."]);
    exit;
}

// Rate limit: 10 attempts per 30 minutes per email address
if ($email) {
    if (!checkRateLimit('login:email:' . strtolower($email), 10, 1800)) {
        http_response_code(429);
        echo json_encode(["error" => "Too many login attempts for this email. Please try again later."]);
        exit;
    }
}

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Email and password required"]);
    exit;
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT id, email, emailVerified, password, role, status, name, createdAt, bio, plan, subscriptionStatus, trialEndsAt, collectionsCreatedCount
        FROM `User`
        WHERE email = ?
        LIMIT 1
    ");
    $stmt->execute([$email]);

    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        // Record additional attempt for email rate limiting on failed login
        if ($email) {
            checkRateLimit('login:email:' . strtolower($email), 10, 1800);
        }
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
        exit;
    }

    if ($user['status'] !== 'ACTIVE') {
        http_response_code(403);
        echo json_encode(["error" => "Account not active"]);
        exit;
    }

    // Block login for unverified email (Google OAuth users are auto-verified)
    if (isset($user['emailVerified']) && !$user['emailVerified']) {
        http_response_code(403);
        echo json_encode(["error" => "email_not_verified"]);
        exit;
    }

    // OK → įrašom į session
    session_regenerate_id(true);
    unset($_SESSION['csrf_token']);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['last_activity'] = time();
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

    // Clear email rate limit on successful login
    if ($email) {
        clearRateLimit('login:email:' . strtolower($email));
    }

    echo json_encode([
        "status" => "OK",
        "user" => [
            "id" => $user['id'],
            "email" => $user['email'],
            "role" => $user['role'],
            "name" => $user['name'],
            "createdAt" => $user['createdAt'],
            "bio" => $user['bio'],
            "plan" => $user['plan'],
            "subscriptionStatus" => $user['subscriptionStatus'],
            "trialEndsAt" => $user['trialEndsAt'],
            "collectionsCreatedCount" => (int)$user['collectionsCreatedCount']
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(["error" => "Internal server error."]);
}
