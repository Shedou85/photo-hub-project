<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';
require_once __DIR__ . '/../helpers/r2.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $pdo = getDbConnection();

    // Verify PRO plan
    $stmt = $pdo->prepare("SELECT plan, brandingLogoUrl FROM `User` WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['plan'] !== 'PRO') {
        http_response_code(403);
        echo json_encode(["error" => "PRO plan required"]);
        exit;
    }

    // Validate uploaded file
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded or upload error"]);
        exit;
    }

    $file = $_FILES['logo'];

    // Validate MIME type
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimes, true)) {
        http_response_code(400);
        echo json_encode(["error" => "Only JPEG, PNG, and WEBP files are allowed"]);
        exit;
    }

    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(["error" => "File size exceeds 5 MB limit"]);
        exit;
    }

    // Resize to max 400px wide using GD
    $tmpPath = $file['tmp_name'];
    $imageSize = @getimagesize($tmpPath);
    if ($imageSize === false) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid image file"]);
        exit;
    }

    $srcWidth = $imageSize[0];
    $srcHeight = $imageSize[1];

    // Load source image
    $srcImage = null;
    switch ($mimeType) {
        case 'image/jpeg':
            $srcImage = @imagecreatefromjpeg($tmpPath);
            break;
        case 'image/png':
            $srcImage = @imagecreatefrompng($tmpPath);
            break;
        case 'image/webp':
            $srcImage = @imagecreatefromwebp($tmpPath);
            break;
    }

    if (!$srcImage) {
        http_response_code(400);
        echo json_encode(["error" => "Could not process image"]);
        exit;
    }

    // Resize if wider than 400px
    if ($srcWidth > 400) {
        $newWidth = 400;
        $newHeight = (int) round($srcHeight * (400 / $srcWidth));
        $resized = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG
        if ($mimeType === 'image/png') {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
            imagefill($resized, 0, 0, $transparent);
        }

        imagecopyresampled($resized, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $srcWidth, $srcHeight);
        imagedestroy($srcImage);
        $srcImage = $resized;
    }

    // Save to temp file
    $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $ext = $extMap[$mimeType];
    $tmpResizedPath = sys_get_temp_dir() . '/branding_' . uniqid('', true) . '.' . $ext;

    switch ($mimeType) {
        case 'image/jpeg':
            imagejpeg($srcImage, $tmpResizedPath, 90);
            break;
        case 'image/png':
            imagepng($srcImage, $tmpResizedPath, 8);
            break;
        case 'image/webp':
            imagewebp($srcImage, $tmpResizedPath, 90);
            break;
    }
    imagedestroy($srcImage);

    // Delete old logo from R2 if exists
    $oldLogoUrl = $user['brandingLogoUrl'];
    if ($oldLogoUrl) {
        r2Delete($oldLogoUrl);
        // Also try to clean up other extension variants
        $oldBase = preg_replace('/\.[^.]+$/', '', $oldLogoUrl);
        foreach (['jpg', 'png', 'webp'] as $oldExt) {
            $variant = $oldBase . '.' . $oldExt;
            if ($variant !== $oldLogoUrl) {
                r2Delete($variant);
            }
        }
    }

    // Upload to R2
    $objectKey = "users/{$userId}/branding/logo.{$ext}";
    r2Upload($tmpResizedPath, $objectKey, $mimeType);
    @unlink($tmpResizedPath);

    // Update database
    $stmt = $pdo->prepare("UPDATE `User` SET brandingLogoUrl = ?, updatedAt = ? WHERE id = ?");
    $stmt->execute([$objectKey, date('Y-m-d H:i:s.v'), $userId]);

    // Return updated user
    $stmt = $pdo->prepare("
        SELECT id, name, email, bio, createdAt, plan, role, subscriptionStatus,
               trialEndsAt, collectionsCreatedCount, emailVerified,
               brandingLogoUrl, brandingColor,
               (password IS NOT NULL) AS hasPassword
        FROM `User`
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($updatedUser) {
        $updatedUser['hasPassword'] = (bool) $updatedUser['hasPassword'];
    }

    echo json_encode(["status" => "OK", "user" => $updatedUser]);

} catch (Throwable $e) {
    error_log('Branding logo upload error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
