<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/share-auth.php';
require_once __DIR__ . '/../helpers/r2.php';

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

        // Send notification to photographer
        try {
            $notifStmt = $pdo->prepare("
                SELECT c.emailNotifications, c.name AS collectionName,
                       u.email AS photographerEmail, u.name AS photographerName, u.plan
                FROM `Collection` c
                JOIN `User` u ON c.userId = u.id
                WHERE c.id = ? LIMIT 1
            ");
            $notifStmt->execute([$collection['id']]);
            $notifData = $notifStmt->fetch(PDO::FETCH_ASSOC);

            if ($notifData && $notifData['emailNotifications'] && $notifData['plan'] === 'PRO'
                && !empty($notifData['photographerEmail'])) {
                require_once __DIR__ . '/../helpers/mailer.php';
                $collectionUrl = 'https://pixelforge.pro/collection/' . $collection['id'];
                sendSelectionsSubmittedEmail(
                    $notifData['photographerEmail'],
                    $notifData['photographerName'] ?? '',
                    $notifData['collectionName'],
                    $collectionUrl
                );
            }
        } catch (\Throwable $e) {
            error_log('[share.php] Notification email failed: ' . $e->getMessage());
        }

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
            SELECT id, userId, name, status, clientName, shareId, coverPhotoId, deliveryToken, expiresAt, createdAt, password, selectionLimit
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
        $collection['selectionLimit'] = $collection['selectionLimit'] !== null ? (int) $collection['selectionLimit'] : null;

        // Query the collection owner's plan and branding data
        $ownerStmt = $pdo->prepare("SELECT plan, brandingLogoUrl, brandingColor, name AS ownerName FROM `User` WHERE id = ? LIMIT 1");
        $ownerStmt->execute([$collectionUserId]);
        $ownerData = $ownerStmt->fetch(PDO::FETCH_ASSOC);
        $ownerPlan = $ownerData['plan'] ?? 'FREE_TRIAL';

        // Expose PRO features flag for label system
        $collection['proFeatures'] = ($ownerPlan === 'PRO');

        // Determine if watermarks should be applied (PRO plan + SELECTING status)
        $isWatermarked = ($ownerPlan === 'PRO' && $collection['status'] === 'SELECTING');
        $collection['watermarked'] = $isWatermarked;

        // Add branding data for PRO users
        $collection['branding'] = ($ownerPlan === 'PRO') ? [
            'logoUrl' => !empty($ownerData['brandingLogoUrl']) ? r2GetUrl($ownerData['brandingLogoUrl']) : null,
            'accentColor' => $ownerData['brandingColor'] ?? null,
            'photographerName' => $ownerData['ownerName'] ?? null,
        ] : null;

        // Query photos for this collection
        $stmt = $pdo->prepare("
            SELECT id, filename, storagePath, thumbnailPath, lqip, `order`, createdAt
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
            SELECT id, photoId, label, createdAt
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
