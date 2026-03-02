# Stack Research — Photo Hub Full Stack

**Domain:** Photo Hub complete technology stack
**Researched:** 2026-02-13 (initial), 2026-03-02 (updated to reflect current state)
**Confidence:** HIGH

---

## Context

This document covers the complete technology stack for Photo Hub as of v3.0.

**Current stack:**
- React 18 + Vite 5 + Tailwind CSS v3 (frontend)
- Vanilla PHP + PDO + MySQL (backend)
- **Cloudflare R2** for photo/thumbnail/watermark storage (via AWS SDK)
- PHPMailer for transactional emails
- maennchen/zipstream-php for ZIP streaming from R2
- Google OAuth via google/apiclient
- Collection status lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED

**Not yet implemented:**
- Stripe payment integration — separate milestone, next priority
- Queue system for ZIP generation — unnecessary at current scale

---

## Current Stack (as shipped)

### Backend (PHP) — All Installed

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **aws/aws-sdk-php** | ^3.0 | Cloudflare R2 storage (S3-compatible API) | INSTALLED — r2Upload, r2Delete, r2GetStream, r2GetUrl, r2GetSize |
| **maennchen/zipstream-php** | 3.0 | Streaming ZIP generation from R2 | INSTALLED — streams R2 objects directly to ZIP output |
| **phpmailer/phpmailer** | ^7.0 | Transactional emails (verification, password reset) | INSTALLED — SMTP via .env config |
| **google/apiclient** | ^2.16 | Google OAuth login | INSTALLED — Account table stores OAuth data |
| **vlucas/phpdotenv** | 5.5 | Environment variable loading | INSTALLED — .env config |
| **random_bytes() + bin2hex()** | Built-in (PHP 8+) | Token generation (shareId, deliveryToken, CSRF) | Built-in — 128-bit hex tokens |
| **GD library** | Built-in | Thumbnail generation + watermark overlay | Built-in — 400px thumbnails, "PREVIEW" diagonal watermark |

### Frontend (React) — All Installed

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| **react** | ^18 | UI framework | Core |
| **react-router-dom** | ^7 | Client-side routing | Core |
| **react-i18next** | i18next | Internationalization (LT/EN/RU) | Core — 19 namespaces |
| **tailwindcss** | ^3 | Utility-first CSS | Core — dark theme tokens |
| **@dnd-kit** | Various | Drag-and-drop photo reorder | PRO feature |
| **react-helmet-async** | Latest | Per-page SEO meta | Core |
| **sonner** | Latest | Toast notifications | Core |
| **Vite** | ^5 | Build tool + dev server | Core |

### Database Schema (All Applied)

All schema changes are in `database_schema.sql`. Key tables: User, Account, Collection, Photo, EditedPhoto, Selection, PromotionalPhoto, Download, AuditLog.

Key Collection fields: `shareId`, `deliveryToken`, `password`, `expiresAt`, `originalsCleanupAt`, `status` enum.
Key User fields: `plan`, `subscriptionStatus`, `trialEndsAt`, `stripeCustomerId` (unused).

### Infrastructure

| Component | Current | Notes |
|-----------|---------|-------|
| **Photo storage** | Cloudflare R2 (S3-compatible) | Via AWS SDK, keys: `collections/{id}/{photoId}.{ext}` |
| **Email** | PHPMailer (SMTP) | Verification + password reset only, no workflow notifications yet |
| **Auth** | PHP sessions + cookies | Cross-domain (.pixelforge.pro), SameSite=Lax, secure, httponly |
| **Queue system** | None | ZIPs generated on-demand via streaming. Not needed at current scale. |
| **CDN** | None | R2 served via PHP proxy. Direct R2 URLs possible future optimization. |
| **Payments** | None | Stripe SDK not yet installed. Schema fields ready. |

---

## Installation (All Done)

### Backend (Composer) — Already Installed

```bash
cd backend && composer install
```

Current `backend/composer.json` requires:
- `phpmailer/phpmailer: ^7.0`
- `aws/aws-sdk-php: ^3.0`
- `google/apiclient: ^2.16`
- `maennchen/zipstream-php: 3.0`
- `vlucas/phpdotenv: 5.5`

