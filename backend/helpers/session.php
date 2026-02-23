<?php
// backend/helpers/session.php
// Session management with inactivity timeout

define('SESSION_TIMEOUT', 1800); // 30 minutes

function startSessionWithTimeout(): bool {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Check for session timeout
    if (isset($_SESSION['last_activity'])) {
        if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
            // Session expired — destroy it
            session_unset();
            session_destroy();
            // Start a fresh session for CSRF etc.
            session_start();
            return false;
        }
    }

    // Update last activity timestamp
    $_SESSION['last_activity'] = time();
    return true;
}
