<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

// This is a PUBLIC endpoint — no session_start, no auth check required
// Authorization is via shareId token in the URL

try {
    // Parse route parts: /share/{shareId}/selections[/{photoId}]
    $parts = parseRouteParts();
    $shareId = $parts[1] ?? '';
    $photoId = $parts[3] ?? ''; // For DELETE requests

    if (empty($shareId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Share ID is required.']);
        exit;
    }

    $pdo = getDbConnection();

    // Query collection by shareId to get id and status
    $stmt = $pdo->prepare("
        SELECT id, status, password
        FROM `Collection`
        WHERE shareId = ?
        LIMIT 1
    ");
    $stmt->execute([$shareId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found.']);
        exit;
    }

    // Password check
    if (!empty($collection['password'])) {
        $provided = $_SERVER['HTTP_X_COLLECTION_PASSWORD'] ?? '';
        if (!password_verify($provided, $collection['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Password required.', 'passwordRequired' => true]);
            exit;
        }
    }

    $collectionId = $collection['id'];
    $status = $collection['status'];
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // GET — return all selections for the collection (no status gate)
        $stmt = $pdo->prepare("
            SELECT id, photoId, createdAt
            FROM `Selection`
            WHERE collectionId = ?
            ORDER BY createdAt ASC
        ");
        $stmt->execute([$collectionId]);
        $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'OK', 'selections' => $selections]);
        exit;
    }

    if ($method === 'POST') {
        // Status gate: only allow POST when status is SELECTING
        if ($status !== 'SELECTING') {
            http_response_code(403);
            echo json_encode(['error' => 'Selection not available for this collection']);
            exit;
        }

        // Read JSON body for photoId
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $photoIdToSelect = $data['photoId'] ?? null;

        if (empty($photoIdToSelect)) {
            http_response_code(400);
            echo json_encode(['error' => 'photoId is required.']);
            exit;
        }

        // Verify photo belongs to this collection
        $stmt = $pdo->prepare("SELECT id FROM `Photo` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoIdToSelect, $collectionId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Photo not found in this collection.']);
            exit;
        }

        // Generate CUID for selection (generateCuid is available from index.php)
        $selectionId = generateCuid();
        $createdAt = date('Y-m-d H:i:s.v');

        // Use try/catch for duplicate key (Selection_photoId_key is UNIQUE)
        // If duplicate, return 200 OK with existing selection (idempotent)
        try {
            $stmt = $pdo->prepare("INSERT INTO `Selection` (id, collectionId, photoId, createdAt) VALUES (?, ?, ?, ?)");
            $stmt->execute([$selectionId, $collectionId, $photoIdToSelect, $createdAt]);

            echo json_encode([
                'status' => 'OK',
                'selection' => [
                    'id' => $selectionId,
                    'photoId' => $photoIdToSelect,
                    'createdAt' => $createdAt
                ]
            ]);
        } catch (PDOException $e) {
            // Check if it's a duplicate key error (error code 23000)
            if ($e->getCode() === '23000') {
                // Fetch existing selection
                $stmt = $pdo->prepare("SELECT id, photoId, createdAt FROM `Selection` WHERE photoId = ? LIMIT 1");
                $stmt->execute([$photoIdToSelect]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    echo json_encode([
                        'status' => 'OK',
                        'selection' => $existing
                    ]);
                } else {
                    // Shouldn't happen, but handle gracefully
                    throw $e;
                }
            } else {
                throw $e;
            }
        }
        exit;
    }

    if ($method === 'DELETE') {
        // Status gate: only allow DELETE when status is SELECTING
        if ($status !== 'SELECTING') {
            http_response_code(403);
            echo json_encode(['error' => 'Selection not available for this collection']);
            exit;
        }

        // photoId from URL path ($parts[3])
        if (empty($photoId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Photo ID is required.']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM `Selection` WHERE collectionId = ? AND photoId = ?");
        $stmt->execute([$collectionId, $photoId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Selection not found.']);
            exit;
        }

        echo json_encode(['status' => 'OK']);
        exit;
    }

    // Other methods → 405
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