Autoloader included in `backend/index.php`: `require_once __DIR__ . '/vendor/autoload.php'`

### Frontend (npm) — Already Installed

```bash
cd frontend && npm install
```

### Database — Schema Applied

Full schema in `database_schema.sql` at project root. All tables and fields are live.

---

## Integration Points (All Implemented)

### 1. Delivery Token Generation (PHP) — IMPLEMENTED

**Location:** `backend/_collections/delivery.php`
**When:** Photographer transitions collection from REVIEWING → DELIVERED
**Note:** Uses `bin2hex(random_bytes(16))` for 128-bit hex tokens. Also auto-sets `originalsCleanupAt` (+7 days) and clears `coverPhotoId`.

**Pattern:**
```php
// In backend/collections/deliver.php (new handler)
function generateDeliveryToken() {
    return bin2hex(random_bytes(32)); // 64-char hex string
}

// POST /collections/{id}/deliver
// Requires session auth (photographer only)
session_start();
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

$collectionId = $uriParts[1]; // From /collections/{id}/deliver
$userId = $_SESSION['user_id'];

$pdo = getDbConnection();

// Verify ownership
$stmt = $pdo->prepare("SELECT * FROM Collection WHERE id = ? AND userId = ?");
$stmt->execute([$collectionId, $userId]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$collection) {
    http_response_code(404);
    exit;
}

// Generate delivery token
$deliveryToken = generateDeliveryToken();
$stmt = $pdo->prepare("
    UPDATE Collection
    SET status = 'DELIVERED', deliveryToken = ?, deliveredAt = NOW(3)
    WHERE id = ?
");
$stmt->execute([$deliveryToken, $collectionId]);

echo json_encode([
    'status' => 'success',
    'deliveryToken' => $deliveryToken,
    'deliveryUrl' => 'https://pixelforge.pro/delivery/' . $deliveryToken
]);
```

**Why this approach:**
- `random_bytes()` is cryptographically secure (uses OS CSPRNG)
- 32 bytes = 256 bits of entropy (far exceeds 128-bit security requirement)
- `bin2hex()` produces URL-safe tokens (0-9a-f charset, no escaping needed)
- No external dependencies—built into PHP 7+
- Faster than UUID generation libraries

**Security:**
- Token is stored in database, not exposed in logs
- HTTPS required for delivery URLs (already enforced on pixelforge.pro)
- Token length makes brute-force infeasible (2^256 possible values)

### 2. ZIP Streaming (PHP + ZipStream) — IMPLEMENTED

**Location:** `backend/_collections/zip-download.php`
**When:** Client clicks "Download All" on delivery page
**Note:** Streams directly from Cloudflare R2 via `r2GetStream()` — no local disk writes.

**Pattern:**
```php
// In backend/delivery/download-zip.php (new handler)
// GET /delivery/{token}/zip

require_once __DIR__ . '/../vendor/autoload.php';
use ZipStream\ZipStream;

$token = $uriParts[1]; // From /delivery/{token}/zip

// Validate token (no session required—public endpoint)
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    exit;
}

$pdo = getDbConnection();
$stmt = $pdo->prepare("
    SELECT * FROM Collection
    WHERE deliveryToken = ? AND status = 'DELIVERED'
");
$stmt->execute([$token]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$collection) {
    http_response_code(404);
    exit;
}

// Fetch edited photos
$stmt = $pdo->prepare("
    SELECT * FROM EditedPhoto
    WHERE collectionId = ?
    ORDER BY filename ASC
");
$stmt->execute([$collection['id']]);
$editedPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Disable output buffering (critical for streaming)
if (ob_get_level()) ob_end_clean();

// Stream ZIP directly to client
$zip = new ZipStream(
    outputName: $collection['name'] . '.zip',
    sendHttpHeaders: true,
);

foreach ($editedPhotos as $photo) {
    $filePath = __DIR__ . '/../uploads/' . $photo['storagePath'];
    if (file_exists($filePath)) {
        $zip->addFileFromPath(
            fileName: $photo['filename'],
            path: $filePath
        );
    }
}

$zip->finish();

// Track download (after streaming completes)
$stmt = $pdo->prepare("UPDATE Collection SET zipDownloadedAt = NOW(3) WHERE id = ?");
$stmt->execute([$collection['id']]);

exit;
```

