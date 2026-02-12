<?php
/**
 * Shared utility functions for backend handlers.
 */

/**
 * Parse the request URI and extract path parts after the /backend base path.
 *
 * @return array The URI segments (e.g. ['collections', 'abc123', 'photos', 'def456'])
 */
function parseRouteParts() {
    $requestUri = $_SERVER['REQUEST_URI'];
    $requestUri = strtok($requestUri, '?');
    $basePath = '/backend';
    if (strpos($requestUri, $basePath) === 0) {
        $requestUri = substr($requestUri, strlen($basePath));
    }
    $requestUri = rtrim($requestUri, '/');
    return explode('/', ltrim($requestUri, '/'));
}

/**
 * Validate that an ID string contains only alphanumeric characters (safe for file paths).
 *
 * @param string $id The ID to validate
 * @return bool True if the ID is valid
 */
function isValidId($id) {
    return preg_match('/^[a-zA-Z0-9]+$/', $id) === 1;
}

/**
 * Get the absolute path to the uploads base directory.
 *
 * @return string The resolved uploads base directory path
 */
function getUploadsBasePath() {
    return __DIR__ . '/uploads';
}

/**
 * Safely delete a file, ensuring the path is within the uploads directory.
 *
 * @param string $storagePath The relative storage path (e.g. "uploads/abc123/file.jpg")
 * @return bool True if the file was deleted, false otherwise
 */
function safeDeleteUploadedFile($storagePath) {
    $uploadsBase = realpath(getUploadsBasePath());
    if (!$uploadsBase) {
        return false;
    }
    $filePath = realpath(__DIR__ . '/' . $storagePath);
    if ($filePath && strpos($filePath, $uploadsBase) === 0 && file_exists($filePath)) {
        return unlink($filePath);
    }
    return false;
}

/**
 * Generate a JPEG thumbnail at 400px width for an uploaded image.
 *
 * Supports JPEG, PNG, and WebP source images. If WebP is not supported by the
 * installed GD build, the thumbnail is skipped and null is returned. Very large
 * images (width × height > 25,000,000 px) are also skipped to prevent memory
 * exhaustion. Failures always degrade gracefully — the original upload is never
 * affected.
 *
 * @param string $sourcePath  Absolute path to the uploaded source file
 * @param string $mimeType    Validated MIME type: image/jpeg, image/png, or image/webp
 * @param string $collectionId  Collection ID used to build the thumbs directory path
 * @param string $photoId     Photo ID used as the thumbnail filename stem
 * @return string|null  Relative thumbnail path (e.g. "uploads/{collId}/thumbs/{id}_thumb.jpg"),
 *                      or null if generation was skipped or failed
 */
