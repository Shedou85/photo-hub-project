<?php
// POST /payments/checkout
// Creates a Stripe Checkout Session for subscription purchase

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

$data = json_decode(file_get_contents('php://input'), true);
$plan = $data['plan'] ?? '';

$priceId = planToStripePrice($plan);
if (!$priceId) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan']);
    exit;
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, email, stripeCustomerId, plan, subscriptionStatus FROM `User` WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Don't allow checkout if already on the same plan with active subscription
    if ($user['plan'] === $plan && $user['subscriptionStatus'] === 'ACTIVE') {
        http_response_code(400);
        echo json_encode(['error' => 'Already on this plan']);
        exit;
    }

    $customerId = getOrCreateStripeCustomer($pdo, $user);
    $stripe = getStripeClient();

    $session = $stripe->checkout->sessions->create([
        'customer' => $customerId,
        'mode' => 'subscription',
        'line_items' => [[
            'price' => $priceId,
            'quantity' => 1,
        ]],
        'success_url' => 'https://pixelforge.pro/payments?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => 'https://pixelforge.pro/payments',
        'metadata' => [
            'userId' => $user['id'],
            'plan' => $plan,
        ],
    ]);

    echo json_encode(['url' => $session->url]);

} catch (Throwable $e) {
    error_log('Stripe checkout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create checkout session']);
}
