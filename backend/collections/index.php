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
        // Handle GET request - paginated collection list for the user
        $page   = max(1, (int) ($_GET['page']  ?? 1));
        $limit  = max(1, min(50, (int) ($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? '';

        $allowedStatuses = ['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED', 'ARCHIVED'];

        $conditions = ['c.userId = ?'];
        $params     = [$userId];

        if ($status !== '' && in_array($status, $allowedStatuses, true)) {
            $conditions[] = 'c.status = ?';
            $params[]     = $status;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $conditions);

        // Count total matching
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `Collection` c $whereClause");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Fetch paginated results
        $dataParams = $params;
        $dataParams[] = $limit;
        $dataParams[] = $offset;

        $dataStmt = $pdo->prepare("
            SELECT c.id, c.name, c.status, c.clientName, c.clientEmail, c.shareId,
                   c.coverPhotoId, c.createdAt, c.updatedAt,
                   p.thumbnailPath as coverPhotoPath,
                   COALESCE(pc.photoCount, 0) as photoCount
            FROM `Collection` c
            LEFT JOIN `Photo` p ON c.coverPhotoId = p.id
            LEFT JOIN (
                SELECT collectionId, COUNT(*) as photoCount
                FROM `Photo`
                GROUP BY collectionId
            ) pc ON pc.collectionId = c.id
            $whereClause
            ORDER BY c.createdAt DESC
            LIMIT ? OFFSET ?
        ");

        $paramIndex = 1;
        foreach ($params as $paramValue) {
            $dataStmt->bindValue($paramIndex++, $paramValue, PDO::PARAM_STR);
        }
        $dataStmt->bindValue($paramIndex++, $limit,  PDO::PARAM_INT);
        $dataStmt->bindValue($paramIndex,   $offset, PDO::PARAM_INT);
        $dataStmt->execute();

        $collections = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "OK",
            "collections" => $collections,
            "pagination" => [
                "total"      => $total,
                "page"       => $page,
                "limit"      => $limit,
                "totalPages" => (int) ceil($total / $limit),
            ]
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - create a new collection
        $data = json_decode(file_get_contents('php://input'), true);

        $name = $data['name'] ?? null;
        $clientName = $data['clientName'] ?? null;
        $clientEmail = $data['clientEmail'] ?? null;

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["error" => "Collection name is required."]);
            exit;
        }

        // Plan-based collection limits
        $planStmt = $pdo->prepare("SELECT plan, subscriptionStatus, collectionsCreatedCount, trialEndsAt FROM `User` WHERE id = ? LIMIT 1");
        $planStmt->execute([$userId]);
        $userData = $planStmt->fetch(PDO::FETCH_ASSOC);
        $userPlan = $userData['plan'];
        $subStatus = $userData['subscriptionStatus'];
        $totalCreated = (int)$userData['collectionsCreatedCount'];

        // Auto-downgrade expired trial if not yet marked
        if ($userPlan === 'FREE_TRIAL' && !empty($userData['trialEndsAt']) && $subStatus !== 'INACTIVE') {
            $trialEnd = new DateTime($userData['trialEndsAt']);
            if (new DateTime() > $trialEnd) {
                $pdo->prepare("UPDATE `User` SET subscriptionStatus = 'INACTIVE', planDowngradedAt = ? WHERE id = ? AND plan = 'FREE_TRIAL'")
                    ->execute([date('Y-m-d H:i:s.v'), $userId]);
                $subStatus = 'INACTIVE';
            }
        }

        if ($userPlan === 'FREE_TRIAL') {
            if ($subStatus === 'INACTIVE') {
                // Expired trial: cumulative limit of 5 total collections ever created
                if ($totalCreated >= 5) {
                    http_response_code(403);
                    echo json_encode(['error' => 'COLLECTION_LIMIT_REACHED', 'limit' => 5, 'type' => 'cumulative']);
                    exit;
                }
            } else {
                // Active trial: STANDARD-level limit of 20 active collections
                $countStmt = $pdo->prepare(
                    "SELECT COUNT(*) FROM `Collection` WHERE userId = ? AND status != 'ARCHIVED'"
                );
                $countStmt->execute([$userId]);
                $activeCount = (int)$countStmt->fetchColumn();

                if ($activeCount >= 20) {
                    http_response_code(403);
                    echo json_encode(['error' => 'COLLECTION_LIMIT_REACHED', 'limit' => 20]);
                    exit;
                }
            }
        } elseif ($userPlan === 'STANDARD') {
            $countStmt = $pdo->prepare(
                "SELECT COUNT(*) FROM `Collection` WHERE userId = ? AND status != 'ARCHIVED'"
            );
            $countStmt->execute([$userId]);
            $activeCount = (int)$countStmt->fetchColumn();

            if ($activeCount >= 20) {
                http_response_code(403);
                echo json_encode(['error' => 'COLLECTION_LIMIT_REACHED', 'limit' => 20]);
                exit;
            }
        }
        // PRO plan: no limits

        // Generate CUID for the new collection
        $collectionId = generateCuid();
        $shareId = bin2hex(random_bytes(16)); // 128-bit entropy shareId
        $currentDateTime = date('Y-m-d H:i:s.v');

        $stmt = $pdo->prepare("
            INSERT INTO `Collection` (id, name, clientName, clientEmail, userId, createdAt, updatedAt, shareId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$collectionId, $name, $clientName, $clientEmail, $userId, $currentDateTime, $currentDateTime, $shareId]);

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
