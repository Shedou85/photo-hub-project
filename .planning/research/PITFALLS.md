# Pitfalls Research

**Domain:** Photo delivery / client gallery app — PHP file uploads, token-based sharing, download protection, server-side ZIP, React photo viewer
**Researched:** 2026-02-11
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Files Stored in a Web-Accessible Directory

**What goes wrong:**
Photos uploaded to `backend/uploads/` are served directly by Apache via URL. Any person who knows — or guesses — the file path (e.g. `https://api.pixelforge.pro/backend/uploads/abc123.jpg`) can download it without any authentication or token check. All download-protection logic in PHP becomes irrelevant if the files themselves are directly reachable.

**Why it happens:**
Developers store files in a folder under the web root for convenience and immediately test that uploads "work" by visiting the URL. They implement download protection later — but the direct URL path is never closed.

**How to avoid:**
Store uploads *outside* the Apache document root or block direct access with `.htaccess`. Two options for this project:
- Move `uploads/` to a sibling of the web root (e.g. `/home/user/uploads/`) so Apache never serves it directly.
- If the directory must stay in the web root, add a `.htaccess` file inside `backend/uploads/` that denies all direct requests:
  ```apache
  Options -Indexes
  deny from all
  ```
  Then serve every file through a PHP proxy script (`/download?token=...`) that validates the token and status before reading the file with `readfile()`.

**Warning signs:**
- You can open `https://api.pixelforge.pro/backend/uploads/somefile.jpg` in a browser and the photo appears without any token in the URL.
- Apache directory listing is enabled (`Options +Indexes`) on the uploads folder.

**Phase to address:**
Phase 1 (Photo Upload) — before any photos are uploaded to production. Fix the directory access policy before writing a single upload handler.

---

### Pitfall 2: Token-Based Sharing With Guessable or Reusable Tokens

**What goes wrong:**
If `shareId` (the `Collection.shareId` column) is generated with a weak source of randomness — or if it is the same as the collection's primary `id` — attackers can enumerate or guess valid share links. Additionally, if a token never expires and is never revokable, a photographer cannot invalidate a link once shared.

**Why it happens:**
Developers reuse the collection `id` as the share token (already a CUID in this schema — which is fine for uniqueness but was not designed as a secret). Or they generate tokens with `rand()` or `mt_rand()` which are not cryptographically random.

**How to avoid:**
- Generate `shareId` with `bin2hex(random_bytes(24))` (48 hex chars). This is cryptographically random and not guessable.
- Never expose the internal collection `id` in the public-facing client URL — use only `shareId`.
- The `Collection.expiresAt` column already exists in the schema: enforce expiry in every PHP handler that accepts a `shareId`. Return 410 Gone when expired.
- Add a "Regenerate link" action for photographers to invalidate the old `shareId` and create a new one.

**Warning signs:**
- The public collection URL contains the same ID that appears in the photographer's `/collection/:id` route.
- Token generation uses PHP's `rand()`, `mt_rand()`, `uniqid()`, or any non-cryptographic function.
- `expiresAt` column is never read in the share-token validation handler.

**Phase to address:**
Phase 2 (Token-Based Sharing) — validate token generation and expiry enforcement before the feature ships.

---

### Pitfall 3: Download Protection Enforced Only by the Frontend

**What goes wrong:**
The React app hides download buttons or disables right-click during the SELECTING stage. A client opens DevTools, finds the direct photo URL from a `<img src="...">` tag or a network request, and downloads every photo. The protection is entirely cosmetic.

**Why it happens:**
Frontend download blocking is easy to implement and looks correct during demos. Developers assume users won't inspect network traffic. The actual file URL is always visible to the browser.

**How to avoid:**
Every photo served during SELECTING must be delivered through a PHP proxy endpoint that checks collection status before streaming:

```php
// GET /photo?id=<photoId>&token=<shareId>
// 1. Look up collection via shareId — verify status != DELIVERED for raw photos
// 2. If status is SELECTING/REVIEWING, return 403 for direct download requests
// 3. Only stream the image bytes when the request is a browser display (not download)
```

