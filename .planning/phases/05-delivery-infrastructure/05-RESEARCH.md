# Phase 5: Delivery Infrastructure - Research

**Researched:** 2026-02-13
**Domain:** Token-based delivery system, download tracking, database schema design
**Confidence:** HIGH

## Summary

Phase 5 establishes the foundation for client photo delivery by introducing a separate delivery token system (distinct from selection tokens), download tracking infrastructure, and database schema for monitoring download events.

The delivery token architecture mirrors the existing `shareId` pattern but serves a different security purpose: selection tokens enable write access (photo selection), while delivery tokens provide read-only access to final deliverables. This separation implements least-privilege access control and prevents clients from modifying selections after photographer approval.

Download tracking requires careful design to avoid double-counting from browser resume requests (HTTP Range requests). The standard solution is session-based deduplication using a composite unique constraint on `(collectionId, downloadType, sessionId, downloadedAt)` with time-window bucketing (hour or day granularity).

**Primary recommendation:** Use PHP's `random_bytes(32)` for cryptographically secure delivery token generation, implement a `Download` table with composite unique constraint for deduplication, and leverage MySQL's existing CUID generation pattern for table IDs. Plan ahead for Phase 6's streaming ZIP requirements but implement only the database/token infrastructure in this phase.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PHP `random_bytes()` | PHP 8.2+ | Cryptographically secure token generation | Built-in, CSPRNG-backed, no dependencies |
| MySQL `utf8mb4` | 8.0+ | Download tracking table with composite keys | Already in use; supports composite UNIQUE constraints |
| PDO (PHP Data Objects) | Built-in | Database operations | Already in use throughout backend |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ZipStream-PHP | 3.2.1 | Streaming ZIP generation (Phase 6) | NOT used in Phase 5; research for Phase 6 planning |
| `bin2hex()` / `base64_encode()` | Built-in | Token encoding after `random_bytes()` | For URL-safe token strings |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `random_bytes()` | `uniqid()` or `mt_rand()` | NOT cryptographically secure; vulnerable to prediction attacks |
| Composite UNIQUE key | Application-level deduplication | Slower, race conditions possible, less reliable |
| Session-based tracking | IP-based tracking | GDPR non-compliant; VPN/proxy users incorrectly deduplicated |

**Installation:**

No new dependencies required for Phase 5. All functionality uses PHP built-ins and existing MySQL database.

## Architecture Patterns

### Recommended Project Structure

```
backend/
├── collections/
│   ├── delivery.php          # NEW: GET /collections/{id}/delivery (generate/fetch token)
│   └── id.php                 # EXISTING: Update to auto-create delivery token on DELIVERED status
└── db.php                     # EXISTING: No changes needed
```

### Pattern 1: Delivery Token Generation

**What:** Generate a cryptographically secure, URL-safe delivery token separate from `shareId`

**When to use:** Automatically when collection transitions to `DELIVERED` status, or manually via new API endpoint

**Example:**

```php
// Source: https://www.texelate.co.uk/blog/generate-a-secure-token-with-php
// Verified: PHP manual random_bytes() documentation

function generateDeliveryToken() {
    // 32 bytes = 256 bits of entropy (recommended minimum for production APIs)
    $randomBytes = random_bytes(32);
    // URL-safe encoding (no special chars)
    return bin2hex($randomBytes); // 64-character hex string
}

// Alternative: Base64 encoding for shorter tokens
function generateDeliveryTokenBase64() {
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    // Returns ~43-character URL-safe string
}
```

**Implementation notes:**
- Use `bin2hex()` for consistency with existing CUID generation pattern (lowercase alphanumeric)
- Token length: 64 characters (hex) or 43 characters (base64url)
- Store in new `Collection.deliveryToken` column (VARCHAR(191))
- Add unique constraint: `UNIQUE KEY Collection_deliveryToken_key (deliveryToken)`

### Pattern 2: Automatic Token Creation on Status Transition

**What:** Hook into collection status updates to auto-generate delivery token when reaching `DELIVERED`

**When to use:** In `backend/collections/id.php` PATCH handler, after validating status transition

**Example:**

