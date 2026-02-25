<?php
require_once __DIR__ . '/../db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

// Extract collection ID from the URL: /collections/{id}
$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$requestUri = rtrim($requestUri, '/');

$parts = explode('/', ltrim($requestUri, '/'));
// parts: ['collections', collectionId]
$collectionId = $parts[1] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT id, name, status, clientName, clientEmail, shareId, deliveryToken, coverPhotoId, sourceFolder, lightroomPath, expiresAt, allowPromotionalUse, createdAt, updatedAt
            FROM `Collection`
            WHERE id = ? AND userId = ?
            LIMIT 1
        ");
        $stmt->execute([$collectionId, $userId]);
        $collection = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$collection) {
            http_response_code(404);
            echo json_encode(["error" => "Collection not found."]);
            exit;
        }

        echo json_encode(["status" => "OK", "collection" => $collection]);
        exit;
    }

    if ($method === 'PATCH') {
        // Verify ownership first
        $stmt = $pdo->prepare("SELECT id FROM `Collection` WHERE id = ? AND userId = ? LIMIT 1");
        $stmt->execute([$collectionId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["error" => "Collection not found."]);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validStatuses = ['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'ARCHIVED'];
        $allowed = ['name', 'clientName', 'clientEmail', 'expiresAt', 'allowPromotionalUse', 'sourceFolder', 'lightroomPath'];

        $setParts = [];
        $params = [];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $setParts[] = "`$field` = ?";
                $params[] = $data[$field];
            }
        }

        if (array_key_exists('status', $data)) {
            if (!in_array($data['status'], $validStatuses, true)) {
                http_response_code(400);
                echo json_encode(["error" => "Invalid status value."]);
                exit;
            }

            // Auto-generate delivery token when transitioning to DELIVERED
            if ($data['status'] === 'DELIVERED') {
                $checkStmt = $pdo->prepare("SELECT deliveryToken FROM `Collection` WHERE id = ? LIMIT 1");
                $checkStmt->execute([$collectionId]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (empty($existing['deliveryToken'])) {
                    $deliveryToken = bin2hex(random_bytes(32));
                    $setParts[] = "`deliveryToken` = ?";
                    $params[] = $deliveryToken;
                }
            }

            $setParts[] = "`status` = ?";
            $params[] = $data['status'];
        }

        if (array_key_exists('password', $data)) {
            $setParts[] = "`password` = ?";
            $params[] = $data['password'] !== null ? password_hash($data['password'], PASSWORD_DEFAULT) : null;
        }

        if (empty($setParts)) {
            http_response_code(400);
            echo json_encode(["error" => "No valid fields to update."]);
            exit;
        }

        $setParts[] = "`updatedAt` = ?";
        $params[] = date('Y-m-d H:i:s.v');
        $params[] = $collectionId;
        $params[] = $userId;

        $pdo->prepare("UPDATE `Collection` SET " . implode(', ', $setParts) . " WHERE id = ? AND userId = ?")
            ->execute($params);

        $stmt = $pdo->prepare("
            SELECT id, name, status, clientName, clientEmail, shareId, deliveryToken, coverPhotoId, sourceFolder, lightroomPath, expiresAt, allowPromotionalUse, createdAt, updatedAt
            FROM `Collection`
            WHERE id = ? AND userId = ?
            LIMIT 1
        ");
        $stmt->execute([$collectionId, $userId]);
        $collection = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "OK", "collection" => $collection]);
        exit;
    }

    if ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM `Collection` WHERE id = ? AND userId = ?");
        $stmt->execute([$collectionId, $userId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Collection not found."]);
            exit;
        }

        echo json_encode(["status" => "OK"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(["error" => "Internal server error."]);
}