For the viewer to show images without allowing download:
- Serve photos as data-URI blobs through the PHP endpoint (adds latency but prevents URL leakage).
- Or use a short-lived signed token per request so the URL in the `<img src>` expires after seconds — making saved URLs useless.
- Set `Content-Disposition: inline` (not `attachment`) and `X-Content-Type-Options: nosniff` to prevent the browser treating the response as a download.
- The `<img>` element naturally prevents "Save image" from saving the original-resolution file only when you serve a lower-resolution proxy — serve thumbnails for the viewer grid and fullscreen, never the original during SELECTING.

**Warning signs:**
- Photo URLs in network requests during SELECTING point directly to `uploads/` with no token.
- Right-click disable is implemented in JavaScript on the photo grid.
- No server-side check of collection status when a photo is requested.

**Phase to address:**
Phase 3 (Client Selection Workflow) — must be enforced at the PHP level before the selection feature is considered done. Frontend UI changes alone do not count.

---

### Pitfall 4: PHP File Upload Accepting Dangerous Files

**What goes wrong:**
The upload handler trusts the MIME type sent by the browser (`$_FILES['file']['type']`) or only checks the file extension. An attacker uploads a PHP file named `shell.php.jpg` or a JPEG with embedded PHP code. When the file is later served (or if PHP processing is enabled in the uploads directory), the attacker achieves remote code execution.

**Why it happens:**
`$_FILES['file']['type']` is browser-supplied and trivially spoofable. Extension checks on `$_FILES['file']['name']` can be bypassed with double extensions.

**How to avoid:**
- Validate MIME type server-side using `finfo_file()` (reads actual file magic bytes, not browser header).
- Whitelist only: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Strip the original filename entirely — generate a new random filename with a safe extension derived from the validated MIME type (e.g. `bin2hex(random_bytes(16)) . '.jpg'`). Never use the client-supplied filename.
- Add `php_flag engine off` to `backend/uploads/.htaccess` to disable PHP execution in the uploads directory even if a PHP file is somehow saved there.
- Validate file size server-side (`$_FILES['file']['size']`) before saving — do not rely only on `upload_max_filesize` in `php.ini`.

**Warning signs:**
- Upload handler uses `$_FILES['file']['type']` without `finfo_file()` verification.
- Stored filename is derived from `$_FILES['file']['name']` even partially.
- No `.htaccess` with `php_flag engine off` in the uploads directory.

**Phase to address:**
Phase 1 (Photo Upload) — validate and harden before the first file is accepted in any environment.

---

### Pitfall 5: Server-Side ZIP Generation Timing Out or Exhausting Memory on Shared Hosting

**What goes wrong:**
A photographer delivers 200 high-resolution JPEG files (~5 MB each = ~1 GB). The PHP ZIP handler reads all files into memory or processes them sequentially within a single HTTP request. The request times out (Hostinger shared hosting default: 30–60 seconds), or PHP hits its memory limit, and the client receives an error with a partial or no ZIP.

**Why it happens:**
PHP's `ZipArchive` is simple to use for small file sets. Developers test with 5–10 photos and ship it. Real deliveries have 50–300 files. Shared hosting does not allow increasing `max_execution_time` or `memory_limit` beyond platform caps.

**How to avoid:**
- Use streaming ZIP generation with `ZipStream-PHP` (maennchen/zipstream-php) or implement chunked streaming with PHP's `ZipArchive` + `ob_flush()` / `flush()` to keep the connection alive while writing.
- Add `set_time_limit(0)` and `ini_set('memory_limit', '256M')` at the start of the ZIP handler (these work even on shared hosting within reason).
- For very large collections: generate the ZIP asynchronously. Store the path in `Collection.processedZipPath` (this column already exists in the schema). The client polls a `/zip-status?token=...` endpoint; when ready, they download the pre-built file. Trigger ZIP generation when the photographer marks the collection as DELIVERED.
- Alternatively, generate the ZIP progressively: each time an EditedPhoto is uploaded, append it to a persistent ZIP file on disk rather than building it all at once on demand.
- Set `Apache TimeOut` and `php_value max_execution_time` in `.htaccess` if Hostinger allows per-directory config.

