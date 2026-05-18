<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/session.php';
require_once __DIR__ . '/../helpers/username.php';

header('Content-Type: application/json');

if (!startSessionWithTimeout() || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data) || empty($data)) {
    http_response_code(400);
    echo json_encode(["error" => "No data provided"]);
    exit;
}

$setParts = [];
$params = [];

try {
    $pdo = getDbConnection();

    if (array_key_exists('name', $data)) {
        $name = $data['name'];
        if ($name !== null && mb_strlen($name) > 100) {
            http_response_code(400);
            echo json_encode(["error" => "Name must be 100 characters or less"]);
            exit;
        }
        $setParts[] = "name = ?";
        $params[] = $name;
    }

    if (array_key_exists('bio', $data)) {
        $bio = $data['bio'];
        if ($bio !== null && mb_strlen($bio) > 1000) {
            http_response_code(400);
            echo json_encode(["error" => "Bio must be 1000 characters or less"]);
            exit;
        }
        $setParts[] = "bio = ?";
        $params[] = $bio;
    }

    if (array_key_exists('brandingColor', $data)) {
        $brandingColor = $data['brandingColor'];
        if ($brandingColor !== null) {
            if (!preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/', $brandingColor)) {
                http_response_code(400);
                echo json_encode(["error" => "Invalid color format. Use hex format (e.g. #ff5500)"]);
                exit;
            }
        }
        $setParts[] = "brandingColor = ?";
        $params[] = $brandingColor;
    }

    if (array_key_exists('brandingSettings', $data)) {
        $brandingSettings = $data['brandingSettings'];
        if ($brandingSettings !== null && !is_array($brandingSettings)) {
            http_response_code(400);
            echo json_encode(["error" => "brandingSettings must be an object"]);
            exit;
        }
        $setParts[] = "brandingSettings = ?";
        $params[] = $brandingSettings !== null ? json_encode($brandingSettings) : null;
    }

    if (array_key_exists('profileTagline', $data)) {
        $profileTagline = $data['profileTagline'];
        if ($profileTagline !== null && mb_strlen($profileTagline) > 160) {
            http_response_code(400);
            echo json_encode(["error" => "Profile tagline must be 160 characters or less"]);
            exit;
        }
        $setParts[] = "profileTagline = ?";
        $params[] = $profileTagline;
    }

    if (array_key_exists('specialties', $data)) {
        $specialties = $data['specialties'];
        if ($specialties !== null && mb_strlen($specialties) > 255) {
            http_response_code(400);
            echo json_encode(["error" => "Specialties must be 255 characters or less"]);
            exit;
        }
        $setParts[] = "specialties = ?";
        $params[] = $specialties;
    }

    if (array_key_exists('location', $data)) {
        $location = $data['location'];
        if ($location !== null && mb_strlen($location) > 120) {
            http_response_code(400);
            echo json_encode(["error" => "Location must be 120 characters or less"]);
            exit;
        }
        $setParts[] = "location = ?";
        $params[] = $location;
    }

    if (array_key_exists('instagramUrl', $data)) {
        $instagramUrl = $data['instagramUrl'];
        if ($instagramUrl !== null) {
            if (mb_strlen($instagramUrl) > 191) {
                http_response_code(400);
                echo json_encode(["error" => "Instagram URL must be 191 characters or less"]);
                exit;
            }
            if (!preg_match('#^https?://(www\.)?instagram\.com/#', $instagramUrl)) {
                http_response_code(400);
                echo json_encode(["error" => "Instagram URL must start with https://instagram.com/"]);
                exit;
            }
        }
        $setParts[] = "instagramUrl = ?";
        $params[] = $instagramUrl;
    }

    if (array_key_exists('isProfilePublic', $data)) {
        $isProfilePublic = (bool) $data['isProfilePublic'];

        if ($isProfilePublic) {
            // Fetch current user name + username to check/auto-generate
            $checkStmt = $pdo->prepare("SELECT name, username FROM `User` WHERE id = ? LIMIT 1");
            $checkStmt->execute([$_SESSION['user_id']]);
            $currentUser = $checkStmt->fetch(PDO::FETCH_ASSOC);

            // If no username yet — auto-generate one
            if (empty($currentUser['username'])) {
                if (empty($currentUser['name'])) {
                    http_response_code(400);
                    echo json_encode(["error" => "Please set your name before publishing your profile"]);
                    exit;
                }
                $generated = generateUniqueUsername($pdo, $currentUser['name'], $_SESSION['user_id']);
                if ($generated === null) {
                    http_response_code(500);
                    echo json_encode(["error" => "Could not generate a unique username. Please set one manually."]);
                    exit;
                }
                $setParts[] = "username = ?";
                $params[] = $generated;
            }
        }

        $setParts[] = "isProfilePublic = ?";
        $params[] = $isProfilePublic ? 1 : 0;
    }

    if (array_key_exists('username', $data)) {
        $newUsername = trim((string) $data['username']);

        if (empty($newUsername)) {
            http_response_code(400);
            echo json_encode(["error" => "Username cannot be empty"]);
            exit;
        }

        if (!isUsernameValid($newUsername)) {
            http_response_code(400);
            echo json_encode(["error" => "Username must be 3–50 characters, only lowercase letters, numbers and hyphens, no leading/trailing hyphens"]);
            exit;
        }

        if (isUsernameReserved($newUsername)) {
            http_response_code(400);
            echo json_encode(["error" => "This username is not available"]);
            exit;
        }

        if (!isUsernameAvailable($pdo, $newUsername, $_SESSION['user_id'])) {
            http_response_code(409);
            echo json_encode(["error" => "This username is already taken"]);
            exit;
        }

        $setParts[] = "username = ?";
        $params[] = $newUsername;
    }

    if (array_key_exists('newPassword', $data)) {
        $newPassword = $data['newPassword'];

        $hashStmt = $pdo->prepare("SELECT password FROM `User` WHERE id = ? LIMIT 1");
        $hashStmt->execute([$_SESSION['user_id']]);
        $row = $hashStmt->fetch(PDO::FETCH_ASSOC);
        $currentHash = $row['password'] ?? null;

        if ($currentHash !== null) {
            $currentPassword = $data['currentPassword'] ?? '';
            if (!password_verify((string) $currentPassword, $currentHash)) {
                http_response_code(400);
                echo json_encode(["error" => "Current password is incorrect"]);
                exit;
            }
        }

        if (mb_strlen((string) $newPassword) < 8 || mb_strlen((string) $newPassword) > 72) {
            http_response_code(400);
            echo json_encode(["error" => "Password must be between 8 and 72 characters"]);
            exit;
        }

        $setParts[] = "password = ?";
        $params[] = password_hash((string) $newPassword, PASSWORD_DEFAULT);
    }

    if (empty($setParts)) {
        http_response_code(400);
        echo json_encode(["error" => "No valid fields to update"]);
        exit;
    }

    $setParts[] = "updatedAt = NOW(3)";
    $params[] = $_SESSION['user_id'];
    $stmt = $pdo->prepare("
        UPDATE `User`
        SET " . implode(', ', $setParts) . "
        WHERE id = ?
    ");
    $stmt->execute($params);

    $stmt = $pdo->prepare("
        SELECT id, name, email, bio, createdAt, plan, role, subscriptionStatus,
               trialEndsAt, planDowngradedAt, collectionsCreatedCount, emailVerified,
               brandingLogoUrl, brandingColor, brandingSettings,
               username, isProfilePublic, profileTagline, specialties, location,
               websiteUrl, instagramUrl, profileImageUrl,
               (password IS NOT NULL) AS hasPassword
        FROM `User`
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $user['hasPassword'] = (bool) $user['hasPassword'];
        $user['isProfilePublic'] = (bool) $user['isProfilePublic'];
        if (!empty($user['brandingSettings'])) {
            $decoded = json_decode($user['brandingSettings'], true);
            $user['brandingSettings'] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
        } else {
            $user['brandingSettings'] = null;
        }
    }

    // Format datetime fields as ISO 8601 with timezone for correct frontend parsing
    foreach (['createdAt', 'trialEndsAt', 'planDowngradedAt'] as $dtField) {
        if (!empty($user[$dtField])) {
            $user[$dtField] = (new DateTime($user[$dtField]))->format('c');
        }
    }

    echo json_encode([
        "status" => "OK",
        "user" => $user
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error"]);
}
