<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data) || empty($data)) {
    http_response_code(400);
    echo json_encode(["error" => "No data provided"]);
    exit;
}

$setParts = [];
$params = [];

try {
    $pdo = getDbConnection();

    if (array_key_exists('name', $data)) {
        $name = $data['name'];
        if ($name !== null && mb_strlen($name) > 100) {
            http_response_code(400);
            echo json_encode(["error" => "Name must be 100 characters or less"]);
            exit;
        }
        $setParts[] = "name = ?";
        $params[] = $name;
    }

    if (array_key_exists('bio', $data)) {
        $bio = $data['bio'];
        if ($bio !== null && mb_strlen($bio) > 1000) {
            http_response_code(400);
            echo json_encode(["error" => "Bio must be 1000 characters or less"]);
            exit;
        }
        $setParts[] = "bio = ?";
        $params[] = $bio;
    }

    if (array_key_exists('newPassword', $data)) {
        $newPassword = $data['newPassword'];

        $hashStmt = $pdo->prepare("SELECT password FROM `User` WHERE id = ? LIMIT 1");
        $hashStmt->execute([$_SESSION['user_id']]);
        $row = $hashStmt->fetch(PDO::FETCH_ASSOC);
        $currentHash = $row['password'] ?? null;

        if ($currentHash !== null) {
            $currentPassword = $data['currentPassword'] ?? '';
            if (!password_verify((string) $currentPassword, $currentHash)) {
                http_response_code(400);
                echo json_encode(["error" => "Current password is incorrect"]);
                exit;
            }
        }

        if (mb_strlen((string) $newPassword) < 8 || mb_strlen((string) $newPassword) > 72) {
            http_response_code(400);
            echo json_encode(["error" => "Password must be between 8 and 72 characters"]);
            exit;
        }

        $setParts[] = "password = ?";
        $params[] = password_hash((string) $newPassword, PASSWORD_DEFAULT);
    }

    if (empty($setParts)) {
        http_response_code(400);
        echo json_encode(["error" => "No valid fields to update"]);
        exit;
    }

    $params[] = $_SESSION['user_id'];
    $stmt = $pdo->prepare("
        UPDATE `User`
        SET " . implode(', ', $setParts) . "
        WHERE id = ?
    ");
    $stmt->execute($params);

    $stmt = $pdo->prepare("
        SELECT id, name, email, bio, createdAt, plan, role, subscriptionStatus,
               trialEndsAt, collectionsCreatedCount, emailVerified,
               (password IS NOT NULL) AS hasPassword
        FROM `User`
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $user['hasPassword'] = (bool) $user['hasPassword'];
    }

    echo json_encode([
        "status" => "OK",
        "user" => $user
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
