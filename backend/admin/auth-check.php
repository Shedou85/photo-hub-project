<?php
// backend/admin/auth-check.php
// Reusable admin guard — require this at the top of every admin handler.

require_once __DIR__ . '/../helpers/session.php';

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

if (($_SESSION['role'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