```php
// In backend/collections/id.php, within PATCH handler

if (array_key_exists('status', $data) && $data['status'] === 'DELIVERED') {
    // Check if delivery token already exists
    $checkStmt = $pdo->prepare("SELECT deliveryToken FROM `Collection` WHERE id = ? LIMIT 1");
    $checkStmt->execute([$collectionId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (empty($existing['deliveryToken'])) {
        // Generate new token on first transition to DELIVERED
        $deliveryToken = bin2hex(random_bytes(32));

        // Add to update query
        $setParts[] = "`deliveryToken` = ?";
        $params[] = $deliveryToken;
    }
}
```

### Pattern 3: Download Tracking Table Schema

**What:** Database table to log download events with session-based deduplication

**When to use:** Required for Phase 5; consumed by Phases 6 and 7 for ZIP/individual downloads

**Schema:**

```sql
CREATE TABLE `Download` (
  `id` VARCHAR(191) NOT NULL,                          -- CUID primary key
  `collectionId` VARCHAR(191) NOT NULL,               -- FK to Collection
  `downloadType` ENUM('ZIP', 'INDIVIDUAL') NOT NULL,  -- Type of download
  `photoId` VARCHAR(191) NULL,                        -- FK to EditedPhoto (NULL for ZIP)
  `sessionId` VARCHAR(191) NOT NULL,                  -- PHP session_id() or generated token
  `downloadedAt` DATETIME(3) NOT NULL,                -- Timestamp (rounded to hour for bucketing)
  `userAgent` VARCHAR(500) NULL,                      -- Browser info (optional)
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Download_collectionId_idx` (`collectionId`),
  -- Composite unique constraint prevents duplicate downloads in same session
  UNIQUE KEY `Download_deduplication_key` (`collectionId`, `downloadType`, `sessionId`, `downloadedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign key constraints
ALTER TABLE `Download`
  ADD CONSTRAINT `Download_collectionId_fkey`
    FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Download_photoId_fkey`
    FOREIGN KEY (`photoId`) REFERENCES `EditedPhoto` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
```

**Key design decisions:**

1. **`sessionId` field:** Use PHP's `session_id()` value, NOT a browser fingerprint
   - GDPR compliant (sessions expire, not permanent tracking)
   - Reliable within session lifetime
   - No need for IP address storage

2. **`downloadedAt` bucketing:** Round to nearest hour for deduplication window
   ```php
   $bucketedTime = date('Y-m-d H:00:00', time());
   ```
   - Prevents double-counting from browser resume requests within same hour
   - Balances accuracy vs. deduplication window

3. **Composite UNIQUE key:** MySQL enforces uniqueness at database level
   - Prevents race conditions (multiple simultaneous requests)
   - Faster than application-level checks
   - Returns error on duplicate INSERT (catch and ignore in PHP)

### Pattern 4: Session-Based Deduplication Logic

**What:** Track downloads without double-counting browser resume requests

**When to use:** In download endpoints (Phases 6 and 7) before sending file data

**Example:**

```php
// Start session for tracking
session_start();
$sessionId = session_id();
$collectionId = /* from route */;
$downloadType = 'ZIP'; // or 'INDIVIDUAL'
$photoId = null; // or specific EditedPhoto ID

// Bucket timestamp to nearest hour
$bucketedTime = date('Y-m-d H:00:00', time());

try {
    $pdo = getDbConnection();

    // Attempt to insert download record
    $stmt = $pdo->prepare("
        INSERT INTO `Download` (id, collectionId, downloadType, photoId, sessionId, downloadedAt, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW(3))
    ");

    $downloadId = generateCuid();
    $stmt->execute([
        $downloadId,
        $collectionId,
        $downloadType,
        $photoId,
        $sessionId,
        $bucketedTime
    ]);

    // Success: new download tracked
    error_log("Download tracked: $downloadId");

} catch (PDOException $e) {
    // Check if error is duplicate key violation (MySQL error 1062)
    if ($e->getCode() == 23000) {
        // Expected: browser resume request, not a new download
        error_log("Duplicate download ignored (resume): $sessionId");
    } else {
        // Unexpected error: log but don't block download
        error_log("Download tracking error: " . $e->getMessage());
    }
}

// Continue with file download (send headers, stream data, etc.)
```

**HTTP Range request detection:**

Browser resume requests include `Range: bytes=X-Y` header. This does NOT require special handling in download tracking because session-based deduplication already handles it (same session + same hour = duplicate).

However, for Phase 6 ZIP streaming, you MUST support HTTP Range headers:

```php
// Check if this is a range request
$rangeHeader = $_SERVER['HTTP_RANGE'] ?? '';

if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
    // Resume request: send 206 Partial Content
    $start = (int)$matches[1];
    $end = $matches[2] !== '' ? (int)$matches[2] : $fileSize - 1;

    header('HTTP/1.1 206 Partial Content');
    header("Content-Range: bytes $start-$end/$fileSize");
    header("Content-Length: " . ($end - $start + 1));

    // Seek to start position and stream
    fseek($fileHandle, $start);
} else {
    // New request: send 200 OK
    header('HTTP/1.1 200 OK');
    header("Content-Length: $fileSize");
    header('Accept-Ranges: bytes'); // Advertise resume support
}
```

**Source:** [MDN HTTP Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests)

### Anti-Patterns to Avoid

- **Using IP addresses for deduplication:** GDPR non-compliant, unreliable (VPNs, NAT, mobile networks), requires consent
- **Pre-generating ZIPs on DELIVERED transition:** Wastes disk space, slow for large collections, breaks on photo additions; defer to Phase 6 streaming approach
- **Using `uniqid()` or `mt_rand()` for tokens:** Not cryptographically secure; predictable tokens enable unauthorized access
- **Storing delivery token in session:** Token must persist across sessions; store in database `Collection` table
- **Application-level duplicate detection:** Race conditions possible; use MySQL UNIQUE constraint for atomic enforcement
- **No time bucketing in deduplication:** Browser resume requests within seconds/minutes incorrectly counted as separate downloads

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP file generation (Phase 6) | Manual ZIP archive creation with temp files | [ZipStream-PHP](https://github.com/maennchen/ZipStream-PHP) 3.2.1 | Handles streaming, compression, Zip64 format, memory efficiency, HTTP headers automatically |
| Cryptographically secure randomness | Custom PRNG or `uniqid()` | PHP `random_bytes()` built-in | CSPRNG-backed, audited, no side-channel vulnerabilities |
| HTTP Range request parsing | Regex-based header parsing | Standard pattern with validation | Edge cases (multipart ranges, If-Range conditional), error handling (416 Range Not Satisfiable) |
| Browser fingerprinting | Custom fingerprint library | Session-based tracking with `session_id()` | GDPR compliant, no consent required for functional sessions, reliable within session lifetime |

**Key insight:** Security-critical code (token generation, deduplication) and complex file operations (ZIP streaming) have mature, well-tested solutions. Custom implementations introduce vulnerabilities and edge-case bugs. For Phase 5, leverage PHP built-ins; for Phase 6, adopt ZipStream-PHP.

## Common Pitfalls

### Pitfall 1: Token Collision Risk with Short Tokens

**What goes wrong:** Using short tokens (e.g., 16 bytes = 32 hex characters) increases collision probability in large databases

**Why it happens:** Birthday paradox: 50% collision chance at ~2^(n/2) tokens (for 128-bit tokens, collision likely after ~2^64 = 18 quintillion tokens, but shorter tokens have much lower thresholds)

**How to avoid:** Use 32 bytes (256 bits) minimum for production tokens; check for collisions on INSERT and retry if duplicate (rare)

**Warning signs:** Duplicate key errors on `deliveryToken` unique constraint during normal operation (not during testing)

### Pitfall 2: Missing `Accept-Ranges` Header Breaks Resume Support

**What goes wrong:** Browsers assume server doesn't support resume; small network interruption forces complete re-download

**Why it happens:** HTTP Range support requires explicit `Accept-Ranges: bytes` header in response; without it, browsers won't send `Range` headers

**How to avoid:** Always include `Accept-Ranges: bytes` in download responses, even for non-ZIP files

```php
header('Accept-Ranges: bytes');
```

**Warning signs:** Users report large downloads restarting from 0% after brief network interruption

### Pitfall 3: Hostinger Timeout/Memory Limits on ZIP Generation

**What goes wrong:** ZIP generation for 50+ large photos (10MB each) hits Hostinger's 90-second `max_execution_time` or memory limit, causing incomplete downloads or 500 errors

**Why it happens:** Hostinger shared hosting caps `max_execution_time` at 90 seconds and memory at plan-specific limits (Premium: 256MB, Business: 512MB); loading all photos into memory before sending ZIP exhausts resources

**How to avoid:** Use streaming ZIP generation (ZipStream-PHP) that sends ZIP data incrementally without loading entire archive into memory; never buffer full ZIP in memory or on disk

**Implementation for Phase 6:**

```php
// ZipStream-PHP example (Phase 6)
use ZipStream\ZipStream;

$zip = new ZipStream(
    outputName: 'collection-' . $collectionId . '.zip',
    sendHttpHeaders: true,
);

// Stream photos one at a time (memory efficient)
foreach ($editedPhotos as $photo) {
    $zip->addFileFromPath(
        fileName: $photo['filename'],
        path: __DIR__ . '/../uploads/' . $photo['storagePath']
    );
}

$zip->finish(); // Flushes remaining data, closes stream
```

**Warning signs:**
- 500 Internal Server Error on ZIP downloads with 30+ photos
- Browser shows stalled download or incomplete file (e.g., 450MB downloaded of 500MB ZIP)
- PHP error log: "Maximum execution time of 90 seconds exceeded" or "Allowed memory size exhausted"

**Source:** [Hostinger PHP Limits](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)

### Pitfall 4: Time Bucketing Too Granular or Too Coarse

**What goes wrong:**
- Too granular (per-second bucketing): Browser resume requests still create duplicate download records
- Too coarse (per-day bucketing): Legitimate separate downloads within same day incorrectly deduplicated

**Why it happens:** Deduplication window must balance preventing double-counting vs. tracking distinct download events

**How to avoid:** Use **hour-level bucketing** (`Y-m-d H:00:00`) as default; provides 1-hour deduplication window suitable for typical download session lengths

**Alternative strategies:**
- **Session expiry based:** Track download timestamp per session; deduplicate within session lifetime (~2 hours PHP default)
- **Hybrid approach:** Hour bucketing + session ID ensures even long downloads (>1 hour) don't create duplicates if session persists

**Warning signs:**
- Analytics show impossibly high download counts (2-10x actual downloads)
- Download tracking shows multiple entries seconds apart for same collection/session

### Pitfall 5: Forgetting UNIQUE Constraint on `deliveryToken`

**What goes wrong:** Two collections accidentally receive identical delivery tokens; client accessing one token sees wrong collection's photos

**Why it happens:** `random_bytes(32)` collision probability is astronomically low but NOT zero; database must enforce uniqueness

**How to avoid:** Add `UNIQUE KEY Collection_deliveryToken_key (deliveryToken)` to `Collection` table schema; catch duplicate key errors during token generation and retry

```php
// Token generation with collision retry
function generateUniqueDeliveryToken($pdo, $maxRetries = 3) {
    for ($i = 0; $i < $maxRetries; $i++) {
        $token = bin2hex(random_bytes(32));

        // Check uniqueness
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `Collection` WHERE deliveryToken = ?");
        $stmt->execute([$token]);

        if ($stmt->fetchColumn() == 0) {
            return $token; // Unique token found
        }

        // Collision detected (extremely rare), retry
        error_log("Delivery token collision detected, retrying ($i/$maxRetries)");
    }

    throw new Exception("Failed to generate unique delivery token after $maxRetries attempts");
}
```

**Warning signs:** Client reports seeing different photos than expected after accessing delivery link (security incident)

## Code Examples

Verified patterns from official sources and existing codebase:

### Generating Cryptographically Secure Tokens

```php
// Source: https://www.texelate.co.uk/blog/generate-a-secure-token-with-php
// PHP Manual: https://www.php.net/manual/en/function.random-bytes.php

/**
 * Generate a cryptographically secure delivery token
 *
 * @return string 64-character hex string (256 bits of entropy)
 */
function generateDeliveryToken() {
    return bin2hex(random_bytes(32));
}

// Usage in Collection creation/update
$deliveryToken = generateDeliveryToken();

// Store in database
$stmt = $pdo->prepare("UPDATE `Collection` SET deliveryToken = ?, updatedAt = NOW(3) WHERE id = ?");
$stmt->execute([$deliveryToken, $collectionId]);
```

### Adding `deliveryToken` Column to Existing `Collection` Table

```sql
-- Migration SQL (run once via phpMyAdmin or mysql CLI)

ALTER TABLE `Collection`
  ADD COLUMN `deliveryToken` VARCHAR(191) NULL AFTER `shareId`,
  ADD UNIQUE KEY `Collection_deliveryToken_key` (`deliveryToken`);
```

### Creating `Download` Tracking Table

```sql
-- Migration SQL (run once via phpMyAdmin or mysql CLI)

CREATE TABLE `Download` (
  `id` VARCHAR(191) NOT NULL,
  `collectionId` VARCHAR(191) NOT NULL,
  `downloadType` ENUM('ZIP', 'INDIVIDUAL') NOT NULL,
  `photoId` VARCHAR(191) NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `downloadedAt` DATETIME(3) NOT NULL,
  `userAgent` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Download_collectionId_idx` (`collectionId`),
  UNIQUE KEY `Download_deduplication_key` (`collectionId`, `downloadType`, `sessionId`, `downloadedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Download`
  ADD CONSTRAINT `Download_collectionId_fkey`
    FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Download_photoId_fkey`
    FOREIGN KEY (`photoId`) REFERENCES `EditedPhoto` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
```

### Download Tracking with Deduplication

```php
// Source: Research findings + existing backend/collections/* patterns

/**
 * Track a download event with session-based deduplication
 *
 * @param PDO $pdo Database connection
 * @param string $collectionId Collection ID
 * @param string $downloadType 'ZIP' or 'INDIVIDUAL'
 * @param string|null $photoId EditedPhoto ID (NULL for ZIP downloads)
 * @return bool True if new download tracked, false if duplicate
 */
function trackDownload($pdo, $collectionId, $downloadType, $photoId = null) {
    session_start();
    $sessionId = session_id();

    // Bucket timestamp to nearest hour for deduplication window
    $bucketedTime = date('Y-m-d H:00:00', time());

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `Download` (id, collectionId, downloadType, photoId, sessionId, downloadedAt, userAgent, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))
        ");

        $downloadId = generateCuid(); // Use existing function from backend/index.php
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        $stmt->execute([
            $downloadId,
            $collectionId,
            $downloadType,
            $photoId,
            $sessionId,
            $bucketedTime,
            $userAgent
        ]);

        return true; // New download tracked

    } catch (PDOException $e) {
        // Check for duplicate key violation (MySQL error code 23000)
        if ($e->getCode() == 23000) {
            // Expected: duplicate download (browser resume, refresh, etc.)
            return false;
        }

        // Unexpected error: log but don't fail download
        error_log("Download tracking error: " . $e->getMessage());
        return false;
    }
}

