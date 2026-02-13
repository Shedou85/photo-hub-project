# Pitfalls Research

**Domain:** Adding delivery links, ZIP downloads, and download tracking to existing photo management system
**Researched:** 2026-02-13 (Updated for v2.0 delivery features)
**Confidence:** HIGH

**Context:** This research focuses on pitfalls when **adding delivery and download features to an existing v1.0 selection workflow**. See original v1.0 pitfalls research (2026-02-11) for foundational security issues. This update addresses integration challenges when extending the system with separate delivery tokens, server-side ZIP generation, individual photo downloads, DOWNLOADED status tracking, and UI polish.

---

## Critical Pitfalls (v2.0 Delivery Features)

### Pitfall 1: Token Confusion Between Sharing and Delivery

**What goes wrong:**
Reusing the existing `shareId` token for delivery downloads creates security risks. Clients who receive delivery links can still modify selections or change collection status. If delivery tokens leak, anyone can download the photos AND make changes to the collection. The selection workflow becomes insecure after delivery.

**Why it happens:**
The existing `shareId` system worked fine for v1.0 selection workflow. Developers assume extending the same token for delivery is simpler than creating separate tokens. "It's already there" feels efficient. No one wants to add another column.

**How to avoid:**
- Create a **separate** `deliveryToken` column in Collection table:
  ```sql
  ALTER TABLE `Collection` ADD COLUMN `deliveryToken` VARCHAR(191) NULL UNIQUE;
  ```
- Generate deliveryToken **only** when status transitions to DELIVERED (not on collection creation)
- Use cryptographically random generation: `bin2hex(random_bytes(32))` (64 hex chars minimum)
- Delivery endpoints (`/delivery/{deliveryToken}`) must be READ-ONLY — no selection changes, no status updates
- Sharing endpoints (`/share/{shareId}`) remain read-write for selection during SELECTING/REVIEWING
- Validate token type in endpoint logic: sharing routes REJECT deliveryToken, delivery routes REJECT shareId
- Delivery token should have separate expiration from share token

**Warning signs:**
- Delivery routes use the same handler as share routes
- No separate permission checks for download vs. selection
- Token generation happens on collection creation instead of status transition
- Same token appears in both client gallery URL and delivery email
- Code like `if ($shareId === $deliveryToken)` exists anywhere

**Phase to address:**
Phase 1: Separate Delivery Token (early architecture decision prevents cascading security issues)

