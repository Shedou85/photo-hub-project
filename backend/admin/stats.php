<?php
// backend/admin/stats.php — GET /admin/stats

header('Content-Type: application/json');

require_once __DIR__ . '/../admin/auth-check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    // --- User counts ---
    $userStmt = $pdo->query("
        SELECT
            COUNT(*) AS totalUsers,
            SUM(status = 'ACTIVE') AS activeUsers,
            SUM(status = 'SUSPENDED') AS suspendedUsers
        FROM `User`
    ");
    $userStats = $userStmt->fetch(PDO::FETCH_ASSOC);

    // --- Plan breakdown ---
    $planStmt = $pdo->query("
        SELECT plan, COUNT(*) AS cnt
        FROM `User`
        GROUP BY plan
    ");
    $planRows = $planStmt->fetchAll(PDO::FETCH_ASSOC);

    $planBreakdown = [
        'FREE_TRIAL' => 0,
        'STANDARD'   => 0,
        'PRO'        => 0,
    ];
    foreach ($planRows as $row) {
        if (array_key_exists($row['plan'], $planBreakdown)) {
            $planBreakdown[$row['plan']] = (int) $row['cnt'];
        }
    }

    // --- Collection counts ---
    $collectionStmt = $pdo->query("SELECT COUNT(*) AS totalCollections FROM `Collection`");
    $collectionStats = $collectionStmt->fetch(PDO::FETCH_ASSOC);

    // --- Collections by status ---
    $statusStmt = $pdo->query("
        SELECT status, COUNT(*) AS cnt
        FROM `Collection`
        GROUP BY status
    ");
    $statusRows = $statusStmt->fetchAll(PDO::FETCH_ASSOC);

    $collectionsByStatus = [
        'DRAFT'      => 0,
        'SELECTING'  => 0,
        'REVIEWING'  => 0,
        'DELIVERED'  => 0,
        'DOWNLOADED' => 0,
        'ARCHIVED'   => 0,
    ];
    foreach ($statusRows as $row) {
        if (array_key_exists($row['status'], $collectionsByStatus)) {
            $collectionsByStatus[$row['status']] = (int) $row['cnt'];
        }
    }

    // --- Total downloads ---
    $downloadStmt = $pdo->query("SELECT COUNT(*) AS totalDownloads FROM `Download`");
    $downloadStats = $downloadStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'totalUsers'           => (int) $userStats['totalUsers'],
        'activeUsers'          => (int) ($userStats['activeUsers'] ?? 0),
        'suspendedUsers'       => (int) ($userStats['suspendedUsers'] ?? 0),
        'planBreakdown'        => $planBreakdown,
        'totalCollections'     => (int) $collectionStats['totalCollections'],
        'collectionsByStatus'  => $collectionsByStatus,
        'totalDownloads'       => (int) $downloadStats['totalDownloads'],
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Internal server error.']);
}