**Warning signs:**
- ZIP handler reads every file with `file_get_contents()` or `addFromString()` instead of `addFile()` (which streams from disk).
- No `set_time_limit(0)` in the ZIP handler.
- `Collection.processedZipPath` column is never used and ZIP is always generated on-demand.
- Testing done only with 3–5 small test images.

**Phase to address:**
Phase 5 (ZIP Delivery) — validate with a realistic data set (50+ files, 10+ MB each) on the actual Hostinger environment before marking the phase done.

---

### Pitfall 6: Serving Full-Resolution Images in the React Grid Viewer

**What goes wrong:**
The photo grid renders `<img src="/photo?id=...">` pointing to the original uploaded files (5–25 MB JPEG each). Loading a collection of 80 photos triggers 80 parallel requests each fetching megabytes of data. The page hangs, the mobile experience is broken, and Hostinger bandwidth limits are hammered on every page load.

**Why it happens:**
Thumbnails require server-side image processing (GD or ImageMagick), which adds complexity. Developers defer this to "later" but the grid is built against the full-resolution endpoint — and "later" never comes.

**How to avoid:**
Generate thumbnails on upload. In the PHP upload handler, after saving the original, use GD (`imagecreatefromjpeg` + `imagecopyresampled` + `imagejpeg`) to write a `_thumb.jpg` at 400px wide. Store both paths in the `Photo` table (or derive the thumb path by convention). The grid always loads thumbnails; the fullscreen lightbox loads the original (and only when opened).

Fallback if GD is unavailable: serve photos through a proxy endpoint that accepts a `?w=400` parameter and resizes on the fly with caching (store the resized version on first request).

**Warning signs:**
- Photo grid `<img>` elements request the same endpoint as the fullscreen lightbox.
- No `_thumb` or `/thumbnail/` path exists in the Photo `storagePath` column values.
- Page load with 20+ photos takes more than 3 seconds on a reasonable connection.

**Phase to address:**
Phase 1 (Photo Upload) — generate thumbnails at upload time. Retrofitting thumbnails for existing photos is expensive.

---

### Pitfall 7: CORS and Cookie Configuration Breaking the Token-Based Public Route

**What goes wrong:**
The existing session cookie is configured with `SameSite=None; Secure; Domain=.pixelforge.pro`. Authenticated photographer pages work because the browser sends the cookie on cross-domain requests. But the public client view (accessed via share token, no login) hits CORS issues because the browser sends a preflight for the OPTIONS request, the PHP backend responds with CORS headers only for whitelisted origins, and the client's browser (on a different domain or no domain) gets blocked.

**Why it happens:**
CORS is set up for the `pixelforge.pro` ↔ `api.pixelforge.pro` pair. The public share page is accessed from `pixelforge.pro` (same pair, so this works), but during development from `localhost:5173` — which is already whitelisted. The real risk is if the client URL is ever served from a different subdomain or if the OPTIONS preflight handler is missing for new endpoints.

**How to avoid:**
- Every new PHP endpoint must include `backend/cors.php` before any output. Verify with browser DevTools that OPTIONS preflights return `200` and the correct `Access-Control-Allow-Methods` header.
- The public share endpoints (those authenticated by `shareId` token rather than PHP session) must not require a session cookie. Confirm that `session_start()` is not mandatory for public endpoints — or that missing sessions are handled gracefully without a 500 error.
- Test the public share URL from an incognito window on a device with no existing session to confirm it loads without auth errors.

**Warning signs:**
- New endpoint added to `backend/index.php` without a corresponding `require_once 'cors.php'` at the top of the handler.
- Public share page fails to load photos in incognito mode.
- Browser DevTools shows `Access-Control-Allow-Origin` missing on OPTIONS preflight responses for new routes.

**Phase to address:**
Phase 2 (Token-Based Sharing) and Phase 3 (Client Selection Workflow) — test each new public endpoint from incognito/fresh session.

---

### Pitfall 8: No Path Traversal Protection in File Download Endpoint

**What goes wrong:**
A download endpoint reads a file path from the database and calls `readfile($storagePath)`. If an attacker manipulates `storagePath` in the database — or if there is any endpoint that accepts a user-supplied path — they can traverse to read `/etc/passwd`, `backend/config.php`, or any file on the server.

