<?php
// backend/helpers/rate-limiter.php
// Simple file-based rate limiter for brute-force protection.
// Limits by IP address + endpoint key.

function checkRateLimit(string $key, int $maxAttempts = 5, int $windowSeconds = 900): bool {
    $dir = sys_get_temp_dir() . '/photohub_ratelimit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    $file = $dir . '/' . md5($key) . '.json';
    $now  = time();

    $data = [];
    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }
    }

    // Remove expired entries
    $data = array_filter($data, fn($ts) => $ts > ($now - $windowSeconds));

    if (count($data) >= $maxAttempts) {
        return false; // Rate limited
    }

    // Record this attempt
    $data[] = $now;
    @file_put_contents($file, json_encode(array_values($data)), LOCK_EX);

    return true; // Allowed
}
