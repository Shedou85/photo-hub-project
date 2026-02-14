# Phase 7: Individual Photo Downloads - Research

**Researched:** 2026-02-14
**Domain:** Browser file downloads, cross-origin image handling, download tracking, collection status transitions
**Confidence:** HIGH

## Summary

Phase 7 implements individual photo downloads (as opposed to bulk ZIP downloads from Phase 6). The core challenge is triggering browser downloads for images hosted on a cross-domain backend (api.pixelforge.pro) from a frontend (pixelforge.pro) while maintaining CORS compliance, download tracking, and collection status transitions.

The critical architectural decision from Phase 6 applies here: **downloads must use server-controlled endpoints that track downloads BEFORE streaming begins**. This ensures DOWNLOADED status transitions happen reliably (requirement TRACK-04). The pattern established in Phase 6's zip-download.php (track → stream → exit) extends to individual photo downloads with a new endpoint: `/deliver/{deliveryToken}/photo/{photoId}`.

For frontend implementation, the standard approach is creating a temporary `<a>` element with `download` attribute and programmatically clicking it. However, cross-origin restrictions require either: (1) server-sent `Content-Disposition: attachment` headers (recommended), or (2) fetch → blob → createObjectURL workaround (adds latency and memory overhead for 10MB JPEGs). Option 1 aligns with the existing ZIP download pattern and requires NO client-side library.

**Primary recommendation:** Create server endpoint `/deliver/{deliveryToken}/photo/{photoId}` that tracks downloads and sends photos with `Content-Disposition: attachment; filename="..."` header. Frontend uses simple anchor click pattern (no file-saver library needed for same-origin workaround). DOWNLOADED status transitions on first download (ZIP or individual) via conditional UPDATE in tracking logic.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **PHP `readfile()`** | Built-in | Stream individual photo files to browser | Zero dependencies, memory-efficient (8KB chunks), proven in production |
| **Browser `<a>` element** | Native | Trigger download in frontend | Standard HTML5, works cross-browser, no library needed when server sends proper headers |
| **PDO transactions** | Built-in | Prevent race conditions on DOWNLOADED status update | Database-level consistency, FOR UPDATE locking, standard in existing codebase |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `header('Content-Disposition')` | Built-in | Force browser download instead of inline display | REQUIRED for all download endpoints; triggers download regardless of MIME type |
| `session_start()` + `trackDownload()` | Phase 5 | Session-based deduplication for download tracking | Reuse existing helper from Phase 5; prevents double-counting from browser resume |
| `UPDATE ... WHERE ... AND status = 'DELIVERED'` | SQL | Conditional status transition to DOWNLOADED | Prevents race conditions; makes status transitions idempotent |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server endpoint with Content-Disposition | file-saver library + fetch blob workaround | Adds 50KB dependency, requires fetching 10MB JPEG into memory before download, slower UX; NO benefit since we control backend headers |
| Direct `<a href>` to photo URL | Proxied fetch → blob URL | Complex, slower, unnecessary when server controls response headers |
| Separate DOWNLOADED endpoint | Track download in photo stream endpoint | Simpler, fewer roundtrips; aligns with Phase 6 ZIP pattern (track BEFORE stream) |

**Installation:**

No new dependencies. Phase 7 uses existing backend patterns (PHP file streaming, PDO transactions, download-tracker.php) and frontend native APIs (anchor element, DOM manipulation).

## Architecture Patterns

### Recommended Project Structure

```
backend/
├── collections/
│   ├── zip-download.php          # EXISTING: ZIP download with tracking (Phase 6)
│   └── photo-download.php        # NEW: Individual photo download with tracking
├── helpers/
│   └── download-tracker.php      # EXISTING: trackDownload() helper (Phase 5)
└── index.php                      # UPDATE: Add /deliver/{token}/photo/{id} route

frontend/src/
├── pages/
│   └── DeliveryPage.jsx          # Phase 8 scope — uses download utilities
└── utils/
    └── download.js               # NEW: Reusable download helpers
```

### Pattern 1: Server-Side Individual Photo Download Endpoint

