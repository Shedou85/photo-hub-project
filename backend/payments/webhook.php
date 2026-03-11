<?php
// POST /payments/webhook
// Stripe webhook handler — CSRF-exempt, no session

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/stripe.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'];

try {
    $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    error_log('Stripe webhook signature failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
} catch (\UnexpectedValueException $e) {
    error_log('Stripe webhook invalid payload: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

$pdo = getDbConnection();

try {
    switch ($event->type) {
        case 'checkout.session.completed':
            handleCheckoutCompleted($pdo, $event->data->object);
            break;

        case 'customer.subscription.updated':
            handleSubscriptionUpdated($pdo, $event->data->object);
            break;

        case 'customer.subscription.deleted':
            handleSubscriptionDeleted($pdo, $event->data->object);
            break;

        case 'invoice.payment_succeeded':
            handleInvoicePayment($pdo, $event->data->object, 'succeeded');
            break;

        case 'invoice.payment_failed':
            handleInvoicePayment($pdo, $event->data->object, 'failed');
            break;

        default:
            // Unhandled event type — acknowledge it
            break;
    }

    echo json_encode(['received' => true]);

} catch (Throwable $e) {
    error_log('Stripe webhook handler error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Webhook handler failed']);
}

// ── Handler functions ──

function handleCheckoutCompleted(PDO $pdo, object $session): void
{
    $customerId = $session->customer;
    $subscriptionId = $session->subscription;

    // Get subscription to find the plan
    $stripe = getStripeClient();
    $subscription = $stripe->subscriptions->retrieve($subscriptionId);
    $priceId = $subscription->items->data[0]->price->id;
    $plan = stripePriceToPlan($priceId);

    if (!$plan) {
        error_log("Unknown price ID from checkout: $priceId");
        return;
    }

    $now = date('Y-m-d H:i:s.v');
    $periodEnd = date('Y-m-d H:i:s.v', $subscription->current_period_end);

    $stmt = $pdo->prepare("
        UPDATE `User`
        SET plan = ?, subscriptionStatus = 'ACTIVE', stripeCustomerId = ?, stripeSubscriptionId = ?,
            subscriptionEndsAt = ?, updatedAt = ?
        WHERE stripeCustomerId = ?
    ");
    $stmt->execute([$plan, $customerId, $subscriptionId, $periodEnd, $now, $customerId]);
}

function handleSubscriptionUpdated(PDO $pdo, object $subscription): void
{
    $customerId = $subscription->customer;
    $subscriptionId = $subscription->id;
    $priceId = $subscription->items->data[0]->price->id;
    $plan = stripePriceToPlan($priceId);

    if (!$plan) {
        error_log("Unknown price ID from subscription update: $priceId");
        return;
    }

    $now = date('Y-m-d H:i:s.v');
    $periodEnd = date('Y-m-d H:i:s.v', $subscription->current_period_end);

    // If cancel_at_period_end → CANCELED (access remains until period end)
    $status = $subscription->cancel_at_period_end ? 'CANCELED' : 'ACTIVE';

    $stmt = $pdo->prepare("
        UPDATE `User`
        SET plan = ?, subscriptionStatus = ?, stripeSubscriptionId = ?,
            subscriptionEndsAt = ?, updatedAt = ?
        WHERE stripeCustomerId = ?
    ");
    $stmt->execute([$plan, $status, $subscriptionId, $periodEnd, $now, $customerId]);
}

function handleSubscriptionDeleted(PDO $pdo, object $subscription): void
{
    $customerId = $subscription->customer;
    $now = date('Y-m-d H:i:s.v');

    $stmt = $pdo->prepare("
        UPDATE `User`
        SET plan = 'FREE_TRIAL', subscriptionStatus = 'INACTIVE',
            stripeSubscriptionId = NULL, subscriptionEndsAt = NULL, updatedAt = ?
        WHERE stripeCustomerId = ?
    ");
    $stmt->execute([$now, $customerId]);
}

function handleInvoicePayment(PDO $pdo, object $invoice, string $status): void
{
    $customerId = $invoice->customer;
    $invoiceId = $invoice->id;

    // Idempotency: skip if already recorded
    $check = $pdo->prepare("SELECT COUNT(*) FROM `Payment` WHERE stripeInvoiceId = ?");
    $check->execute([$invoiceId]);
    if ($check->fetchColumn() > 0) {
        return;
    }

    // Find user by stripeCustomerId
    $userStmt = $pdo->prepare("SELECT id, plan FROM `User` WHERE stripeCustomerId = ?");
    $userStmt->execute([$customerId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        error_log("Invoice webhook: no user for customer $customerId");
        return;
    }

    // Determine plan from subscription items
    $plan = null;
    if (!empty($invoice->lines->data)) {
        $priceId = $invoice->lines->data[0]->price->id ?? null;
        if ($priceId) {
            $plan = stripePriceToPlan($priceId);
        }
    }

    $paymentId = 'pay_' . bin2hex(random_bytes(12));
    $stmt = $pdo->prepare("
        INSERT INTO `Payment` (id, userId, stripeInvoiceId, stripeSubscriptionId, amount, currency, status, plan, description, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $paymentId,
        $user['id'],
        $invoiceId,
        $invoice->subscription,
        $invoice->amount_paid ?? 0,
        $invoice->currency ?? 'usd',
        $status,
        $plan,
        $status === 'succeeded' ? 'Subscription payment' : 'Payment failed',
        date('Y-m-d H:i:s.v'),
    ]);
}
