<?php
/**
 * Shared helper for share page authentication (password + token).
 * Used by share.php and share-selections.php.
 */

require_once __DIR__ . '/rate-limiter.php';

/**
 * Verify password or share token for share page access.
 * Returns true if access is granted, false otherwise.
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
        // Only count rate limit when password is actually provided
        $provided = $_SERVER['HTTP_X_COLLECTION_PASSWORD'] ?? '';
        if (!empty($provided)) {
            // Rate limit password attempts: 10 per 15 minutes per IP
            $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            if (!checkRateLimit('share_pwd:' . $clientIp . ':' . $shareId, 10, 900)) {
                http_response_code(429);
                echo json_encode(['error' => 'Too many attempts. Please try again later.']);
                exit;
            }

            if (password_verify($provided, $collectionPasswordHash)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Generate and store a share token in the session.
 */
function generateShareToken($shareId) {
    $token = bin2hex(random_bytes(32));
    $_SESSION['share_token_' . $shareId] = $token;
    $_SESSION['share_token_' . $shareId . '_time'] = time();
    return $token;
}
