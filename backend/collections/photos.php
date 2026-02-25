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

// Parse URI: /collections/{collectionId}/photos[/{photoId}]
$parts = parseRouteParts();
$collectionId = $parts[1] ?? '';
$photoId = $parts[3] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID is required."]);
    exit;
}

// Validate ID formats to prevent path traversal
if (!isValidId($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid collection ID format."]);
    exit;
}
if (!empty($photoId) && !isValidId($photoId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid photo ID format."]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();

    // Verify collection ownership (admin can access any collection)
    $isAdmin = ($_SESSION['role'] ?? '') === 'ADMIN';
    if ($isAdmin) {
        $stmt = $pdo->prepare("SELECT id FROM `Collection` WHERE id = ? LIMIT 1");
        $stmt->execute([$collectionId]);
    } else {
        $stmt = $pdo->prepare("SELECT id FROM `Collection` WHERE id = ? AND userId = ? LIMIT 1");
        $stmt->execute([$collectionId, $userId]);
    }
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, filename, storagePath, thumbnailPath, createdAt FROM `Photo` WHERE collectionId = ? ORDER BY createdAt ASC");
        $stmt->execute([$collectionId]);
        $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT id, filename, storagePath, createdAt FROM `EditedPhoto` WHERE collectionId = ? ORDER BY createdAt ASC");
        $stmt->execute([$collectionId]);
        $editedPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "OK", "photos" => $photos, "editedPhotos" => $editedPhotos]);
        exit;
    }

    if ($method === 'POST') {
        if (empty($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(["error" => "No file uploaded."]);
            exit;
        }

        // Plan-based photo limits
        $planStmt = $pdo->prepare("SELECT u.id as uid, u.plan, u.subscriptionStatus, u.trialEndsAt FROM `User` u JOIN `Collection` c ON c.userId = u.id WHERE c.id = ? LIMIT 1");
        $planStmt->execute([$collectionId]);
        $planData = $planStmt->fetch(PDO::FETCH_ASSOC);
        $userPlan = $planData['plan'];
        $subStatus = $planData['subscriptionStatus'];

        // Auto-downgrade expired trial if not yet marked
        if ($userPlan === 'FREE_TRIAL' && !empty($planData['trialEndsAt']) && $subStatus !== 'INACTIVE') {
            $trialEnd = new DateTime($planData['trialEndsAt']);
            if (new DateTime() > $trialEnd) {
                $pdo->prepare("UPDATE `User` SET subscriptionStatus = 'INACTIVE', planDowngradedAt = ? WHERE id = ? AND plan = 'FREE_TRIAL'")
                    ->execute([date('Y-m-d H:i:s.v'), $planData['uid']]);
                $subStatus = 'INACTIVE';
            }
        }

        $photoLimit = null; // null = unlimited
        if ($userPlan === 'FREE_TRIAL' && $subStatus === 'INACTIVE') {
            $photoLimit = 30;
        } elseif ($userPlan === 'FREE_TRIAL' || $userPlan === 'STANDARD') {
            $photoLimit = 500;
        }

        if ($photoLimit !== null) {
            $photoCountStmt = $pdo->prepare("SELECT COUNT(*) FROM `Photo` WHERE collectionId = ?");
            $photoCountStmt->execute([$collectionId]);
            $photoCount = (int)$photoCountStmt->fetchColumn();

            if ($photoCount >= $photoLimit) {
                http_response_code(403);
                echo json_encode(['error' => 'PHOTO_LIMIT_REACHED', 'limit' => $photoLimit]);
                exit;
            }
        }

        $result = handleFileUpload($_FILES['file'], $collectionId);
        if (!$result['ok']) {
            http_response_code($result['code']);
            echo json_encode(["error" => $result['error']]);
            exit;
        }

        try {
            $createdAt = date('Y-m-d H:i:s.v');
            $stmt = $pdo->prepare(
                "INSERT INTO `Photo` (id, filename, storagePath, thumbnailPath, collectionId, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $result['id'],
                $result['filename'],
                $result['storagePath'],
                $result['thumbnailPath'],
                $collectionId,
                $createdAt,
            ]);

            // Auto-cover logic: set coverPhotoId on the collection if it is currently NULL
            $wasAutoCoverSet = false;
            $coverStmt = $pdo->prepare("SELECT coverPhotoId FROM `Collection` WHERE id = ? LIMIT 1");
            $coverStmt->execute([$collectionId]);
            $collection = $coverStmt->fetch(PDO::FETCH_ASSOC);

            if ($collection && $collection['coverPhotoId'] === null) {
                $updateCover = $pdo->prepare(
                    "UPDATE `Collection` SET coverPhotoId = ?, updatedAt = ? WHERE id = ?"
                );
                $updateCover->execute([$result['id'], date('Y-m-d H:i:s.v'), $collectionId]);
                $wasAutoCoverSet = true;
            }

            $response = [
                "status" => "OK",
                "photo" => [
                    "id"            => $result['id'],
                    "filename"      => $result['filename'],
                    "storagePath"   => $result['storagePath'],
                    "thumbnailPath" => $result['thumbnailPath'],
                    "createdAt"     => $createdAt,
                ],
            ];

            if ($wasAutoCoverSet) {
                $response["autoSetCover"] = [
                    "photoId"      => $result['id'],
                    "coverPhotoId" => $result['id'],
                ];
            }

            echo json_encode($response);
            exit;
        } catch (Throwable $e) {
            // CLEANUP: Remove uploaded files if DB insert failed
            safeDeleteUploadedFile($result['storagePath']);
            if (!empty($result['thumbnailPath'])) {
                safeDeleteUploadedFile($result['thumbnailPath']);
            }
            throw $e;
        }
    }

    if ($method === 'DELETE') {
        if (empty($photoId)) {
            http_response_code(400);
            echo json_encode(["error" => "Photo ID is required."]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, storagePath, thumbnailPath FROM `Photo` WHERE id = ? AND collectionId = ? LIMIT 1");
        $stmt->execute([$photoId, $collectionId]);
        $photo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$photo) {
            http_response_code(404);
            echo json_encode(["error" => "Photo not found."]);
            exit;
        }

        // Delete original file from disk (validates path is within uploads directory)
        safeDeleteUploadedFile($photo['storagePath']);

        // Delete thumbnail from disk if it exists
        if (!empty($photo['thumbnailPath'])) {
            safeDeleteUploadedFile($photo['thumbnailPath']);
        }

        $pdo->prepare("DELETE FROM `Photo` WHERE id = ? AND collectionId = ?")->execute([$photoId, $collectionId]);

        echo json_encode(["status" => "OK"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);

} catch (Throwable $e) {
    error_log("Photo handler error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
