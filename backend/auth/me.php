<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');
$sessionValid = startSessionWithTimeout();

if (!$sessionValid || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT id, name, email, bio, createdAt, plan, role, subscriptionStatus, trialEndsAt, collectionsCreatedCount
        FROM `User`
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Auto-downgrade expired trial users
    if ($user && $user['plan'] === 'FREE_TRIAL' && $user['trialEndsAt'] !== null) {
        $trialEnd = new DateTime($user['trialEndsAt']);
        $now = new DateTime();
        if ($now > $trialEnd && $user['subscriptionStatus'] !== 'INACTIVE') {
            $downgradeStmt = $pdo->prepare("UPDATE `User` SET subscriptionStatus = 'INACTIVE', planDowngradedAt = ? WHERE id = ? AND plan = 'FREE_TRIAL'");
            $downgradeStmt->execute([date('Y-m-d H:i:s.v'), $_SESSION['user_id']]);
            $user['subscriptionStatus'] = 'INACTIVE';
        }
    }

    echo json_encode([
        "status" => "OK",
        "user" => $user
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
