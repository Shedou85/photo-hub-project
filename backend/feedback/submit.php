<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$type        = trim($data['type'] ?? '');
$subject     = trim($data['subject'] ?? '');
$description = trim($data['description'] ?? '');

$errors = [];
if (!in_array($type, ['BUG', 'FEATURE'], true)) {
    $errors[] = 'Invalid type.';
}
if ($subject === '') {
    $errors[] = 'Subject is required.';
} elseif (mb_strlen($subject) > 255) {
    $errors[] = 'Subject too long (max 255 chars).';
}
if ($description === '') {
    $errors[] = 'Description is required.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['error' => implode(' ', $errors)]);
    exit;
}

try {
    $pdo = getDbConnection();

    $id        = generateCuid();
    $createdAt = date('Y-m-d H:i:s.v');
    $userId    = $_SESSION['user_id'];

    $stmt = $pdo->prepare(
        "INSERT INTO `FeedbackReport` (id, userId, type, subject, description, status, createdAt)
         VALUES (?, ?, ?, ?, ?, 'OPEN', ?)"
    );
    $stmt->execute([$id, $userId, $type, $subject, $description, $createdAt]);

    echo json_encode(['status' => 'OK']);

} catch (Throwable $e) {
    error_log('Feedback submit error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
