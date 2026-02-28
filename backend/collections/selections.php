<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Parse URI: /collections/{collectionId}/selections[/{photoId}]
$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$requestUri = rtrim($requestUri, '/');

$parts = explode('/', ltrim($requestUri, '/'));
// parts: ['collections', collectionId, 'selections', ?photoId]
$collectionId = $parts[1] ?? '';
$photoId = $parts[3] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

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

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, photoId, label, createdAt FROM `Selection` WHERE collectionId = ? ORDER BY createdAt ASC");
        $stmt->execute([$collectionId]);
        $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "OK", "selections" => $selections]);
        exit;
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $photoIdToSelect = $data['photoId'] ?? null;
        $label = $data['label'] ?? 'SELECTED';

        if (empty($photoIdToSelect)) {
            http_response_code(400);
            echo json_encode(["error" => "photoId is required."]);
            exit;
        }

        // Validate label
        $validLabels = ['SELECTED', 'FAVORITE', 'REJECTED'];
        if (!in_array($label, $validLabels, true)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid label. Must be one of: SELECTED, FAVORITE, REJECTED"]);
            exit;
        }

        // PRO gate for non-SELECTED labels
        if ($label !== 'SELECTED') {
            $userStmt = $pdo->prepare("SELECT plan FROM `User` WHERE id = ? LIMIT 1");
            $userStmt->execute([$userId]);
            $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
            if (!$userData || $userData['plan'] !== 'PRO') {
                http_response_code(403);
                echo json_encode(["error" => "LABEL_PRO_ONLY"]);
                exit;
            }
        }

        // Verify photo belongs to this collection
        $stmt = $pdo->prepare("SELECT id FROM `Photo` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoIdToSelect, $collectionId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["error" => "Photo not found in this collection."]);
            exit;
        }

        $selectionId = generateCuid();
        $createdAt = date('Y-m-d H:i:s.v');

        // INSERT ... ON DUPLICATE KEY UPDATE handles label changes on already-labeled photos
        $stmt = $pdo->prepare("
            INSERT INTO `Selection` (id, collectionId, photoId, label, createdAt)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE label = VALUES(label)
        ");
        $stmt->execute([$selectionId, $collectionId, $photoIdToSelect, $label, $createdAt]);

        // Fetch the current selection (may be newly inserted or updated)
        $stmt = $pdo->prepare("SELECT id, photoId, label, createdAt FROM `Selection` WHERE photoId = ? LIMIT 1");
        $stmt->execute([$photoIdToSelect]);
        $selection = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "OK",
            "selection" => $selection
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        if (empty($photoId)) {
            http_response_code(400);
            echo json_encode(["error" => "Photo ID is required."]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM `Selection` WHERE collectionId = ? AND photoId = ?");
        $stmt->execute([$collectionId, $photoId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Selection not found."]);
            exit;
        }

        echo json_encode(["status" => "OK"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log('Selections error: ' . $e->getMessage());
    echo json_encode(["error" => "Internal server error."]);
}
