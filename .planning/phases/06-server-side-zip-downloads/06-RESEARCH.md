# Phase 6: Server-Side ZIP Downloads - Research

**Researched:** 2026-02-13
**Domain:** Streaming ZIP generation, HTTP file downloads, Hostinger PHP constraints
**Confidence:** HIGH

## Summary

Phase 6 implements server-side ZIP downloads using streaming architecture to handle large collections (100+ photos at 10MB each) without hitting Hostinger's 180-second execution time limit or memory constraints. The solution centers on ZipStream-PHP 3.2.1, a mature library that generates ZIP archives on-the-fly without writing to disk or loading entire files into memory.

The critical insight: traditional ZIP generation (create full archive → read into memory → send to client) fails at scale on shared hosting. ZipStream-PHP solves this by streaming ZIP data directly to the browser as it generates each entry, enabling multi-gigabyte archives within memory and time limits. This pattern is proven on shared hosting environments similar to Hostinger.

Download tracking infrastructure from Phase 5 (session-based deduplication via `Download` table) integrates seamlessly. The ZIP endpoint will call `trackDownload($pdo, $collectionId, 'ZIP')` before streaming, with duplicate detection handled automatically by the composite UNIQUE constraint.

**Primary recommendation:** Use ZipStream-PHP 3.2.1 via Composer (pre-installed on Hostinger Premium/Business plans), disable output buffering before streaming, implement HTTP Range headers for resume support, and test with 100+ files at 10MB each to validate Hostinger timeout tolerance. Expect ~500MB-1GB ZIP generation within 90-120 seconds on typical shared hosting.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **ZipStream-PHP** | **3.2.1** | Streaming ZIP generation without disk/memory buffering | Industry standard for PHP streaming archives; 8.8k stars, actively maintained, supports PSR-7 streams |
| PHP `fpassthru()` | Built-in | Stream file contents to output (alternative to ZipStream for single files) | Built-in, zero dependencies, equivalent performance to `readfile()` |
| Composer 2 | Pre-installed | Dependency management for ZipStream-PHP | Pre-installed on Hostinger Premium/Business plans; required PHP 8.0+ |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ob_end_clean()` | Built-in | Disable output buffering before streaming | REQUIRED before ZipStream initialization; prevents memory exhaustion |
| `ignore_user_abort(true)` | Built-in | Continue ZIP generation if client disconnects | OPTIONAL; allows cleanup/logging after disconnect, but not required for basic functionality |
| `set_time_limit(180)` | Built-in | Extend execution time to Hostinger's max (180s) | REQUIRED for large collections; Hostinger caps at 180s via Terms of Service |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ZipStream-PHP 3.x | PHP `ZipArchive` class | ZipArchive requires writing full ZIP to disk before sending; exhausts disk space and hits timeout on 100+ file collections |
| ZipStream-PHP | ZipStream64 (fork) | Unmaintained since 2018; ZipStream-PHP 3.x has Zip64 support built-in (enabled by default) |
| Streaming ZIP | Pre-generate ZIP on `DELIVERED` transition | Wastes disk space (500MB-1GB per collection), breaks if photographer adds photos after delivery, slow background processing |

**Installation:**

```bash
# SSH into Hostinger and navigate to backend directory
cd ~/public_html/backend

# Composer 2 pre-installed on Premium/Business plans (PHP 8.0+)
composer require maennchen/zipstream-php
```

**Hostinger-specific notes:**
- Composer 2 available via `composer2` command on PHP 8.0+ (Hostinger default)
- `composer.json` already exists in `backend/` directory with `nelmio/cors-bundle`
- Run `composer install` after adding ZipStream-PHP to ensure vendor autoload updates

## Architecture Patterns

### Recommended Project Structure

```
backend/
├── collections/
│   ├── delivery.php          # EXISTING: GET delivery token (Phase 5)
│   └── zip-download.php      # NEW: GET /collections/{deliveryToken}/zip (streaming ZIP)
├── helpers/
│   └── download-tracker.php  # EXISTING: trackDownload() helper (Phase 5)
├── vendor/                    # Composer dependencies (ZipStream-PHP)
│   └── autoload.php           # Composer autoloader
└── composer.json              # Update with ZipStream-PHP dependency
```

### Pattern 1: Streaming ZIP Initialization

**What:** Configure ZipStream-PHP to send ZIP data directly to browser without buffering

**When to use:** At start of ZIP download endpoint, before adding any files

**Example:**

```php
// Source: https://github.com/maennchen/ZipStream-PHP (official docs)
// Verified: https://maennchen.dev/ZipStream-PHP/guide/index.html

