<?php

/**
 * GET /u/{username}
 *
 * Public photographer profile endpoint.
 * No authentication required — same pattern as share.php / deliver-view.php.
 *
 * Returns only whitelisted public fields (NEVER email, plan, role, stripe*, token*, password*).
 * If isProfilePublic = false  → 404  (not 403, to avoid disclosing username existence)
 * If username not found       → 404
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/r2.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Parse username from URI: /u/{username}
$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$requestUri = rtrim($requestUri, '/');

$parts = explode('/', ltrim($requestUri, '/'));
// $parts[0] = 'u', $parts[1] = username
$username = $parts[1] ?? '';

if (empty($username)) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

$pdo = getDbConnection();

// ------------------------------------------------------------------
// 1. Fetch user — whitelist only public fields
// ------------------------------------------------------------------
$stmt = $pdo->prepare("
    SELECT
        id,
        name,
        username,
        isProfilePublic,
        bio,
        profileTagline,
        specialties,
        location,
        profileImageUrl,
        websiteUrl,
        instagramUrl,
        brandingColor,
        brandingLogoUrl,
        plan
    FROM `User`
    WHERE username = :username
    LIMIT 1
");
$stmt->execute([':username' => $username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Username not found OR profile is private → always 404
if (!$user || !(bool)$user['isProfilePublic']) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

// ------------------------------------------------------------------
// 2. Build public profile response (whitelist — never expose sensitive fields)
// ------------------------------------------------------------------
$profile = [
    'name'            => $user['name'],
    'username'        => $user['username'],
    'bio'             => $user['bio'],
    'profileTagline'  => $user['profileTagline'],
    'specialties'     => $user['specialties'],
    'location'        => $user['location'],
    'profileImageUrl' => $user['profileImageUrl'],
    'websiteUrl'      => $user['websiteUrl'],
    'instagramUrl'    => $user['instagramUrl'],
    'brandingColor'   => $user['brandingColor'],
    // brandingLogoUrl only for PRO users (upsell hook for FREE users)
    'brandingLogoUrl' => ($user['plan'] === 'PRO') ? $user['brandingLogoUrl'] : null,
];

// ------------------------------------------------------------------
// 3. Fetch public portfolio collections
//    - isPublicPortfolio = true
//    - status NOT IN (DRAFT, ARCHIVED)
//    - ordered by portfolioOrder ASC, then createdAt DESC
// ------------------------------------------------------------------
$collectionsStmt = $pdo->prepare("
    SELECT
        c.id,
        c.name,
        c.status,
        c.coverPhotoId,
        c.portfolioOrder,
        c.createdAt,
        (SELECT COUNT(*) FROM `Photo` p WHERE p.collectionId = c.id) AS photoCount,
        ph.storagePath AS coverStoragePath,
        ph.thumbnailPath AS coverThumbnailPath
    FROM `Collection` c
    LEFT JOIN `Photo` ph ON ph.id = c.coverPhotoId
    WHERE
        c.userId = :userId
        AND c.isPublicPortfolio = true
        AND c.status NOT IN ('DRAFT', 'ARCHIVED')
    ORDER BY
        ISNULL(c.portfolioOrder) ASC,
        c.portfolioOrder ASC,
        c.createdAt DESC
");
$collectionsStmt->execute([':userId' => $user['id']]);
$collectionsRaw = $collectionsStmt->fetchAll(PDO::FETCH_ASSOC);

$collections = array_map(function ($col) {
    return [
        'id'             => $col['id'],
        'name'           => $col['name'],
        'status'         => $col['status'],
        'photoCount'     => (int) $col['photoCount'],
        'portfolioOrder' => $col['portfolioOrder'] !== null ? (int)$col['portfolioOrder'] : null,
        'createdAt'      => $col['createdAt'],
        // Use thumbnail for cover if available, else full image, else null
        'coverUrl'       => $col['coverThumbnailPath']
            ? r2GetUrl($col['coverThumbnailPath'])
            : ($col['coverStoragePath'] ? r2GetUrl($col['coverStoragePath']) : null),
    ];
}, $collectionsRaw);

// ------------------------------------------------------------------
// 4. Return response
// ------------------------------------------------------------------
echo json_encode([
    'profile'     => $profile,
    'collections' => $collections,
]);