**Why ZipStream-PHP:**
- **Memory-efficient:** Streams files one-by-one to output buffer, never loads entire ZIP into memory
- **No disk writes:** Unlike `ZipArchive`, doesn't create temp file on disk (important on Hostinger with limited disk quota)
- **Timeout-resistant:** Processes and sends chunks continuously, preventing PHP max_execution_time issues
- **Large file support:** Handles collections with 100+ photos totaling GB sizes
- **Active maintenance:** Latest version (3.2.0) released July 2025

**Alternative (ZipArchive):**
- Use only for small collections (<10 photos, <50MB total)
- Requires writing full ZIP to disk before streaming
- Simpler code, no Composer dependency
- Pattern:
  ```php
  $zipPath = sys_get_temp_dir() . '/collection_' . $collectionId . '.zip';
  $zip = new ZipArchive();
  $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
  foreach ($editedPhotos as $photo) {
      $zip->addFile($filePath, $photo['filename']);
  }
  $zip->close();

  header('Content-Type: application/zip');
  header('Content-Disposition: attachment; filename="' . $collection['name'] . '.zip"');
  header('Content-Length: ' . filesize($zipPath));
  readfile($zipPath);
  unlink($zipPath);
  ```

### 3. Individual Photo Download (PHP) — IMPLEMENTED

**Location:** `backend/_collections/photo-download.php`
**When:** Client clicks download icon on individual photo in delivery page
**Note:** Streams from R2 via `r2GetStream()`, tracks download in Download table via `download-tracker.php`.

**Pattern:**
```php
// In backend/delivery/download-photo.php (new handler)
// GET /delivery/{token}/photo/{photoId}

$token = $uriParts[1];
$photoId = $uriParts[3]; // From /delivery/{token}/photo/{photoId}

// Validate token
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    exit;
}

$pdo = getDbConnection();
$stmt = $pdo->prepare("
    SELECT c.*, ep.*
    FROM Collection c
    JOIN EditedPhoto ep ON ep.collectionId = c.id
    WHERE c.deliveryToken = ? AND ep.id = ? AND c.status = 'DELIVERED'
");
$stmt->execute([$token, $photoId]);
$result = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$result) {
    http_response_code(404);
    exit;
}

$filePath = __DIR__ . '/../uploads/' . $result['storagePath'];
if (!file_exists($filePath)) {
    http_response_code(404);
    exit;
}

// Send file with download headers
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . addslashes($result['filename']) . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: must-revalidate');
readfile($filePath);

// Track download
$stmt = $pdo->prepare("UPDATE EditedPhoto SET downloadedAt = NOW(3) WHERE id = ?");
$stmt->execute([$photoId]);

exit;
```

**Why this approach:**
- **Native PHP functions:** No dependencies, works on all PHP versions
- **Content-Disposition: attachment:** Forces browser download dialog (prevents inline display)
- **addslashes() on filename:** Prevents header injection if filename contains quotes
- **readfile():** Memory-efficient streaming for files <100MB (reads in 8KB chunks)
- **Post-download tracking:** Updates `downloadedAt` after file is served

**Security:**
- Token validation prevents unauthorized access
- JOIN ensures photoId belongs to collection (prevents photo enumeration)
- Status check ensures only DELIVERED collections allow downloads
- Direct file paths never exposed to client

### 4. Frontend Download Handling (React) — IMPLEMENTED

**Location:** `frontend/src/pages/DeliveryPage.jsx` + `frontend/src/utils/download.js`
**Note:** Uses anchor-click download helpers (no file-saver library). ZIP and individual downloads via native fetch.

#### Individual Photo Downloads

**Pattern:**
```javascript
// In frontend/src/pages/DeliveryPage.jsx
import { saveAs } from 'file-saver';

const downloadPhoto = async (photoId, filename) => {
  try {
    const response = await fetch(
      `${API_URL}/delivery/${deliveryToken}/photo/${photoId}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error('Download error:', error);
    // Show error toast via Sonner
  }
};

// In JSX
<button
  onClick={() => downloadPhoto(photo.id, photo.filename)}
  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
>
  Download