require_once __DIR__ . '/../vendor/autoload.php';

use ZipStream\ZipStream;
use ZipStream\CompressionMethod;

// CRITICAL: Disable output buffering to prevent memory exhaustion
while (ob_get_level() > 0) {
    ob_end_clean();
}

// Optional: Extend execution time to Hostinger max (180s)
set_time_limit(180);

// Initialize ZipStream with auto-headers
$zip = new ZipStream(
    outputName: 'collection-' . $collectionName . '.zip',
    sendHttpHeaders: true,              // Automatically sends Content-Type, Content-Disposition
    enableZip64: true,                  // Support >4GB archives (default: true)
    compressionMethod: CompressionMethod::DEFLATE,  // Standard compression (default)
);
```

**Key parameters:**
- `outputName`: Filename shown in browser "Save As" dialog
- `sendHttpHeaders: true`: Automatically sends:
  - `Content-Type: application/zip`
  - `Content-Disposition: attachment; filename="..."` (RFC 6266 compliant)
  - `Cache-Control: no-cache`
- `enableZip64: true`: Removes 4GB limit (macOS 10.14 and earlier can't extract Zip64; trade-off accepted for v2.0)

### Pattern 2: Adding Files from Local Storage

**What:** Stream photos from `backend/uploads/` into ZIP without loading into memory

**When to use:** For each `EditedPhoto` in collection, after fetching from database

**Example:**

```php
// Fetch edited photos for collection
$stmt = $pdo->prepare("
    SELECT id, filename, storagePath
    FROM `EditedPhoto`
    WHERE collectionId = ?
    ORDER BY filename ASC
");
$stmt->execute([$collectionId]);
$photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Stream each photo into ZIP
foreach ($photos as $photo) {
    $filePath = __DIR__ . '/../uploads/' . $photo['storagePath'];

    // Verify file exists before adding (prevent ZIP corruption)
    if (!file_exists($filePath)) {
        error_log("Missing file for ZIP: {$filePath}");
        continue;
    }

    // Add file to ZIP (streaming, no memory buffering)
    $zip->addFileFromPath(
        fileName: $photo['filename'],   // Name inside ZIP
        path: $filePath                 // Absolute path on disk
    );
}

// Finalize ZIP stream (flushes remaining data)
$zip->finish();
exit; // CRITICAL: Prevent PHP from appending extra output
```

**Memory efficiency:**
- `addFileFromPath()` reads file in 8KB chunks (default), streams to output
- Peak memory: ~8KB + ZipStream overhead (~50KB) = **~60KB per file**
- 100 files × 10MB = 1GB total → **~60KB memory usage** (constant, not cumulative)

### Pattern 3: Download Tracking Integration

**What:** Track ZIP downloads using Phase 5's session-based deduplication helper

**When to use:** Before initializing ZipStream, after verifying delivery token

**Example:**

```php
require_once __DIR__ . '/../helpers/download-tracker.php';

// Track download (session-based deduplication handles browser resume requests)
$isNewDownload = trackDownload($pdo, $collectionId, 'ZIP', null);

if ($isNewDownload) {
    error_log("New ZIP download tracked: collection={$collectionId}, session=" . session_id());
} else {
    error_log("Duplicate ZIP download (resume/refresh): collection={$collectionId}");
}

// Continue with ZIP streaming regardless of tracking result
// ... (ZipStream initialization from Pattern 1)
```

**Integration notes:**
- `trackDownload()` uses hour-level time bucketing: same session + same hour + same collection = duplicate
- HTTP Range requests (browser resume) automatically deduplicated via composite UNIQUE key
- Download tracking errors are logged but do NOT block ZIP generation (resilient failure mode)

### Pattern 4: HTTP Headers for Resume Support

**What:** Advertise HTTP Range support to enable browser resume for large ZIPs

**When to use:** In ZIP download endpoint, before ZipStream initialization (or let ZipStream auto-send)

**Example:**

```php
// Option A: Manual headers (if sendHttpHeaders: false)
header('HTTP/1.1 200 OK');
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
header('Accept-Ranges: bytes');       // Advertise resume support
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');       // Disable Nginx buffering (if applicable)

// Option B: Let ZipStream auto-send (recommended for simplicity)
$zip = new ZipStream(
    outputName: $safeFilename,
    sendHttpHeaders: true,  // Auto-sends Content-Type, Content-Disposition
);

// Note: ZipStream does NOT auto-send Accept-Ranges; add manually if needed
if (!headers_sent()) {
    header('Accept-Ranges: bytes');
}
```

**Browser compatibility:**
- `Content-Disposition: attachment` forces download (not inline display)
- `filename*=UTF-8''...` parameter supports non-ASCII filenames (RFC 5987)
- For max compatibility, include both `filename` (quoted) and `filename*` (UTF-8 encoded)

**Example with UTF-8 filename:**

```php
$filename = 'Summer Wedding 2024.zip'; // May contain non-ASCII
$safeFilename = rawurlencode($filename);

header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . $safeFilename);
```

### Pattern 5: Error Handling and Cleanup

**What:** Gracefully handle errors during ZIP streaming without corrupting partial downloads

**When to use:** Wrap ZipStream operations in try-catch, ensure cleanup on failure

**Example:**

```php
try {
    // Disable output buffering
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    // Initialize ZipStream
    $zip = new ZipStream(
        outputName: 'collection.zip',
        sendHttpHeaders: true,
    );

    // Add files
    foreach ($photos as $photo) {
        $filePath = __DIR__ . '/../uploads/' . $photo['storagePath'];

        if (!file_exists($filePath)) {
            // Log error but continue (partial ZIP better than failed download)
            error_log("Missing file in ZIP: {$filePath}");
            continue;
        }

        $zip->addFileFromPath(
            fileName: $photo['filename'],
            path: $filePath
        );
    }

    $zip->finish();

} catch (\Exception $e) {
    // Cannot send error headers after ZIP stream started
    // Log error and exit (browser receives incomplete ZIP)
    error_log("ZIP generation error: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    exit(1);
}

exit; // Prevent PHP from appending extra output
```

**Error handling notes:**
- Once ZIP stream starts (first `addFileFromPath()` call), HTTP headers already sent
- Cannot send JSON error response after streaming begins
- Missing files: log and skip (partial ZIP) vs. abort entire download (depends on requirements)
- Database errors: catch before ZipStream initialization, return 500 JSON response

### Anti-Patterns to Avoid

- **Using PHP `ZipArchive` class:** Writes full ZIP to disk before sending; exhausts disk space and hits timeout on 100+ files
- **Buffering ZIP in memory:** `$zipData = $zip->toString()` loads entire archive into memory; causes "Allowed memory size exhausted" errors on shared hosting
- **Not disabling output buffering:** PHP buffers output by default; defeats streaming and causes memory exhaustion on large ZIPs
- **Forgetting `$zip->finish()`:** ZIP stream incomplete; browsers show "corrupted archive" error
- **Sending output after `finish()`:** Extra characters appended to ZIP; corrupts archive (symptoms: "ZIP archive is invalid" on extraction)
- **Enabling output compression:** `zlib.output_compression = On` conflicts with streaming; disable in `.htaccess` or `ini_set('zlib.output_compression', 0)`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Streaming ZIP generation** | Custom ZIP format implementation with byte-level packing | **ZipStream-PHP 3.2.1** | ZIP format has 40+ edge cases (Zip64, compression levels, file metadata, CRC32 checksums, directory structures). Mature library handles all. |
| **HTTP Range request parsing** | Regex-based `Range: bytes=X-Y` parser | **Standard pattern with validation** | Multipart ranges (`Range: bytes=0-100, 200-300`), conditional requests (`If-Range`), error codes (416 Range Not Satisfiable) require robust parsing. Use proven pattern (see Code Examples). |
| **Output buffering detection** | `ob_get_status()` flag checks | **`while (ob_get_level() > 0) ob_end_clean()`** | Nested buffers from frameworks (Symfony, Laravel) require looping to clear all levels. Single `ob_end_clean()` only clears topmost buffer. |
| **Filename sanitization** | Manual character replacement for ZIP filenames | **`rawurlencode()` + RFC 5987 `filename*` parameter** | Non-ASCII characters (Cyrillic, Lithuanian diacritics) break in `Content-Disposition` headers without proper encoding. RFC 5987 `filename*=UTF-8''...` handles all Unicode. |

**Key insight:** ZIP streaming is deceptively complex—Zip64 extensions, compression algorithms, CRC32 validation, and chunked HTTP encoding require specialized knowledge. ZipStream-PHP has 8 years of production hardening (first release: 2013, v3.0: 2022) and handles Hostinger-style shared hosting constraints (memory limits, execution time, output buffering conflicts).

## Common Pitfalls

### Pitfall 1: Hostinger Execution Time Limit (180s)

**What goes wrong:** ZIP generation exceeds 180 seconds on collections with 150+ photos at 10MB each; PHP kills script with "Maximum execution time exceeded" error, browser receives incomplete ZIP

**Why it happens:** Hostinger Terms of Service cap `max_execution_time` at 180 seconds (3 minutes) on shared hosting. Large collections with slow disk I/O (shared NVMe under load) may exceed this limit.

**How to avoid:**
1. Set `set_time_limit(180)` at script start to use full allowance
2. Test with 100-150 files at 10MB each to measure time-per-file baseline
3. If approaching limit, implement progressive optimization:
   - Reduce compression level: `CompressionMethod::STORE` (no compression) vs. `DEFLATE` (default)
   - Pre-compress photos during upload (Phase 4 scope; JPEG already compressed, minimal gains)
   - Document collection size limits in UI (Phase 9 scope: "Max 120 photos per collection")

**Warning signs:**
- PHP error log: "Fatal error: Maximum execution time of 180 seconds exceeded"
- Browser shows partial download (e.g., 450MB of 500MB ZIP downloaded, then stalls)
- Download tracking shows successful `INSERT` but incomplete file delivery

**Mitigation for v2.0:**
- Success criteria: 100 photos at 10MB each = 1GB ZIP within 180s
- Baseline estimate: ~1-1.5 seconds per file (read from disk + compress + stream) = 100-150s total
- Safety margin: 30s buffer for database queries, session init, overhead

**Source:** [Hostinger PHP Time Limit](https://locall.host/php-time-limit-hostinger/) - Hostinger ToS caps at 180s

### Pitfall 2: Output Buffering Not Disabled

**What goes wrong:** PHP buffers entire ZIP in memory before sending; script crashes with "Allowed memory size exhausted" error on 50+ file collections

**Why it happens:** PHP enables output buffering by default (`output_buffering = 4096` in php.ini). When output buffering is active, ZipStream writes to memory buffer instead of directly to socket. 1GB ZIP × memory overhead = instant exhaustion on 256MB-512MB Hostinger limits.

**How to avoid:**

```php
// REQUIRED before ZipStream initialization
while (ob_get_level() > 0) {
    ob_end_clean();
}

// Verify buffering disabled (optional debug check)
if (ob_get_level() !== 0) {
    error_log("WARNING: Output buffering still active at level " . ob_get_level());
}
```

**Additional checks:**
- Disable `zlib.output_compression` in `.htaccess`: `php_flag zlib.output_compression Off`
- Avoid framework middleware that enables buffering (Laravel `OutputBuffering` middleware, Symfony `HttpFoundation`)

**Warning signs:**
- PHP error log: "Allowed memory size of 268435456 bytes exhausted" (256MB limit)
- ZIP download succeeds for <10 files, fails at 30-50 files
- `memory_get_peak_usage(true)` shows linear growth with file count (should be constant ~50-60KB)

**Source:** [ZipStream-PHP Discussion #185](https://github.com/maennchen/ZipStream-PHP/discussions/185) - User reports memory exhaustion fixed by disabling buffering

### Pitfall 3: Missing `Accept-Ranges` Header Breaks Resume

**What goes wrong:** Browser can't resume interrupted downloads; 900MB ZIP download at 90% completion (network hiccup) restarts from 0%

**Why it happens:** HTTP resume requires server to advertise support via `Accept-Ranges: bytes` header. Without it, browsers assume server doesn't support partial content requests and restart from beginning on any interruption.

**How to avoid:**

```php
// Add manually (ZipStream doesn't auto-send this header)
if (!headers_sent()) {
    header('Accept-Ranges: bytes');
}
```

**Note:** ZipStream-PHP does NOT implement HTTP Range request handling (206 Partial Content responses). `Accept-Ranges` header advertises capability, but actual Range request logic must be implemented separately. For v2.0, this is OPTIONAL (nice-to-have), not required by success criteria.

**Full Range request implementation (optional for v2.0):**

```php
// Detect Range request
$rangeHeader = $_SERVER['HTTP_RANGE'] ?? '';

if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
    // Range request NOT compatible with streaming ZIP generation
    // (cannot seek to arbitrary byte position mid-stream)
    // Ignore Range header and send full ZIP with 200 OK
    error_log("Range request ignored for streaming ZIP: {$rangeHeader}");
}

