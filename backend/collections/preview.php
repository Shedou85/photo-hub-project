<?php
// backend/collections/preview.php
//
// On-demand watermark proxy endpoint for lightbox full-size previews.
// Route: GET /share/{shareId}/preview/{photoId}[?token=xxx]
//
// This is a PUBLIC endpoint — auth is via password session token or ?token query param.
// Response is image/jpeg on success; application/json on any error.

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/r2.php';
require_once __DIR__ . '/../helpers/rate-limiter.php';
require_once __DIR__ . '/../helpers/watermark.php';

// ---------------------------------------------------------------------------
// Helper: emit a JSON error response and exit.
// ---------------------------------------------------------------------------
function previewError(int $code, string $message): never
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    exit;
}

// ---------------------------------------------------------------------------
// Only GET is supported.
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    previewError(405, 'Method Not Allowed');
}

// ---------------------------------------------------------------------------
// Rate limiting — 120 requests per minute per IP.
// ---------------------------------------------------------------------------
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (!checkRateLimit('preview:' . $clientIp, 120, 60)) {
    previewError(429, 'Too many requests. Please try again later.');
}

// ---------------------------------------------------------------------------
// Parse route parts: /share/{shareId}/preview/{photoId}
// parts[0] = 'share', parts[1] = shareId, parts[2] = 'preview', parts[3] = photoId
// ---------------------------------------------------------------------------
$parts   = parseRouteParts();
$shareId = $parts[1] ?? '';
$photoId = $parts[3] ?? '';

// ---------------------------------------------------------------------------
// Validate IDs — alphanumeric only (safe for file paths and SQL).
// isValidId() is defined in utils.php and uses the same regex.
// ---------------------------------------------------------------------------
if (!isValidId($shareId)) {
    previewError(400, 'Invalid share ID.');
}

if (!isValidId($photoId)) {
    previewError(400, 'Invalid photo ID.');
}

