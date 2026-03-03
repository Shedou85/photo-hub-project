<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';
require_once __DIR__ . '/../helpers/r2.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $pdo = getDbConnection();

    // Get current branding logo
    $stmt = $pdo->prepare("SELECT brandingLogoUrl FROM `User` WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["error" => "User not found"]);
        exit;
    }

    // Delete from R2 if exists
    if ($user['brandingLogoUrl']) {
        r2Delete($user['brandingLogoUrl']);
    }

    // Set brandingLogoUrl to NULL
    $stmt = $pdo->prepare("UPDATE `User` SET brandingLogoUrl = NULL, updatedAt = ? WHERE id = ?");
    $stmt->execute([date('Y-m-d H:i:s.v'), $userId]);

    // Return updated user
    $stmt = $pdo->prepare("
        SELECT id, name, email, bio, createdAt, plan, role, subscriptionStatus,
               trialEndsAt, collectionsCreatedCount, emailVerified,
               brandingLogoUrl, brandingColor,
               (password IS NOT NULL) AS hasPassword
        FROM `User`
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($updatedUser) {
        $updatedUser['hasPassword'] = (bool) $updatedUser['hasPassword'];
    }

    // Format datetime fields as ISO 8601 with timezone for correct frontend parsing
    foreach (['createdAt', 'trialEndsAt', 'planDowngradedAt'] as $dtField) {
        if (!empty($updatedUser[$dtField])) {
            $updatedUser[$dtField] = (new DateTime($updatedUser[$dtField]))->format('c');
        }
    }

    echo json_encode(["status" => "OK", "user" => $updatedUser]);

} catch (Throwable $e) {
    error_log('Branding logo delete error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
