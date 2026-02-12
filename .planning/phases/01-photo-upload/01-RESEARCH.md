# Phase 1: Photo Upload — Research

**Researched:** 2026-02-11
**Phase:** 01-photo-upload
**Status:** RESEARCH COMPLETE

---

## Summary Finding

**Phase 1 is substantially already implemented.** The backend upload handler, cover endpoint, photo listing, and delete are all live. The frontend CollectionDetailsPage has full drag-and-drop upload, photo grid, lightbox, delete, and cover-setting functionality. What remains is a schema mismatch (the live Photo table is stripped-down vs. the planned schema), missing thumbnail generation, and missing directory access control to block direct URL access to uploaded files.

---

## What Already Exists (Do NOT Rebuild)

### Backend: Fully Implemented

| File | What it Does |
|------|-------------|
| `backend/collections/photos.php` | GET (list photos), POST (upload), DELETE (delete by photoId) |
| `backend/collections/cover.php` | PATCH — sets `coverPhotoId` on Collection |
| `backend/utils.php` | `handleFileUpload()` — validates MIME via `finfo_file()`, checks size, generates random filename via CUID, moves file |
| `backend/uploads/.htaccess` | `php_flag engine off`, denies PHP files, grants image files |

The router in `backend/index.php` already dispatches:
- `GET/POST /collections/{id}/photos` → `photos.php`
- `DELETE /collections/{id}/photos/{photoId}` → `photos.php` (parsed from `$parts[3]`)
- `PATCH /collections/{id}/cover` → `cover.php`

### Frontend: Fully Implemented

