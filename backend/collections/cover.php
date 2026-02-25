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

// Parse URI: /collections/{collectionId}/cover
$parts = parseRouteParts();
$collectionId = $parts[1] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

// Validate ID format to prevent injection
if (!isValidId($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid collection ID format."]);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$photoId = $data['photoId'] ?? null;

if ($photoId !== null && !isValidId($photoId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid photo ID format."]);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify collection ownership
    $stmt = $pdo->prepare("SELECT id FROM `Collection` WHERE id = ? AND userId = ? LIMIT 1");
    $stmt->execute([$collectionId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    if ($photoId !== null) {
        // Verify photo belongs to this collection
        $stmt = $pdo->prepare("SELECT id FROM `Photo` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoId, $collectionId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["error" => "Photo not found in this collection."]);
            exit;
        }
    }

    $pdo->prepare("UPDATE `Collection` SET coverPhotoId = ?, updatedAt = ? WHERE id = ? AND userId = ?")
        ->execute([$photoId, date('Y-m-d H:i:s.v'), $collectionId, $userId]);

    $stmt = $pdo->prepare("
        SELECT id, name, status, clientName, clientEmail, shareId, coverPhotoId, expiresAt, allowPromotionalUse, createdAt, updatedAt
        FROM `Collection`
        WHERE id = ? AND userId = ?
        LIMIT 1
    ");
    $stmt->execute([$collectionId, $userId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "OK", "collection" => $collection]);

} catch (Throwable $e) {
    error_log("Cover handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
