# Stack Research — v2.0 Delivery & Download Features

**Domain:** Photo delivery and download management (v2.0 milestone additions)
**Researched:** 2026-02-13
**Confidence:** HIGH

---

## Context

This research covers ONLY the NEW stack additions needed for v2.0 milestone:

1. **Delivery link system** — Separate delivery token (distinct from selection shareId)
2. **ZIP download** — Stream all edited photos as ZIP archive
3. **Individual photo downloads** — Download single edited photos
4. **Download tracking** — Record when photos/ZIPs are downloaded
5. **UI polish** — Hide upload dropzone after first upload, reorganize buttons

**EXISTING stack (v1.0) — NOT researched here:**
- React 18 + Vite 5 + Tailwind CSS (frontend)
- Vanilla PHP + PDO + MySQL (backend)
- Token-based sharing (`shareId` for selection phase)
- File storage in `backend/uploads/` (local filesystem)
- GD-based thumbnail generation (400px JPEG)
- Collection status lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED

**What v2.0 does NOT include:**
- Cloud storage migration (S3/R2) — deferred to v3.0
- Email delivery notifications — deferred to v2.1
- Payment processing enhancements — separate milestone
- Queue system for ZIP generation — unnecessary at current scale

---

## Recommended Stack

### Backend (PHP) Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **maennchen/zipstream-php** | ^3.2 | Streaming ZIP generation | Industry standard for PHP ZIP creation without disk writes. Streams directly to client via output buffer, avoiding memory exhaustion and timeout issues. Works with local filesystem and PSR7 streams. Active maintenance (3.2.0 released July 2025). |
| **random_bytes() + bin2hex()** | Built-in (PHP 7+) | Delivery token generation | PHP's cryptographically secure CSPRNG. Meets NIST/FIPS standards for unpredictability. 32-byte input → 64-char hex token = 256 bits entropy. No external dependencies. |
| **readfile() with headers** | Built-in (PHP 7+) | Individual photo download proxy | Memory-efficient streaming for files <100MB. Use with `Content-Disposition: attachment` header to force browser download. Built-in, no library needed. |

### Frontend (React) Additions

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **file-saver** | ^2.0.5 | Client-side Blob download | For individual edited photo downloads. Handles cross-browser quirks (Safari, Firefox filename handling). Mature, stable library (last update 2019—feature-complete). |
| **Native Fetch + Blob** | Built-in | ZIP download handling | For large ZIP downloads, use native Fetch API with `response.blob()`. No library needed. Browser-native, handles CORS with `credentials: 'include'`, supports AbortController for cancellation. |

### Database Schema Additions

| Change | SQL Type | Purpose | Implementation |
|--------|----------|---------|----------------|
| `Collection.deliveryToken` | VARCHAR(64) UNIQUE | Separate delivery link token | Generated via `bin2hex(random_bytes(32))`. Nullable—only set when status transitions to DELIVERED. Indexed for fast lookup. |
| `Collection.deliveredAt` | DATETIME(3) | Track delivery timestamp | Set when status changes to DELIVERED. Used for expiry calculations (deliveredAt + 30 days). |
| `Collection.zipDownloadedAt` | DATETIME(3) | Track ZIP download | Updated when client downloads full ZIP. NULL = not yet downloaded. |
| `EditedPhoto.downloadedAt` | DATETIME(3) | Track individual downloads | Updated when client downloads individual photo. NULL = not yet downloaded. |

### No New Infrastructure Required

**What NOT to Add:**