// Usage in download endpoint (Phase 6 / Phase 7)
$isNewDownload = trackDownload($pdo, $collectionId, 'ZIP', null);

if ($isNewDownload) {
    error_log("New ZIP download tracked for collection: $collectionId");
}

// Continue with file download regardless of tracking result
// ... send headers, stream file data ...
```

### Auto-Generate Delivery Token on Status Transition

```php
// Integration into existing backend/collections/id.php PATCH handler

// ... existing validation code ...

if (array_key_exists('status', $data)) {
    if (!in_array($data['status'], $validStatuses, true)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid status value."]);
        exit;
    }

    // NEW: Auto-generate delivery token when transitioning to DELIVERED
    if ($data['status'] === 'DELIVERED') {
        // Check if delivery token already exists
        $checkStmt = $pdo->prepare("SELECT deliveryToken FROM `Collection` WHERE id = ? LIMIT 1");
        $checkStmt->execute([$collectionId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (empty($existing['deliveryToken'])) {
            // Generate new token (first time reaching DELIVERED)
            $deliveryToken = bin2hex(random_bytes(32));

            $setParts[] = "`deliveryToken` = ?";
            $params[] = $deliveryToken;

            error_log("Generated delivery token for collection $collectionId: $deliveryToken");
        }
    }

    $setParts[] = "`status` = ?";
    $params[] = $data['status'];
}

// ... rest of existing update logic ...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single token for selection + delivery | Separate tokens (shareId vs deliveryToken) | v2.0 (2026) | Least-privilege access: selection token = write access, delivery token = read-only |
| Pre-generated ZIP files (processedZipPath) | On-demand streaming ZIP generation | v2.0 (2026) | No disk waste, works with 100+ photo collections, avoids Hostinger timeout/memory limits |
| IP-based download tracking | Session-based tracking with time bucketing | 2025+ | GDPR compliant, no IP storage, handles VPN/NAT correctly |
| `uniqid()` for token generation | `random_bytes()` with `bin2hex()` | PHP 7.0+ (2015) | Cryptographically secure, prevents token prediction attacks |
| Browser fingerprinting (FingerprintJS) | PHP session ID for deduplication | 2025+ | GDPR: fingerprinting requires consent, sessions don't (functional necessity) |

**Deprecated/outdated:**

- **`uniqid()` for security tokens:** Not cryptographically secure; use `random_bytes()` instead
- **`mt_rand()` for tokens:** Predictable PRNG; use `random_bytes()` instead
- **IP address tracking without consent:** GDPR violation; use session-based tracking
- **Buffering entire ZIP in memory:** Causes memory exhaustion on shared hosting; use streaming libraries
- **ZipStream Option classes (v2.x):** Removed in v3.x; use named arguments in constructor

## Open Questions

1. **Download tracking query patterns**
   - What we know: Download table exists with deduplication schema
   - What's unclear: Specific queries for photographer analytics (Phase 9 scope: "has collection been downloaded?", Phase 7: DOWNLOADED status transition logic)
   - Recommendation: Design queries during Phase 7/9 planning; Phase 5 focuses on table schema only

2. **Delivery token expiration**
   - What we know: Requirements don't specify token expiration for v2.0
   - What's unclear: Should delivery tokens expire after X days? Or persist indefinitely?
   - Recommendation: Implement without expiration for v2.0 (simplest); add `expiresAt` column in v3.0 if clients request expiring links (ADVDL-02 requirement deferred to v3.0+)

3. **Multiple delivery tokens per collection**
   - What we know: v2.0 requires one delivery token per collection
   - What's unclear: Should photographer be able to regenerate/invalidate delivery tokens (e.g., after sending wrong link)?
   - Recommendation: Single token per collection for v2.0; add "Regenerate Delivery Link" button in v3.0 if requested (updates `deliveryToken` column, invalidates old token)

4. **Download tracking for resume requests**
   - What we know: Session + time bucketing prevents double-counting
   - What's unclear: If download spans multiple sessions (pause overnight, resume next day), should it count as two downloads?
   - Recommendation: YES, count as separate downloads (different sessions = different client "visits"); aligns with web analytics conventions

## Sources

### Primary (HIGH confidence)

- [ZipStream-PHP GitHub](https://github.com/maennchen/ZipStream-PHP) - Installation, API, streaming architecture verified via official README
- [MDN HTTP Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) - HTTP Range headers, status codes, conditional requests
- [PHP `random_bytes()` Manual](https://www.php.net/manual/en/function.random-bytes.php) - CSPRNG documentation
- [Texelate: Secure Token Generation](https://www.texelate.co.uk/blog/generate-a-secure-token-with-php) - `random_bytes()` usage patterns
- [Hostinger PHP Limits](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/) - 90s max_execution_time, memory limits per plan

### Secondary (MEDIUM confidence)

- [Auth0 Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices) - Token storage, lifecycle, security (verified with multiple sources)
- [Contentstack Delivery Tokens](https://www.contentstack.com/docs/developers/create-tokens/about-delivery-tokens) - Environment-scoped tokens, security isolation patterns
- [MySQL Composite Keys](https://www.oreilly.com/library/view/mysql-cookbook-2nd/059652708X/ch14s02.html) - Preventing duplicates with UNIQUE constraints
- [PixelsTech: HTTP Range Header in PHP](https://www.pixelstech.net/article/1357732373-Output-a-file-with-HTTP-range-header-in-PHP) - Range request implementation patterns

### Tertiary (LOW confidence - flagged for validation)

- [Browser Fingerprinting GDPR](https://cheq.ai/blog/what-is-browser-fingerprinting/) - GDPR requirements for fingerprinting (requires consent); used to inform decision AGAINST fingerprinting in favor of sessions
- [PHP Download Tracking](https://dave.autonoma.ca/blog/2023/11/12/php-download-hit-counter/) - General download tracking patterns; verified approach via multiple sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses PHP built-ins and existing MySQL; no new dependencies
- Architecture: HIGH - Token generation pattern verified in PHP manual; download tracking schema follows established MySQL practices
- Pitfalls: MEDIUM-HIGH - Hostinger limits verified via official docs; HTTP Range behavior verified via MDN; time bucketing approach inferred from download tracking best practices

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days; stable domain with mature tools)

**Phase 5 Scope Boundaries:**
- IN SCOPE: Database schema, token generation, download tracking deduplication logic
- OUT OF SCOPE: ZIP streaming implementation (Phase 6), individual download implementation (Phase 7), frontend delivery page (Phase 8), photographer dashboard UI (Phase 9)
- RESEARCH ONLY: ZipStream-PHP (implementation deferred to Phase 6 planning)
