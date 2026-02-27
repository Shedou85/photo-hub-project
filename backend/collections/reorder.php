<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Parse URI: /collections/{collectionId}/reorder
$parts = parseRouteParts();
$collectionId = $parts[1] ?? '';

if (empty($collectionId) || !isValidId($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid collection ID."]);
    exit;
}

$userId = $_SESSION['user_id'];
$isAdmin = ($_SESSION['role'] ?? '') === 'ADMIN';

try {
    $pdo = getDbConnection();

    // Verify collection ownership (admin can access any collection)
    if ($isAdmin) {
        $stmt = $pdo->prepare("SELECT id, userId FROM `Collection` WHERE id = ? LIMIT 1");
        $stmt->execute([$collectionId]);
    } else {
        $stmt = $pdo->prepare("SELECT id, userId FROM `Collection` WHERE id = ? AND userId = ? LIMIT 1");
        $stmt->execute([$collectionId, $userId]);
    }
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$collection) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    // Plan gate: only PRO users (or admins) can reorder
    if (!$isAdmin) {
        $planStmt = $pdo->prepare("SELECT plan FROM `User` WHERE id = ? LIMIT 1");
        $planStmt->execute([$userId]);
        $userData = $planStmt->fetch(PDO::FETCH_ASSOC);

        if (!$userData || $userData['plan'] !== 'PRO') {
            http_response_code(403);
            echo json_encode(["error" => "REORDER_PRO_ONLY"]);
            exit;
        }
    }

    // Parse and validate request body
    $data = json_decode(file_get_contents('php://input'), true);
    $photos = $data['photos'] ?? null;

    if (!is_array($photos) || empty($photos)) {
        http_response_code(400);
        echo json_encode(["error" => "photos array is required."]);
        exit;
    }

    // Validate each entry
    $ids = [];
    $orderMap = [];
    foreach ($photos as $entry) {
        $photoId = $entry['id'] ?? '';
        $order = $entry['order'] ?? null;

        if (empty($photoId) || !isValidId($photoId) || !is_int($order) || $order < 0) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid photo entry."]);
            exit;
        }

        $ids[] = $photoId;
        $orderMap[$photoId] = $order;
    }

    // Build bulk UPDATE using CASE WHEN
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $caseParts = [];
    $params = [];

    foreach ($orderMap as $photoId => $order) {
        $caseParts[] = "WHEN id = ? THEN ?";
        $params[] = $photoId;
        $params[] = $order;
    }

    $caseSQL = implode(' ', $caseParts);
    $params[] = $collectionId;
    $params = array_merge($params, $ids);

    $sql = "UPDATE `Photo` SET `order` = CASE {$caseSQL} END WHERE collectionId = ? AND id IN ({$placeholders})";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["status" => "OK"]);

} catch (Throwable $e) {
    error_log("Reorder handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
