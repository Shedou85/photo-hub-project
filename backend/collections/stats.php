<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$uriParts = explode('/', ltrim($_SERVER['REQUEST_URI'], '/'));
// URI: backend/collections/{collectionId}/stats
$collectionId = $uriParts[1] ?? '';
// Handle basePath stripping — collectionId is in the parsed route
$requestUri = strtok($_SERVER['REQUEST_URI'], '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$parts = explode('/', ltrim($requestUri, '/'));
$collectionId = $parts[1] ?? '';

if (empty($collectionId)) {
    http_response_code(400);
    echo json_encode(["error" => "Collection ID required"]);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify collection ownership (admin bypass)
    $stmt = $pdo->prepare("SELECT userId FROM `Collection` WHERE id = ?");
    $stmt->execute([$collectionId]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found"]);
        exit;
    }

    // Check ownership — allow admins to bypass
    $isAdmin = false;
    $adminStmt = $pdo->prepare("SELECT role FROM `User` WHERE id = ?");
    $adminStmt->execute([$_SESSION['user_id']]);
    $currentUser = $adminStmt->fetch(PDO::FETCH_ASSOC);
    if ($currentUser && $currentUser['role'] === 'ADMIN') {
        $isAdmin = true;
    }

    if ($collection['userId'] !== $_SESSION['user_id'] && !$isAdmin) {
        http_response_code(403);
        echo json_encode(["error" => "Access denied"]);
        exit;
    }

    // Download stats
    $stmt = $pdo->prepare("SELECT COUNT(*) AS totalDownloads, MAX(downloadedAt) AS lastDownloadAt FROM `Download` WHERE collectionId = ?");
    $stmt->execute([$collectionId]);
    $downloadStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Selection count
    $stmt = $pdo->prepare("SELECT COUNT(*) AS selectedPhotos FROM `Selection` WHERE collectionId = ?");
    $stmt->execute([$collectionId]);
    $selectionStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Format lastDownloadAt to ISO 8601 if present
    $lastDownloadAt = null;
    if (!empty($downloadStats['lastDownloadAt'])) {
        $lastDownloadAt = (new DateTime($downloadStats['lastDownloadAt']))->format('c');
    }

    echo json_encode([
        "totalDownloads" => (int) ($downloadStats['totalDownloads'] ?? 0),
        "lastDownloadAt" => $lastDownloadAt,
        "selectedPhotos" => (int) ($selectionStats['selectedPhotos'] ?? 0),
    ]);

} catch (Throwable $e) {
    error_log('Collection stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