**What:** Stream single photo with download tracking and Content-Disposition header

**When to use:** For individual photo downloads from delivery page (Phase 8) or photographer dashboard preview

**Example:**

```php
<?php
// backend/collections/photo-download.php
// Route: GET /deliver/{deliveryToken}/photo/{photoId}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/download-tracker.php';
require_once __DIR__ . '/../utils.php';

// Extract deliveryToken and photoId from route
$routeParts = parseRouteParts();
// routeParts: ['deliver', deliveryToken, 'photo', photoId]
$deliveryToken = $routeParts[1] ?? '';
$photoId = $routeParts[3] ?? '';

if (empty($deliveryToken) || empty($photoId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Delivery token and photo ID required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify delivery token
    $stmt = $pdo->prepare("SELECT id, status FROM Collection WHERE deliveryToken = ?");
    $stmt->execute([$deliveryToken]);
    $collection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$collection) {
        http_response_code(404);
        echo json_encode(['error' => 'Collection not found']);
        exit;
    }

    // Check collection status
    if ($collection['status'] !== 'DELIVERED' && $collection['status'] !== 'DOWNLOADED') {
        http_response_code(403);
        echo json_encode(['error' => 'Collection not available for download']);
        exit;
    }

    $collectionId = $collection['id'];

    // Fetch photo
    $stmt = $pdo->prepare("
        SELECT id, filename, storagePath
        FROM EditedPhoto
        WHERE id = ? AND collectionId = ?
        LIMIT 1
    ");
    $stmt->execute([$photoId, $collectionId]);
    $photo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$photo) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo not found']);
        exit;
    }

    $filePath = __DIR__ . '/../' . $photo['storagePath'];

    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo file not found on disk']);
        exit;
    }

    // Track download BEFORE streaming (while we can still send JSON errors)
    $isNewDownload = trackDownload($pdo, $collectionId, 'INDIVIDUAL', $photoId);
    error_log("Individual photo download: collection={$collectionId}, photo={$photoId}, new=" . ($isNewDownload ? 'true' : 'false'));

    // Transition to DOWNLOADED status on first download (idempotent)
    if ($collection['status'] === 'DELIVERED') {
        $updateStmt = $pdo->prepare("
            UPDATE Collection
            SET status = 'DOWNLOADED', updatedAt = NOW(3)
            WHERE id = ? AND status = 'DELIVERED'
        ");
        $updateStmt->execute([$collectionId]);

        if ($updateStmt->rowCount() > 0) {
            error_log("Collection {$collectionId} transitioned to DOWNLOADED status");
        }
    }

    // --- POINT OF NO RETURN: Headers will be sent ---

    // Disable output buffering
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    // Send download headers
    $safeFilename = $photo['filename']; // Already sanitized during upload
    $fileSize = filesize($filePath);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $filePath) ?: 'application/octet-stream';
    finfo_close($finfo);

    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . addslashes($safeFilename) . '"');
    header('Content-Length: ' . $fileSize);
    header('Content-Transfer-Encoding: binary');
    header('Accept-Ranges: bytes');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Stream file to browser (memory-efficient)
    readfile($filePath);

} catch (\Exception $e) {
    if (!headers_sent()) {
        http_response_code(500);
        echo json_encode(['error' => 'Download failed: ' . $e->getMessage()]);
    } else {
        error_log("Photo download error after streaming started: " . $e->getMessage());
    }
}

exit;
```

**Key design decisions:**

1. **Track download BEFORE streaming** — allows DOWNLOADED status update in error-returnable window (before headers sent)
2. **Allow downloads from DOWNLOADED status** — client can re-download photos; status transition is idempotent (DELIVERED → DOWNLOADED only)
3. **Conditional UPDATE with status check** — `WHERE id = ? AND status = 'DELIVERED'` prevents race conditions (multiple simultaneous downloads)
4. **No file-saver library needed** — server sends `Content-Disposition: attachment`, which triggers download in all browsers
5. **Reuse trackDownload() helper** — session-based deduplication prevents double-counting from browser resume requests

### Pattern 2: Frontend Download Trigger (Anchor Click Pattern)

