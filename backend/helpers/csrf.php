<?php
// backend/helpers/csrf.php
// CSRF token generation and validation

function generateCsrfToken(): string {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCsrfToken(): bool {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }

    return hash_equals($_SESSION['csrf_token'], $token);
}

function requireCsrfToken(): void {
    if (!validateCsrfToken()) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid or missing CSRF token']);
        exit();
    }
}
