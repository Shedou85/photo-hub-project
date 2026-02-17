<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed"]);
    exit;
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("
        SELECT pp.photoId, pp.collectionId, pp.`order`,
               p.storagePath, p.thumbnailPath
        FROM PromotionalPhoto pp
        JOIN Photo p ON p.id = pp.photoId
        JOIN `Collection` c ON c.id = pp.collectionId
        WHERE c.allowPromotionalUse = 1
          AND c.status IN ('DELIVERED', 'DOWNLOADED')
        ORDER BY RAND()
        LIMIT 20
    ");
    $stmt->execute();
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "OK", "photos" => $photos]);

} catch (Throwable $e) {
    error_log("Promotional public endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
