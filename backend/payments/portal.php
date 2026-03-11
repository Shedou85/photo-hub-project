<?php
// POST /payments/portal
// Creates a Stripe Customer Portal session for subscription management

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';
require_once __DIR__ . '/../helpers/stripe.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$sessionValid = startSessionWithTimeout();
if (!$sessionValid || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, email, stripeCustomerId FROM `User` WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['stripeCustomerId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No active subscription found']);
        exit;
    }

    $stripe = getStripeClient();
    $session = $stripe->billingPortal->sessions->create([
        'customer' => $user['stripeCustomerId'],
        'return_url' => 'https://pixelforge.pro/payments',
    ]);

    echo json_encode(['url' => $session->url]);

} catch (Throwable $e) {
    error_log('Stripe portal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create portal session']);
}
