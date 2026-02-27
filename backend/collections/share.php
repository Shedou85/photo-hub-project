<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';

// This is a PUBLIC endpoint — no session/auth check required
// Authentication is handled via password (first request) or session token (subsequent requests)

header('Content-Type: application/json');

// Start session to manage share tokens
session_start();

$requestMethod = $_SERVER['REQUEST_METHOD'];

if (!in_array($requestMethod, ['GET', 'PATCH'])) {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Parse shareId from URL: /share/{shareId}
$parts = parseRouteParts();
$shareId = $parts[1] ?? '';

if (empty($shareId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Share ID is required.']);
    exit;
}

$pdo = getDbConnection();

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

/**
 * Helper function to generate and store a share token
 */
function generateShareToken($shareId) {
    $token = bin2hex(random_bytes(32));
    $_SESSION['share_token_' . $shareId] = $token;
    $_SESSION['share_token_' . $shareId . '_time'] = time();
    return $token;
}

if ($requestMethod === 'PATCH') {
    // Handle status update: SELECTING → REVIEWING
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $newStatus = $data['status'] ?? '';

        if ($newStatus !== 'REVIEWING') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status transition. Only REVIEWING is allowed.']);
            exit;
        }

        // Query collection by shareId
        $stmt = $pdo->prepare("
            SELECT id, status, expiresAt, password
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

        // Check collection expiration
        if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
            http_response_code(410);
            echo json_encode(['error' => 'This collection has expired.']);
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

        // Validate status transition: Only allow SELECTING → REVIEWING
        if ($collection['status'] !== 'SELECTING') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status transition. Collection must be in SELECTING status.']);
            exit;
        }

        // Update status
        $stmt = $pdo->prepare("
            UPDATE `Collection`
            SET status = ?, updatedAt = NOW(3)
            WHERE id = ?
        ");
        $stmt->execute(['REVIEWING', $collection['id']]);

        // Return updated collection
        $stmt = $pdo->prepare("
            SELECT id, name, status, clientName, shareId, coverPhotoId, createdAt
            FROM `Collection`
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$collection['id']]);
        $updatedCollection = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'OK', 'collection' => $updatedCollection]);

    } catch (Throwable $e) {
        http_response_code(500);
        error_log($e->getMessage());
        echo json_encode(['error' => 'Internal server error.']);
    }

} else {
    // GET request — return collection details
    try {
        // Query collection by shareId — explicitly exclude sensitive fields
        $stmt = $pdo->prepare("
            SELECT id, userId, name, status, clientName, shareId, coverPhotoId, deliveryToken, expiresAt, createdAt, password
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

        // Check collection expiration
        if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
            http_response_code(410);
            echo json_encode(['error' => 'This collection has expired.']);
            exit;
        }

        // Password check (with token support)
        $shareToken = null;
        if (!empty($collection['password'])) {
            if (!verifyShareAccess($shareId, $collection['password'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Password required.', 'passwordRequired' => true]);
                exit;
            }
            // Generate a share token for future requests (only if password was just verified)
            // Check if we have an existing token; if not, generate one
            $sessionKey = 'share_token_' . $shareId;
            if (!isset($_SESSION[$sessionKey])) {
                $shareToken = generateShareToken($shareId);
            } else {
                $shareToken = $_SESSION[$sessionKey];
            }
        }

        // Only allow access to collections that are in SELECTING status or beyond
        if (!in_array($collection['status'], ['SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Collection is not ready for sharing yet.']);
            exit;
        }

        // Remove sensitive fields before sending to client
        $collectionUserId = $collection['userId'];
        unset($collection['password']);
        unset($collection['expiresAt']);
        unset($collection['userId']);

        // Query the collection owner's plan for watermark feature check
        $ownerStmt = $pdo->prepare("SELECT plan FROM `User` WHERE id = ? LIMIT 1");
        $ownerStmt->execute([$collectionUserId]);
        $ownerData = $ownerStmt->fetch(PDO::FETCH_ASSOC);
        $ownerPlan = $ownerData['plan'] ?? 'FREE_TRIAL';

        // Determine if watermarks should be applied (PRO plan + SELECTING status)
        $isWatermarked = ($ownerPlan === 'PRO' && $collection['status'] === 'SELECTING');
        $collection['watermarked'] = $isWatermarked;

        // Query photos for this collection
        $stmt = $pdo->prepare("
            SELECT id, filename, storagePath, thumbnailPath, `order`, createdAt
            FROM `Photo`
            WHERE collectionId = ?
            ORDER BY COALESCE(`order`, 999999) ASC, createdAt ASC
        ");
        $stmt->execute([$collection['id']]);
        $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach watermarked thumbnail paths if applicable
        if ($isWatermarked) {
            foreach ($photos as &$photo) {
                if (!empty($photo['thumbnailPath'])) {
                    $photo['watermarkedThumbnailPath'] = 'collections/' . $collection['id'] . '/watermarked/' . $photo['id'] . '_wm.jpg';
                }
            }
            unset($photo); // Break the reference
        }

        // Attach photos to collection
        $collection['photos'] = $photos;

        // Query selections for this collection
        $stmt = $pdo->prepare("
            SELECT id, photoId, createdAt
            FROM `Selection`
            WHERE collectionId = ?
            ORDER BY createdAt ASC
        ");
        $stmt->execute([$collection['id']]);
        $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach selections to collection
        $collection['selections'] = $selections;

        // Include shareToken in response if one was generated
        if ($shareToken) {
            echo json_encode(['status' => 'OK', 'collection' => $collection, 'shareToken' => $shareToken]);
        } else {
            echo json_encode(['status' => 'OK', 'collection' => $collection]);
        }

    } catch (Throwable $e) {
        http_response_code(500);
        error_log($e->getMessage());
        echo json_encode(['error' => 'Internal server error.']);
    }
}