// ---------------------------------------------------------------------------
// Main logic wrapped in a single try/catch for unrecoverable errors.
// ---------------------------------------------------------------------------
try {
    // -------------------------------------------------------------------------
    // Session start — required to read/write share tokens.
    // -------------------------------------------------------------------------
    session_start();

    $pdo = getDbConnection();

    // -------------------------------------------------------------------------
    // Fetch the collection (joined to owner user for plan check).
    // -------------------------------------------------------------------------
    $stmt = $pdo->prepare("
        SELECT c.id, c.status, c.password, c.expiresAt, u.plan
        FROM `Collection` c
        JOIN `User` u ON c.userId = u.id
        WHERE c.shareId = ?
        LIMIT 1
    ");
    $stmt->execute([$shareId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        previewError(404, 'Collection not found.');
    }

    // -------------------------------------------------------------------------
    // Expiry check.
    // -------------------------------------------------------------------------
    if (!empty($collection['expiresAt']) && strtotime($collection['expiresAt']) < time()) {
        previewError(410, 'This collection has expired.');
    }

    // -------------------------------------------------------------------------
    // Password-protected collections — verify session token or ?token param.
    // -------------------------------------------------------------------------
    if (!empty($collection['password'])) {
        $sessionKey     = 'share_token_' . $shareId;
        $sessionTimeKey = 'share_token_' . $shareId . '_time';
        $accessGranted  = false;

        // 1. Check existing session share token.
        if (isset($_SESSION[$sessionKey])) {
            $tokenAge = time() - (int) ($_SESSION[$sessionTimeKey] ?? 0);
            if ($tokenAge < 7200) {
                $accessGranted = true;
            } else {
                // Expired — clear it.
                unset($_SESSION[$sessionKey], $_SESSION[$sessionTimeKey]);
            }
        }

        // 2. Fall back to ?token query param validated against session token.
        if (!$accessGranted) {
            $queryToken = $_GET['token'] ?? '';
            if (!empty($queryToken) && isset($_SESSION[$sessionKey])) {
                if (hash_equals($_SESSION[$sessionKey], $queryToken)) {
                    $tokenAge = time() - (int) ($_SESSION[$sessionTimeKey] ?? 0);
                    if ($tokenAge < 7200) {
                        $accessGranted = true;
                    } else {
                        unset($_SESSION[$sessionKey], $_SESSION[$sessionTimeKey]);
                    }
                }
            }
        }

        if (!$accessGranted) {
            previewError(401, 'Password required.');
        }
    }

    // -------------------------------------------------------------------------
    // Status gate — watermarked previews are only available during selection.
    // -------------------------------------------------------------------------
    if ($collection['status'] !== 'SELECTING') {
        previewError(403, 'Watermarked previews are only available during selection.');
    }

    // -------------------------------------------------------------------------
    // Plan gate — feature is PRO-only.
    // -------------------------------------------------------------------------
    if ($collection['plan'] !== 'PRO') {
        previewError(403, 'Feature not available.');
    }

    $collectionId = $collection['id'];

    // -------------------------------------------------------------------------
    // Verify photo belongs to this collection.
    // -------------------------------------------------------------------------
    $stmt = $pdo->prepare("
        SELECT id, storagePath
        FROM `Photo`
        WHERE id = ? AND collectionId = ?
        LIMIT 1
    ");
    $stmt->execute([$photoId, $collectionId]);
    $photo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$photo) {
        previewError(404, 'Photo not found in this collection.');
    }

    // -------------------------------------------------------------------------
    // Cache key for the watermarked version in R2.
    // -------------------------------------------------------------------------
    $cacheKey = 'collections/' . $collectionId . '/watermarked/' . $photoId . '_wm_full.jpg';

    // -------------------------------------------------------------------------
    // Attempt to serve from R2 cache — avoids regeneration on repeat requests.
    // -------------------------------------------------------------------------
    try {
        $cachedStream = r2GetStream($cacheKey);

        header('Content-Type: image/jpeg');
        header('Cache-Control: public, max-age=3600');

        // Stream the cached object directly to the browser.
        $contents = (string) $cachedStream;
        header('Content-Length: ' . strlen($contents));
        echo $contents;
        exit;
    } catch (\RuntimeException $e) {
        // Cache miss — fall through to on-demand generation.
    }

    // -------------------------------------------------------------------------
    // Fetch original image from R2 and load into GD.
    // -------------------------------------------------------------------------
    $originalStream = r2GetStream($photo['storagePath']);
    $imageData      = (string) $originalStream;

    // Safety check: reject very large images to prevent memory exhaustion
    $imageInfo = @getimagesizefromstring($imageData);
    if ($imageInfo && $imageInfo[0] * $imageInfo[1] > 25000000) {
        error_log('[preview] Image too large (' . $imageInfo[0] . 'x' . $imageInfo[1] . ') for photo ' . $photoId);
        previewError(422, 'Image too large to preview.');
    }

    $srcImage = @imagecreatefromstring($imageData);
    if ($srcImage === false) {
        error_log('[preview] imagecreatefromstring() failed for photo ' . $photoId);
        previewError(500, 'Failed to process image.');
    }

    $srcWidth  = imagesx($srcImage);
    $srcHeight = imagesy($srcImage);

    // -------------------------------------------------------------------------
    // Resize to max 1600px wide — never serve true full-resolution.
    // -------------------------------------------------------------------------
    $maxWidth  = 1600;
    $newWidth  = $srcWidth;
    $newHeight = $srcHeight;

    if ($srcWidth > $maxWidth) {
        $newWidth  = $maxWidth;
        $newHeight = (int) round($srcHeight * ($maxWidth / $srcWidth));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        if ($resized === false) {
            imagedestroy($srcImage);
            error_log('[preview] imagecreatetruecolor() failed for photo ' . $photoId);
            previewError(500, 'Failed to process image.');
        }

        $resampleOk = imagecopyresampled(
            $resized, $srcImage,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $srcWidth, $srcHeight
        );

        imagedestroy($srcImage);

        if (!$resampleOk) {
            imagedestroy($resized);
            error_log('[preview] imagecopyresampled() failed for photo ' . $photoId);
            previewError(500, 'Failed to process image.');
        }

        $image = $resized;
    } else {
        $image = $srcImage;
    }

    // -------------------------------------------------------------------------
    // Apply watermark overlay.
    // -------------------------------------------------------------------------
    applyWatermark($image, $newWidth, $newHeight);

    // -------------------------------------------------------------------------
    // Write watermarked JPEG to a temporary file.
    // -------------------------------------------------------------------------
    $tmpPath = sys_get_temp_dir() . '/wm_' . uniqid('', true) . '.jpg';
    $saved   = @imagejpeg($image, $tmpPath, 85);
    imagedestroy($image);

    if (!$saved) {
        @unlink($tmpPath);
        error_log('[preview] imagejpeg() failed writing temp file for photo ' . $photoId);
        previewError(500, 'Failed to encode watermarked image.');
    }

    // -------------------------------------------------------------------------
    // Upload watermarked copy to R2 cache (non-fatal — best effort).
    // -------------------------------------------------------------------------
    try {
        r2Upload($tmpPath, $cacheKey, 'image/jpeg');
    } catch (\RuntimeException $e) {
        error_log('[preview] R2 cache upload failed for photo ' . $photoId . ': ' . $e->getMessage());
        // Continue — we still serve the freshly generated file.
    }

    // -------------------------------------------------------------------------
    // Output the watermarked image.
    // -------------------------------------------------------------------------
    header('Content-Type: image/jpeg');
    header('Cache-Control: public, max-age=3600');
    header('Content-Length: ' . filesize($tmpPath));

    readfile($tmpPath);

    @unlink($tmpPath);
    exit;

} catch (\Throwable $e) {
    error_log('[preview] Unrecoverable error for shareId=' . $shareId . ' photoId=' . $photoId . ': ' . $e->getMessage());
    previewError(500, 'Internal server error.');
}