| Technology | Why Avoid | Current Approach |
|------------|-----------|------------------|
| Cloud storage SDK (AWS SDK, Cloudflare SDK) | Premature—v2.0 uses local filesystem | Keep `backend/uploads/` storage. Defer S3/CloudFlare R2 to v3.0 when scaling needs emerge (>500GB storage). |
| Queue system (Redis, RabbitMQ, Beanstalkd) | Overkill for current scale | Generate ZIPs on-demand with streaming. Add queuing only if >100 collections/day or analytics show timeout issues. |
| Separate file server (Nginx static, CDN) | Unnecessary complexity for v2.0 | Serve files from same PHP backend. Nginx reverse proxy for static files is future optimization, not v2.0 blocker. |
| JWT library (firebase/php-jwt) | Overkill for simple token validation | Plain random token with DB lookup is faster, simpler, and sufficient for delivery links. |
| Email library (PHPMailer, SwiftMailer) | Not in v2.0 scope | Manual copy/paste of delivery link. Defer email notifications to v2.1. |

---

## Installation

### Backend (Composer)

```bash
cd backend
composer require maennchen/zipstream-php:^3.2
```

This adds to `backend/composer.json`:
```json
{
  "require": {
    "nelmio/cors-bundle": "^2.1",
    "maennchen/zipstream-php": "^3.2"
  }
}
```

Then add autoloader to `backend/index.php` (if not already present):
```php
require_once __DIR__ . '/vendor/autoload.php';
```

### Frontend (npm)

```bash
cd frontend
npm install file-saver@^2.0.5
```

This adds to `frontend/package.json`:
```json
{
  "dependencies": {
    "file-saver": "^2.0.5",
    // ... existing dependencies
  }
}
```

### Database Migration

```sql
-- Add delivery token and tracking columns to Collection table
ALTER TABLE `Collection`
  ADD COLUMN `deliveryToken` VARCHAR(64) NULL UNIQUE AFTER `shareId`,
  ADD COLUMN `deliveredAt` DATETIME(3) NULL AFTER `status`,
  ADD COLUMN `zipDownloadedAt` DATETIME(3) NULL AFTER `deliveredAt`,
  ADD INDEX `Collection_deliveryToken_idx` (`deliveryToken`);

-- Add download tracking to EditedPhoto table
ALTER TABLE `EditedPhoto`
  ADD COLUMN `downloadedAt` DATETIME(3) NULL AFTER `createdAt`;
```

**Migration notes:**
- Run on production via phpMyAdmin or `mysql` CLI
- `deliveryToken` is nullable—existing collections remain NULL until delivered
- UNIQUE constraint prevents token collisions
- Index on `deliveryToken` enables fast lookup for public delivery page

---

## Integration Points

### 1. Delivery Token Generation (PHP)

**When:** Photographer transitions collection from REVIEWING → DELIVERED

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

### 2. ZIP Streaming (PHP + ZipStream)

**When:** Client clicks "Download All" on delivery page

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

### 3. Individual Photo Download (PHP)

**When:** Client clicks download icon on individual photo in delivery page

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

### 4. Frontend Download Handling (React)

