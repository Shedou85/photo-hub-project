<?php

/**
 * Username helpers for public photographer profiles.
 *
 * Functions:
 *   slugify($name)                              — generate username from display name
 *   isUsernameValid($username)                  — validate format (regex)
 *   isUsernameReserved($username)               — check against reserved words list
 *   isUsernameAvailable($pdo, $username, $excludeUserId) — DB uniqueness check
 */

// ---------------------------------------------------------------------------
// Reserved words — these must never become usernames because they conflict
// with existing frontend routes, backend API paths, or platform subdomains.
// ---------------------------------------------------------------------------
const RESERVED_USERNAMES = [
    'admin', 'api', 'login', 'logout', 'register', 'share', 'deliver',
    'profile', 'collections', 'payments', 'faq', 'privacy', 'terms',
    'www', 'mail', 'u', 'about', 'contact', 'help', 'support',
    'blog', 'app', 'dashboard', 'settings', 'account', 'home',
    '404', '500', 'error', 'static', 'assets', 'cdn', 'media',
    'verify-email', 'forgot-password', 'reset-password',
];

// ---------------------------------------------------------------------------
// slugify($name) — convert display name to a valid username candidate
//
// Examples:
//   "Marius K."        → "marius-k"
//   "Žilvinas Ąžuolas" → "zilvinas-azuolas"
//   "Anna  Marie"      → "anna-marie"
// ---------------------------------------------------------------------------
function slugify(string $name): string {
    // Transliterate Lithuanian/accented characters
    $translit = [
        'ą' => 'a', 'č' => 'c', 'ę' => 'e', 'ė' => 'e', 'į' => 'i',
        'š' => 's', 'ų' => 'u', 'ū' => 'u', 'ž' => 'z',
        'Ą' => 'a', 'Č' => 'c', 'Ę' => 'e', 'Ė' => 'e', 'Į' => 'i',
        'Š' => 's', 'Ų' => 'u', 'Ū' => 'u', 'Ž' => 'z',
        // Common accented Latin
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ý' => 'y', 'ÿ' => 'y',
        'ñ' => 'n', 'ç' => 'c',
    ];

    $slug = strtr($name, $translit);

    // Lowercase
    $slug = mb_strtolower($slug, 'UTF-8');

    // Replace anything that is not a-z, 0-9 with a hyphen
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

    // Trim leading/trailing hyphens
    $slug = trim($slug, '-');

    // Collapse multiple hyphens
    $slug = preg_replace('/-{2,}/', '-', $slug);

    // Enforce max length (leave room for uniqueness suffix)
    $slug = substr($slug, 0, 45);

    // Trim again in case substr cut in the middle of a hyphen sequence
    $slug = trim($slug, '-');

    return $slug ?: 'photographer';
}

// ---------------------------------------------------------------------------
// isUsernameValid($username) — validate format only (no DB call)
//
// Rules:
//   - 3–50 characters
//   - Only a-z, 0-9, hyphen
//   - Must start and end with a-z or 0-9 (no leading/trailing hyphens)
//   - No consecutive hyphens
// ---------------------------------------------------------------------------
function isUsernameValid(string $username): bool {
    return (bool) preg_match(
        '/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,48}[a-z0-9]$/',
        $username
    );
}

// ---------------------------------------------------------------------------
// isUsernameReserved($username) — check against reserved words list
// ---------------------------------------------------------------------------
function isUsernameReserved(string $username): bool {
    return in_array(strtolower($username), RESERVED_USERNAMES, true);
}

// ---------------------------------------------------------------------------
// isUsernameAvailable($pdo, $username, $excludeUserId)
//
// Returns true if username is not taken.
// Pass $excludeUserId when checking for the currently logged-in user
// so they can "save" their own existing username without a false conflict.
// ---------------------------------------------------------------------------
function isUsernameAvailable(PDO $pdo, string $username, ?string $excludeUserId = null): bool {
    if ($excludeUserId !== null) {
        $stmt = $pdo->prepare(
            'SELECT id FROM `User` WHERE username = :username AND id != :userId LIMIT 1'
        );
        $stmt->execute([':username' => $username, ':userId' => $excludeUserId]);
    } else {
        $stmt = $pdo->prepare(
            'SELECT id FROM `User` WHERE username = :username LIMIT 1'
        );
        $stmt->execute([':username' => $username]);
    }

    return $stmt->fetch() === false;
}

// ---------------------------------------------------------------------------
// generateUniqueUsername($pdo, $name, $excludeUserId)
//
// Generates a slug from $name, then appends -2, -3, … until unique.
// Used when a photographer enables their public profile for the first time.
// ---------------------------------------------------------------------------
function generateUniqueUsername(PDO $pdo, string $name, ?string $excludeUserId = null): ?string {
    $base = slugify($name);

    // Ensure base is valid length (min 3 chars after slugify)
    if (strlen($base) < 3) {
        $base = $base . '-photo';
    }

    $candidate = $base;

    // Try plain slug first, then base-2, base-3 … base-99
    for ($i = 2; $i <= 99; $i++) {
        if (!isUsernameReserved($candidate) && isUsernameAvailable($pdo, $candidate, $excludeUserId)) {
            return $candidate;
        }
        $candidate = substr($base, 0, 44) . '-' . $i;
    }

    // Extremely unlikely — 99 variants all taken
    return null;
}
