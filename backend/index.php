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
    'samesite' => 'Lax'
]);

// Generate cryptographically secure unique IDs (CUID-compatible length)
function generateCuid() {
    $timestamp = dechex(intval(microtime(true) * 1000));
    $random = bin2hex(random_bytes(12));
    return 'cl' . substr($timestamp . $random, 0, 22);
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

// CSRF protection for state-changing requests
require_once __DIR__ . '/helpers/csrf.php';
if (in_array($requestMethod, ['POST', 'PATCH', 'PUT', 'DELETE'])) {
    $csrfExemptPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/resend-verification', '/auth/google'];
    $isShareRoute = strpos($requestUri, '/share/') === 0;
    $isDeliverRoute = strpos($requestUri, '/deliver/') === 0;

    if (!in_array($requestUri, $csrfExemptPaths) && !$isShareRoute && !$isDeliverRoute) {
        session_start();
        requireCsrfToken();
    }
}

// Basic router
switch ($requestUri) {
    case '/csrf-token':
        if ($requestMethod == 'GET') {
            session_start();
            header('Content-Type: application/json');
            echo json_encode(['csrfToken' => generateCsrfToken()]);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/':
    case '':
        echo json_encode(['message' => 'Welcome to the Photo-Hub API']);
        break;
        
    case '/register':
        if ($requestMethod == 'POST') {
            require_once __DIR__ . '/helpers/rate-limiter.php';
            $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            if (!checkRateLimit('register:' . $clientIp, 5, 3600)) {
                http_response_code(429);
                echo json_encode(['status' => 'error', 'message' => 'Too many registration attempts. Please try again later.']);
                exit();
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($email) || empty($password)) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
                exit();
            }

            if (strlen($password) < 8 || strlen($password) > 72) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Password must be between 8 and 72 characters.']);
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

                $rawToken    = bin2hex(random_bytes(32));
                $hashedVerifyToken = hash('sha256', $rawToken);

                $stmt = $pdo->prepare("INSERT INTO `User` (id, email, emailVerified, emailVerificationToken, emailVerificationTokenExpires, password, createdAt, updatedAt, trialEndsAt) VALUES (?, ?, false, ?, ?, ?, ?, ?, ?)");

                $currentDateTime = date('Y-m-d H:i:s.v');
                $trialEndsAt = date('Y-m-d H:i:s.v', strtotime('+30 days'));
                $tokenExpiresAt = date('Y-m-d H:i:s.v', strtotime('+24 hours'));

                $stmt->execute([$userId, $email, $hashedVerifyToken, $tokenExpiresAt, $hashedPassword, $currentDateTime, $currentDateTime, $trialEndsAt]);

                // Send verification email
                require_once __DIR__ . '/helpers/mailer.php';
                $verifyUrl = 'https://pixelforge.pro/verify-email?token=' . urlencode($rawToken);
                $emailSent = false;
                try {
                    $emailSent = sendVerificationEmail($email, $verifyUrl);
                } catch (Throwable $mailErr) {
                    error_log('Verification email failed: ' . $mailErr->getMessage());
                }

                echo json_encode([
                    'status' => 'success',
                    'message' => 'User registered successfully!',
                    'requiresVerification' => true,
                    'emailSent' => $emailSent
                ]);

            } catch (PDOException $e) {
                http_response_code(500);
                error_log('Registration error: ' . $e->getMessage());
                echo json_encode(['status' => 'error', 'message' => 'Registration failed. Please try again.']);
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

    case '/verify-email':
        if ($requestMethod == 'GET') {
            require_once __DIR__ . '/auth/verify-email.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/resend-verification':
        if ($requestMethod == 'POST') {
            require_once __DIR__ . '/auth/resend-verification.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/forgot-password':
        if ($requestMethod == 'POST') {
            require_once __DIR__ . '/auth/forgot-password.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/reset-password':
        if ($requestMethod == 'POST') {
            require_once __DIR__ . '/auth/reset-password.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case '/logout':
        if ($requestMethod == 'POST') {
            require_once __DIR__ . '/auth/logout.php';
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

    case '/auth/google':
        if ($requestMethod == 'POST') {
            require __DIR__ . '/auth/google.php';
        } else {
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

    case '/promotional':
        if ($requestMethod == 'GET') {
            require_once __DIR__ . '/promotional.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    default:
        // Handle /share/ routes (public endpoints)
        if (strpos($requestUri, '/share/') === 0) {
            // Check if this is a selections sub-route: /share/{shareId}/selections[/{photoId}]
            if (preg_match('#^/share/[^/]+/selections#', $requestUri)) {
                if (in_array($requestMethod, ['GET', 'POST', 'DELETE'])) {
                    require_once __DIR__ . '/collections/share-selections.php';
                } else {
                    http_response_code(405);
                    echo json_encode(['error' => 'Method Not Allowed']);
                }
                break;
            }
            // Base share route: /share/{shareId}
            if (in_array($requestMethod, ['GET', 'PATCH'])) {
                require_once __DIR__ . '/collections/share.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method Not Allowed']);
            }
            break;
        }

        // Handle /deliver/ routes (public endpoints — delivery token auth)
        if (strpos($requestUri, '/deliver/') === 0) {
            $uriParts = explode('/', ltrim($requestUri, '/'));
            // uriParts: ['deliver', deliveryToken, ?subRoute]
            $subRoute = $uriParts[2] ?? '';

            // Handle base delivery gallery endpoint: /deliver/{token}
            if (empty($subRoute)) {
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/collections/deliver-view.php';
                } else {
                    http_response_code(405);
                    echo json_encode(['error' => 'Method Not Allowed']);
                }
                break;
            }

            switch ($subRoute) {
                case 'zip':
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/collections/zip-download.php';
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method Not Allowed']);
                    }
                    break;
                case 'photo':
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/collections/photo-download.php';
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method Not Allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Endpoint Not Found']);
            }
            break;
        }

        // Handle /admin/ routes
        if (strpos($requestUri, '/admin/') === 0 || $requestUri === '/admin') {
            $uriParts = explode('/', ltrim($requestUri, '/'));
            $resource = $uriParts[1] ?? '';
            switch ($resource) {
                case 'stats':
                    require_once __DIR__ . '/admin/stats.php';
                    break;
                case 'users':
                    require_once __DIR__ . '/admin/users.php';
                    break;
                case 'collections':
                    require_once __DIR__ . '/admin/collections.php';
                    break;
                case 'audit-log':
                    require_once __DIR__ . '/admin/audit-log.php';
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found']);
            }
            break;
        }

        // Handle /collections/{id} and sub-routes
        if (strpos($requestUri, '/collections/') === 0) {
            $uriParts = explode('/', ltrim($requestUri, '/'));
            // uriParts: ['collections', collectionId, ?subRoute, ?subId]
            $subRoute = $uriParts[2] ?? '';

            switch ($subRoute) {
                case '':
                    require_once __DIR__ . '/collections/id.php';
                    break;
                case 'photos':
                    require_once __DIR__ . '/collections/photos.php';
                    break;
                case 'cover':
                    require_once __DIR__ . '/collections/cover.php';
                    break;
                case 'selections':
                    require_once __DIR__ . '/collections/selections.php';
                    break;
                case 'edited':
                    require_once __DIR__ . '/collections/edited.php';
                    break;
                case 'delivery':
                    require_once __DIR__ . '/collections/delivery.php';
                    break;
                case 'promotional':
                    require_once __DIR__ . '/collections/promotional.php';
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Endpoint Not Found']);
            }
            break;
        }

        http_response_code(404);
        echo json_encode(['error' => 'Endpoint Not Found']);
        break;
}

?>