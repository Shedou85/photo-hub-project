<?php
/**
 * Temporary GD support verification endpoint.
 * Usage: curl https://api.pixelforge.pro/backend/gd-test.php
 * Delete after confirming GD WebP support on Hostinger.
 */
header('Content-Type: application/json');

if (!function_exists('gd_info')) {
    http_response_code(500);
    echo json_encode([
        'gd_enabled' => false,
        'error' => 'GD extension is not loaded',
    ]);
    exit;
}

$info = gd_info();

echo json_encode([
    'gd_enabled' => true,
    'gd_version' => $info['GD Version'] ?? 'unknown',
    'webp_support' => !empty($info['WebP Support']),
    'jpeg_support' => !empty($info['JPEG Support']),
    'png_support' => !empty($info['PNG Support']),
    'full_info' => $info,
]);