**What:** Programmatically trigger download via temporary anchor element

**When to use:** In delivery page grid view and lightbox download buttons

**Example:**

```javascript
// frontend/src/utils/download.js

/**
 * Trigger individual photo download via server endpoint
 *
 * @param {string} deliveryToken - Collection delivery token
 * @param {string} photoId - EditedPhoto ID (CUID)
 * @param {string} filename - Original photo filename (for logging/analytics)
 */
export function downloadPhoto(deliveryToken, photoId, filename) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const downloadUrl = `${baseUrl}/deliver/${deliveryToken}/photo/${photoId}`;

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename; // Suggests filename (server header takes precedence)
  link.style.display = 'none';

  // Append to DOM (required for Firefox)
  document.body.appendChild(link);

  // Trigger download
  link.click();

  // Cleanup
  document.body.removeChild(link);

  // Optional: Analytics/logging
  console.log(`Download triggered: ${filename} (${photoId})`);
}
```

**Usage in delivery page (Phase 8):**

```jsx
// In grid view
<button
  onClick={() => downloadPhoto(deliveryToken, photo.id, photo.filename)}
  className="download-button"
  aria-label={`Download ${photo.filename}`}
>
  <DownloadIcon />
</button>

// In lightbox
<button
  onClick={(e) => {
    e.stopPropagation();
    downloadPhoto(deliveryToken, photos[lightboxIndex].id, photos[lightboxIndex].filename);
  }}
  className="lightbox-download-btn"
>
  Download Photo
</button>
```

**Browser compatibility:**

- Chrome 65+, Firefox 20+, Safari 10.1+, Edge 18+ all support `download` attribute
- Server `Content-Disposition` header takes precedence over `download` attribute value
- No cross-origin restrictions when server controls headers (same backend we control)

**Why this works (no fetch blob needed):**

1. Backend endpoint sends `Content-Disposition: attachment; filename="..."`
2. Browser receives header → treats response as download (not inline display)
3. Anchor `download` attribute suggests filename (overridden by server header)
4. Server sends `Access-Control-Allow-Origin` from existing CORS setup (backend/cors.php)
5. No need to fetch → blob → createObjectURL because server headers control behavior

