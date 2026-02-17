<?php
require_once __DIR__ . '/../db.php';

session_start();

// Tik POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// JSON input
$input = json_decode(file_get_contents("php://input"), true);

$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Email and password required"]);
    exit;
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT id, email, password, role, status, name, createdAt, bio, plan, subscriptionStatus
        FROM `User`
        WHERE email = ?
        LIMIT 1
    ");
    $stmt->execute([$email]);

    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
        exit;
    }

    if ($user['status'] !== 'ACTIVE') {
        http_response_code(403);
        echo json_encode(["error" => "Account not active"]);
        exit;
    }

    // OK → įrašom į session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];

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
            "subscriptionStatus" => $user['subscriptionStatus']
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(["error" => "Internal server error."]);
}
