<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';

// This is a PUBLIC endpoint — no session_start required
// Authorization is via shareId token in the URL and password/share token headers

header('Content-Type: application/json');

// Start session to validate share tokens
session_start();

/**
 * Helper function to verify password or share token
 * Returns true if access is granted, false otherwise
 */
function verifyShareAccess($shareId, $collectionPasswordHash) {
    // Check for share token first (more secure, no password sent)
    $shareToken = $_SERVER['HTTP_X_SHARE_TOKEN'] ?? '';
    if (!empty($shareToken)) {
        $sessionKey = 'share_token_' . $shareId;
        $sessionTimeKey = 'share_token_' . $shareId . '_time';

        if (isset($_SESSION[$sessionKey]) && hash_equals($_SESSION[$sessionKey], $shareToken)) {
            // Check if token has expired (2 hours)
            $tokenTime = $_SESSION[$sessionTimeKey] ?? 0;
            if (time() - $tokenTime < 7200) {
                return true;
            } else {
                // Token expired, clear it
                unset($_SESSION[$sessionKey]);
                unset($_SESSION[$sessionTimeKey]);
            }
        }
    }

    // Fall back to password check
    if (!empty($collectionPasswordHash)) {
        // Rate limit password attempts: 10 per 15 minutes per IP
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!checkRateLimit('share_pwd:' . $clientIp . ':' . $shareId, 10, 900)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many attempts. Please try again later.']);
            exit;
        }

        $provided = $_SERVER['HTTP_X_COLLECTION_PASSWORD'] ?? '';
        if (password_verify($provided, $collectionPasswordHash)) {
            return true;
        }
    }

    return false;
}

try {
    // Parse route parts: /share/{shareId}/selections[/{photoId}]
    $parts = parseRouteParts();
    $shareId = $parts[1] ?? '';
    $photoId = $parts[3] ?? ''; // For DELETE requests

    if (empty($shareId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Share ID is required.']);
        exit;
    }

    $pdo = getDbConnection();

    // Query collection by shareId to get id and status
    $stmt = $pdo->prepare("
        SELECT id, status, password
        FROM `Collection`
        WHERE shareId = ?
        LIMIT 1
    ");
    $stmt->execute([$shareId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found.']);
        exit;
    }

    // Password check (with token support)
    if (!empty($collection['password'])) {
        if (!verifyShareAccess($shareId, $collection['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Password required.', 'passwordRequired' => true]);
            exit;
        }
    }

    $collectionId = $collection['id'];
    $status = $collection['status'];
    $method = $_SERVER['REQUEST_METHOD'];

    // Feature gate: selections not available on expired free trial
    if ($method === 'POST' || $method === 'DELETE') {
        $ownerStmt = $pdo->prepare("SELECT u.plan, u.subscriptionStatus FROM `User` u JOIN `Collection` c ON c.userId = u.id WHERE c.id = ? LIMIT 1");
        $ownerStmt->execute([$collectionId]);
        $ownerData = $ownerStmt->fetch(PDO::FETCH_ASSOC);
        if ($ownerData && $ownerData['plan'] === 'FREE_TRIAL' && $ownerData['subscriptionStatus'] === 'INACTIVE') {
            http_response_code(403);
            echo json_encode(['error' => 'FEATURE_GATED', 'feature' => 'selections']);
            exit;
        }
    }

    if ($method === 'GET') {
        // GET — return all selections for the collection (no status gate)
        $stmt = $pdo->prepare("
            SELECT id, photoId, label, createdAt
            FROM `Selection`
            WHERE collectionId = ?
            ORDER BY createdAt ASC
        ");
        $stmt->execute([$collectionId]);
        $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'OK', 'selections' => $selections]);
        exit;
    }

    if ($method === 'POST') {
        // Status gate: only allow POST when status is SELECTING
        if ($status !== 'SELECTING') {
            http_response_code(403);
            echo json_encode(['error' => 'Selection not available for this collection']);
            exit;
        }

        // Read JSON body for photoId and label
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $photoIdToSelect = $data['photoId'] ?? null;
        $label = $data['label'] ?? 'SELECTED';

        if (empty($photoIdToSelect)) {
            http_response_code(400);
            echo json_encode(['error' => 'photoId is required.']);
            exit;
        }

        // Validate label
        $validLabels = ['SELECTED', 'FAVORITE', 'REJECTED'];
        if (!in_array($label, $validLabels, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid label. Must be one of: SELECTED, FAVORITE, REJECTED']);
            exit;
        }

        // PRO gate for non-SELECTED labels
        if ($label !== 'SELECTED') {
            $ownerPlan = $ownerData['plan'] ?? 'FREE_TRIAL';
            if ($ownerPlan !== 'PRO') {
                http_response_code(403);
                echo json_encode(['error' => 'LABEL_PRO_ONLY']);
                exit;
            }
        }

        // Verify photo belongs to this collection
        $stmt = $pdo->prepare("SELECT id FROM `Photo` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoIdToSelect, $collectionId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Photo not found in this collection.']);
            exit;
        }

        // Generate CUID for selection (generateCuid is available from index.php)
        $selectionId = generateCuid();
        $createdAt = date('Y-m-d H:i:s.v');

        // INSERT ... ON DUPLICATE KEY UPDATE handles label changes on already-labeled photos
        $stmt = $pdo->prepare("
            INSERT INTO `Selection` (id, collectionId, photoId, label, createdAt)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE label = VALUES(label)
        ");
        $stmt->execute([$selectionId, $collectionId, $photoIdToSelect, $label, $createdAt]);

        // Fetch the current selection (may be newly inserted or updated)
        $stmt = $pdo->prepare("SELECT id, photoId, label, createdAt FROM `Selection` WHERE photoId = ? LIMIT 1");
        $stmt->execute([$photoIdToSelect]);
        $selection = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'OK',
            'selection' => $selection
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        // Status gate: only allow DELETE when status is SELECTING
        if ($status !== 'SELECTING') {
            http_response_code(403);
            echo json_encode(['error' => 'Selection not available for this collection']);
            exit;
        }

        // photoId from URL path ($parts[3])
        if (empty($photoId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Photo ID is required.']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM `Selection` WHERE collectionId = ? AND photoId = ?");
        $stmt->execute([$collectionId, $photoId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Selection not found.']);
            exit;
        }

        echo json_encode(['status' => 'OK']);
        exit;
    }

    // Other methods → 405
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
