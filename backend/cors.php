<?php

$allowedOrigins = [
    'https://pixelforge.pro',
    'http://localhost:5173',
    'http://localhost:4173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PATCH, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token");
    http_response_code(200);
    exit;
}
