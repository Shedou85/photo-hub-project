<?php
// backend/helpers/stripe.php — Stripe client & helpers

require_once __DIR__ . '/../config.php';

function getStripeClient(): \Stripe\StripeClient
{
    static $client = null;
    if ($client === null) {
        $client = new \Stripe\StripeClient($_ENV['STRIPE_SECRET_KEY']);
    }
    return $client;
}

/**
 * Get or create a Stripe customer for the given user.
 * Stores stripeCustomerId in DB if newly created.
 */
function getOrCreateStripeCustomer(PDO $pdo, array $user): string
{
    if (!empty($user['stripeCustomerId'])) {
        return $user['stripeCustomerId'];
    }

    $stripe = getStripeClient();
    $customer = $stripe->customers->create([
        'email' => $user['email'],
        'metadata' => ['userId' => $user['id']],
    ]);

    $stmt = $pdo->prepare("UPDATE `User` SET stripeCustomerId = ? WHERE id = ?");
    $stmt->execute([$customer->id, $user['id']]);

    return $customer->id;
}

/**
 * Convert Stripe price ID → DB plan enum.
 */
function stripePriceToPlan(string $priceId): ?string
{
    $map = [
        $_ENV['STRIPE_PRICE_PROFESSIONAL'] => 'STANDARD',
        $_ENV['STRIPE_PRICE_BUSINESS'] => 'PRO',
    ];
    return $map[$priceId] ?? null;
}

/**
 * Convert DB plan enum → Stripe price ID.
 */
function planToStripePrice(string $plan): ?string
{
    $map = [
        'STANDARD' => $_ENV['STRIPE_PRICE_PROFESSIONAL'],
        'PRO' => $_ENV['STRIPE_PRICE_BUSINESS'],
    ];
    return $map[$plan] ?? null;
}