#### Individual Photo Downloads (file-saver)

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
| **JWT library (firebase/php-jwt)** | Overkill for simple token validation. Plain random token with DB lookup is faster, simpler, and sufficient for delivery links. | `random_bytes()` + bin2hex() with DB storage |
| **axios for downloads** | Adds 13KB dependency for functionality built into Fetch API. No benefit for file downloads. | Native Fetch with Blob |
| **Pre-generating ZIPs on upload** | Wastes disk space, slows upload, outdated if photos change. ZIP becomes stale if photographer re-uploads edited versions. | On-demand generation with streaming |
| **uniqid() or mt_rand() for tokens** | NOT cryptographically secure. Predictable under certain conditions. OWASP warns against using for access tokens. | `random_bytes()` (PHP's CSPRNG) |
| **Storing ZIPs in database as BLOB** | Extremely slow, bloats database, hits MySQL max_allowed_packet limit (~64MB default). | Stream from filesystem via PHP proxy |
| **chmod 777 on uploads/** | World-writable directories are attack vector on shared hosting. Allows malicious file creation. | `chmod 755` (owner write, group/other read) |

---

## Stack Patterns by Scenario

### Small Collections (<10 photos, <50MB)

**Backend:**
- Use native `ZipArchive` class (built-in PHP)
- Pre-generate ZIP on transition to DELIVERED
- Store path in `Collection.processedZipPath`
- Serve with `readfile()`

**Why:**
- Simpler code (no Composer dependency)
- Fast generation (<5 seconds)
- Low memory usage
- Can re-use ZIP for multiple downloads

**Pattern:**
```php
// POST /collections/{id}/deliver
$zipPath = __DIR__ . '/../uploads/zips/' . $collectionId . '.zip';
$zip = new ZipArchive();
$zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
foreach ($editedPhotos as $photo) {
    $zip->addFile(__DIR__ . '/../uploads/' . $photo['storagePath'], $photo['filename']);
}
$zip->close();

// Store path
$stmt = $pdo->prepare("UPDATE Collection SET processedZipPath = ? WHERE id = ?");
$stmt->execute(['zips/' . $collectionId . '.zip', $collectionId]);
```

### Large Collections (10+ photos or >50MB)

**Backend:**
- Use `maennchen/zipstream-php`
- Stream directly to client (no disk writes)
- Track download completion via `zipDownloadedAt`

**Why:**
- Prevents timeout (no upfront generation wait)
- Prevents memory exhaustion (streams in chunks)
- Saves disk space (no stored ZIP file)
- Scales to hundreds of photos

**Pattern:** See "ZIP Streaming" section above

### Delivery Link Expiry

**Implementation:**
- Check `deliveredAt` timestamp on delivery page load
- If `deliveredAt + 30 days < NOW()`, show expired message
- Allow photographer to regenerate link (updates `deliveredAt`, keeps same `deliveryToken`)

**Pattern:**
```php
// GET /delivery/{token}
$stmt = $pdo->prepare("SELECT * FROM Collection WHERE deliveryToken = ?");
$stmt->execute([$token]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);

$expiryDays = 30; // Could vary by user plan (FREE_TRIAL: 7, STANDARD: 30, PRO: 90)
$expiresAt = strtotime($collection['deliveredAt']) + ($expiryDays * 86400);

if (time() > $expiresAt) {
    http_response_code(410); // Gone
    echo json_encode(['error' => 'Delivery link expired']);
    exit;
}
```

**Why time-based expiry:**
- No cron jobs needed
- Configurable per plan
- Photographer can extend by updating `deliveredAt`

### UI Polish Patterns

#### Hide Upload Dropzone After First Upload

**Pattern:**
```jsx
// In CollectionDetailsPage.jsx
const [hasPhotos, setHasPhotos] = useState(collection.photos.length > 0);

// After successful upload
const handleUploadSuccess = (newPhoto) => {
  setPhotos([...photos, newPhoto]);
  setHasPhotos(true);
};

// In JSX
{!hasPhotos && (
  <div className="border-2 border-dashed border-gray-300 rounded-[10px] p-8">
    <Dropzone onUpload={handleUploadSuccess} />
  </div>
)}

{hasPhotos && (
  <button onClick={() => setHasPhotos(false)} className="text-sm text-gray-500">
    + Add more photos
  </button>
)}
```

#### Button Reorganization

**Before (v1.0):** All actions in single row
**After (v2.0):** Group by phase

**Pattern:**
```jsx
// Collection details page — photographer view
<div className="flex flex-col gap-4">
  {/* Phase 1: Upload & Setup */}
  <div className="flex gap-2">
    <button onClick={handleUpload}>Upload Photos</button>
    <button onClick={handleSetCover}>Set Cover Photo</button>
  </div>

  {/* Phase 2: Sharing */}
  <div className="flex gap-2">
    <button onClick={handleShare}>Share for Selection</button>
    <button onClick={handleCopyShareLink}>Copy Link</button>
  </div>

  {/* Phase 3: Delivery */}
  {collection.status === 'REVIEWING' && (
    <button onClick={handleDeliver} className="bg-green-500">
      Mark as Delivered
    </button>
  )}

  {collection.status === 'DELIVERED' && (
    <button onClick={handleCopyDeliveryLink}>Copy Delivery Link</button>
  )}
</div>
```

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
