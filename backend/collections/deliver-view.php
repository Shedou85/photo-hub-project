<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';
require_once __DIR__ . '/../helpers/r2.php';

// This is a PUBLIC endpoint — no session/auth check required
// Delivery token IS the credential
// Password verification uses sessions for token persistence

header('Content-Type: application/json');

session_start();

$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Parse deliveryToken from URL: /deliver/{deliveryToken}
$parts = parseRouteParts();
$deliveryToken = $parts[1] ?? '';

if (empty($deliveryToken)) {
    http_response_code(400);
    echo json_encode(['error' => 'Delivery token is required.']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Query collection by deliveryToken
    $stmt = $pdo->prepare("
        SELECT id, userId, name, clientName, status, expiresAt, password, createdAt
        FROM `Collection`
        WHERE deliveryToken = ?
        LIMIT 1
    ");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found.']);
        exit;
    }

    // Validate status — only DELIVERED or DOWNLOADED collections are accessible
    if (!in_array($collection['status'], ['DELIVERED', 'DOWNLOADED'])) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Collection not ready for delivery',
            'status' => $collection['status']
        ]);
        exit;
    }

    // Check collection expiration
    if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
        http_response_code(410);
        echo json_encode(['error' => 'This collection has expired.']);
        exit;
    }

    // Password verification (mirrors share.php pattern)
    $deliverySessionToken = null;
    if (!empty($collection['password'])) {
        $sessionKey = 'delivery_token_' . $deliveryToken;
        $sessionTimeKey = 'delivery_token_' . $deliveryToken . '_time';
        $authenticated = false;

        // Check for existing delivery session token
        $providedToken = $_SERVER['HTTP_X_DELIVERY_SESSION_TOKEN'] ?? '';
        if (!empty($providedToken) && isset($_SESSION[$sessionKey]) && hash_equals($_SESSION[$sessionKey], $providedToken)) {
            $tokenTime = $_SESSION[$sessionTimeKey] ?? 0;
            if (time() - $tokenTime < 7200) {
                $authenticated = true;
                $deliverySessionToken = $providedToken;
            } else {
                unset($_SESSION[$sessionKey]);
                unset($_SESSION[$sessionTimeKey]);
            }
        }

        // Try password from header
        if (!$authenticated) {
            $providedPassword = $_SERVER['HTTP_X_COLLECTION_PASSWORD'] ?? '';
            if (!empty($providedPassword)) {
                // Rate limit password attempts: 10 per 15 minutes per IP
                $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                if (!checkRateLimit('delivery_pwd:' . $clientIp . ':' . $deliveryToken, 10, 900)) {
                    http_response_code(429);
                    echo json_encode(['error' => 'Too many attempts. Please try again later.']);
                    exit;
                }

                if (password_verify($providedPassword, $collection['password'])) {
                    $authenticated = true;
                    // Generate session token
                    $deliverySessionToken = bin2hex(random_bytes(32));
                    $_SESSION[$sessionKey] = $deliverySessionToken;
                    $_SESSION[$sessionTimeKey] = time();
                } else {
                    http_response_code(401);
                    echo json_encode(['error' => 'Incorrect password.', 'passwordRequired' => true]);
                    exit;
                }
            }
        }

        if (!$authenticated) {
            http_response_code(401);
            echo json_encode(['error' => 'Password required.', 'passwordRequired' => true]);
            exit;
        }
    }

    // Query the collection owner's branding data
    $ownerStmt = $pdo->prepare("SELECT plan, brandingLogoUrl, brandingColor, name AS ownerName FROM `User` WHERE id = ? LIMIT 1");
    $ownerStmt->execute([$collection['userId']]);
    $ownerData = $ownerStmt->fetch(PDO::FETCH_ASSOC);
    $ownerPlan = $ownerData['plan'] ?? 'FREE_TRIAL';

    $branding = ($ownerPlan === 'PRO') ? [
        'logoUrl' => !empty($ownerData['brandingLogoUrl']) ? r2GetUrl($ownerData['brandingLogoUrl']) : null,
        'accentColor' => $ownerData['brandingColor'] ?? null,
        'photographerName' => $ownerData['ownerName'] ?? null,
    ] : null;

    // Query EditedPhoto table (NOT Photo table) — only final/edited photos
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath, createdAt
        FROM `EditedPhoto`
        WHERE collectionId = ?
        ORDER BY filename ASC
    ");
    $stmt->execute([$collection['id']]);
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build response
    $response = [
        'status' => 'OK',
        'collection' => [
            'id' => $collection['id'],
            'name' => $collection['name'],
            'clientName' => $collection['clientName'],
            'collectionStatus' => $collection['status'],
            'createdAt' => $collection['createdAt'],
            'photoCount' => count($photos),
            'photos' => $photos,
            'branding' => $branding
        ]
    ];

    if ($deliverySessionToken) {
        $response['deliverySessionToken'] = $deliverySessionToken;
    }

    echo json_encode($response);

} catch (Throwable $e) {
    http_response_code(500);
    error_log('Deliver-view error: ' . $e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
