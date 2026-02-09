<?php
// backend/api/index.php

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

// Set session cookie params once for all handlers
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.pixelforge.pro',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
]);

// Helper function to generate CUIDs (simplified for demonstration)
function generateCuid() {
    // In a real application, consider a more robust CUID library
    // This is a basic example to match Prisma's CUID length and format.
    $timestamp = round(microtime(true) * 1000);
    $random = bin2hex(random_bytes(8)); // 16 characters
    $counter = uniqid(); // 13 characters, pseudo-random
    return 'cl' . substr(md5($timestamp . $random . $counter), 0, 22); // 'cl' + 22 chars = 24 chars, similar to Prisma's CUID length
}


// Simple routing logic
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI
$requestUri = strtok($requestUri, '?');

// Remove sub-folder path from request URI
$basePath = '/backend'; // The path to this script's directory from the web root
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Strip trailing slash (e.g. /collections/ -> /collections)
$requestUri = rtrim($requestUri, '/');

// Basic router
switch ($requestUri) {
    case '/':
    case '':
        echo json_encode(['message' => 'Welcome to the Photo-Hub API']);
        break;
        
    case '/test':
        if ($requestMethod == 'GET') {
            echo json_encode(['status' => 'success', 'data' => 'This is a test response from the PHP backend.']);
        }
        else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/db-test':
        if ($requestMethod == 'GET') {
            try {
                $pdo = getDbConnection();
                $stmt = $pdo->query('SELECT 1');
                if ($stmt) {
                    echo json_encode(['status' => 'success', 'message' => 'Database connection successful!']);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: unable to execute query.']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/register':
        if ($requestMethod == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);

            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($email) || empty($password)) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
                exit();
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
                exit();
            }

            try {
                $pdo = getDbConnection();
                
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM `User` WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetchColumn() > 0) {
                    http_response_code(409); // Conflict
                    echo json_encode(['status' => 'error', 'message' => 'User with this email already exists.']);
                    exit();
                }

                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $userId = generateCuid();

                $stmt = $pdo->prepare("INSERT INTO `User` (id, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
                
                $currentDateTime = date('Y-m-d H:i:s.v');

                $stmt->execute([$userId, $email, $hashedPassword, $currentDateTime, $currentDateTime]);

                echo json_encode(['status' => 'success', 'message' => 'User registered successfully!', 'userId' => $userId]);

            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Registration failed: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/login':
        if ($requestMethod == 'POST') {
            require_once __DIR__ . '/auth/login.php';
        }
        else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/auth/me':
        if ($requestMethod == 'GET') {
            require_once __DIR__ . '/auth/me.php';
        }
        else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/profile/me':
        if ($requestMethod == 'PATCH') {
            require_once __DIR__ . '/profile/me.php';
        }
        else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/collections':
        require_once __DIR__ . '/collections/index.php';
        break;

    default:
        // Handle /collections/{id}
        if (strpos($requestUri, '/collections/') === 0) {
            require_once __DIR__ . '/collections/id.php';
            break;
        }

        http_response_code(404);
        echo json_encode(['error' => 'Endpoint Not Found']);
        break;
}

?>