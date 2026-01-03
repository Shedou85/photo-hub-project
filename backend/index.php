<?php
// backend/index.php

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

// Simple routing logic
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove sub-folder path from request URI
// This is important if your project is not in the web root.
$basePath = '/backend'; // Adjust if your structure is different
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Basic router
switch ($requestUri) {
    case '/':
    case '':
        echo json_encode(['message' => 'Welcome to the Photo-Hub API']);
        break;
        
    // Example endpoint: /api/test
    case '/api/test':
        if ($requestMethod == 'GET') {
            echo json_encode(['status' => 'success', 'data' => 'This is a test response from the PHP backend.']);
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    // Database connection test endpoint
    case '/api/db-test':
        if ($requestMethod == 'GET') {
            try {
                $pdo = getDbConnection();
                // Check if the connection is established by running a simple query
                $stmt = $pdo->query('SELECT 1');
                if ($stmt) {
                    echo json_encode(['status' => 'success', 'message' => 'Database connection successful!']);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: unable to execute query.']);
                }
            } catch (PDOException $e) {
                http_response_code(500); // Internal Server Error
                echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    // User registration endpoint
    case '/api/register':
        if ($requestMethod == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);

            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($email) || empty($password)) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
                exit();
            }

            // Basic email validation
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
                exit();
            }

            try {
                $pdo = getDbConnection();
                
                // Check if user already exists
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM `User` WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetchColumn() > 0) {
                    http_response_code(409); // Conflict
                    echo json_encode(['status' => 'error', 'message' => 'User with this email already exists.']);
                    exit();
                }

                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $userId = generateCuid(); // Generate a CUID for the user ID

                $stmt = $pdo->prepare("INSERT INTO `User` (id, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
                
                $currentDateTime = date('Y-m-d H:i:s.v'); // Format for DATETIME(3)

                $stmt->execute([$userId, $email, $hashedPassword, $currentDateTime, $currentDateTime]);

                echo json_encode(['status' => 'success', 'message' => 'User registered successfully!', 'userId' => $userId]);

            } catch (PDOException $e) {
                http_response_code(500); // Internal Server Error
                echo json_encode(['status' => 'error', 'message' => 'Registration failed: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    // User login endpoint
    case '/api/login':
        if ($requestMethod == 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);

            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($email) || empty($password)) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
                exit();
            }

            try {
                $pdo = getDbConnection();
                
                // Find user by email
                $stmt = $pdo->prepare("SELECT * FROM `User` WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();

                // Verify user exists and password is correct
                if ($user && password_verify($password, $user['password'])) {
                    // In a real app, generate and return a JWT here
                    echo json_encode(['status' => 'success', 'message' => 'Login successful!', 'userId' => $user['id']]);
                } else {
                    http_response_code(401); // Unauthorized
                    echo json_encode(['status' => 'error', 'message' => 'Invalid email or password.']);
                }

            } catch (PDOException $e) {
                http_response_code(500); // Internal Server Error
                echo json_encode(['status' => 'error', 'message' => 'Login failed: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    // File upload endpoint
    case '/api/upload':
        if ($requestMethod == 'POST') {
            // Unlike JSON, file uploads use `$_FILES` and `$_POST`
            
            if (isset($_FILES['photo'])) {
                $file = $_FILES['photo'];

                // Check for upload errors
                if ($file['error'] !== UPLOAD_ERR_OK) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'File upload error. Code: ' . $file['error']]);
                    exit();
                }

                // Basic security checks
                $allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!in_array($file['type'], $allowedMimes)) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
                    exit();
                }
                
                // Max file size (e.g., 5MB)
                if ($file['size'] > 5 * 1024 * 1024) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'File is too large. Maximum size is 5MB.']);
                    exit();
                }

                // Generate a unique filename to prevent overwriting
                $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $uniqueFilename = uniqid('img_', true) . '.' . $fileExtension;
                
                $uploadDir = __DIR__ . '/uploads/';
                $uploadPath = $uploadDir . $uniqueFilename;

                // Move the file from temp location to the final destination
                if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                    // We return the relative path that the web server can serve
                    $publicUrl = '/backend/uploads/' . $uniqueFilename;
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
            http_response_code(405); // Method Not Allowed
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    default:
        http_response_code(404); // Not Found
        echo json_encode(['error' => 'Endpoint Not Found']);
        break;
}

?>
