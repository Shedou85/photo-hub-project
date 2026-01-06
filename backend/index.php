<?php
// backend/api/index.php

// Set headers for CORS and content type
header("Access-Control-Allow-Origin: https://pixelforge.pro");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

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

// Remove sub-folder path from request URI
$basePath = '/backend'; // The path to this script's directory from the web root
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Basic router
switch ($requestUri) {
    case '/':
    case '':
        echo json_encode(['message' => 'Welcome to the Photo-Hub API']);
        break;
        
    case '/test':
        if ($requestMethod == 'GET') {
            echo json_encode(['status' => 'success', 'data' => 'This is a test response from the PHP backend.']);
        } else {
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
            $data = json_decode(file_get_contents('php://input'), true);

            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
                exit();
            }

            try {
                $pdo = getDbConnection();
                
                $stmt = $pdo->prepare("SELECT * FROM `User` WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                if ($user && password_verify($password, $user['password'])) {
                    session_set_cookie_params([
                        'lifetime' => 86400, // 24 hours
                        'path' => '/',
                        'domain' => '.pixelforge.pro',
                        'secure' => true,
                        'httponly' => true,
                        'samesite' => 'None'
                    ]);
                    session_start();
                    $_SESSION['user_id'] = $user['id'];
                    
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Login successful!',
                        'user' => [
                            'id' => $user['id'],
                            'name' => $user['name'], // Use 'name' instead of 'username'
                            'email' => $user['email'],
                            'createdAt' => $user['createdAt']
                        ]
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(['status' => 'error', 'message' => 'Invalid email or password.']);
                }

            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Login failed: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/user':
        if ($requestMethod == 'GET') {
            $name = $_GET['name'] ?? ''; // Query by 'name'
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['error' => 'Name is required.']);
                exit();
            }
    
            try {
                $pdo = getDbConnection();
                $stmt = $pdo->prepare("SELECT email, createdAt FROM `User` WHERE name = ?"); // Select by 'name'
                $stmt->execute([$name]);
                $userData = $stmt->fetch();
    
                if ($userData) {
                    echo json_encode(['status' => 'success', 'user' => $userData]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found.']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/upload':
        if ($requestMethod == 'POST') {
            
            if (isset($_FILES['photo'])) {
                $file = $_FILES['photo'];

                if ($file['error'] !== UPLOAD_ERR_OK) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'File upload error. Code: ' . $file['error']]);
                    exit();
                }

                $allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!in_array($file['type'], $allowedMimes)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
                    exit();
                }
                
                if ($file['size'] > 5 * 1024 * 1024) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'File is too large. Maximum size is 5MB.']);
                    exit();
                }

                $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $uniqueFilename = uniqid('img_', true) . '.' . $fileExtension;
                
                $uploadDir = __DIR__ . '/uploads/';
                $uploadPath = $uploadDir . $uniqueFilename;

                if (move_uploaded_file($file['tmp_name'], `uploadPath`)) {
                    $publicUrl = '/backend/api/uploads/' . $uniqueFilename;
                    echo json_encode(['status' => 'success', 'message' => 'File uploaded successfully.', 'url' => $publicUrl]);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file.']);
                }

            } else {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'No file was uploaded. Please use the "photo" field.']);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint Not Found']);
        break;
}

?>