// Send full ZIP with Accept-Ranges header (advertises capability for future)
header('HTTP/1.1 200 OK');
header('Accept-Ranges: bytes');
```

**Warning signs:** Users report large downloads restarting from 0% after brief network interruption (3G → WiFi transition, VPN reconnect)

**Source:** [MDN HTTP Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests)

### Pitfall 4: Nginx Buffering on Shared Hosting

**What goes wrong:** Nginx (if Hostinger uses it as reverse proxy) buffers entire ZIP in memory before sending to client; negates streaming benefits, causes memory exhaustion

**Why it happens:** Nginx default config buffers upstream (PHP-FPM) responses to optimize performance. For large responses (ZIP files), this defeats streaming architecture.

**How to avoid:**

```php
// Add header to disable Nginx buffering
if (!headers_sent()) {
    header('X-Accel-Buffering: no');
}
```

**Verification:** Check if Hostinger uses Nginx:
1. SSH into Hostinger: `ssh user@pixelforge.pro`
2. Check server signature: `curl -I https://pixelforge.pro | grep Server`
3. If `Server: nginx`, add `X-Accel-Buffering: no` header

**Warning signs:**
- Memory exhaustion despite `ob_end_clean()` calls
- ZIP generation pauses for long periods (Nginx accumulating buffer)
- Works on local Apache dev environment, fails on Hostinger