</button>
```

**Why file-saver:**
- **Cross-browser compatibility:** Handles Safari, Firefox, Edge filename quirks
- **Mature library:** Last update 2019 (feature-complete, no updates needed)
- **Simple API:** Single function call (`saveAs(blob, filename)`)
- **Small bundle size:** 1.5KB gzipped
- **No React-specific code:** Works with any framework

**Alternative (native download attribute):**
- Use only if you control file URLs and don't need Blob handling
- Pattern:
  ```jsx
  <a
    href={`${API_URL}/delivery/${deliveryToken}/photo/${photoId}`}
    download={filename}
    className="..."
  >
    Download
  </a>
  ```
- Limitation: Browser may open image inline instead of downloading (depends on Content-Type header)

#### ZIP Downloads (native Fetch + Blob)

**Pattern:**
```javascript
// In frontend/src/pages/DeliveryPage.jsx
const downloadZip = async (deliveryToken, collectionName) => {
  try {
    const response = await fetch(
      `${API_URL}/delivery/${deliveryToken}/zip`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('ZIP download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collectionName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('ZIP download error:', error);
    // Show error toast via Sonner
  }
};

// In JSX
<button
  onClick={() => downloadZip(deliveryToken, collection.name)}
  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-[10px]"
>
  Download All Photos
</button>
```

**Why native Fetch (no file-saver):**
- **No library needed:** Browser-native API, zero dependencies
- **Handles large files:** Blob-based approach works for multi-GB ZIPs
- **CORS support:** `credentials: 'include'` sends cookies for session auth
- **Cleanup:** `revokeObjectURL()` prevents memory leaks
- **Works in all modern browsers:** Chrome, Firefox, Safari, Edge

**Why not file-saver for ZIPs:**
- Same functionality as native approach, but adds dependency
- file-saver doesn't provide benefits for large Blob downloads

**Progress tracking (optional enhancement):**
```javascript
// Use ReadableStream for progress
const response = await fetch(url, { credentials: 'include' });
const reader = response.body.getReader();
const contentLength = +response.headers.get('Content-Length');

let receivedLength = 0;
const chunks = [];

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  chunks.push(value);
  receivedLength += value.length;

  const progress = (receivedLength / contentLength) * 100;
  setDownloadProgress(progress); // Update UI
}

const blob = new Blob(chunks);
// ... rest of download logic
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **maennchen/zipstream-php 3.2** | Native ZipArchive | Small collections (<10 photos, <50MB total). Simpler code, no Composer dependency. Write ZIP to `sys_get_temp_dir()`, stream with `readfile()`, then `unlink()`. |
| **random_bytes() + bin2hex()** | ramsey/uuid (UUID v4) | When UUID format is required for interoperability with external systems. Same entropy, but requires Composer dependency. |
| **file-saver** | Native `<a download>` attribute | When you control file URLs and backend sets correct Content-Disposition headers. Works for simple cases but less reliable for Blob downloads. |
| **Native Fetch + Blob** | axios library | When you already use axios for other API calls. Adds 13KB to bundle, but provides interceptor support and simpler error handling. |
| **On-demand ZIP generation** | Pre-generated ZIPs (stored in `processedZipPath`) | When edited photos rarely change after delivery. Generate once on transition to DELIVERED, store path in DB, serve directly with `readfile()`. Saves CPU but uses disk space. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **JWT library (firebase/php-jwt)** | Overkill for simple token validation. Plain random token with DB lookup is sufficient. | `random_bytes()` + bin2hex() with DB storage (already using) |
| **axios for downloads** | Adds 13KB dependency for functionality built into Fetch API. | Native Fetch with anchor-click download (already using) |
| **Pre-generating ZIPs on upload** | Wastes disk space, stale if photos change. | On-demand ZipStream from R2 (already using) |
| **uniqid() or mt_rand() for tokens** | NOT cryptographically secure. | `random_bytes()` (already using) |
| **Local filesystem for photos** | Doesn't scale, ties to single server. | Cloudflare R2 (already migrated) |
| **Raw fetch() for authenticated API calls** | Misses CSRF tokens, error handling. | Centralized `api.js` client (already using, except CSRF-exempt routes) |

---

## Current Implementation Patterns

### ZIP Downloads — Streaming from R2

All collections use ZipStream-PHP streaming from Cloudflare R2. No local disk writes. Handles any collection size.

**Location:** `backend/_collections/zip-download.php`
- Validates deliveryToken
- Fetches EditedPhoto records for the collection
- Streams each file from R2 directly into ZIP output
- Tracks download in Download table

### Delivery Link Expiry

**Current implementation:** `expiresAt` field on Collection table, checked on every share/delivery access.
- Backend returns 410 GONE if expired
- Frontend shows expiration message
- Photographer can update expiration date

**Missing:** No automated cron for cleanup of expired collections.

### Phase Components (Collection Details)

**Current implementation:** Separate React components per workflow phase:
- `DraftPhase.jsx` — upload zone (adapts: large when empty, compact when has photos)
- `SelectingPhase.jsx` — share link, selection stats
- `ReviewingPhase.jsx` — edited finals upload, selection review
- `DeliveredPhase.jsx` — delivery link, download stats

**Location:** `frontend/src/components/collection/`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| maennchen/zipstream-php@3.2 | PHP 8.0+ | Requires Composer 2.0+. For PHP 7.4, use v2.4 branch. Check PHP version: `php -v` on Hostinger. |
| maennchen/zipstream-php@2.4 | PHP 7.4–8.0 | Fallback version. Same streaming behavior, slightly different constructor syntax. |
| file-saver@2.0.5 | React 18, Vite 5 | No React-specific integration—works with plain JS. Import as ES module: `import { saveAs } from 'file-saver'`. |
| random_bytes() | PHP 7.0+ | Built-in, no version concerns. Fallback to `openssl_random_pseudo_bytes()` only if <PHP 7 (unlikely on Hostinger 2026). |

**PHP version on Hostinger (2026):**
- Most plans default to PHP 8.1 or 8.2
- Check via phpMyAdmin → Variables → `version`
- Or via `php -v` in SSH

**Composer on Hostinger:**
- Available on most plans
- Install via SSH: `curl -sS https://getcomposer.org/installer | php`
- Run with `php composer.phar install`

---

## Security Considerations

### Token Security

**Length:**
- 64 characters (32 bytes) = 256 bits of entropy
- Brute-force infeasible: 2^256 possible values
- Collision probability: negligible (birthday attack requires 2^128 attempts)

**Storage:**
- Store in database with UNIQUE constraint
- Index for fast lookup (`Collection_deliveryToken_idx`)
- Never log tokens in plain text (hash with SHA-256 before logging)

**Transmission:**
- HTTPS required (already enforced on pixelforge.pro)
- Tokens in URL path (not query string) for cleaner URLs
- Pattern: `/delivery/{token}` not `/delivery?token={token}`

**Validation:**
```php
// Validate format before DB query (prevents injection)
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    exit;
}
```

### Download Authentication

**Public delivery links:**
- No session required (token-based)
- Token proves authorization
- Check collection status = DELIVERED
- Check token exists and matches collection

**Photographer endpoints:**
- Require session auth (existing pattern)
- Check `$_SESSION['user_id']` matches `Collection.userId`

**CORS:**
- Already configured for cross-domain (pixelforge.pro ↔ api.pixelforge.pro)
- `credentials: 'include'` in Fetch for cookie transmission

### File Access Control

**Direct file access:**
- Block via `.htaccess` in `backend/uploads/`
- Pattern:
  ```apache
  # backend/uploads/.htaccess
  Options -Indexes
  Deny from all
  ```

**PHP proxy:**
- All downloads go through PHP handlers
- Token validation before `readfile()`
- Prevents direct URL guessing

**Path traversal:**
- Validate photoId exists in collection before serving
- Use prepared statements (prevents SQL injection)
- Never concatenate user input into file paths

**Example validation:**
```php
// SECURE: Validate photoId belongs to collection
$stmt = $pdo->prepare("
    SELECT * FROM EditedPhoto
    WHERE id = ? AND collectionId = ?
");
$stmt->execute([$photoId, $collectionId]);

// INSECURE: Don't do this
$filePath = __DIR__ . '/../uploads/' . $_GET['path']; // Path traversal risk!
```

---

## Performance Considerations

### ZIP Generation

**Small collections (<10 photos):**
- Generation time: <5 seconds
- Memory usage: <50MB
- Recommendation: Pre-generate and cache

**Large collections (50+ photos, >500MB):**
- Generation time: 30–60 seconds
- Memory usage: <100MB (with streaming)
- Recommendation: Stream on-demand, show progress indicator

**Timeout prevention:**
- Set `max_execution_time = 300` in `.htaccess` for ZIP endpoint
- ZipStream processes incrementally (no upfront wait)

### Download Tracking

**When to update:**
- Update `downloadedAt` AFTER file is served (not before)
- Use separate query (don't block download on tracking failure)
- Pattern:
  ```php
  readfile($filePath); // Serve file first

  // Track asynchronously (failure doesn't affect download)
  try {
      $stmt = $pdo->prepare("UPDATE EditedPhoto SET downloadedAt = NOW(3) WHERE id = ?");
      $stmt->execute([$photoId]);
  } catch (PDOException $e) {
      error_log("Download tracking failed: " . $e->getMessage());
  }
  ```

### Caching

**Delivery page:**
- Cache collection metadata for 5 minutes
- Pattern:
  ```php
  header('Cache-Control: public, max-age=300'); // 5 minutes
  ```

**Photo files:**
- Cache individual photos for 1 year
- Pattern:
  ```php
  header('Cache-Control: public, max-age=31536000'); // 1 year
  header('ETag: ' . md5_file($filePath));
  ```

**ZIP files:**
- Never cache (dynamic generation)
- Pattern:
  ```php
  header('Cache-Control: no-cache, must-revalidate');
  ```

---

## Sources

**PHP ZIP Generation:**
- [maennchen/ZipStream-PHP GitHub](https://github.com/maennchen/ZipStream-PHP) — Latest version, API documentation — HIGH confidence
- [maennchen/zipstream-php Packagist](https://packagist.org/packages/maennchen/zipstream-php) — Version 3.2.0 confirmed (July 2025) — HIGH confidence
- [PHP ZipArchive Manual](https://www.php.net/manual/en/class.ziparchive.php) — Native alternative documentation — HIGH confidence
- [How to Read Big Files with PHP (Without Killing Your Server) — SitePoint](https://www.sitepoint.com/performant-reading-big-files-php/) — Memory management best practices — MEDIUM confidence

**Token Generation:**
- [Generate a secure token with PHP | Texelate](https://www.texelate.co.uk/blog/generate-a-secure-token-with-php) — random_bytes() best practices — MEDIUM confidence
- [Generating cryptographically secure tokens - PHP | W3Docs](https://www.w3docs.com/snippets/php/generating-cryptographically-secure-tokens.html) — Security standards (NIST/FIPS) — MEDIUM confidence
- [Best practice to generate random token for forgot password | W3Docs](https://www.w3docs.com/snippets/php/best-practice-to-generate-random-token-for-forgot-password.html) — Token length recommendations — MEDIUM confidence
- [PHP random_bytes Manual](https://www.php.net/manual/en/function.random-bytes.php) — Official PHP documentation — HIGH confidence

**Frontend Downloads:**
- [file-saver npm](https://www.npmjs.com/package/file-saver) — Version 2.0.5 confirmed (stable since 2019) — HIGH confidence
- [React download file from API: A Guide | Filestack Blog](https://blog.filestack.com/efficient-file-download-react-exploring-api-integration/) — Modern download patterns — MEDIUM confidence
- [Binary File Downloads in JavaScript(React) | Medium](https://medium.com/@yashkhant24/binary-file-downloads-in-javascript-react-ec6a355fcacc) — Blob handling patterns — MEDIUM confidence
- [Programmatically downloading files in the browser | LogRocket](https://blog.logrocket.com/programmatically-downloading-files-browser/) — Native Fetch approach — HIGH confidence

**HTTP Headers:**
- [Content-Disposition header - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) — Standard reference — HIGH confidence
- [How to force file download with PHP? | TutorialsPoint](https://www.tutorialspoint.com/how-to-force-file-download-with-php) — PHP implementation — MEDIUM confidence

---

*Stack research for: Photo delivery and download management (v2.0 milestone)*
*Researched: 2026-02-13*
