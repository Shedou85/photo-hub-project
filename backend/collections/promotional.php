<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

$parts = parseRouteParts();
// parts: ['collections', collectionId, 'promotional', ?photoId]
$collectionId = $parts[1] ?? '';
$userId       = $_SESSION['user_id'];
$method       = $_SERVER['REQUEST_METHOD'];

if (empty($collectionId) || !isValidId($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid collection ID."]);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify ownership
    $stmt = $pdo->prepare("SELECT id FROM `Collection` WHERE id = ? AND userId = ? LIMIT 1");
    $stmt->execute([$collectionId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT pp.photoId, pp.`order`, p.storagePath, p.thumbnailPath, pp.createdAt
            FROM PromotionalPhoto pp
            JOIN Photo p ON p.id = pp.photoId
            WHERE pp.collectionId = ?
            ORDER BY pp.`order` ASC
        ");
        $stmt->execute([$collectionId]);
        $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "OK", "photos" => $photos]);

    } elseif ($method === 'POST') {
        $data    = json_decode(file_get_contents('php://input'), true) ?? [];
        $photoId = $data['photoId'] ?? '';
        $order   = (int) ($data['order'] ?? 0);

        if (empty($photoId) || !isValidId($photoId)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid or missing photoId."]);
            exit;
        }

        // Enforce maximum of 5 promotional photos per collection
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM PromotionalPhoto WHERE collectionId = ?");
        $stmt->execute([$collectionId]);
        if ((int) $stmt->fetchColumn() >= 5) {
            http_response_code(400);
            echo json_encode(["error" => "Maximum 5 promotional photos allowed."]);
            exit;
        }

        // Verify the photo belongs to this collection
        $stmt = $pdo->prepare("SELECT id FROM Photo WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoId, $collectionId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["error" => "Photo not found in this collection."]);
            exit;
        }

        // Check for duplicates
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM PromotionalPhoto WHERE collectionId = ? AND photoId = ?");
        $stmt->execute([$collectionId, $photoId]);
        if ((int) $stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(["error" => "Photo already added as promotional."]);
            exit;
        }

        $now = date('Y-m-d H:i:s.v');
        $promoId = generateCuid();
        $stmt = $pdo->prepare("
            INSERT INTO PromotionalPhoto (id, collectionId, photoId, `order`, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$promoId, $collectionId, $photoId, $order, $now, $now]);

        echo json_encode(["status" => "OK", "photoId" => $photoId]);

    } elseif ($method === 'DELETE') {
        $photoId = $parts[3] ?? '';

        if (empty($photoId) || !isValidId($photoId)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid or missing photoId."]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM PromotionalPhoto WHERE collectionId = ? AND photoId = ?");
        $stmt->execute([$collectionId, $photoId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Promotional photo not found."]);
            exit;
        }

        echo json_encode(["status" => "OK"]);

    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method Not Allowed"]);
    }

} catch (Throwable $e) {
    error_log("Promotional handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
