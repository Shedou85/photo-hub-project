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
 * Delete a file from R2 storage.
 *
 * @param string $storagePath The R2 object key (e.g. "collections/abc123/file.jpg")
 * @return bool True if the file was deleted, false otherwise
 */
function safeDeleteUploadedFile($storagePath) {
    if (empty($storagePath)) {
        return false;
    }
    require_once __DIR__ . '/helpers/r2.php';
    return r2Delete($storagePath);
}

/**
 * Generate a JPEG thumbnail at 400px width and save to a temp file.
 *
 * Supports JPEG, PNG, and WebP source images. If WebP is not supported by the
 * installed GD build, the thumbnail is skipped and null is returned. Very large
 * images (width × height > 25,000,000 px) are also skipped to prevent memory
 * exhaustion. Failures always degrade gracefully — the original upload is never
 * affected.
 *
 * @param string $sourcePath  Absolute path to the source file (can be a temp upload)
 * @param string $mimeType    Validated MIME type: image/jpeg, image/png, or image/webp
 * @return string|null  Absolute path to the generated temp thumbnail file,
 *                      or null if generation was skipped or failed.
 *                      Caller is responsible for deleting the temp file after use.
 */
function generateThumbnail($sourcePath, $mimeType) {
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

    // Save as JPEG to a temp file (quality 85)
    $tmpThumbPath = sys_get_temp_dir() . '/thumb_' . uniqid('', true) . '.jpg';
    $saved = @imagejpeg($thumbImage, $tmpThumbPath, 85);
    imagedestroy($thumbImage);

    if (!$saved) {
        error_log("Thumbnail skipped: imagejpeg() could not write to temp file");
        @unlink($tmpThumbPath);
        return null;
    }

    return $tmpThumbPath;
}

/**
 * Handle a file upload: validate MIME type and size, upload to R2,
 * and generate + upload a JPEG thumbnail at 400px width.
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
    require_once __DIR__ . '/helpers/r2.php';

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
    $tmpPath = $file['tmp_name'];

    // Build R2 object key
    $subPath = $subdirectory ? "/{$subdirectory}" : '';
    $objectKey = "collections/{$collectionId}{$subPath}/{$newId}.{$ext}";

    // Upload original to R2
    try {
        r2Upload($tmpPath, $objectKey, $mimeType);
    } catch (\RuntimeException $e) {
        return ['ok' => false, 'error' => 'Failed to upload file to storage.', 'code' => 500];
    }

    $originalFilename = basename($file['name']);
    $createdAt = date('Y-m-d H:i:s.v');

    // Generate and upload thumbnail (only for main uploads, not edited subdirectory)
    $thumbnailKey = null;
    if (empty($subdirectory)) {
        $tmpThumbPath = generateThumbnail($tmpPath, $mimeType);
        if ($tmpThumbPath !== null) {
            $thumbObjectKey = "collections/{$collectionId}/thumbs/{$newId}_thumb.jpg";
            try {
                r2Upload($tmpThumbPath, $thumbObjectKey, 'image/jpeg');
                $thumbnailKey = $thumbObjectKey;
            } catch (\RuntimeException $e) {
                error_log("Thumbnail upload to R2 failed: " . $e->getMessage());
            } finally {
                @unlink($tmpThumbPath);
            }
        }
    }

    return [
        'ok'            => true,
        'id'            => $newId,
        'storagePath'   => $objectKey,
        'thumbnailPath' => $thumbnailKey,
        'filename'      => $originalFilename,
        'createdAt'     => $createdAt,
        'error'         => null,
    ];
}