**Why it happens:**
Developers trust that database values are safe. But if the upload handler ever stores a user-controlled filename (even partially), or if the download endpoint accepts a path as a query parameter, path traversal becomes possible.

**How to avoid:**
- The download endpoint must never accept a raw filesystem path as input. Accept only a `photoId` (the database ID), look up the `storagePath` from the database, and then validate the resolved path before serving:
  ```php
  $realPath = realpath($storagePath);
  $allowedDir = realpath('/home/user/uploads/');
  if (strpos($realPath, $allowedDir) !== 0) {
      http_response_code(403); exit;
  }
  readfile($realPath);
  ```
- Filenames stored in the database must be the server-generated random names, never the client-supplied originals.

**Warning signs:**
- Download endpoint accepts `?path=...` or `?file=...` as a query parameter.
- `storagePath` in the database contains a value like `../uploads/photo.jpg` (relative path with traversal).
- No `realpath()` validation before `readfile()`.

**Phase to address:**
Phase 1 (Photo Upload) — establish safe path storage conventions before any files are written.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store original filename in DB and on disk | Simple, no rename logic needed | Path traversal risk; double-extension exploit; exposes client filenames | Never — always generate server-side random names |
| Generate ZIP on every download request | No background jobs needed | Times out on large collections; hits memory limits; repeated work on same data | Only for MVP with < 20 small files, very early testing |
| Serve photos directly from uploads/ URL without proxy | Zero latency overhead | Cannot enforce download protection; status checks bypassed; directory enumeration | Never — defeats the entire access control model |
| Use `$_FILES['file']['type']` for MIME validation | One line of code | Trivially spoofable; allows malicious file upload | Never |
| Skip thumbnail generation | Faster to build | Mobile unusable on large collections; bandwidth costs; Hostinger quota exceeded | Only for initial local testing; must be addressed before any real photos |
| Build ZIP synchronously in request lifecycle | No async complexity | Hard timeout on shared hosting; terrible UX for large deliveries | Acceptable for < 30 small files during beta; must be replaced with async before launch |
| Same shareId and collection id | One fewer column to manage | Exposes internal IDs in public URLs; shareId rotation breaks collection routing | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PHP `ZipArchive` on Hostinger | Calling `addFromString()` which loads file content into memory | Use `addFile($diskPath)` so ZipArchive streams from disk; set `set_time_limit(0)` |
| PHP GD for thumbnails | Calling `imagecreatefromjpeg()` on a TIFF or WebP file without checking actual type | Use `finfo_file()` to determine image type before choosing the correct `imagecreatefrom*()` function |
| PHP file download proxy with `readfile()` | Not setting correct headers before calling `readfile()`, causing browser to display binary instead of download | Set `Content-Type`, `Content-Length`, `Content-Disposition` before `readfile()`; call `ob_clean()` first to clear any buffered output |
| React `<img>` with blob URLs | Creating `URL.createObjectURL()` and never revoking it | Always call `URL.revokeObjectURL()` when the component unmounts to prevent memory leaks in the photo viewer |
| PHP session on public share routes | Calling `session_start()` unconditionally, creating a session for anonymous clients and hitting session storage limits | Only call `session_start()` on authenticated routes; public token-based routes should not create sessions |
| Hostinger PHP upload limits | `upload_max_filesize` and `post_max_size` default to 8 MB on shared plans | Set these in `backend/.htaccess` via `php_value upload_max_filesize 50M` and `php_value post_max_size 55M`; test actual limits before committing to a max file size in the UI |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-resolution images in photo grid | Grid page load > 5s; mobile browsers crash or go blank | Generate thumbnails on upload; serve `_thumb.jpg` in grid | 10+ photos at 5 MB each |
| N+1 photo queries per collection | Collection details page gets slower the more photos it has; each photo triggers a separate DB query | Fetch all photos in a single `WHERE collectionId = ?` query; join Selection table in one query | 50+ photos |
| On-demand ZIP generation per request | Client waits 30–120 seconds; server returns 504 Gateway Timeout | Pre-generate ZIP on DELIVERED transition; store path in `processedZipPath`; serve pre-built file | 30+ edited photos |
| Loading all photos into React state at once | Browser memory spike; UI freeze during fullscreen lightbox navigation | Virtualize the photo grid (use windowing); only load visible photos | 100+ photos in a collection |
| Synchronous file deletion on collection delete | Deleting large collections hangs the HTTP request or times out | Queue file deletion or do it in a background process; respond immediately with 200 and clean up asynchronously | Collections with 500+ photos |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Photos accessible directly via URL without auth check | Any person who learns the URL can download protected photos, bypassing all stage-based protection | Block direct access with `.htaccess deny from all` in uploads/; serve all files through PHP proxy with status check |
| Using the collection `id` as the share token | Internal IDs exposed in public URLs; if the ID format is predictable, collection enumeration is possible | Use a separate cryptographically random `shareId` generated with `bin2hex(random_bytes(24))` |
| Trusting browser-supplied MIME type (`$_FILES['type']`) | Attackers upload PHP scripts disguised as JPEG files; remote code execution possible | Use `finfo_file()` on the saved file; whitelist only image/* MIME types; disable PHP execution in uploads directory |
| No ownership check on download endpoints | Authenticated photographer A can download photos from photographer B's collection by guessing photo IDs | Every photo fetch must JOIN through Collection to verify `Collection.userId = session user_id` |
| ZIP endpoint not checking collection status | Client downloads ZIP during SELECTING stage when only raw (unedited) photos exist | ZIP endpoint must verify `Collection.status = 'DELIVERED'` before allowing download |
| Storing original client-supplied filename on disk | Double-extension bypass (`evil.php.jpg`); exposes client filenames in server paths; path traversal risk | Generate server-side random filenames; store original name in DB metadata only if needed for display |
| No expiry on share tokens | Revoked client relationships still have active links indefinitely | Enforce `Collection.expiresAt` on every token-authenticated request; provide a "Regenerate link" action |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No upload progress indication | Photographer thinks the upload froze; refreshes page; loses partial progress | Track per-file upload progress with `XMLHttpRequest` `progress` event (not `fetch`); display progress bar per file |
| No thumbnail during selection — only full-res | Client on mobile data cannot browse 300 photos; selection becomes unusable | Serve thumbnails in selection grid; load original only in fullscreen lightbox on demand |
| ZIP download starts with no feedback | Client clicks "Download all" and nothing happens for 30 seconds; they click again | Show loading state immediately on ZIP download button; if ZIP is pre-generated, the wait is short; if not, show progress |
| No confirmation when changing collection status | Photographer accidentally transitions from SELECTING to REVIEWING; client loses ability to change selections | Status transitions are one-way and irreversible; require explicit confirmation dialog with status explanation |
| Selection UI allows zero photos selected | Client accidentally submits empty selection; photographer receives notification of 0 selected photos | Validate minimum 1 selection before allowing status transition from SELECTING; show clear count badge |
| No "copy link" affordance on share link | Photographer manually selects and copies URL from a text field; prone to partial selection errors | Dedicated "Copy link" button with clipboard API + toast confirmation |
| Fullscreen lightbox with no keyboard navigation | Keyboard users and photographers reviewing selections cannot use arrow keys | Implement `keydown` handler for ArrowLeft/ArrowRight/Escape in the lightscreen component |

---

## "Looks Done But Isn't" Checklist

- [ ] **Photo upload:** Upload handler saves file to disk and creates DB row — but verify `php_flag engine off` is set in `uploads/.htaccess` so a malicious file cannot execute even if it bypasses MIME validation.
- [ ] **Token-based share:** Share URL loads in the browser — but verify it works in **incognito mode** with no existing session cookie, from a device that has never visited the site.
- [ ] **Download protection:** Download button is hidden during SELECTING — but verify that the photo URL itself (from the `<img src>` in network requests) returns `403` when accessed directly without a valid delivery token.
- [ ] **ZIP generation:** ZIP downloads successfully in local testing — but verify it completes without timeout for a realistic payload (50+ files, 100+ MB total) on **Hostinger** specifically, not local dev.
- [ ] **Status transitions:** Collection transitions to DELIVERED — but verify that raw photos (`/uploads/originals/...`) remain inaccessible after delivery; only edited photos should be downloadable.
- [ ] **Share token regeneration:** New share link can be generated — but verify the old link returns `404` or `410` immediately after regeneration.
- [ ] **Thumbnail generation:** Thumbnails are created on upload — but verify they are generated for all supported formats (JPEG, PNG, WebP) and that a corrupt upload does not crash the handler without cleanup.
- [ ] **Responsive photo viewer:** Grid displays correctly on desktop — but verify on a 375px-wide mobile viewport with 50+ photos, and that the fullscreen lightbox closes correctly with the back button on Android.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Files stored in web-accessible directory (already in production) | MEDIUM | Add `deny from all` to `uploads/.htaccess` immediately; audit access logs for unauthorized direct-URL access; rotate any share tokens that were active during the exposure window |
| Weak share tokens discovered in production | MEDIUM | Regenerate all existing `shareId` values with cryptographically random bytes; invalidate old tokens; notify photographers that old links are now dead |
| ZIP generation timing out in production | LOW | Enable `processedZipPath` workflow: generate ZIP on status transition to DELIVERED in a background-style PHP call; serve pre-built file on download requests |
| Full-resolution images causing bandwidth overages | MEDIUM | Write a one-time migration script to generate thumbnails for all existing photos using GD; update Photo table to store thumb path; update frontend to use thumb endpoint |
| Path traversal vulnerability found | HIGH | Immediately take download endpoint offline; audit server filesystem for unexpected file access in logs; patch with `realpath()` validation; review all stored paths in DB for anomalies |
| PHP file execution in uploads directory | CRITICAL | Take site offline; remove all files in uploads/; add `php_flag engine off` and `deny from all` to `.htaccess`; audit for webshell indicators in server logs; rotate all credentials |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Files in web-accessible directory | Phase 1 — Photo Upload | `curl https://api.pixelforge.pro/backend/uploads/<filename>` returns 403 |
| Guessable share tokens | Phase 2 — Token-Based Sharing | Confirm token is 48+ hex chars; confirm `expiresAt` check present in handler |
| Frontend-only download protection | Phase 3 — Client Selection Workflow | `curl` the photo URL with a valid `shareId` during SELECTING status returns 403 |
| Dangerous file upload (no MIME validation) | Phase 1 — Photo Upload | Upload a `.php` file disguised as JPEG; verify it is rejected at MIME check |
| ZIP timeout on shared hosting | Phase 5 — ZIP Delivery | Test with 50+ files totaling 200 MB on Hostinger; confirm no 504 timeout |
| Full-resolution images in grid | Phase 1 — Photo Upload | Confirm thumbnail path exists in DB after upload; grid `<img>` requests return < 100 KB responses |
| CORS broken on public routes | Phase 2 — Token-Based Sharing | Open share URL in browser incognito; check network tab for CORS errors |
| Path traversal in download endpoint | Phase 1 — Photo Upload | Confirm `realpath()` guard exists in download handler; no raw path accepted as query param |

---

## Sources

- PHP manual — `ZipArchive`, `finfo_file`, `readfile`, `set_time_limit`: https://www.php.net/manual/
- OWASP — Unrestricted File Upload: https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload
- OWASP — Path Traversal: https://owasp.org/www-community/attacks/Path_Traversal
- Hostinger Knowledge Base — PHP configuration limits on shared hosting (upload limits, execution time)
- ZipStream-PHP (maennchen/zipstream-php) — streaming ZIP without memory accumulation: https://github.com/maennchen/ZipStream-PHP
- Known pattern from client gallery apps (Pixieset, Pic-Time, ShootProof post-mortems in developer communities) — download protection bypass via direct URL is the #1 reported vulnerability class in this category
- Personal / domain knowledge: PHP file upload security, token-based auth patterns, shared hosting constraints

---

*Pitfalls research for: PHP/React photo delivery app — file uploads, token sharing, download protection, ZIP delivery, React photo viewer*
*Researched: 2026-02-11*
