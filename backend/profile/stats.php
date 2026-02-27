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

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT
            COUNT(*)                                                  AS totalCollections,
            SUM(CASE WHEN status <> 'ARCHIVED' THEN 1 ELSE 0 END)    AS activeCollections,
            SUM(CASE WHEN status  = 'ARCHIVED' THEN 1 ELSE 0 END)    AS archivedCollections
        FROM `Collection`
        WHERE userId = ?
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $counts = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS totalPhotos
        FROM `Photo` p
        INNER JOIN `Collection` c ON c.id = p.collectionId
        WHERE c.userId = ?
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $photos = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "totalCollections"    => (int) ($counts['totalCollections']    ?? 0),
        "activeCollections"   => (int) ($counts['activeCollections']   ?? 0),
        "archivedCollections" => (int) ($counts['archivedCollections'] ?? 0),
        "totalPhotos"         => (int) ($photos['totalPhotos']         ?? 0),
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
