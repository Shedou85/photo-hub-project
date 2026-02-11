# Stack Research

**Domain:** Photographer photo delivery web app — file uploads, token-based sharing, photo selection, ZIP delivery
**Researched:** 2026-02-11
**Confidence:** HIGH (PHP primitives), HIGH (React libraries), MEDIUM (version specifics — verified against npm/packagist as of research date)

---

## Context

This research covers the four new capability dimensions being added to an existing React 18 + vanilla PHP + MySQL app:

1. **File uploads** — chunked multipart uploads from photographer to server (PHP backend, local `backend/uploads/` on Hostinger)
2. **Server-side ZIP generation** — PHP streams ZIP archives to client without temp disk usage
3. **Token-based public URL access** — no-auth client links using a cryptographically secure token in the URL
4. **Responsive photo grid viewer** — React component for client-facing gallery (grid + fullscreen/lightbox)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PHP `random_bytes()` + `bin2hex()` | Built-in (PHP 7.x+) | Secure share token generation | Cryptographically secure CSPRNG, built into PHP — no library needed. `uniqid()` and `rand()` are insecure and must not be used for access tokens. 32-byte hex = 64-char token = 256 bits entropy, URL-safe without encoding. |
| PHP `finfo_file()` + extension whitelist | Built-in (PHP 7.x+) | Server-side MIME type validation on upload | Client-supplied `$_FILES['type']` is trivially spoofed. `finfo` inspects file magic bytes. Combined with an extension whitelist (jpg, jpeg, png, webp), this is the correct 2025 approach. |
| PHP `move_uploaded_file()` | Built-in | Move uploaded file from temp to uploads dir | The only safe way to move uploaded files in PHP — validates the file came from an HTTP upload, preventing path traversal and temp-file injection attacks. |
| `maennchen/zipstream-php` | ^3.1 | Stream ZIP archives to browser without writing to disk | Unlike `ZipArchive` (which requires the full file on disk), ZipStream writes directly to the output buffer chunk by chunk. Avoids disk quota consumption on Hostinger and prevents timeout on large archives. Requires Composer. |
| PHP GD Library | Built-in extension | Server-side JPEG thumbnail generation for photo previews | GD is universally available on Hostinger shared hosting. Sufficient for JPEG/PNG/WebP resize to thumbnail dimensions. Imagick is superior in quality but may not be available on all Hostinger plans. GD is the safe default. |
| `react-photo-album` | ^3.4 | Responsive justified/masonry photo grid (React) | Actively maintained (v3 released 2024, v3.4 current). Solves the hard problem of justified row layout (Knuth-Plass algorithm). SSR-compatible. Works with React 18. Composable — renders custom wrappers per photo, which is essential for adding selection checkboxes and preventing right-click download. |
| `yet-another-react-lightbox` | ^3.25 | Fullscreen photo lightbox viewer (React) | The standard choice for React lightboxes in 2025. Performant (virtualized slide rendering), keyboard/touch/mouse navigation, plugin architecture (Thumbnails, Zoom, Slideshow plugins). Works with React 16.8–19. Pairs naturally with react-photo-album. |
| `react-dropzone` | ^15.0 | Drag-and-drop file upload zone (React) | Minimal, well-maintained (15.0 released Feb 2026). Handles drag-over UI, file type filtering, multiple file acceptance. Returns `File` objects — pairs with custom fetch-based chunked uploader. No dependency on a specific upload protocol. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@uppy/core` + `@uppy/react` + `@uppy/xhr-upload` | ^5.2 | Full-featured upload UI with progress, retry, resumable uploads | Use instead of custom chunked uploader + react-dropzone **only if** resumable (pause/resume mid-upload) is a hard requirement. Uppy 5.x is headless-capable and React 18 compatible. Adds ~120KB to bundle. For this app (photos up to ~50MB), a simple chunked XHR approach with react-dropzone is sufficient and lighter. |
| PHP `imagick` extension | System | Higher-quality thumbnail generation, RAW format support | Use over GD if Hostinger plan includes the `imagick` PHP extension. Better JPEG color fidelity, supports TIFF/RAW. Check availability with `extension_loaded('imagick')`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `composer` | Install PHP dependencies (`zipstream-php`) | Run `composer require maennchen/zipstream-php ^3.1` from `backend/`. Generates `vendor/` — add to `.gitignore`. Autoloader must be included via `require __DIR__ . '/vendor/autoload.php'` in `index.php`. |
| Vite dev server proxy | Forward `/api/*` to PHP backend during local development | Already configured in `frontend/vite.config.js`. No changes needed for upload routes. |

---

## Installation

### Frontend

```bash
# From frontend/ directory
npm install react-photo-album yet-another-react-lightbox react-dropzone
```

### Backend

```bash
# From backend/ directory
composer require maennchen/zipstream-php "^3.1"
```

---

## Implementation Patterns

### 1. Token-Based Public URL Access (PHP)

**Generate token on collection share:**
```php
// In backend — generate share token
$shareToken = bin2hex(random_bytes(32)); // 64-char hex, 256-bit entropy
// Store in Collection.shareToken column (VARCHAR 64, UNIQUE, nullable)
// URL becomes: https://pixelforge.pro/c/{shareToken}
```

**Validate token on public endpoint:**
```php
// In backend — verify token, no session required
$token = $_GET['token'] ?? '';
if (empty($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400); exit;
}
$stmt = $pdo->prepare('SELECT * FROM Collection WHERE shareToken = ? AND status != "ARCHIVED"');
$stmt->execute([$token]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$collection) { http_response_code(404); exit; }
```

**Key rule:** Token endpoint must NOT check `$_SESSION['user_id']`. It is deliberately public.

### 2. Chunked File Upload (PHP backend handler)

The approach: client sends chunks as individual POST requests with `X-Chunk-Index` and `X-Total-Chunks` headers. PHP appends each chunk to a temp assembly file, then moves to final location on last chunk.

```php
// POST /collections/{id}/upload
// Headers: X-Chunk-Index, X-Total-Chunks, X-File-Name, X-Collection-Id
$chunkIndex = (int)$_SERVER['HTTP_X_CHUNK_INDEX'];
$totalChunks = (int)$_SERVER['HTTP_X_TOTAL_CHUNKS'];
$originalName = $_SERVER['HTTP_X_FILE_NAME'] ?? '';

// Sanitize filename — never use client-provided name directly
$safeId = bin2hex(random_bytes(8)); // unique ID for this upload
$tempPath = sys_get_temp_dir() . '/photohub_' . $safeId . '.tmp';

// Validate MIME on first chunk
if ($chunkIndex === 0) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $_FILES['chunk']['tmp_name']);
    finfo_close($finfo);
    $allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($mime, $allowed, true)) {
        http_response_code(422); exit;
    }
}

// Append chunk to temp assembly file
$chunkData = file_get_contents($_FILES['chunk']['tmp_name']);
file_put_contents($tempPath, $chunkData, FILE_APPEND | LOCK_EX);

// On last chunk: finalize
if ($chunkIndex === $totalChunks - 1) {
    $finalName = bin2hex(random_bytes(16)) . '.jpg'; // always use generated name
    $finalPath = __DIR__ . '/../uploads/' . $collectionId . '/' . $finalName;
    rename($tempPath, $finalPath);
    // Insert Photo record, generate thumbnail via GD, respond 201
}
```

**Important:** Use `LOCK_EX` on `file_put_contents` to prevent concurrent write corruption. Pass `sys_get_temp_dir()` for temp file — do not write chunks inside `backend/uploads/` until assembly is complete.

### 3. Server-Side ZIP Generation (PHP + ZipStream)

```php
// GET /collections/{id}/download?token={shareToken}
// Verify token, verify collection status === 'DELIVERED', then stream

require __DIR__ . '/vendor/autoload.php';
use ZipStream\ZipStream;

// Disable output buffering before streaming
if (ob_get_level()) ob_end_clean();

$zip = new ZipStream(
    outputName: $collectionName . '.zip',
    sendHttpHeaders: true,
);

foreach ($editedPhotos as $photo) {
    $filePath = __DIR__ . '/../uploads/' . $photo['path'];
    if (file_exists($filePath)) {
        $zip->addFileFromPath(
            fileName: basename($filePath),
            path: $filePath,
        );
    }
}
$zip->finish();
exit;
```

**Key rule:** Set `Content-Disposition: attachment` and `Content-Type: application/zip` headers before starting. ZipStream does this via `sendHttpHeaders: true`. Never buffer the full ZIP in memory.

### 4. React Photo Grid + Lightbox Integration

```jsx
// Client-facing photo viewer — selection mode
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Prevent right-click download during SELECTING stage
const renderPhoto = ({ photo, imageProps }) => (
  <div
    onClick={() => handlePhotoClick(photo)}
    onContextMenu={(e) => e.preventDefault()} // disable right-click
    className="relative cursor-pointer"
  >
    <img {...imageProps} draggable={false} />
    {isSelected(photo.id) && (
      <div className="absolute inset-0 ring-4 ring-blue-500 rounded" />
    )}
  </div>
);

<RowsPhotoAlbum
  photos={photos}
  render={{ photo: renderPhoto }}
  onClick={({ photo }) => setLightboxIndex(photos.indexOf(photo))}
/>

<Lightbox
  open={lightboxIndex >= 0}
  index={lightboxIndex}
  slides={photos.map(p => ({ src: p.src }))}
  close={() => setLightboxIndex(-1)}
/>
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `maennchen/zipstream-php` | PHP `ZipArchive` (built-in) | Use ZipArchive only if you need to create the ZIP file on disk for re-use (e.g., caching). Never for streaming — it requires the full file to exist before delivery and will exhaust disk quota on Hostinger. |
| `react-photo-album` v3 | `react-photo-gallery` | react-photo-gallery is unmaintained (last commit 2021). Do not use. react-photo-album was built as its successor. |
| `react-photo-album` v3 | `react-grid-gallery` | Includes its own lightbox (Lightbox.js based). Use if you want a single self-contained package with fewer customization requirements. Less composable for custom selection overlays. |
| `yet-another-react-lightbox` | `lightgallery/react` | Use lightgallery if you need video support, share buttons, or built-in social sharing. Heavier bundle (~200KB). For photo-only, yet-another-react-lightbox is lighter and more actively developed. |
| `react-dropzone` | `@uppy/react` (full Uppy) | Use Uppy if you need resumable uploads (Tus protocol), a built-in upload progress UI, or integration with cloud storage (S3, Cloudflare R2). Overkill for direct-to-PHP uploads of photographer photos. |
| PHP `random_bytes()` | UUID v4 (ramsey/uuid) | Use ramsey/uuid if you need UUID format for interoperability with other systems. For internal share tokens, `bin2hex(random_bytes(32))` is simpler, has the same entropy, and requires no Composer dependency. |
| PHP GD | Imagick PHP extension | Use Imagick if available on your Hostinger plan and you need RAW format support, TIFF, or high-quality CMYK handling. Always check `extension_loaded('imagick')` at runtime to fall back gracefully. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-photo-gallery` (npm) | Unmaintained since 2021. No React 18 support. Open issues unresolved. | `react-photo-album` v3 |
| `$_FILES['file']['type']` for MIME validation | Client-controlled header — trivially spoofed. Allows upload of malicious files disguised as images. | `finfo_file()` on the actual temp file |
| `rand()`, `mt_rand()`, `uniqid()` for tokens | Not cryptographically secure. Predictable under certain conditions. OWASP explicitly warns against these for access tokens. | `bin2hex(random_bytes(32))` |
| `ZipArchive` (PHP built-in) for streaming downloads | Writes complete ZIP to disk before streaming. On Hostinger, this will exhaust disk quota for large collections. No streaming support. | `maennchen/zipstream-php` |
| Storing original client filenames in filesystem paths | Path traversal risk, encoding issues, collision risk. Also leaks client system info. | Generate a new filename with `bin2hex(random_bytes(16))` at upload time. Store original name only in DB. |
| `chmod(777)` on uploads directory | World-writable directories are a common attack vector on shared hosting. | Set `backend/uploads/` to `755` (owner write, group/other read-execute). Apache user must own the directory. |
| Uppy with Tus for this use case | Tus requires a stateful server-side resumable upload protocol implementation. No vanilla PHP Tus server library is actively maintained. The complexity is unjustified for photos under ~100MB. | Custom chunked XHR via `react-dropzone` + fetch |

---

## Stack Patterns by Variant

**If photos are under 10MB each (typical JPEG for web delivery):**
- Skip chunked upload entirely. Single multipart POST via `fetch` with `FormData` is sufficient.
- PHP `upload_max_filesize` and `post_max_size` set to `15M` in `php.ini` / `.htaccess`.
- Simpler backend handler, no temp assembly needed.

**If photos are 20–100MB each (high-res RAW-processed TIFFs/JPEGs):**
- Use chunked upload (8MB chunks). Avoids Hostinger's PHP `max_execution_time` ceiling.
- Set `max_execution_time = 300` in `.htaccess` for the upload endpoint.
- Store chunk assembly state in DB (chunk count received) to support detection of incomplete uploads.

**If client needs to view photos before selection is available:**
- Add a `BROWSING` status or a separate `browsingToken` column. Use same token validation pattern.

**If photographer delivers photos outside this app (e.g., WeTransfer):**
- Skip EditedPhoto upload and ZIP features for initial milestone. `shareToken` still valid for selection phase.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `react-photo-album@^3.4` | React 18.x | v3 is ESM-only. No CommonJS. Vite handles this correctly. Ensure `"type": "module"` in package.json (already set). |
| `yet-another-react-lightbox@^3.25` | React 16.8–19 | Fully compatible with React 18. Peer dependency: `react` and `react-dom`. No additional CSS-in-JS required. |
| `react-dropzone@^15.0` | React 16.8+ | React 18 compatible. Uses hooks internally. |
| `maennchen/zipstream-php@^3.1` | PHP 8.1+ | v3.x requires PHP 8.1+. If Hostinger runs PHP 8.0, use `^2.4` (PHP 7.4+ compatible). Verify with `php -v` on Hostinger. |
| `maennchen/zipstream-php@^2.4` | PHP 7.4–8.0 | Fallback version. Same API surface, slightly different constructor syntax. |
| PHP GD (thumbnail generation) | PHP 7.4+ | GD is bundled with PHP on Hostinger. Verify with `phpinfo()` or `gd_info()`. WebP support requires GD compiled with `--with-webp`. |

---

## Security Notes for Hostinger (Shared Hosting Specific)

1. **`backend/uploads/` must not be web-accessible for original files.** Add `.htaccess` to `backend/uploads/` with `Options -Indexes` and deny direct access. Serve files through a PHP proxy that validates session or token before streaming.
2. **Thumbnails can be web-accessible** (they contain no private data). Store at `backend/uploads/thumbs/` with direct URL access allowed.
3. **Upload directory permissions:** Owner-writable only (`chmod 755` on directories, `644` on files). Apache runs as the same user on most Hostinger plans.
4. **PHP memory limit for ZIP:** `memory_limit = 256M` recommended in `.htaccess` for ZIP generation handler. ZipStream does not buffer the full archive, but PHP itself needs headroom.
5. **Session vs token endpoints:** A single `backend/cors.php` + session init runs for all routes. Token-based endpoints must not call `session_start()` — or if they do, must not check `$_SESSION['user_id']` for authorization. Make this explicit in handler comments.

---

## Sources

- [npmjs.com — yet-another-react-lightbox](https://www.npmjs.com/package/yet-another-react-lightbox) — version 3.25.0 confirmed current
- [npmjs.com — react-photo-album](https://www.npmjs.com/package/react-photo-album) — version 3.4.0 confirmed current
- [npmjs.com — react-dropzone](https://www.npmjs.com/package/react-dropzone) — version 15.0.0 confirmed current (published ~Feb 2026)
- [npmjs.com — @uppy/core, @uppy/react](https://www.npmjs.com/package/@uppy/core) — version 5.2.0 (evaluated and deferred)
- [packagist.org — maennchen/zipstream-php](https://packagist.org/packages/maennchen/zipstream-php) — v3.x stable; v2.4 for PHP <8.1
- [yet-another-react-lightbox.com](https://yet-another-react-lightbox.com/) — official docs, plugin system verified
- [react-photo-album.com](https://react-photo-album.com/) — layout algorithms and SSR support verified
- [Chunked File Uploads in Native PHP — Roman Huliak / Medium](https://roman-huliak.medium.com/chunked-file-uploads-in-native-php-for-large-files-800mb-dbf6228d8434) — vanilla PHP chunked assembly pattern
- [Handle a chunked uploader server-side (PHP) — Accreditly](https://accreditly.io/articles/handle-a-chunked-uploader-server-side-in-php) — server-side pattern
- [ZipStream-PHP GitHub — maennchen](https://github.com/maennchen/ZipStream-PHP) — streaming ZIP without temp file
- [PHP Security Best Practices 2025 — HackMD](https://hackmd.io/tCKn60evTsWxNIWDAwnqVQ) — MIME validation, token generation
- [PortSwigger Web Security — File Uploads](https://portswigger.net/web-security/file-upload) — upload vulnerability classes
- [PHP Manual — random_bytes](https://www.php.net/manual/en/function.random-bytes.php) — CSPRNG built-in
- [PHP Manual — ZipArchive](https://www.php.net/manual/en/class.ziparchive.php) — limitations documented (no streaming)
- [Uppy 5.0 announcement](https://uppy.io/blog/uppy-5.0/) — headless components, evaluated and deferred

---

*Stack research for: photographer photo delivery web app — file uploads, token sharing, photo selection, ZIP delivery*
*Researched: 2026-02-11*
