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
 * Handle a file upload: validate MIME type and size, move file to destination.
 *
 * @param array $file The $_FILES['file'] entry
 * @param string $collectionId The collection ID
 * @param string $subdirectory Optional subdirectory within the collection (e.g. 'edited')
 * @return array ['ok' => bool, 'id' => string, 'storagePath' => string, 'filename' => string, 'error' => string|null]
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

    return [
        'ok' => true,
        'id' => $newId,
        'storagePath' => $storagePath,
        'filename' => $originalFilename,
        'error' => null
    ];
}
