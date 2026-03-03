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
        SELECT id, name, email, bio, createdAt, plan, role, subscriptionStatus, trialEndsAt, planDowngradedAt, collectionsCreatedCount, emailVerified,
               brandingLogoUrl, brandingColor,
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

    // Auto-downgrade expired trial users (skip admins)
    if ($user && $user['plan'] === 'FREE_TRIAL' && $user['role'] !== 'ADMIN') {
        // Backfill trialEndsAt if NULL (legacy/Google OAuth accounts)
        if ($user['trialEndsAt'] === null) {
            $backfillDate = new DateTime($user['createdAt']);
            $backfillDate->modify('+30 days');
            $backfillStr = $backfillDate->format('Y-m-d H:i:s.v');
            $pdo->prepare("UPDATE `User` SET trialEndsAt = ? WHERE id = ? AND trialEndsAt IS NULL")
                ->execute([$backfillStr, $_SESSION['user_id']]);
            $user['trialEndsAt'] = $backfillStr;
        }
        $trialEnd = new DateTime($user['trialEndsAt']);
        if (new DateTime() > $trialEnd && $user['subscriptionStatus'] !== 'INACTIVE') {
            $downgradedAt = date('Y-m-d H:i:s.v');
            $pdo->prepare("UPDATE `User` SET subscriptionStatus = 'INACTIVE', planDowngradedAt = ? WHERE id = ? AND plan = 'FREE_TRIAL'")
                ->execute([$downgradedAt, $_SESSION['user_id']]);
            $user['subscriptionStatus'] = 'INACTIVE';
            $user['planDowngradedAt'] = $downgradedAt;
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
