<?php
// backend/helpers/audit-logger.php — Immutable audit log for admin actions

/**
 * Log an admin action to the AuditLog table.
 *
 * @param PDO    $pdo              Database connection
 * @param string $adminUserId      ID of the admin performing the action
 * @param string $action           Action type (e.g. USER_ROLE_CHANGED)
 * @param string $targetEntityType Target type (e.g. USER)
 * @param string $targetEntityId   Target entity ID
 * @param array  $changes          Associative array with 'before' and 'after' values
 * @param string|null $targetEmail Optional target email for user actions
 * @return bool  True if logged successfully
 */
function logAuditAction(
    PDO $pdo,
    string $adminUserId,
    string $action,
    string $targetEntityType,
    string $targetEntityId,
    array $changes,
    ?string $targetEmail = null
): bool {
    try {
        $id = 'cl' . substr(dechex(intval(microtime(true) * 1000)) . bin2hex(random_bytes(12)), 0, 22);

        $stmt = $pdo->prepare("
            INSERT INTO `AuditLog` (id, adminUserId, action, targetEntityType, targetEntityId, targetEmail, changes, ipAddress, userAgent, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $id,
            $adminUserId,
            $action,
            $targetEntityType,
            $targetEntityId,
            $targetEmail,
            json_encode($changes, JSON_UNESCAPED_UNICODE),
            $_SERVER['REMOTE_ADDR'] ?? null,
            isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 500) : null,
            date('Y-m-d H:i:s.v'),
        ]);

        return true;
    } catch (Throwable $e) {
        error_log('Audit log error: ' . $e->getMessage());
        return false;
    }
}