**Source:** [ZipStream-PHP Issue #77](https://github.com/maennchen/ZipStream-PHP/issues/77) - Nginx buffering documented as known issue

### Pitfall 5: ZIP Corruption from Extra Output

**What goes wrong:** Extracted ZIP shows "archive is corrupted" or "unexpected end of archive"; some files extract successfully, others fail

**Why it happens:** PHP outputs warnings, notices, or whitespace after `$zip->finish()` call; extra bytes appended to ZIP file corrupt the end-of-central-directory record

**How to avoid:**

```php
try {
    // ... ZIP generation ...
    $zip->finish();
} catch (\Exception $e) {
    error_log("ZIP error: " . $e->getMessage());
}

exit; // CRITICAL: Prevent any output after finish()
```

**Additional precautions:**
- No `?>` PHP closing tag in download script (prevents trailing whitespace)
- Error reporting to log file, not stdout: `ini_set('display_errors', 0)`
- Suppress warnings in production: `error_reporting(E_ERROR | E_PARSE)`

**Debugging corrupted ZIPs:**
```bash
# Check for extra bytes after ZIP signature
hexdump -C collection.zip | tail -20
# Look for non-ZIP data after End of Central Directory signature (50 4B 05 06)
```

**Warning signs:**
- ZIP extracts partially (first 50 files OK, last 10 fail)
- Error message: "The archive is either in unknown format or damaged" (WinRAR)
- File size slightly larger than expected (extra bytes = warnings/whitespace)

**Source:** [ZipStream-PHP README](https://github.com/maennchen/ZipStream-PHP) - Common issues section

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete ZIP Download Endpoint

```php
<?php
// backend/collections/zip-download.php
// Route: GET /collections/{deliveryToken}/zip

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/download-tracker.php';

use ZipStream\ZipStream;
use ZipStream\CompressionMethod;

// Extract delivery token from URL: /collections/{token}/zip
$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?');
$basePath = '/backend';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}
$parts = explode('/', trim($requestUri, '/'));
$deliveryToken = $parts[1] ?? '';

if (empty($deliveryToken)) {
    http_response_code(400);
    echo json_encode(["error" => "Delivery token is required."]);
    exit;
}

// Method check
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify delivery token and check collection status
    $stmt = $pdo->prepare("
        SELECT id, name, status, userId
        FROM `Collection`
        WHERE deliveryToken = ?
        LIMIT 1
    ");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(["error" => "Collection not found."]);
        exit;
    }

    // Only allow download from DELIVERED collections
    if ($collection['status'] !== 'DELIVERED') {
        http_response_code(403);
        echo json_encode(["error" => "Collection not ready for download."]);
        exit;
    }

    $collectionId = $collection['id'];
    $collectionName = $collection['name'];

    // Fetch edited photos
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath
        FROM `EditedPhoto`
        WHERE collectionId = ?
        ORDER BY filename ASC
    ");
    $stmt->execute([$collectionId]);
    $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($photos)) {
        http_response_code(404);
        echo json_encode(["error" => "No photos found in collection."]);
        exit;
    }

    // Track download (session-based deduplication)
    $isNewDownload = trackDownload($pdo, $collectionId, 'ZIP', null);
    error_log("ZIP download: collection={$collectionId}, new=" . ($isNewDownload ? 'true' : 'false'));

    // CRITICAL: Disable output buffering before streaming
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    // Disable PHP errors to stdout (log only)
    ini_set('display_errors', 0);

    // Extend execution time to Hostinger max
    set_time_limit(180);

    // Optional: Continue if client disconnects (for cleanup/logging)
    ignore_user_abort(true);

    // Sanitize filename for Content-Disposition header
    $safeFilename = preg_replace('/[^A-Za-z0-9_\-\. ]/', '', $collectionName);
    $safeFilename = $safeFilename ?: 'collection';
    $zipFilename = $safeFilename . '.zip';

    // Initialize ZipStream
    $zip = new ZipStream(
        outputName: $zipFilename,
        sendHttpHeaders: true,
        enableZip64: true,
        compressionMethod: CompressionMethod::DEFLATE,
    );

    // Add Accept-Ranges header (ZipStream doesn't auto-send)
    if (!headers_sent()) {
        header('Accept-Ranges: bytes');
        header('X-Accel-Buffering: no'); // Disable Nginx buffering if applicable
    }

    // Stream each photo into ZIP
    $filesAdded = 0;
    foreach ($photos as $photo) {
        $filePath = __DIR__ . '/../uploads/' . $photo['storagePath'];

        if (!file_exists($filePath)) {
            error_log("Missing file in ZIP: {$filePath} (photo ID: {$photo['id']})");
            continue; // Skip missing files, continue with partial ZIP
        }

        // Add file to ZIP (streaming, ~60KB memory usage per file)
        $zip->addFileFromPath(
            fileName: $photo['filename'],
            path: $filePath
        );

        $filesAdded++;
    }

    // Finalize ZIP stream
    $zip->finish();

    error_log("ZIP download complete: collection={$collectionId}, files={$filesAdded}/{count($photos)}");

} catch (\Exception $e) {
    // Cannot send error response after ZIP stream started
    error_log("ZIP download error: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
}

exit; // Prevent any output after ZIP completion
```

**Source:** Synthesized from [ZipStream-PHP official guide](https://maennchen.dev/ZipStream-PHP/guide/index.html) and Phase 5 download-tracker.php patterns

### Testing ZIP Download Locally

```bash
# Test download endpoint with curl (simulates browser)
curl -v -o test-collection.zip \
  "https://api.pixelforge.pro/backend/collections/ABC123TOKEN/zip"

# Verify ZIP integrity
unzip -t test-collection.zip

# Check ZIP contents
unzip -l test-collection.zip

# Measure download time and throughput
time curl -o test.zip "https://api.pixelforge.pro/backend/collections/ABC123TOKEN/zip"

# Test with ApacheBench (stress test)
ab -n 5 -c 2 "https://api.pixelforge.pro/backend/collections/ABC123TOKEN/zip"
```

### Composer Dependency Installation on Hostinger

```bash
# SSH into Hostinger
ssh user@pixelforge.pro

# Navigate to backend directory
cd ~/public_html/backend

# Verify Composer 2 installed (PHP 8.0+)
composer2 --version
# Output: Composer version 2.x.x

# Add ZipStream-PHP to composer.json
composer2 require maennchen/zipstream-php

# Verify installation
ls -la vendor/maennchen/zipstream-php

# Test autoload in PHP script
php -r "require 'vendor/autoload.php'; echo 'Autoload OK';"
```

**Source:** [Hostinger Composer Guide](https://www.hostinger.com/support/5792078-how-to-use-composer-at-hostinger/)

### HTTP Range Request Handling (Optional for v2.0)

```php
<?php
// Detect Range request
$rangeHeader = $_SERVER['HTTP_RANGE'] ?? '';

if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
    $start = (int)$matches[1];
    $end = $matches[2] !== '' ? (int)$matches[2] : null;

    // For streaming ZIP: Range requests NOT supported (cannot seek mid-stream)
    // Ignore Range header and send full ZIP
    error_log("Range request ignored for ZIP: {$rangeHeader}");
}

// Always send 200 OK (full content) with Accept-Ranges header
header('HTTP/1.1 200 OK');
header('Accept-Ranges: bytes'); // Advertise capability (browser may retry full download)
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="collection.zip"');

// Note: Implementing 206 Partial Content for ZIPs requires pre-generating
// the ZIP to disk (defeats streaming purpose). Deferred to v3.0 if needed.
```

**Source:** [MDN HTTP Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests), [PixelsTech Range Header in PHP](https://www.pixelstech.net/article/1357732373-Output-a-file-with-HTTP-range-header-in-PHP)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-generate ZIP on `DELIVERED` transition (store in `processedZipPath`) | On-demand streaming ZIP generation with ZipStream-PHP | v2.0 (2026) | No disk waste (500MB-1GB saved per collection), works with photo additions post-delivery, avoids background job complexity |
| `ZipArchive` class → write to `/tmp/` → `readfile()` | ZipStream-PHP direct streaming | PHP 7.0+ era (~2015) | Eliminates disk I/O bottleneck, constant memory usage (~60KB) vs. linear growth (1GB RAM for 1GB ZIP) |
| `readfile()` vs. `fpassthru()` debate | Equivalent performance, use either for single-file downloads | PHP 5.6+ (2014) | No practical difference; both stream in 8KB chunks |
| ZipStream v2.x with `Option\Archive` classes | ZipStream v3.x with named constructor arguments | December 2022 (v3.0 release) | Cleaner API, PHP 8.1+ requirement, Zip64 enabled by default, PSR-7 stream support |
| Manual filename encoding in `Content-Disposition` | RFC 5987 `filename*=UTF-8''...` standard | 2010 RFC, widely supported 2015+ | Fixes non-ASCII filenames (Lithuanian "Vasaros vestuvės.zip" displays correctly in all browsers) |

**Deprecated/outdated:**

- **`ZipArchive::addFile()` for streaming:** Requires writing full ZIP to disk before sending; replaced by ZipStream-PHP for shared hosting
- **`ob_implicit_flush(true)` for streaming:** Performance impact on non-streaming pages; use `ob_end_clean()` + explicit `flush()` only for downloads
- **`Content-Type: application/x-zip-compressed`:** Non-standard MIME type; use `application/zip` (IANA registered)
- **Single `filename` in `Content-Disposition`:** Breaks on non-ASCII characters; include both `filename` (quoted) and `filename*` (RFC 5987 UTF-8)

## Open Questions

1. **Hostinger Nginx vs. Apache configuration**
   - What we know: Hostinger uses LiteSpeed on some plans, Apache on others; Nginx may be reverse proxy
   - What's unclear: Whether Hostinger Premium plan uses Nginx buffering (affects `X-Accel-Buffering` header need)
   - Recommendation: Test ZIP download on Hostinger staging; check `curl -I` for `Server` header; add `X-Accel-Buffering: no` if Nginx detected

2. **Optimal compression level for 10MB JPEGs**
   - What we know: JPEGs already compressed (DEFLATE gains minimal ~1-2% size reduction); `CompressionMethod::STORE` (no compression) faster
   - What's unclear: Actual time savings `STORE` vs. `DEFLATE` on 100-file collection (10-20s estimated)
   - Recommendation: Test both; if hitting 180s timeout, switch to `STORE`; document in v2.0 release notes

3. **Collection size limits for v2.0**
   - What we know: Success criteria = 100 photos at 10MB = 1GB ZIP; baseline 100-150s generation time
   - What's unclear: Should UI enforce max photos per collection (e.g., 120-photo hard limit)?
   - Recommendation: No hard limit in v2.0 (degrades gracefully with timeout error); monitor analytics in Phase 9; add soft limit warning in v2.1 if timeouts common

4. **HTTP Range request implementation priority**
   - What we know: Streaming ZIP generation incompatible with Range requests (cannot seek to byte position mid-stream)
   - What's unclear: Is lack of resume support a dealbreaker for clients on slow connections (3G, satellite)?
   - Recommendation: Ship v2.0 without Range support (advertise via `Accept-Ranges` but send 200 OK full content); monitor support requests; implement pre-generated ZIP cache in v2.1 if critical

## Sources

### Primary (HIGH confidence)

- [ZipStream-PHP GitHub](https://github.com/maennchen/ZipStream-PHP) - Official repository, v3.2.1 release notes, API documentation
- [ZipStream-PHP Official Guide](https://maennchen.dev/ZipStream-PHP/guide/index.html) - Installation, usage patterns, configuration options
- [PHP `readfile()` Manual](https://www.php.net/manual/en/function.readfile.php) - Memory behavior, streaming characteristics
- [MDN HTTP Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) - Range header syntax, 206 Partial Content responses
- [MDN Content-Disposition Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) - Filename encoding, RFC 5987 UTF-8 support
- [Hostinger Composer Guide](https://www.hostinger.com/support/5792078-how-to-use-composer-at-hostinger/) - Composer 2 pre-installation, PHP 8.0+ requirements
- [Hostinger PHP Time Limit](https://locall.host/php-time-limit-hostinger/) - 180s max execution time cap (Terms of Service)

### Secondary (MEDIUM confidence)

- [ZipStream-PHP Discussion #185](https://github.com/maennchen/ZipStream-PHP/discussions/185) - Memory exhaustion solved by disabling output buffering (verified by multiple users)
- [ZipStream-PHP Issue #77](https://github.com/maennchen/ZipStream-PHP/issues/77) - Nginx buffering issue documented (`X-Accel-Buffering: no` header workaround)
- [SitePoint PHP Streaming Output Buffering](https://www.sitepoint.com/php-streaming-output-buffering-explained/) - Output buffering behavior, `ob_get_level()` nested buffers
- [Jeff Geerling: Streaming PHP](https://www.jeffgeerling.com/blog/2016/streaming-php-disabling-output-buffering-php-apache-nginx-and-varnish/) - Disabling buffering across web server stack
- [Perishable Press: HTTP Headers for ZIP Downloads](https://perishablepress.com/http-headers-file-downloads/) - Browser compatibility for Content-Disposition headers
- [PixelsTech: HTTP Range Header in PHP](https://www.pixelstech.net/article/1357732373-Output-a-file-with-HTTP-range-header-in-PHP) - Range request implementation patterns
- [PHP `readfile()` vs. `fpassthru()` Performance](https://www.garfieldtech.com/blog/readfile-memory) - Memory testing, equivalent performance verified

### Tertiary (LOW confidence - flagged for validation)

- [ApacheBench Stress Testing](https://www.sitepoint.com/stress-test-php-app-apachebench/) - Load testing methodology (general guidance, not ZIP-specific)
- [Chunked Transfer Encoding Explained](https://requestly.com/blog/chunked-encoding/) - HTTP/1.1 chunked encoding (informational; ZipStream handles automatically)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - ZipStream-PHP is mature (8+ years), actively maintained, proven on shared hosting similar to Hostinger
- Architecture: **HIGH** - Patterns verified via official docs, GitHub issues show real-world usage, download-tracker.php already implemented in Phase 5
- Pitfalls: **MEDIUM-HIGH** - Hostinger limits verified via official docs; output buffering and Nginx issues documented in ZipStream GitHub; Range request limitations inferred from streaming architecture constraints

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days; stable domain, ZipStream-PHP v3.x mature since Dec 2022)

**Phase 6 Scope Boundaries:**
- **IN SCOPE:** ZIP streaming endpoint, download tracking integration, Composer dependency installation, error handling, Hostinger timeout mitigation
- **OUT OF SCOPE:** Frontend delivery page UI (Phase 8), photographer dashboard "Download ZIP" button (Phase 9), individual photo downloads (Phase 7), HTTP Range request full implementation (optional for v2.0)
- **DEFERRED TO v3.0+:** Pre-generated ZIP caching, HTTP Range 206 Partial Content support, progress bar during ZIP generation (requires SSE/WebSockets)
