<?php
require_once __DIR__ . '/../db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle GET request - list all collections for the user
        $stmt = $pdo->prepare("
            SELECT c.id, c.name, c.status, c.clientName, c.clientEmail, c.shareId,
                   c.coverPhotoId, c.createdAt, c.updatedAt,
                   p.thumbnailPath as coverPhotoPath,
                   (SELECT COUNT(*) FROM `Photo` ph WHERE ph.collectionId = c.id) as photoCount
            FROM `Collection` c
            LEFT JOIN `Photo` p ON c.coverPhotoId = p.id
            WHERE c.userId = ?
            ORDER BY c.createdAt DESC
        ");
        $stmt->execute([$userId]);
        $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "OK",
            "collections" => $collections
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - create a new collection
        $data = json_decode(file_get_contents('php://input'), true);

        $name = $data['name'] ?? null;

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["error" => "Collection name is required."]);
            exit;
        }

        // FREE_TRIAL: max 3 active (non-archived) collections
        $planStmt = $pdo->prepare("SELECT plan FROM `User` WHERE id = ? LIMIT 1");
        $planStmt->execute([$userId]);
        $userPlan = $planStmt->fetchColumn();

        if ($userPlan === 'FREE_TRIAL') {
            $countStmt = $pdo->prepare(
                "SELECT COUNT(*) FROM `Collection` WHERE userId = ? AND status != 'ARCHIVED'"
            );
            $countStmt->execute([$userId]);
            $activeCount = (int)$countStmt->fetchColumn();

            if ($activeCount >= 3) {
                http_response_code(403);
                echo json_encode(['error' => 'COLLECTION_LIMIT_REACHED', 'limit' => 3]);
                exit;
            }
        }

        // Generate CUID for the new collection
        $collectionId = generateCuid();
        $shareId = bin2hex(random_bytes(16)); // 128-bit entropy shareId
        $currentDateTime = date('Y-m-d H:i:s.v');

        $stmt = $pdo->prepare("
            INSERT INTO `Collection` (id, name, userId, createdAt, updatedAt, shareId)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$collectionId, $name, $userId, $currentDateTime, $currentDateTime, $shareId]);

        $pdo->prepare("UPDATE `User` SET collectionsCreatedCount = collectionsCreatedCount + 1 WHERE id = ?")->execute([$userId]);

        echo json_encode([
            "status" => "OK",
            "message" => "Collection created successfully!",
            "collection" => [
                "id" => $collectionId,
                "name" => $name,
                "shareId" => $shareId,
                "status" => "DRAFT",
                "createdAt" => $currentDateTime,
                "updatedAt" => $currentDateTime
            ]
        ]);
        exit;
    }

    // If method is not GET or POST
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(["error" => "Internal server error."]);
}