**Sources:**
- [Token Best Practices (Auth0)](https://auth0.com/docs/secure/tokens/token-best-practices) — Separate tokens for different scopes
- [Key Approaches to Token Sharing (Curity)](https://curity.io/resources/learn/token-sharing/) — Token exchange vs embedded patterns

---

### Pitfall 2: ZIP Generation Exceeding Hostinger Limits

**What goes wrong:**
Server-side ZIP creation for large collections (50+ high-res photos) hits Hostinger's `max_execution_time` limit (180 seconds maximum) or `memory_limit`, causing timeouts. Half-generated ZIP files corrupt downloads. Users receive "Download failed" with no explanation. Photographer reputation suffers.

**Why it happens:**
Developers test with 5-10 small photos locally. Native `ZipArchive` loads entire archive into memory on shared hosting. No one tests with 100 edited photos (10MB each = 1GB total) until production. Hostinger's limits aren't discovered until client complaints.

**How to avoid:**
- **Use ZipStream-PHP library** instead of native ZipArchive:
  ```bash
  composer require maennchen/zipstream-php
  ```
- ZipStream streams directly to client with NO memory buffering — processes one file at a time
- Implement chunked streaming: `set_time_limit(0)` for download scripts (allowed for delivery endpoints, not API)
- Add collection size validation BEFORE offering ZIP download:
  ```php
  $totalSize = $pdo->prepare("SELECT SUM(fileSize) FROM EditedPhoto WHERE collectionId = ?")->execute([$collectionId])->fetchColumn();
  if ($totalSize > 2_000_000_000) { // 2GB limit
      // Offer async generation or reject
  }
  ```
- Display estimated download size and time to users: "Download size: 1.2 GB - Estimated time: 3 min on WiFi"
- For collections exceeding threshold (e.g., 2GB), generate ZIP asynchronously via background process and email download link when ready
- Test with realistic photo sizes: 10MB per edited photo minimum, 50+ files

**Warning signs:**
- Using `ZipArchive::open()` and `ZipArchive::close()` pattern (buffers in memory)
- No size checks before ZIP generation
- Timeout errors in production logs: "Maximum execution time of 180 seconds exceeded"
- Users report "ZIP file is corrupted" or "Download interrupted at 90%"
- No background job system for large archives
- Testing only with small sample datasets

**Phase to address:**
Phase 2: Server-Side ZIP Generation (core implementation must handle constraints from day one)

**Sources:**
- [ZipStream-PHP Memory Issues Discussion](https://github.com/maennchen/ZipStream-PHP/discussions/185) — Memory exhaustion with 300+ files
- [PHP ZipArchive vs ZipStream Performance](https://github.com/maennchen/ZipStream-PHP/issues/40) — Streaming avoids memory limits
- [Hostinger PHP Memory Limits](https://www.hostinger.com/support/1583711-what-is-php-memory-limit-at-hostinger/) — Fixed per-plan memory limits
- [Hostinger max_execution_time](https://www.hostinger.com/tutorials/how-to-fix-maximum-execution-time-exceeded-error-wordpress) — 180s maximum via .htaccess

---

### Pitfall 3: Download Tracking Double-Counting

**What goes wrong:**
Every browser preflight, partial download, or resume request increments download counter. One client downloading a ZIP appears as 5-10 downloads. Analytics become meaningless. Photographers can't trust download reports. If billing is ever based on download counts, users are overcharged.

**Why it happens:**
Naive implementation: log every request to `/download/{token}` endpoint. HTTP range requests (206 Partial Content) for resume trigger multiple hits. Browser preflight OPTIONS requests count as downloads. No deduplication logic exists.

**How to avoid:**
- Track downloads at **session + collection + date** granularity, not per-request
- Create DownloadLog table with unique constraint:
  ```sql
  CREATE TABLE `DownloadLog` (
    `id` VARCHAR(191) PRIMARY KEY,
    `collectionId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `downloadedAt` DATE NOT NULL,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `unique_download` (`collectionId`, `sessionId`, `downloadedAt`),
    FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE
  );
  ```
- Use database transaction with `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE` to prevent race conditions:
  ```php
  $pdo->beginTransaction();
  $stmt = $pdo->prepare("INSERT IGNORE INTO DownloadLog (id, collectionId, sessionId, downloadedAt) VALUES (?, ?, ?, CURDATE())");
  $stmt->execute([generateCuid(), $collectionId, session_id(), date('Y-m-d')]);
  $pdo->commit();
  ```
- Exclude OPTIONS, HEAD requests from download counting
- For range requests: only count the **first** request (HTTP 200 or 206 with `Range: bytes=0-`), not subsequent chunks
- Generate download session token on first request, reuse for subsequent chunks

**Warning signs:**
- Download count = 10x actual users in analytics
- Every partial download increments counter independently
- No uniqueness constraint in DownloadLog table
- Logging happens before file streaming starts (failures don't decrement, inflating counts)
- No distinction between preview thumbnails and full ZIP downloads
- Code logs downloads in simple counter increment without session tracking

**Phase to address:**
Phase 3: Download Tracking (database schema design must prevent double-counting from start)

**Sources:**
- [GA4 Download Tracking Duplicate Events](https://www.analyticsmania.com/post/duplicate-events-in-google-analytics-4-and-how-to-fix-them/) — Double-counting from Enhanced Measurement + GTM
- [How to Track File Downloads in GA4](https://www.analyticsmania.com/post/track-file-downloads-with-google-analytics-4/) — Proper deduplication patterns

---

### Pitfall 4: ZIP Path Traversal Vulnerability (Zip Slip)

**What goes wrong:**
When generating ZIP files, malicious photo filenames like `../../../etc/passwd` allow attackers to write files outside intended directory during extraction on client machines. Or worse: when processing uploaded photos, path traversal in filenames lets users overwrite server files during ZIP creation.

**Why it happens:**
Direct use of user-supplied filenames in ZIP entries without sanitization. Code assumes `filename` column contains safe values, but v1.0 upload endpoint may not have validated paths thoroughly. Developer trusts database content without verification.

**How to avoid:**
- Sanitize filenames when adding to ZIP: `basename($filename)` to strip directory traversal characters
- Use incremental filenames for ZIP entries: `edited_001.jpg`, `edited_002.jpg` instead of original filenames
- Validate filenames on upload (v1.0 audit): reject filenames containing `/`, `\`, `..`, null bytes, control characters
- Apply allowlist for file extensions: `.jpg`, `.jpeg`, `.png`, `.heic` only
- For existing data: run migration to sanitize Photo.filename column:
  ```php
  UPDATE Photo SET filename = CONCAT('photo_', id, '.jpg') WHERE filename LIKE '%..%' OR filename LIKE '%/%';
  ```
- Never trust `EditedPhoto.filename` column directly — always sanitize before ZIP entry

**Warning signs:**
- Filenames in ZIP match user-uploaded filenames exactly without sanitization
- No path sanitization in ZIP generation code: `$zip->addFile($storagePath, $filename)` uses raw filename
- Upload endpoint accepts any filename without validation
- Database contains filenames with directory separators (`/`, `\`)
- Code uses `$_FILES['file']['name']` directly in storage path

**Phase to address:**
Phase 2: Server-Side ZIP Generation (validate before implementing ZIP creation)

**Sources:**
- [Zip Slip Vulnerability (Snyk)](https://security.snyk.io/research/zip-slip-vulnerability) — Path traversal in archive extraction
- [Zip Path Traversal (Android Developers)](https://developer.android.com/privacy-and-security/risks/zip-path-traversal) — Prevention patterns
- [CVE-2026-22685 DevToys](https://github.com/DevToys-app/DevToys/security/advisories/GHSA-ggxr-h6fm-p2qh) — Recent 2026 path traversal in ZIP extraction

---

### Pitfall 5: Temporary ZIP Files Exhausting Disk Space

**What goes wrong:**
Generated ZIP files stored in `/tmp` or `backend/uploads/temp/` never get cleaned up. After 100 deliveries, server runs out of disk space. New uploads fail with "No space left on device". Download generation fails. Hosting provider suspends account.

**Why it happens:**
ZIP generation creates temp file for pre-generation approach. Script completes successfully, but cleanup code never runs due to errors, timeouts, or exceptions. No cron job configured to purge old temp files. Developers forget cleanup is needed.

**How to avoid:**
**If using pre-generated ZIPs (async approach):**
- Store in dedicated directory: `backend/uploads/zips/{collectionId}.zip`
- Add `processedZipPath` column to Collection table (already exists in schema!)
- Delete old ZIP when regenerating (e.g., when edited photos change):
  ```php
  if ($collection['processedZipPath'] && file_exists($collection['processedZipPath'])) {
      unlink($collection['processedZipPath']);
  }
  ```
- Implement cron job: delete ZIPs older than 30 days if collection status = DELIVERED:
  ```bash
  0 2 * * * find /path/to/uploads/zips -name "*.zip" -mtime +30 -delete
  ```
- Add database trigger: when Collection deleted, unlink processedZipPath file before row deletion
- Monitor disk usage with alerts

**If using streaming approach (recommended):**
- No temp files needed — stream directly to client via ZipStream-PHP
- Eliminates cleanup problem entirely
- No cron jobs needed
- No disk space risk

**Warning signs:**
- Disk usage grows without bound over time
- `/tmp` directory fills up with .zip files
- No file cleanup logic in ZIP generation code
- No cron jobs configured for maintenance
- Logs show "No space left on device" errors
- `backend/uploads/zips/` directory has hundreds of old files

**Phase to address:**
Phase 2: Server-Side ZIP Generation (architecture decision) + Phase 5: Production Readiness (operational hardening)

**Sources:**
- [Cron Job Storage Cleanup](https://www.hostinger.com/tutorials/cron-job) — Automated file cleanup
- [Removing Log Files with Cron](https://www.baeldung.com/linux/cron-logograte-delete-log-files) — Cleanup patterns
- [Cron Job Monitoring Guide](https://uptimerobot.com/knowledge-hub/cron-monitoring/cron-job-guide/) — Ensuring cleanup runs

---

### Pitfall 6: Missing HTTP Range Request Support

**What goes wrong:**
Client downloads 500MB ZIP, connection drops at 90%. Browser attempts to resume download, but server doesn't support HTTP Range requests. Client must restart from 0%. After 3 failed attempts, delivery fails completely. Client contacts photographer frustrated.

**Why it happens:**
Simple file streaming code: `readfile($filePath)` or `file_get_contents()` doesn't handle `Range:` header. Developer tests on local network (fast, reliable connection), never encounters resume scenario. Mobile clients on unstable connections suffer.

**How to avoid:**
- Implement HTTP 206 Partial Content support:
  ```php
  $fileSize = filesize($filePath);
  header('Accept-Ranges: bytes');

  if (isset($_SERVER['HTTP_RANGE'])) {
      preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $matches);
      $start = $matches[1];
      $end = $matches[2] ?: $fileSize - 1;

      http_response_code(206);
      header("Content-Range: bytes $start-$end/$fileSize");
      header("Content-Length: " . ($end - $start + 1));

      $fp = fopen($filePath, 'rb');
      fseek($fp, $start);
      echo fread($fp, $end - $start + 1);
      fclose($fp);
  } else {
      http_response_code(200);
      header("Content-Length: $fileSize");
      readfile($filePath);
  }
  ```
- Use `If-Range` header to validate file hasn't changed (check Last-Modified or ETag)
- Set `Accept-Ranges: bytes` header on ALL download responses
- Test with `curl -r` flag: `curl -r 0-1000 {url}` should return 206, not 200
- Test with interrupted download simulation

**Warning signs:**
- Download scripts use `readfile()` or `echo file_get_contents()` without range handling
- No handling of `$_SERVER['HTTP_RANGE']`
- Response always returns 200 OK, never 206 Partial Content
- Large downloads can't be resumed in browser (restart from beginning)
- Users report having to restart failed downloads multiple times
- No `Accept-Ranges: bytes` header in download responses

**Phase to address:**
Phase 2: Server-Side ZIP Generation (must be in initial implementation for large files)

**Sources:**
- [HTTP Range Requests (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) — Official specification
- [HTTP 206 Partial Content Guide](https://apidog.com/blog/status-code-206-partial-content/) — Implementation examples
- [Apache Byte-Ranges for Resumable Downloads](https://linux.goeszen.com/apache-and-byte-ranges-for-resumable-downloads.html) — Server configuration

---

### Pitfall 7: Race Condition on DOWNLOADED Status Update

**What goes wrong:**
Client downloads ZIP via browser AND mobile app simultaneously. Two requests hit `PATCH /delivery/{token}` to mark status = DOWNLOADED at the same time. Both check status (DELIVERED), both execute UPDATE. Database reports success for both, but only one update happens, or worse: constraint violation errors occur.

**Why it happens:**
Check-then-update pattern without transaction isolation:
```php
// WRONG: Race condition
$status = getCollectionStatus($id);
if ($status === 'DELIVERED') {
    updateStatus($id, 'DOWNLOADED');
}
```
Gap between SELECT and UPDATE allows concurrent requests to both pass the check.

**How to avoid:**
- Use database transaction with row locking:
```php
$pdo->beginTransaction();
$stmt = $pdo->prepare("SELECT status FROM Collection WHERE id = ? FOR UPDATE");
$stmt->execute([$collectionId]);
$status = $stmt->fetchColumn();

if ($status === 'DELIVERED') {
    $pdo->prepare("UPDATE Collection SET status = 'DOWNLOADED', updatedAt = NOW(3) WHERE id = ?")
        ->execute([$collectionId]);
}
$pdo->commit();
```
- Or use conditional UPDATE (simpler, no explicit locking):
```php
$stmt = $pdo->prepare("UPDATE Collection SET status = 'DOWNLOADED', updatedAt = NOW(3) WHERE id = ? AND status = 'DELIVERED'");
$stmt->execute([$collectionId]);
if ($stmt->rowCount() === 0) {
    // Already DOWNLOADED or invalid state transition
}
```
- Check `rowCount()` to verify update succeeded
- Status transitions should be **idempotent**: DOWNLOADED → DOWNLOADED is safe (no error)
- Prevent backwards transitions: DOWNLOADED → DELIVERED should be rejected

**Warning signs:**
- No database transactions in status update code
- Separate SELECT and UPDATE statements with gap between them
- No row locking (`FOR UPDATE`)
- Duplicate constraint violations in logs during concurrent access
- Status transitions don't check current state in WHERE clause
- Code assumes single-threaded execution

**Phase to address:**
Phase 3: Download Tracking (fix during implementation of status tracking)

**Sources:**
- [Transactional Locking to Prevent Race Conditions](https://sqlfordevs.com/transaction-locking-prevent-race-condition) — FOR UPDATE pattern
- [Database Race Conditions Catalog](https://www.ketanbhatt.com/p/db-concurrency-defects) — Common concurrency bugs
- [How to Prevent Race Conditions in Database](https://medium.com/@doniantoro34/how-to-prevent-race-conditions-in-database-3aac965bf47b) — Pessimistic locking

---

### Pitfall 8: Delivery Token in Email Logs

**What goes wrong:**
Delivery email contains link `pixelforge.pro/delivery/{deliveryToken}`. Email server logs full URL. SMTP provider (SendGrid, Mailgun) indexes all URLs for click tracking. Anyone with log access (support staff, compromised account) can download all client photos. Email forwarding multiplies exposure.

**Why it happens:**
Standard practice: put download link directly in email body. Developers don't consider email as untrusted logging layer. Email services log everything for analytics. Email forwarding creates copies in multiple inboxes indefinitely.

**How to avoid:**
- Use **two-step delivery**: Email contains short-lived landing page link with temporary token:
  ```
  Email: pixelforge.pro/delivery-verify/{emailToken}
  Landing page: Requires button click → reveals actual deliveryToken
  Actual download: pixelforge.pro/delivery/{deliveryToken}
  ```
- Or: Email contains `{baseUrl}/delivery-access/{emailToken}`, which validates then redirects to `{baseUrl}/delivery/{deliveryToken}` after validation
- Implement token expiration hierarchy:
  - `deliveryToken`: valid for 30 days (long-lived for client convenience)
  - `emailToken`: valid for 7 days (short-lived for email security)
- Add rate limiting on delivery endpoints: max 10 downloads per hour per token
- Consider password-protected deliveries for sensitive collections (optional client protection)
- Log only token prefix in server logs: `substr($token, 0, 8) . '...'`

**Warning signs:**
- Delivery email body contains actual deliveryToken in URL
- No distinction between email-safe tokens and download tokens
- Tokens never expire
- No rate limiting on delivery endpoints
- Email templates hardcode full download URLs like `<a href="https://pixelforge.pro/delivery/abc123...">`
- SMTP logs show full deliveryToken in click tracking

**Phase to address:**
Phase 4: Email Notifications (email integration must consider token security)

**Sources:**
- [Magic Link Security Best Practices](https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/) — Token exposure in email
- [Link Sharing Best Practices](https://blog.box.com/link-sharing-best-practices) — Expiration and access controls
- [The Dangers of Shared Links](https://www.varonis.com/blog/the-dangers-of-shared-links) — Link leakage patterns

---

## Critical Pitfalls (v1.0 Foundation — Previously Documented)

### Pitfall 9: Files Stored in Web-Accessible Directory

**What goes wrong:**
Photos uploaded to `backend/uploads/` are served directly by Apache via URL. Any person who knows — or guesses — the file path can download it without authentication or token check. All download-protection logic in PHP becomes irrelevant if the files themselves are directly reachable.

**How to avoid:**
Store uploads *outside* the Apache document root or block direct access with `.htaccess`:
```apache
Options -Indexes
deny from all
```
Serve every file through a PHP proxy script that validates token and status before `readfile()`.

**Phase to address:**
Phase 1 (Photo Upload) — before any photos are uploaded to production.

---

### Pitfall 10: PHP File Upload Accepting Dangerous Files

**What goes wrong:**
The upload handler trusts the MIME type sent by the browser (`$_FILES['file']['type']`). An attacker uploads a PHP file named `shell.php.jpg`. When served (if PHP execution is enabled in uploads directory), the attacker achieves remote code execution.

**How to avoid:**
- Validate MIME type server-side using `finfo_file()` (reads actual file magic bytes, not browser header)
- Whitelist only: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Strip the original filename entirely — generate random filename: `bin2hex(random_bytes(16)) . '.jpg'`
- Add `php_flag engine off` to `backend/uploads/.htaccess` to disable PHP execution

**Phase to address:**
Phase 1 (Photo Upload) — validate and harden before the first file is accepted.

---

### Pitfall 11: Serving Full-Resolution Images in React Grid Viewer

**What goes wrong:**
The photo grid renders `<img src="/photo?id=...">` pointing to original uploaded files (5–25 MB each). Loading a collection of 80 photos triggers 80 parallel requests fetching gigabytes of data. Page hangs, mobile experience is broken, Hostinger bandwidth limits are hammered.

**How to avoid:**
Generate thumbnails on upload. Use GD (`imagecreatefromjpeg` + `imagecopyresampled`) to write `_thumb.jpg` at 400px wide. Grid always loads thumbnails; fullscreen lightbox loads original only when opened.

**Phase to address:**
Phase 1 (Photo Upload) — generate thumbnails at upload time. Retrofitting is expensive.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse shareId for delivery | No schema migration needed | Security holes, can't revoke delivery without breaking shares, permissions leak | **Never** — creates fundamental security flaw |
| Use ZipArchive instead of ZipStream | Simpler code (native PHP) | Memory exhaustion, timeouts on large collections (50+ photos) | Only for MVP if collection size < 500MB AND user count < 10 |
| Skip Range request support | 50 lines less code | Failed downloads for large files (>100MB), poor mobile UX | Only if all files < 10MB guaranteed |
| Pre-generate ZIPs on DELIVERED transition | Instant downloads for clients | Disk space exhaustion, stale ZIPs when edited photos change | Acceptable if cleanup cron + storage monitoring implemented |
| Log download on every request | Simple analytics, 3 lines of code | Inflated metrics (10x actual), meaningless reports, broken billing | **Never** — makes analytics worthless from day one |
| Inline ZIP generation in API endpoint | No background job infrastructure | Timeouts (180s limit), no progress feedback, blocked requests | Only for collections < 100 photos AND Hostinger limits confirmed |
| Store original filename in ZIP | Preserves client filenames | Zip Slip vulnerability, path traversal on extraction | Never — use sanitized sequential names |
| Single-use deliveryToken | Simpler validation logic | Client can't re-download after 1st attempt | Only if explicitly designed as one-time download |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Existing shareId system | Assuming shareId can serve both selection AND delivery | Create separate deliveryToken with read-only permissions, different expiration |
| Existing status lifecycle | Adding DOWNLOADED status without validating transitions | Only allow DELIVERED → DOWNLOADED, make it idempotent, prevent DOWNLOADED → earlier states |
| File storage structure | Assuming backend/uploads/ structure supports ZIPs | Create separate backend/uploads/zips/ directory OR stream without temp files |
| Session-based auth | Delivery downloads require session cookies | Delivery endpoints must work WITHOUT session — use token-only auth |
| CORS configuration | Forgetting to allow Range headers in CORS | Add `Access-Control-Allow-Headers: Range, If-Range` to cors.php |
| Collection.processedZipPath | Forgetting column already exists in schema | Use existing column, don't add duplicate; clean up old ZIPs when regenerating |
| PHP ZipArchive on Hostinger | Calling `addFromString()` which loads file content into memory | Use `addFile($diskPath)` so ZipArchive streams from disk; set `set_time_limit(0)` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all photo paths into memory before ZIP | Script timeout, "memory exhausted" errors | Stream file entries one-by-one with ZipStream-PHP, process 1 file at a time | >50 photos OR >2GB total size |
| Generating thumbnail for every photo in ZIP preview | Slow page load on delivery landing page | Use existing thumbnailPath column from Photo table (already generated at upload) | >100 photos in collection |
| No progress indicator for ZIP generation | Users close browser, thinking it's frozen | Implement async job + polling endpoint OR streaming with chunked encoding | ZIP generation >30 seconds |
| Checking download count on every request | Slow delivery page load (N+1 query problem) | Cache count in Collection.downloadCount column, update async via trigger | >1000 downloads tracked |
| No index on Collection.deliveryToken | Slow delivery page load (full table scan) | Add UNIQUE index on deliveryToken column during migration | >10,000 collections |
| Full-resolution images in photo grid | Grid page load > 5s; mobile browsers crash | Generate thumbnails on upload; serve `_thumb.jpg` in grid | 10+ photos at 5 MB each |
| On-demand ZIP generation per request | Client waits 30–120 seconds; server returns 504 Gateway Timeout | Pre-generate ZIP on DELIVERED transition; store path in `processedZipPath`; serve pre-built file | 30+ edited photos |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using predictable deliveryToken format | Token enumeration attack, unauthorized downloads | Use cryptographically random tokens: `bin2hex(random_bytes(32))` minimum (64 hex chars) |
| No token expiration | Permanent access to photos via old delivery links | Add expiresAt check: refuse downloads if `NOW() > expiresAt` |
| Delivery endpoints require authentication | Clients can't download without photographer account | Delivery must work with token-only auth, no session required |
| Exposing internal collection IDs in delivery URLs | Enumeration of all collections via sequential IDs | Use opaque tokens, never expose database IDs in public URLs |
| No rate limiting on delivery downloads | Bandwidth exhaustion, scraping attacks, DDOS | Limit downloads per token: 10/hour OR 100/day via rate limiting table |
| Filename injection in ZIP entries | Path traversal on client extraction (Zip Slip) | Sanitize with `basename()`, use safe sequential names: `edited_001.jpg` |
| Logging deliveryToken in server logs | Token leakage via log access (support staff, breaches) | Log only token prefix: `substr($token, 0, 8) . '...'` |
| Photos accessible directly via URL without auth check | Anyone who learns the URL can download protected photos, bypassing stage-based protection | Block direct access with `.htaccess deny from all` in uploads/; serve via PHP proxy with status check |
| Using collection `id` as share token | Internal IDs exposed; if ID format is predictable, collection enumeration possible | Use separate cryptographically random `shareId`: `bin2hex(random_bytes(24))` |
| Trusting browser-supplied MIME type (`$_FILES['type']`) | Attackers upload PHP scripts disguised as JPEG files; remote code execution | Use `finfo_file()` on saved file; whitelist only image/* MIME types; disable PHP execution in uploads |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No download size estimate before ZIP | Client starts download, realizes it's 5GB on mobile data, abandons | Display "Download size: 1.2 GB - Estimated time: 3 min on WiFi" before download button |
| Generic "Download failed" error | Client doesn't know if it's their connection, server issue, or file corruption | Specific errors: "File too large for browser", "Connection timeout - resume supported", "Server timeout - try again" |
| Forcing ZIP download for single photo | Client wants 1 photo, must download 500-photo ZIP (1GB) | Offer individual photo download + "Download all as ZIP" option |
| No download progress for large ZIPs | Client thinks page froze, closes browser at 50% complete | Use streaming with chunked encoding + Content-Length header for browser progress bar |
| Delivery link expires without warning | Client receives link Friday, tries to download Monday (expired Sunday), link dead | Email warning 3 days before expiration + "Extend link" button for photographer |
| No mobile-friendly delivery page | Client can't download 2GB ZIP on phone, frustrated experience | Detect mobile, show warning: "Large download (2GB) - WiFi recommended. Mobile data may incur charges." |
| No upload progress indication | Photographer thinks upload froze; refreshes page; loses partial progress | Track per-file upload progress with `XMLHttpRequest` `progress` event; display progress bar |
| No confirmation when changing collection status | Photographer accidentally transitions from SELECTING to REVIEWING; client loses ability to change selections | Status transitions are one-way and irreversible; require explicit confirmation dialog with status explanation |

## "Looks Done But Isn't" Checklist

- [ ] **ZIP Generation:** Works with 5 test photos BUT fails with 100 production photos — verify with realistic dataset (50+ photos, 10MB each)
- [ ] **Download Tracking:** Counts requests BUT double-counts resumed downloads — verify with `curl -r` range request simulation (should show 1 download, not 5)
- [ ] **Token Security:** deliveryToken generated BUT uses shareId format (only 8 chars) — verify cryptographic randomness (32+ bytes, 64 hex chars)
- [ ] **Error Handling:** Shows "Download ready" BUT ZIP generation failed silently — verify error state propagates to UI
- [ ] **Status Transitions:** DELIVERED → DOWNLOADED works BUT DOWNLOADED → DELIVERED allowed — verify all invalid transitions rejected
- [ ] **File Cleanup:** ZIP generated successfully BUT never deleted — verify cron job configured AND logs show cleanup runs
- [ ] **Range Requests:** Download starts BUT can't resume after disconnect — verify 206 Partial Content response with `curl -r 0-1000`
- [ ] **Email Security:** Delivery email sent BUT contains raw deliveryToken — verify two-step token approach or expiring email tokens
- [ ] **Mobile UX:** Desktop download works BUT mobile times out or crashes — verify file size warnings and streaming implementation
- [ ] **Expiration:** Token expiration set BUT not enforced in download endpoint — verify expired token returns 410 Gone, not 200 OK
- [ ] **Token Separation:** Delivery route accepts deliveryToken BUT also accepts shareId — verify token type validation rejects wrong token type
- [ ] **Race Conditions:** Single download updates status correctly BUT concurrent downloads cause errors — verify transaction isolation or conditional UPDATE

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Shared shareId/deliveryToken | **HIGH** | 1. Add deliveryToken column 2. Migrate: generate deliveryToken for status=DELIVERED collections 3. Update all delivery endpoints 4. Email clients new links 5. Deprecate old share links for delivery |
| ZipArchive memory exhaustion | **MEDIUM** | 1. `composer require maennchen/zipstream-php` 2. Rewrite ZIP generation with ZipStream 3. Remove ZipArchive code 4. Test with large collections 5. No data migration needed |
| Double-counted downloads | **LOW** | 1. Add sessionId to DownloadLog 2. Add unique constraint (collectionId, sessionId, date) 3. Historical data can't be fixed — reset counts or accept inflated legacy data |
| Missing Range support | **LOW** | 1. Add Range header handling to download script 2. Test with `curl -r` 3. No schema changes needed |
| Disk exhaustion from temp ZIPs | **LOW** | 1. Configure cron: `0 2 * * * find /path/to/zips -mtime +30 -delete` 2. Clear existing temp files manually 3. Monitor disk usage |
| Zip Slip vulnerability | **MEDIUM** | 1. Audit existing Photo.filename data for path traversal 2. Sanitize ZIP generation code with `basename()` 3. Run migration to clean filenames 4. Add upload validation |
| Race condition on status update | **LOW** | 1. Wrap status updates in transactions with FOR UPDATE 2. Or use conditional UPDATE with WHERE clause 3. No schema changes needed |
| Token in email logs | **HIGH** | 1. Implement two-step token system (emailToken → deliveryToken) 2. Generate new emailTokens for active deliveries 3. Re-send delivery emails 4. Deprecate direct deliveryToken URLs |
| Files in web-accessible directory | **MEDIUM** | Add `deny from all` to `uploads/.htaccess` immediately; audit access logs for unauthorized direct-URL access; rotate any share tokens active during exposure |
| PHP file execution in uploads | **CRITICAL** | Take site offline; remove all files in uploads/; add `php_flag engine off` to `.htaccess`; audit for webshell indicators; rotate all credentials |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Token confusion (shareId reuse) | Phase 1: Separate Delivery Token | Query shows distinct shareId and deliveryToken for each DELIVERED collection |
| ZIP timeout/memory limits | Phase 2: Server-Side ZIP Generation | Generate ZIP with 100 photos (10MB each) completes in <30 sec without errors |
| Double-counting downloads | Phase 3: Download Tracking | Simulate 5 resumed downloads with curl -r, verify DownloadLog shows 1 entry |
| Zip Slip vulnerability | Phase 2: Server-Side ZIP Generation | Upload photo with filename `../../test.jpg`, verify rejected OR sanitized to `test.jpg` |
| Temp file exhaustion | Phase 5: Production Readiness | Cron log shows cleanup runs nightly, disk usage stable over 7 days of testing |
| Missing Range support | Phase 2: Server-Side ZIP Generation | `curl -r 0-1000 <url>` returns 206 Partial Content with `Content-Range` header |
| Race condition on status | Phase 3: Download Tracking | Simulate 10 concurrent PATCH requests, verify single status update via logs |
| Token in email logs | Phase 4: Email Notifications | Email body inspection shows NO deliveryToken in URLs, only emailToken |
| No download size estimate | Phase 4: Email Notifications + Phase 2 | Delivery page shows "Download size: X GB" before download button |
| No mobile warnings | Phase 5: Production Readiness (UI polish) | Mobile browser shows "Large file - WiFi recommended" for >100MB downloads |

## Sources

### High Confidence (Official Docs + Technical Sources)
- [ZipStream-PHP Memory Issues Discussion](https://github.com/maennchen/ZipStream-PHP/discussions/185) — Memory exhaustion patterns with 300+ files
- [PHP ZipArchive vs ZipStream Performance](https://github.com/maennchen/ZipStream-PHP/issues/40) — Architecture decision rationale for streaming
- [Hostinger PHP Memory Limits](https://www.hostinger.com/support/1583711-what-is-php-memory-limit-at-hostinger/) — Fixed per-plan memory limits, can only decrease
- [Hostinger PHP Time Limits](https://www.hostinger.com/tutorials/how-to-fix-maximum-execution-time-exceeded-error-wordpress) — max_execution_time = 180s maximum via ToS
- [Zip Slip Vulnerability (Snyk)](https://security.snyk.io/research/zip-slip-vulnerability) — Path traversal attack patterns in ZIP extraction
- [Zip Path Traversal (Android)](https://developer.android.com/privacy-and-security/risks/zip-path-traversal) — ZIP entry sanitization
- [HTTP Range Requests (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) — 206 Partial Content official spec
- [Database Race Conditions Catalog](https://www.ketanbhatt.com/p/db-concurrency-defects) — Transaction isolation patterns
- [Transactional Locking](https://sqlfordevs.com/transaction-locking-prevent-race-condition) — FOR UPDATE usage in MySQL
- [HTTP 206 Partial Content Guide](https://apidog.com/blog/status-code-206-partial-content/) — Implementation examples
- [CVE-2026-22685 DevToys](https://github.com/DevToys-app/DevToys/security/advisories/GHSA-ggxr-h6fm-p2qh) — Recent 2026 path traversal in ZIP

### Medium Confidence (Industry Best Practices)
- [Photo Delivery Guide for Professional Photographers](https://www.sendphoto.io/blog/client-photo-delivery-guide-professional-photographers) — UX expectations for delivery
- [How to Deliver Photos Without Losing Quality](https://fotoowl.ai/blogs/how-to-deliver-photos-to-clients-without-compromising-quality) — Download UX patterns
- [GA4 Download Tracking Duplicate Events](https://www.analyticsmania.com/post/duplicate-events-in-google-analytics-4-and-how-to-fix-them/) — Double-counting prevention in analytics
- [How to Track File Downloads in GA4](https://www.analyticsmania.com/post/track-file-downloads-with-google-analytics-4/) — Deduplication strategies
- [Token Best Practices (Auth0)](https://auth0.com/docs/secure/tokens/token-best-practices) — Token security patterns
- [Key Approaches to Token Sharing (Curity)](https://curity.io/resources/learn/token-sharing/) — Token exchange vs embedded
- [Magic Link Security Best Practices](https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/) — Token exposure in email
- [Link Sharing Best Practices (Box)](https://blog.box.com/link-sharing-best-practices) — Expiration and access controls
- [Cron Job Storage Cleanup](https://www.hostinger.com/tutorials/cron-job) — Automated file cleanup strategies
- [Apache Byte-Ranges for Resumable Downloads](https://linux.goeszen.com/apache-and-byte-ranges-for-resumable-downloads.html) — Server configuration

### Project-Specific Observations
- Existing v1.0 shareId system: Single token serves selection AND viewing (share.php lines 72-94)
- Collection schema already includes `processedZipPath` column (database_schema.sql line 74) — suggests pre-generation was considered
- No expiration enforcement in share.php (expiresAt column exists but not validated in handler)
- Hostinger shared hosting confirmed via project context (max_execution_time and memory_limit constraints apply)
- No deliveryToken column exists yet — integration pitfall risk is HIGH

---

*Pitfalls research for: Photo Hub v2.0 Delivery and Download Features (extending v1.0 selection workflow)*
*Original v1.0 research: 2026-02-11*
*Updated for v2.0 delivery features: 2026-02-13*