`frontend/src/pages/CollectionDetailsPage.jsx` already has:
- Drag-and-drop zone (native HTML5 drag events — no react-dropzone)
- File input (`<input type="file" multiple>`) as fallback
- Client-side MIME + size validation (JPEG/PNG/WEBP, max 20 MB)
- Concurrent upload queue (3 concurrent uploads with a manual worker loop)
- Per-file upload states: `uploading`, `done`, `error`, `invalid-type`, `too-large`
- `fetchPhotos()` refreshes the photo list after all uploads complete
- Responsive grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2`, aspect-square thumbnails
- Cover badge (gradient star) on the photo matching `collection.coverPhotoId`
- Set-cover button on hover overlay (calls `PATCH /collections/:id/cover`)
- Delete button on hover overlay (with Sonner confirmation toast)
- Custom lightbox (no library): fixed overlay, prev/next arrows, keyboard (ArrowLeft/ArrowRight/Escape), counter
- All i18n keys present in all 3 locale files (en/lt/ru)

---

## Critical Gaps to Address

### Gap 1: Photo Table Schema Mismatch

**Problem:** The live `database_schema.sql` `Photo` table is stripped down:
```sql
CREATE TABLE `Photo` (
  `id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(191) NOT NULL,
  `storagePath` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `collectionId` VARCHAR(191) NOT NULL,
  ...
)
```

The phase description and planning documents describe a richer schema:
```
Photo(id, collectionId, filename, originalName, mimeType, size, width, height,
      storagePath, thumbnailPath, sortOrder, isCover, uploadedAt)
```

**Actual missing columns:** `originalName`, `mimeType`, `size`, `width`, `height`, `thumbnailPath`, `sortOrder`, `isCover`, `uploadedAt`

**Impact assessment:**
- `originalName` — frontend uses `photo.filename` as `aria-label` and `alt` text; the existing handler stores `basename($file['name'])` (the raw client filename) as `filename`, so this is actually being stored already (just not in a separate column)
- `thumbnailPath` — CRITICAL MISSING: no thumbnail generation exists. The grid currently loads full-resolution originals via `storagePath`. This will break on mobile / large collections.
- `sortOrder` — not currently used; grid sorts by `createdAt ASC`; not blocking for Phase 1
- `isCover` — cover is managed via `Collection.coverPhotoId` FK, not a column on Photo; this is fine (the schema already uses the FK approach)
- `width`, `height`, `mimeType`, `size` — not currently stored; not blocking for Phase 1 but needed for later phases

**Decision needed:** Whether to run a schema migration to add `thumbnailPath` (and optionally other columns) or stay with the current schema and derive thumb paths by convention (e.g., `uploads/{collectionId}/thumbs/{id}.jpg`).

### Gap 2: No Thumbnail Generation

**Problem:** `handleFileUpload()` in `utils.php` saves the original file but generates no thumbnail. The frontend grid renders `photoUrl(photo.storagePath)` which points to the original (potentially 5–20 MB JPEG).

**Impact:** With even 10+ photos, the grid loads very slowly. On mobile it may crash the browser tab. This is Pitfall 6 from PITFALLS.md — explicitly flagged as a Phase 1 blocker: "Generate thumbnails at upload time. Retrofitting thumbnails for existing photos is expensive."

**What needs to be added to `utils.php` / `photos.php`:**
1. After `move_uploaded_file()`, open the image with GD (`imagecreatefromjpeg` / `imagecreatefrompng` / `imagecreatefromwebp`)
2. Resize to max 400px wide (maintain aspect ratio)
3. Save as JPEG to `uploads/{collectionId}/thumbs/{id}_thumb.jpg`
4. Return `thumbnailPath` from `handleFileUpload()`
5. Store `thumbnailPath` in the Photo row (requires schema migration OR derive by convention)

**Blocker to verify first:** GD WebP support. The upload handler accepts `image/webp`, so GD must be compiled with `--with-webp`. On Hostinger, call `gd_info()` to check `WebP Support => true`. If not available, either reject WebP or fall back to JPEG thumbnail from WebP source (GD can create a thumbnail from WebP if `imagecreatefromwebp()` exists).

### Gap 3: Direct File Access Not Fully Blocked

**Problem:** The `backend/uploads/.htaccess` currently allows direct URL access to image files:
```apache
<FilesMatch "\.(?i)(jpe?g|png|webp)$">
    Require all granted
</FilesMatch>
```

This means anyone who knows (or guesses) `https://api.pixelforge.pro/backend/uploads/{collectionId}/{photoId}.jpg` can fetch the photo without authentication. For Phase 1 (photographer upload), this is acceptable because the photographer is authenticated. However, it becomes a critical security issue in Phase 3 (client selection) when clients must not be able to download originals.

**For Phase 1:** The `.htaccess` is fine for the photographer workflow. But the plan should note that Phase 3 requires changing this to `deny from all` and routing all photo serving through a PHP proxy.

**Immediate action for Phase 1:** Add a `deny from all` baseline and only allow access via a PHP serve endpoint. OR document that this is a Phase 3 concern with a specific note not to expose files before that fix is in place.

### Gap 4: Auto-Set Cover on First Upload Not Implemented

**Requirement UPLOAD-02:** "Collection cover is automatically set to the first uploaded photo."

**Current behavior:** The upload handler (`photos.php` POST) creates a Photo row but never updates `Collection.coverPhotoId`. The cover can only be set manually via `PATCH /collections/{id}/cover`.

**What needs to be added:** After inserting a Photo row, check if `Collection.coverPhotoId IS NULL` for this collection. If null, set it to the new photo's ID in the same transaction (or immediate follow-up query).

```php
// After INSERT INTO Photo...
$stmt = $pdo->prepare("SELECT coverPhotoId FROM `Collection` WHERE id = ? LIMIT 1");
$stmt->execute([$collectionId]);
$col = $stmt->fetch(PDO::FETCH_ASSOC);
if ($col && $col['coverPhotoId'] === null) {
    $pdo->prepare("UPDATE `Collection` SET coverPhotoId = ?, updatedAt = ? WHERE id = ?")
        ->execute([$result['id'], date('Y-m-d H:i:s.v'), $collectionId]);
}
```

**Frontend consideration:** After upload, `fetchPhotos()` is called but `collection` state (which holds `coverPhotoId`) is NOT refreshed. If auto-cover is set server-side, the cover badge won't appear until the user navigates away and back. Either:
- Also call `fetchCollection()` after upload completes, or
- Return the updated `coverPhotoId` in the POST `/photos` response and update `collection` state

---

## Schema Decision: Minimal vs. Full Migration

Two options for the Photo table schema:

**Option A: Minimal — Add only `thumbnailPath`**
- Run: `ALTER TABLE Photo ADD COLUMN thumbnailPath VARCHAR(191) NULL`
- Store thumb path in DB
- Grid uses `photo.thumbnailPath || photo.storagePath` as fallback
- Pro: Minimal migration, stays close to current code
- Con: Loses `originalName`, `mimeType`, `size` for future phases

**Option B: Full migration to planned schema**
- Add: `originalName`, `mimeType`, `size`, `width`, `height`, `thumbnailPath`, `sortOrder`, `uploadedAt`
- Set `uploadedAt` default = `CURRENT_TIMESTAMP(3)`, `sortOrder` default = 0
- Rename existing `createdAt` to `uploadedAt` (or keep both)
- Pro: Future phases (client view, metadata display) are already covered
- Con: More SQL to write; larger `handleFileUpload()` changes; existing Photo rows have NULL for new columns

**Recommendation:** Option A for now. `thumbnailPath` is the only field needed for Phase 1 goals. Other columns can be added lazily when they are needed by a specific phase.

---

## Library / Dependency Decisions

### Frontend: No Additional Libraries Needed for Phase 1

The roadmap suggested `react-dropzone` and `yet-another-react-lightbox`. However:

- **react-dropzone:** The existing implementation uses native drag-and-drop events (`onDrop`, `onDragOver`, `onDragLeave`) which is fully functional. Adding react-dropzone would replace working code with a library dependency for no functional gain. **Skip it for Phase 1.**

- **yet-another-react-lightbox:** A custom lightbox is already implemented in `CollectionDetailsPage.jsx` (lines 471–526). It supports prev/next navigation, keyboard shortcuts, and a close button. **Skip it for Phase 1.** Consider replacing with the library if a later phase requires Zoom, Thumbnails strip, or Slideshow plugins.

- **react-photo-album:** The grid is a Tailwind CSS grid with `aspect-square` thumbnails. This is simpler and more controllable than the justified layout from react-photo-album. **Skip it for Phase 1.** May be worth revisiting for Phase 3 (client-facing gallery needs justified layout for professional look).

**Net new frontend dependencies for Phase 1: zero.**

### Backend: No Additional Libraries Needed for Phase 1

- GD is a built-in PHP extension, sufficient for thumbnail generation
- ZipStream is not needed until Phase 5
- Composer is already in `backend/` with `composer.json`; no new packages needed

---

## Hostinger Environment Risks

### Risk 1: GD WebP Support

**Must verify before writing WebP thumbnail code.** GD requires compilation with `--with-webp` for `imagecreatefromwebp()` / `imagewebp()` to work. Not all Hostinger plans have this enabled.

**Verification approach (run once in production or via a test endpoint):**
```php
$gdInfo = gd_info();
var_dump($gdInfo['WebP Support']); // Must be true
```

**Mitigation if WebP not supported:** Convert WebP uploads to JPEG thumbnails using an intermediate step, OR simply refuse WebP uploads in the backend. The frontend already accepts WebP (`image/webp`) — if the server rejects them, the frontend shows an upload error. That is acceptable for Phase 1.

### Risk 2: PHP Upload Limits

`upload_max_filesize` on Hostinger shared plans defaults to 8 MB. The frontend allows 20 MB per file. Files over the `upload_max_filesize` limit arrive as `$_FILES['file']['error'] === UPLOAD_ERR_INI_SIZE` — the handler returns 400 but the mismatch between frontend limit and server limit will confuse users.

**Must verify:** Actual `upload_max_filesize` on the Hostinger plan. If it is 8 MB, either:
- Lower the frontend `MAX_FILE_SIZE` constant to match, or
- Set in `backend/.htaccess`: `php_value upload_max_filesize 25M` and `php_value post_max_size 30M`

### Risk 3: GD Memory for Large Images

`imagecreatefromjpeg()` allocates memory proportional to image dimensions × 4 bytes (RGBA). A 24 MP JPEG (6000×4000) needs ~96 MB of memory in PHP. On Hostinger shared hosting the default `memory_limit` may be 128–256 MB. Thumbnail generation for very large source images may hit this limit.

**Mitigation:** Check image dimensions before loading into GD. If width × height > 25,000,000 pixels (25 MP), either skip thumbnail generation (return null for `thumbnailPath`) or stream-resize with a lower memory approach.

---

## Route and API Contract

The existing API contract (what the frontend calls, what the backend currently returns):

### GET /collections/{id}/photos
**Response:**
```json
{
  "status": "OK",
  "photos": [
    { "id": "...", "filename": "...", "storagePath": "uploads/abc/xyz.jpg", "createdAt": "..." }
  ],
  "editedPhotos": [...]
}
```
**Frontend accesses:** `photo.id`, `photo.storagePath`, `photo.filename`
**Needs adding:** `photo.thumbnailPath` (for grid) — frontend must be updated to use `photo.thumbnailPath ?? photo.storagePath`

### POST /collections/{id}/photos
**Request:** `multipart/form-data` with `file` field
**Response:**
```json
{ "status": "OK", "photo": { "id": "...", "filename": "...", "storagePath": "...", "createdAt": "..." } }
```
**Needs adding:** Return `coverPhotoId` change info so frontend can update collection state without a separate fetch

### PATCH /collections/{id}/cover
**Request:** `{ "photoId": "..." }`
**Response:** Returns updated collection object with `coverPhotoId`
**Status:** Fully working

### DELETE /collections/{id}/photos/{photoId}
**Status:** Fully working. Path parsed as `$parts[3]` in `photos.php`.

---

## File Storage Layout

Current layout (per `utils.php`):
```
backend/uploads/
  {collectionId}/          # 755 permissions
    {cuid}.jpg             # original files
    {cuid}.png
    edited/
      {cuid}.jpg           # edited photos (separate subdirectory)
```

Proposed addition for thumbnails:
```
backend/uploads/
  {collectionId}/
    {cuid}.jpg             # original files
    thumbs/                # NEW subdirectory
      {cuid}_thumb.jpg     # always JPEG, 400px wide
    edited/
      {cuid}.jpg
```

The `thumbnailPath` stored in DB would be: `uploads/{collectionId}/thumbs/{cuid}_thumb.jpg`

Frontend `photoUrl()` function already handles this: it prepends `VITE_API_BASE_URL` to any `storagePath` value.

---

## Auto-Cover Flow Design

When the first photo is uploaded to a collection:

1. `POST /collections/{id}/photos` → `handleFileUpload()` saves file → `INSERT INTO Photo`
2. **New:** `SELECT coverPhotoId FROM Collection WHERE id = ?`
3. **New:** If `coverPhotoId IS NULL` → `UPDATE Collection SET coverPhotoId = {newPhotoId}`
4. Response includes `{ "photo": {...}, "collection": { "coverPhotoId": "..." } }` OR frontend re-fetches collection

The frontend currently refreshes photos after upload (`fetchPhotos()`) but does NOT re-fetch the collection. Options:
- **Preferred:** Update the POST response to include the new `coverPhotoId` if changed, and update `collection` state in React.
- **Alternative:** Call `fetchCollection()` after all uploads complete. This adds an extra network request but is simpler.

---

## What Phase 1 Plans Must Cover

Based on this research, the three planned sub-plans map to actual work as follows:

### Plan 01-01: Backend upload handler
**Reality:** Handler exists. Actual work:
1. Add `thumbnailPath` column to `Photo` table (ALTER TABLE migration)
2. Add GD thumbnail generation to `handleFileUpload()` in `utils.php`
3. Add auto-cover logic to `photos.php` POST handler
4. Update GET response to include `thumbnailPath`
5. Verify GD WebP support on Hostinger (gd_info check)
6. Verify/set PHP upload limits in `.htaccess`

### Plan 01-02: Frontend upload UI
**Reality:** Upload UI exists and works. Actual work:
1. Update photo grid to use `photo.thumbnailPath ?? photo.storagePath` for `<img src>`
2. Update lightbox to continue using `photo.storagePath` (full-res) for the fullscreen view
3. Update `fetchPhotos()` + collection state to reflect auto-set cover after first upload
4. Optionally: re-fetch collection data after upload batch completes so cover badge appears immediately

### Plan 01-03: Lightbox integration and cover photo management
**Reality:** Custom lightbox exists. Cover management UI (set-cover button + badge) exists. Actual work:
- This plan may be a no-op if the custom lightbox is deemed sufficient
- Only meaningful work: ensure cover badge appears immediately after first upload (depends on Plan 01-02's state update fix)

---

## Success Criteria Assessment (Against Phase 1 Requirements)

| Criterion | Current State | Gap |
|-----------|--------------|-----|
| 1. Drag-and-drop or click-to-select multiple photos | DONE | None |
| 2. After upload, photos appear in responsive grid | PARTIAL — grid works but loads full-res originals | Thumbnail generation needed |
| 3. Fullscreen with prev/next navigation | DONE | None |
| 4. Cover auto-set to first uploaded photo | NOT DONE | Auto-cover logic missing in backend |
| 5. Manual cover override | DONE | None |

---

## Open Questions / Decisions for Planning

1. **Thumbnail storage:** DB column (`thumbnailPath`) vs. derived path convention? Recommendation: add `thumbnailPath` column.

2. **Thumbnail dimensions:** 400px wide recommended (PITFALLS.md). Confirm or adjust.

3. **WebP thumbnail fallback:** If `imagecreatefromwebp()` is unavailable, reject WebP entirely or generate thumbnail in JPEG? Recommendation: generate JPEG thumbnail from any source format; show error in UI only if the source file itself cannot be processed.

4. **GD memory guard:** Add an image dimension check before calling `imagecreatefromjpeg()` to prevent memory exhaustion on very large source images?

5. **Direct file access:** The `.htaccess` currently allows direct URL access to uploaded images (requires `Require all granted` to be removed and a PHP serve endpoint added). For Phase 1 (photographer-only), this is acceptable. Should this be addressed in Phase 1 or deferred to Phase 3? Recommendation: defer to Phase 3, but document as a known TODO.

6. **POST response design:** Should the upload POST endpoint return the updated `coverPhotoId` when auto-cover is set, or should the frontend re-fetch the collection? Recommendation: include `"autoSetCover": true` and the `photoId` in the response.

---

## Verification Checklist for Phase 1 Done

- [ ] `gd_info()` confirms GD is enabled; `WebP Support` status documented
- [ ] `php_value upload_max_filesize` in `.htaccess` matches the 20 MB frontend limit
- [ ] Upload a JPEG: thumbnail file appears at `uploads/{collectionId}/thumbs/{id}_thumb.jpg`
- [ ] Upload a PNG: thumbnail generated correctly
- [ ] Upload a WebP: thumbnail generated (or error documented if unsupported)
- [ ] Upload first photo: `Collection.coverPhotoId` is set to the new photo's ID
- [ ] Upload second photo: `Collection.coverPhotoId` unchanged (still first photo)
- [ ] Cover badge appears immediately in the UI after first upload without manual refresh
- [ ] Photo grid `<img>` elements load thumbnails (< 100 KB each), not originals
- [ ] Lightbox opens original full-resolution image
- [ ] Keyboard navigation (ArrowLeft, ArrowRight, Escape) works in lightbox
- [ ] Delete photo: file removed from disk, DB row deleted, cover cleared if it was the cover
- [ ] Manual set-cover: badge moves to newly selected photo

---

*Phase 1 research — photo-hub*
*Researched: 2026-02-11*