**Source:** [MDN: HTML Download Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download), [Alex MacArthur: Cross-Origin Download](https://macarthur.me/posts/trigger-cross-origin-download/)

### Pattern 3: DOWNLOADED Status Transition Logic

**What:** Transition collection from DELIVERED to DOWNLOADED on first download (ZIP or individual)

**When to use:** In both zip-download.php and photo-download.php endpoints, after tracking download

**Example:**

```php
// After trackDownload() call in download endpoint

// Fetch current status (already have $collection array from token verification)
$currentStatus = $collection['status'];

// Only transition DELIVERED → DOWNLOADED (idempotent)
if ($currentStatus === 'DELIVERED') {
    try {
        $stmt = $pdo->prepare("
            UPDATE Collection
            SET status = 'DOWNLOADED', updatedAt = NOW(3)
            WHERE id = ? AND status = 'DELIVERED'
        ");
        $stmt->execute([$collectionId]);

        if ($stmt->rowCount() > 0) {
            // Transition succeeded
            error_log("Collection {$collectionId} transitioned to DOWNLOADED");
        } else {
            // Another request already transitioned (race condition resolved)
            error_log("Collection {$collectionId} already DOWNLOADED (concurrent request)");
        }

    } catch (PDOException $e) {
        // Log error but don't block download
        error_log("DOWNLOADED status transition error: " . $e->getMessage());
    }
}

// Continue with file streaming...
```

**Race condition prevention:**

- `WHERE status = 'DELIVERED'` ensures only ONE request transitions status (first wins)
- `rowCount() === 0` indicates another request already transitioned (safe to ignore)
- Status transitions are **idempotent**: DOWNLOADED → DOWNLOADED is no-op (safe)
- Backwards transitions rejected: DOWNLOADED → DELIVERED never occurs

**Alternative approach (pessimistic locking):**

```php
// If race conditions are frequent (unlikely for typical use)
$pdo->beginTransaction();
try {
    // Lock collection row
    $stmt = $pdo->prepare("SELECT status FROM Collection WHERE id = ? FOR UPDATE");
    $stmt->execute([$collectionId]);
    $status = $stmt->fetchColumn();

    if ($status === 'DELIVERED') {
        $pdo->prepare("UPDATE Collection SET status = 'DOWNLOADED', updatedAt = NOW(3) WHERE id = ?")
            ->execute([$collectionId]);
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Status transition error: " . $e->getMessage());
}
```

**Recommendation:** Use conditional UPDATE (simpler, fewer transactions). Pessimistic locking only if analytics show frequent concurrent downloads (unlikely).

**Source:** [Research Pitfall 7: Race Condition on DOWNLOADED Status Update](C:/Users/Marius/Documents/Gemini/photo-hub/.planning/research/PITFALLS.md#pitfall-7-race-condition-on-downloaded-status-update), [SQL for Devs: Transactional Locking](https://sqlfordevs.com/transaction-locking-prevent-race-condition)

### Pattern 4: Router Wiring for Photo Download Endpoint

**What:** Add individual photo download route to backend router (backend/index.php)

**When to use:** During Phase 7 implementation, alongside zip-download.php route

**Example:**

```php
// In backend/index.php, within /deliver/ route handler (added in Phase 6)

// Handle /deliver/ routes (public endpoints — delivery token auth)
if (strpos($requestUri, '/deliver/') === 0) {
    $uriParts = explode('/', ltrim($requestUri, '/'));
    // uriParts: ['deliver', deliveryToken, subRoute, ?subId]
    $subRoute = $uriParts[2] ?? '';

    switch ($subRoute) {
        case 'zip':
            // EXISTING from Phase 6
            if ($requestMethod === 'GET') {
                require_once __DIR__ . '/collections/zip-download.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method Not Allowed']);
            }
            break;

        case 'photo':
            // NEW for Phase 7
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
```

**Route pattern:**
- ZIP: `/deliver/{deliveryToken}/zip`
- Individual photo: `/deliver/{deliveryToken}/photo/{photoId}`

**Consistency with Phase 6:** Both routes follow same pattern (public, token-based auth, track-then-stream)

### Anti-Patterns to Avoid

- **Using file-saver library when server controls headers:** Adds unnecessary dependency, fetches 10MB JPEGs into memory, slower UX. Only needed when you DON'T control server response headers.
- **Separate download tracking endpoint:** Creates race condition window between track and download. Phase 6 pattern (track BEFORE stream in same endpoint) is correct.
- **Allowing DOWNLOADED → DELIVERED transitions:** Status should only move forward in lifecycle. Use conditional UPDATE with `WHERE status = 'DELIVERED'` to prevent backwards movement.
- **No Content-Disposition header:** Browser displays image inline instead of downloading. MUST send `Content-Disposition: attachment` for all download endpoints.
- **Hardcoding MIME type:** Different image formats (JPEG, PNG, WEBP) need correct Content-Type. Use `finfo_file()` to detect dynamically.
- **Not clearing output buffer:** PHP buffers output by default; defeats memory-efficient streaming. Always `ob_end_clean()` before `readfile()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Browser download trigger** | Custom fetch → blob → createObjectURL | **Server `Content-Disposition` header + anchor click** | Server-controlled headers work cross-browser, no memory overhead, no CORS workarounds needed |
| **Download tracking deduplication** | Custom UUID-based duplicate detection | **Existing `trackDownload()` helper from Phase 5** | Session-based deduplication with composite UNIQUE key prevents double-counting, already tested in Phase 6 ZIP downloads |
| **Status transition safety** | Manual status checks with separate SELECT/UPDATE | **Conditional UPDATE with WHERE status check** | Database-level atomicity prevents race conditions without explicit transactions |
| **File MIME type detection** | Extension-based lookup table (`jpg` → `image/jpeg`) | **`finfo_file()` built-in** | Handles edge cases (JPEG with .png extension, WEBP, HEIC), returns accurate MIME types |

**Key insight:** Phase 7 is a simplification of Phase 6's ZIP streaming pattern. The infrastructure (delivery tokens, download tracking, CORS headers, router wiring) already exists. Individual photo downloads are just "stream single file instead of ZIP archive" with the same track-then-stream sequence.

## Common Pitfalls

### Pitfall 1: Cross-Origin Download Restrictions Without Server Headers

**What goes wrong:** Frontend tries to download image via `<a download>` pointing to backend URL, browser blocks download or displays inline instead of saving to disk

**Why it happens:** Chrome 65+ blocks `download` attribute on cross-origin URLs for security. Without server `Content-Disposition: attachment` header, browser treats image as inline content (opens in new tab instead of downloading).

**How to avoid:**

```php
// REQUIRED in photo-download.php
header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"');
```

This header signals browser to download regardless of origin or MIME type. `download` attribute on anchor is suggestion only (server header takes precedence).

**Alternative (NOT recommended):** Fetch blob workaround

```javascript
// WRONG: Unnecessary complexity when we control server
async function downloadPhotoBlob(url, filename) {
  const response = await fetch(url, { credentials: 'include' });
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(blobUrl);
}
```

**Why blob workaround is worse:**
- Loads entire 10MB JPEG into memory before download
- Slower UX (wait for fetch, wait for blob creation, then download)
- Uses browser memory quota (can fail on low-memory devices)
- Requires CORS headers anyway (`Access-Control-Allow-Origin`)

**Correct approach:** Server sends `Content-Disposition`, frontend uses simple anchor click (no fetch needed).

**Warning signs:** Downloads open in new tab instead of saving, "Download blocked" browser console errors

**Sources:**
- [Chrome 65 Cross-Origin Download Blocks](https://copyprogramming.com/howto/cross-origin-download-of-images-in-js)
- [Alex MacArthur: Cross-Origin Download Won't "Just Work"](https://macarthur.me/posts/trigger-cross-origin-download/)
- [MDN: Content-Disposition Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)

### Pitfall 2: Race Condition on DOWNLOADED Status Transition

**What goes wrong:** Client downloads ZIP and individual photo simultaneously. Both requests check status (DELIVERED), both execute UPDATE to DOWNLOADED. Database reports success for both but only one update happens, or constraint errors occur.

**Why it happens:** Check-then-update pattern without transaction isolation:

```php
// WRONG: Race condition
$status = getCollectionStatus($id);
if ($status === 'DELIVERED') {
    updateStatus($id, 'DOWNLOADED');
}
```

Gap between SELECT and UPDATE allows concurrent requests to both pass the check.

**How to avoid:** Conditional UPDATE with status check in WHERE clause

```php
// CORRECT: Atomic transition, idempotent
$stmt = $pdo->prepare("
    UPDATE Collection
    SET status = 'DOWNLOADED', updatedAt = NOW(3)
    WHERE id = ? AND status = 'DELIVERED'
");
$stmt->execute([$collectionId]);

if ($stmt->rowCount() === 0) {
    // Already DOWNLOADED (concurrent request) or invalid state
    // Safe to ignore — download continues normally
}
```

**Alternative (pessimistic locking):**

```php
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("SELECT status FROM Collection WHERE id = ? FOR UPDATE");
    $stmt->execute([$collectionId]);
    $status = $stmt->fetchColumn();

    if ($status === 'DELIVERED') {
        $pdo->prepare("UPDATE Collection SET status = 'DOWNLOADED', updatedAt = NOW(3) WHERE id = ?")
            ->execute([$collectionId]);
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Status transition error: " . $e->getMessage());
}
```

**Recommendation:** Use conditional UPDATE (simpler, fewer transactions). Pessimistic locking only if analytics show frequent concurrent downloads (unlikely in typical use).

**Status transitions should be idempotent:**
- DELIVERED → DOWNLOADED: ✅ Allowed (first download)
- DOWNLOADED → DOWNLOADED: ✅ Safe no-op (re-download)
- DOWNLOADED → DELIVERED: ❌ Prevented by WHERE clause

**Warning signs:**
- No WHERE clause checking current status in UPDATE
- Separate SELECT and UPDATE statements
- Duplicate constraint violations in logs
- Status transitions don't use `rowCount()` to verify success

**Sources:**
- [Research Pitfall 7](C:/Users/Marius/Documents/Gemini/photo-hub/.planning/research/PITFALLS.md#pitfall-7-race-condition-on-downloaded-status-update)
- [SQL for Devs: Transactional Locking](https://sqlfordevs.com/transaction-locking-prevent-race-condition)
- [Database Race Conditions Catalog](https://www.ketanbhatt.com/p/db-concurrency-defects)

### Pitfall 3: Missing Output Buffer Clearing Before File Stream

**What goes wrong:** PHP buffers entire 10MB photo in memory before sending, script crashes with "Allowed memory size exhausted" on Hostinger's 256MB-512MB limit

**Why it happens:** PHP enables output buffering by default (`output_buffering = 4096` in php.ini). When output buffering is active, `readfile()` writes to memory buffer instead of directly to socket.

**How to avoid:**

```php
// REQUIRED before readfile()
while (ob_get_level() > 0) {
    ob_end_clean();
}

// Now readfile() streams in 8KB chunks (memory-efficient)
readfile($filePath);
```

**Also disable zlib compression in .htaccess:**

```apache
# In backend/.htaccess
php_flag zlib.output_compression Off
```

**Verification:**

```php
// Optional debug check
if (ob_get_level() !== 0) {
    error_log("WARNING: Output buffering still active at level " . ob_get_level());
}
```

**Warning signs:**
- Memory exhaustion errors on 5-10MB photo downloads
- Works locally (high memory_limit) but fails on Hostinger
- `memory_get_peak_usage(true)` shows usage proportional to file size

**Source:** Pattern established in Phase 6 ZIP downloads (zip-download.php lines 84-86)

### Pitfall 4: Not Tracking Individual Downloads Separately from ZIP

**What goes wrong:** Photographer sees "Collection downloaded (ZIP)" but client actually downloaded 30 individual photos. Analytics inaccurate, can't identify usage patterns (prefer ZIP vs. individual).

**Why it happens:** Reusing same download tracking without `downloadType` differentiation, or tracking only ZIP downloads.

**How to avoid:** Use `downloadType` ENUM in trackDownload() call

```php
// ZIP download (Phase 6)
trackDownload($pdo, $collectionId, 'ZIP', null);

// Individual photo download (Phase 7)
trackDownload($pdo, $collectionId, 'INDIVIDUAL', $photoId);
```

Download table schema (already created in Phase 5):

```sql
CREATE TABLE `Download` (
  `downloadType` ENUM('ZIP', 'INDIVIDUAL') NOT NULL,
  `photoId` VARCHAR(191) NULL,  -- NULL for ZIP, EditedPhoto ID for individual
  ...
);
```

**Analytics queries (Phase 9 scope):**

```sql
-- Total downloads per collection (all types)
SELECT COUNT(*) FROM Download WHERE collectionId = ?;

-- ZIP downloads only
SELECT COUNT(*) FROM Download WHERE collectionId = ? AND downloadType = 'ZIP';

-- Individual photo downloads only
SELECT COUNT(*) FROM Download WHERE collectionId = ? AND downloadType = 'INDIVIDUAL';

-- Which photos were downloaded individually
SELECT photoId, COUNT(*) as count
FROM Download
WHERE collectionId = ? AND downloadType = 'INDIVIDUAL'
GROUP BY photoId
ORDER BY count DESC;
```

**Warning signs:** Download table has all `downloadType = 'ZIP'` values even when individual downloads occur

### Pitfall 5: Triggering Download on Hover/Mouseenter Events

**What goes wrong:** Browser blocks download, shows "Download blocked: multiple downloads not allowed" warning, requires user permission dialog

**Why it happens:** Browsers restrict `download` attribute to user-initiated events (click, keyboard) for security. Hover events don't qualify.

**How to avoid:**

```javascript
// WRONG: Blocked by browser
<button onMouseEnter={() => downloadPhoto(token, id, filename)}>
  Hover to download
</button>

// CORRECT: Click event is user-initiated
<button onClick={() => downloadPhoto(token, id, filename)}>
  Download Photo
</button>
```

**User interaction events that allow downloads:**
- ✅ `click` (mouse or keyboard)
- ✅ `touchend` (mobile tap)
- ✅ `keydown` (Enter/Space on focused element)
- ❌ `mouseenter` / `mouseover`
- ❌ `scroll`
- ❌ `setTimeout` callback

**Source:** [FileSaver.js README](https://github.com/eligrey/FileSaver.js) - "saveAs must be run within a user interaction event"

## Code Examples

Verified patterns from existing codebase and official sources:

### Complete Individual Photo Download Endpoint

See **Pattern 1** above for full `backend/collections/photo-download.php` implementation.

### Frontend Download Utility

See **Pattern 2** above for `frontend/src/utils/download.js` implementation.

### Router Integration

See **Pattern 4** above for `backend/index.php` route wiring.

### Testing Individual Downloads Locally

```bash
# Test download endpoint with curl
curl -v -o test-photo.jpg \
  "https://api.pixelforge.pro/backend/deliver/ABC123TOKEN/photo/PHOTO_ID_CUID"

# Verify file integrity
file test-photo.jpg
# Expected: test-photo.jpg: JPEG image data, JFIF standard

# Check headers
curl -I "https://api.pixelforge.pro/backend/deliver/ABC123TOKEN/photo/PHOTO_ID_CUID"
# Expected headers:
# Content-Type: image/jpeg
# Content-Disposition: attachment; filename="DSC_1234.jpg"
# Content-Length: 10485760
# Accept-Ranges: bytes
```

### Database Query for DOWNLOADED Status Verification

```sql
-- Check collection status after first download
SELECT id, name, status, updatedAt
FROM Collection
WHERE id = 'COLLECTION_ID';
-- status should be 'DOWNLOADED' after first download (ZIP or individual)

-- Verify download tracking records
SELECT downloadType, photoId, sessionId, downloadedAt, createdAt
FROM Download
WHERE collectionId = 'COLLECTION_ID'
ORDER BY createdAt DESC;
-- Should show downloadType = 'INDIVIDUAL' with photoId populated
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| file-saver library + fetch blob | Server Content-Disposition header + anchor click | 2018 (Chrome 65 cross-origin blocks) | Simpler frontend (no dependencies), faster downloads (no blob conversion), works reliably cross-browser |
| Separate download tracking endpoint | Track-then-stream in same endpoint | Phase 6 (2026) | Prevents race conditions, ensures DOWNLOADED status transitions reliably |
| Manual MIME type lookup | `finfo_file()` dynamic detection | PHP 5.3+ (2009) | Handles edge cases (wrong extensions, WEBP, HEIC), accurate Content-Type headers |
| IP-based download tracking | Session-based with composite UNIQUE key | Phase 5 (2026) | GDPR compliant, prevents double-counting from browser resume, works with VPN/NAT |

**Deprecated/outdated:**

- **file-saver library for same-origin servers:** Unnecessary when you control server response headers
- **fetch → blob → createObjectURL for downloads:** Only needed when server doesn't send Content-Disposition attachment header
- **Separate SELECT and UPDATE for status transitions:** Race condition prone; use conditional UPDATE with WHERE status check
- **Extension-based MIME type detection:** Fails on misnamed files, non-standard formats; use finfo_file()

## Open Questions

1. **DOWNLOADED status transition threshold for individual downloads**
   - What we know: ZIP download immediately transitions to DOWNLOADED (one-click, all photos)
   - What's unclear: Should individual downloads require threshold (e.g., "50% of photos downloaded") or any single photo download triggers DOWNLOADED?
   - Recommendation: ANY download (ZIP or individual) transitions to DOWNLOADED. Simpler logic, photographer gets confirmation client received photos. Analytics can show breakdown (ZIP vs. individual count) in Phase 9.

2. **Download button placement in delivery page UI**
   - What we know: Requirements specify "grid view with single click" and "lightbox view with download button"
   - What's unclear: Should grid view have separate download button or click-to-download on photo thumbnail? Lightbox download button placement (top-right vs. bottom)?
   - Recommendation: Defer to Phase 8 (Client Delivery Interface) planning. Research will inform UI patterns from competitor analysis (Pixieset, Pic-Time layouts).

3. **Re-download behavior from DOWNLOADED status**
   - What we know: Status transitions are idempotent (DOWNLOADED → DOWNLOADED allowed)
   - What's unclear: Should re-downloads be tracked separately in Download table? Or deduplicated by session (existing pattern)?
   - Recommendation: Use existing session-based deduplication. Re-download within same hour + same session = duplicate (not tracked). Re-download next day or different device = new download record. Balances analytics accuracy vs. spam prevention.

4. **Individual download analytics visibility**
   - What we know: Download table tracks `photoId` for INDIVIDUAL downloads
   - What's unclear: Should Phase 7 implement analytics UI showing "Photo X downloaded 5 times" or defer to Phase 9?
   - Recommendation: Phase 7 implements tracking only (backend). Phase 9 (Photographer Dashboard Integration) adds analytics UI. Separation of concerns, allows Phase 8 (delivery page) to ship without dashboard changes.

## Sources

### Primary (HIGH confidence)

- [MDN: HTML Download Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download) - Browser support, same-origin restrictions
- [MDN: Content-Disposition Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition) - Attachment vs. inline, filename encoding
- [PHP readfile() Manual](https://www.php.net/manual/en/function.readfile.php) - Memory behavior, streaming characteristics
- [PHP finfo_file() Manual](https://www.php.net/manual/en/function.finfo-file.php) - MIME type detection
- [Alex MacArthur: Cross-Origin Download](https://macarthur.me/posts/trigger-cross-origin-download/) - Why download attribute alone doesn't work cross-origin
- [FileSaver.js GitHub](https://github.com/eligrey/FileSaver.js) - User interaction event requirements, browser compatibility

### Secondary (MEDIUM confidence)

- [LogRocket: Programmatic File Downloads](https://blog.logrocket.com/programmatically-downloading-files-browser/) - Fetch blob workaround patterns
- [Chrome 65 Cross-Origin Download Blocks](https://copyprogramming.com/howto/cross-origin-download-of-images-in-js) - Security policy changes in 2018
- [SQL for Devs: Transactional Locking](https://sqlfordevs.com/transaction-locking-prevent-race-condition) - FOR UPDATE pattern for race condition prevention
- [Database Race Conditions Catalog](https://www.ketanbhatt.com/p/db-concurrency-defects) - Common concurrency bugs
- Phase 6 RESEARCH.md and zip-download.php — Established patterns for track-then-stream downloads

### Tertiary (LOW confidence - flagged for validation)

- [file-saver npm package](https://www.npmjs.com/package/file-saver) - Not needed for this use case (we control server), included for completeness
- [SQLPey: Client-Side Download Techniques](https://sqlpey.com/javascript/client-side-javascript-file-download-techniques/) - General patterns (verified against official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - No new dependencies; reuses Phase 5/6 infrastructure (trackDownload, delivery tokens, PDO transactions)
- Architecture: **HIGH** - Patterns verified via existing zip-download.php implementation, MDN documentation, cross-origin download research
- Pitfalls: **HIGH** - Race condition prevention validated in Phase 5/6 research, cross-origin restrictions documented in browser security policies, output buffering pattern established in Phase 6

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days; stable domain, browser APIs unchanged since 2018)

**Phase 7 Scope Boundaries:**
- **IN SCOPE:** Individual photo download endpoint (backend), download utility (frontend), DOWNLOADED status transitions, download tracking integration
- **OUT OF SCOPE:** Delivery page UI implementation (Phase 8), photographer dashboard analytics (Phase 9), UI polish for status badges (Phase 10)
- **DEFERRED:** Download analytics UI (Phase 9), threshold-based DOWNLOADED transitions (not needed for v2.0), detailed per-photo download tracking UI (v3.0+)