function generateThumbnail($sourcePath, $mimeType, $collectionId, $photoId) {
    // Require GD extension
    if (!function_exists('imagecreatefromjpeg')) {
        error_log("Thumbnail skipped: GD extension not available");
        return null;
    }

    // Determine source image dimensions without fully loading into memory
    $imageSize = @getimagesize($sourcePath);
    if ($imageSize === false) {
        error_log("Thumbnail skipped: getimagesize() failed for {$sourcePath}");
        return null;
    }

    $srcWidth  = $imageSize[0];
    $srcHeight = $imageSize[1];

    // Skip very large images to prevent memory exhaustion
    if ($srcWidth * $srcHeight > 25000000) {
        error_log("Thumbnail skipped: image too large ({$srcWidth}x{$srcHeight})");
        return null;
    }

    // Load source image into GD resource
    $srcImage = null;
    try {
        switch ($mimeType) {
            case 'image/jpeg':
                $srcImage = @imagecreatefromjpeg($sourcePath);
                break;

            case 'image/png':
                $srcImage = @imagecreatefrompng($sourcePath);
                break;

            case 'image/webp':
                if (!function_exists('imagecreatefromwebp')) {
                    error_log("Thumbnail skipped: imagecreatefromwebp() not available (GD built without WebP support)");
                    return null;
                }
                $srcImage = @imagecreatefromwebp($sourcePath);
                break;

            default:
                return null;
        }
    } catch (Throwable $e) {
        error_log("Thumbnail skipped: GD load error — " . $e->getMessage());
        return null;
    }

    if ($srcImage === false || $srcImage === null) {
        error_log("Thumbnail skipped: GD could not load {$sourcePath}");
        return null;
    }

    // Compute thumbnail dimensions preserving aspect ratio (max 400px wide)
    $thumbWidth  = min(400, $srcWidth);
    $thumbHeight = (int) round($srcHeight * ($thumbWidth / $srcWidth));

    // Create thumbnail canvas and resample
    $thumbImage = imagecreatetruecolor($thumbWidth, $thumbHeight);
    if ($thumbImage === false) {
        imagedestroy($srcImage);
        error_log("Thumbnail skipped: imagecreatetruecolor() failed");
        return null;
    }

    // Fill with white background (handles PNG transparency)
    $white = imagecolorallocate($thumbImage, 255, 255, 255);
    imagefill($thumbImage, 0, 0, $white);

    $resampleOk = imagecopyresampled(
        $thumbImage, $srcImage,
        0, 0, 0, 0,
        $thumbWidth, $thumbHeight,
        $srcWidth, $srcHeight
    );

    imagedestroy($srcImage);

    if (!$resampleOk) {
        imagedestroy($thumbImage);
        error_log("Thumbnail skipped: imagecopyresampled() failed");
        return null;
    }

    // Ensure thumbs directory exists
    $thumbsDir = getUploadsBasePath() . '/' . $collectionId . '/thumbs';
    if (!is_dir($thumbsDir)) {
        mkdir($thumbsDir, 0755, true);
    }

    $thumbRelativePath = "uploads/{$collectionId}/thumbs/{$photoId}_thumb.jpg";
    $thumbAbsPath      = __DIR__ . '/' . $thumbRelativePath;

    // Save as JPEG (quality 85 — good balance of size vs. fidelity)
    $saved = @imagejpeg($thumbImage, $thumbAbsPath, 85);
    imagedestroy($thumbImage);

    if (!$saved) {
        error_log("Thumbnail skipped: imagejpeg() could not write to {$thumbAbsPath}");
        return null;
    }

    return $thumbRelativePath;
}

/**
 * Handle a file upload: validate MIME type and size, move file to destination,
 * and generate a JPEG thumbnail at 400px width.
 *
 * @param array  $file         The $_FILES['file'] entry
 * @param string $collectionId The collection ID
 * @param string $subdirectory Optional subdirectory within the collection (e.g. 'edited')
 * @return array {
 *   'ok'            => bool,
 *   'id'            => string,
 *   'storagePath'   => string,
 *   'thumbnailPath' => string|null,
 *   'filename'      => string,
 *   'createdAt'     => string,
 *   'error'         => string|null,
 *   'code'          => int|null
 * }
 */
function handleFileUpload($file, $collectionId, $subdirectory = '') {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'File upload error: ' . $file['error'], 'code' => 400];
    }

    // Validate MIME type
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimes, true)) {
        return ['ok' => false, 'error' => 'Only JPEG, PNG, and WEBP files are allowed.', 'code' => 400];
    }

    // Validate file size (max 20 MB)
    $maxSize = 20 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        return ['ok' => false, 'error' => 'File size exceeds 20 MB limit.', 'code' => 400];
    }

    $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $ext = $extMap[$mimeType];
    $newId = generateCuid();

    $subPath = $subdirectory ? "/{$subdirectory}" : '';
    $storagePath = "uploads/{$collectionId}{$subPath}/{$newId}.{$ext}";

    $uploadDir = getUploadsBasePath() . '/' . $collectionId . ($subdirectory ? '/' . $subdirectory : '');
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], __DIR__ . '/' . $storagePath)) {
        return ['ok' => false, 'error' => 'Failed to save file.', 'code' => 500];
    }

    $originalFilename = basename($file['name']);
    $createdAt = date('Y-m-d H:i:s.v');

    // Generate thumbnail (only for main uploads, not edited subdirectory)
    $thumbnailPath = null;
    if (empty($subdirectory)) {
        $thumbnailPath = generateThumbnail(
            __DIR__ . '/' . $storagePath,
            $mimeType,
            $collectionId,
            $newId
        );
    }

    return [
        'ok'            => true,
        'id'            => $newId,
        'storagePath'   => $storagePath,
        'thumbnailPath' => $thumbnailPath,
        'filename'      => $originalFilename,
        'createdAt'     => $createdAt,
        'error'         => null,
    ];
}
