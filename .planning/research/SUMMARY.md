# Project Research Summary

**Project:** Photo Hub (pixelforge.pro)
**Domain:** Photographer client gallery / photo delivery web app
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

Photo Hub is a professional photographer delivery tool that enables the end-to-end proofing and delivery workflow: photographer uploads originals, client browses and selects favorites via a share link (no client account required), photographer uploads edited finals, and client downloads the delivered set. This is a well-understood product category with established competitors (Pixieset, ShootProof, Pic-Time), which means the feature set, user expectations, and failure modes are all well-documented. The recommended approach is to build sequentially along the feature dependency chain — upload first, then token-based sharing, then client selection, then delivery — because nothing downstream can be built or tested without the upstream pieces.

The existing codebase already has a strong foundation: authentication, collections CRUD, a `CollectionDetailsPage` with photo upload, and an `EditedPhoto` table. What is missing is the client-facing side: the public gallery page accessible via `shareId`, the selection workflow, and the ZIP delivery endpoint. The recommended stack additions are minimal and mature: `react-photo-album@^3.4` + `yet-another-react-lightbox@^3.25` + `react-dropzone@^15.0` on the frontend, and `maennchen/zipstream-php@^3.1` on the backend. No framework changes, no new auth systems, no cloud storage yet.

The dominant risk pattern in this domain is security shortcuts that appear to work in demos but expose photos to unauthorized access. The three critical risks are: (1) photos accessible via direct URL without token or status check, (2) download protection enforced only in React (not on the server), and (3) PHP upload handlers trusting browser-supplied MIME types. All three are easily avoided with established PHP patterns but commonly missed because they are invisible in early testing. These must be addressed in Phase 1, not deferred.

---

## Key Findings

### Recommended Stack

The existing React 18 + vanilla PHP + MySQL stack requires no architectural changes. Three frontend libraries solve the hard UI problems: `react-photo-album` provides the justified grid layout with a composable render prop API ideal for adding selection overlays; `yet-another-react-lightbox` handles fullscreen viewing with keyboard/touch navigation and a plugin system; `react-dropzone` handles drag-and-drop file input with React 18 hooks. On the backend, `maennchen/zipstream-php` is the only non-trivial addition — it streams ZIP archives without writing to disk, which is essential on Hostinger shared hosting where disk quota and execution time limits would cause `ZipArchive`-based solutions to fail on large deliveries.

**Core technologies:**
- `react-photo-album@^3.4`: Responsive justified/masonry grid — composable render prop required for selection overlay and right-click blocking
- `yet-another-react-lightbox@^3.25`: Fullscreen lightbox — keyboard/swipe navigation, plugin architecture, React 18 compatible
- `react-dropzone@^15.0`: Drag-and-drop upload zone — returns `File` objects, pairs with custom fetch uploader, no Uppy overhead needed
- `maennchen/zipstream-php@^3.1`: Server-side ZIP streaming — no temp disk file, avoids Hostinger quota exhaustion (requires PHP 8.1+; fall back to `^2.4` if PHP 8.0)
- PHP `random_bytes()` + `bin2hex()`: Token generation — 256-bit entropy, cryptographically secure, no Composer dependency
- PHP `finfo_file()`: MIME validation — reads actual file magic bytes, not browser-supplied header
- PHP GD Library: Thumbnail generation — universally available on Hostinger, sufficient for JPEG/PNG/WebP resize

### Expected Features

Research confirmed a clear three-tier feature hierarchy based on competitor analysis (Pixieset, ShootProof, Pic-Time) and workflow dependency mapping.

**Must have (table stakes) — v1 launch:**
- Multi-photo upload by photographer — entry point of the entire workflow; nothing else works without it
- Responsive client gallery grid view (token, no account) — core client experience; token-only access is a genuine differentiator at this price point
- Fullscreen lightbox viewer with navigation — instinctive user expectation; gallery without it feels broken
- Photo selection by client (toggle favorites, running count) — the proofing workflow
- Download block during SELECTING stage — photographer controls when finals are available; must be server-enforced
- Photographer view of client selections (All/Selected/Not-Selected filter) — required to start editing
- Edited finals upload by photographer — delivery half of the workflow
- Individual photo download + ZIP archive download (DELIVERED only) — ZIP is required for galleries of 20+ photos
- Collection status color coding on cards — visual workflow management

**Should have (competitive) — v1.x:**
- Selection quota enforcement (photographer sets max count) — prevents scope creep; few competitors enforce this server-side
- Selection submission confirmation (explicit submit button) — prevents incomplete selections; triggers SELECTING → REVIEWING transition
- Expiring gallery links — enforces `Collection.expiresAt` column already in schema
- Password protection as second factor on top of token

**Defer (v2+):**
- Per-photo client notes / editing instructions — high value but requires schema change and complex UI
- Email notifications — requires email infrastructure (SendGrid/SES), out of scope
- Cloud storage migration (S3/R2) — `storagePath` column already anticipates this migration
- Gallery analytics and download tracking

### Architecture Approach

The architecture is a clean dual-auth pattern: session-cookie authentication for photographer routes (`/collections/*`) and shareId token authentication for public client routes (`/gallery/*`). These two zones are kept strictly separate in a new `backend/gallery/` directory. The frontend adds a single unauthenticated route `/gallery/:shareId` pointing to a new `GalleryPage.jsx` component that lives outside `ProtectedRoute` and `MainLayout`. Static photo files continue to be served directly by Apache from `backend/uploads/`; PHP is only invoked for the download endpoint where status-gating is enforced.

**Major components:**
1. `backend/gallery/view.php` — token-auth public endpoint: resolves `shareId` to collection + photos, checks `expiresAt`, returns JSON
2. `backend/gallery/selections.php` — token-auth: POST/DELETE selections, enforces `status = SELECTING` gate
3. `backend/gallery/download.php` — token-auth: serves individual files via `readfile()` or streams ZIP; enforces `status = DELIVERED` gate
4. `frontend/src/pages/GalleryPage.jsx` — public client view: photo grid, lightbox, selection UI, download buttons; reads `shareId` from `useParams()` on every render
5. `backend/collections/photos.php` + `backend/utils.php` — existing upload infrastructure extended with thumbnail generation via GD

### Critical Pitfalls

1. **Photos accessible via direct URL without auth check** — Block direct access with `.htaccess deny from all` in `backend/uploads/`; route all photo requests for the download endpoint through a PHP proxy that validates token and status. Apply in Phase 1 before any photos reach production.

2. **Frontend-only download protection** — React UI hiding download buttons is UX only; a user with DevTools can call the download API directly. The PHP download handler must return `403` when `status != 'DELIVERED'`. Apply in Phase 3.

3. **PHP upload accepting dangerous files** — Never trust `$_FILES['file']['type']` (browser-supplied, spoofable). Use `finfo_file()` on the actual temp file; whitelist `image/jpeg`, `image/png`, `image/webp`; generate random server-side filenames; set `php_flag engine off` in `uploads/.htaccess`. Apply in Phase 1.

4. **ZIP generation timing out on Hostinger shared hosting** — Standard `ZipArchive` loads all files into a temp disk file and blocks the request. Use `maennchen/zipstream-php` for streaming; add `set_time_limit(0)` in the handler; validate with 50+ files on Hostinger before marking Phase 5 done. Consider pre-generating ZIP on DELIVERED transition and caching at `Collection.processedZipPath`.

5. **Serving full-resolution images in the React grid viewer** — A collection of 80 photos at 5 MB each will hang on mobile and exhaust Hostinger bandwidth. Generate thumbnails at upload time using PHP GD; the grid always loads thumbnails; the lightbox loads originals only when opened. This must be addressed in Phase 1 alongside the upload handler, not retrofitted.

---

## Implications for Roadmap

Based on the feature dependency chain from FEATURES.md and the build order from ARCHITECTURE.md, a 5-phase structure is recommended. Each phase has a single clear deliverable and unlocks the next.

### Phase 1: Photo Upload and Gallery Foundation
**Rationale:** Photo upload is the unconstrained entry point — no other feature can be built or tested without photos in the system. This phase also establishes the security baseline (MIME validation, random filenames, thumbnail generation, upload directory access control) that all later phases depend on. Retrofitting these is expensive.
**Delivers:** Photographer can upload multiple photos to a collection; thumbnails generated on upload; photos display in `CollectionDetailsPage` grid with lightbox.
**Addresses:** Multi-photo upload, responsive grid view (photographer-side), fullscreen lightbox viewer
**Stack elements:** `react-photo-album`, `yet-another-react-lightbox`, `react-dropzone`, PHP GD
**Avoids:** Files in web-accessible directory (Pitfall 1), dangerous file upload (Pitfall 4), full-resolution images in grid (Pitfall 6)

### Phase 2: Collection Status Lifecycle and Share Link
**Rationale:** Status transitions and share link generation are prerequisites for the entire client-facing side. The `Collection.shareId` column and `status` field must be wired up before any client feature is built. This phase is also where token security is established.
**Delivers:** Photographer can transition collection status (DRAFT → SELECTING → REVIEWING → DELIVERED); a cryptographically secure `shareId` is generated; copy-link UI is shown on `CollectionDetailsPage`; collection cards display status color coding.
**Addresses:** Collection status color coding, gallery link sharing, collection status visibility
**Stack elements:** PHP `bin2hex(random_bytes(24))`, `Collection.shareId` column, `Collection.expiresAt` column
**Avoids:** Guessable share tokens (Pitfall 2), CORS broken on public routes (Pitfall 7)

### Phase 3: Public Client Gallery and Photo Selection
**Rationale:** This is the core client-facing phase. Once photos exist and a share link can be generated, the client gallery can be built end-to-end. Selection is bundled here because the gallery without selection is only half the workflow — a client can browse but cannot communicate their choices.
**Delivers:** Client opens share URL, sees photo grid and lightbox (no account required); can toggle photo selections; sees running count; selections are persisted in the `Selection` table; photographer can view selections with All/Selected/Not-Selected filter.
**Addresses:** Client gallery grid, lightbox, photo selection, selection count feedback, photographer selection review
**Stack elements:** `GalleryPage.jsx`, `backend/gallery/view.php`, `backend/gallery/selections.php`, `useParams()` for shareId
**Avoids:** Frontend-only download protection (Pitfall 3), shareId stored in localStorage (Architecture anti-pattern 3)

### Phase 4: Edited Finals Upload and Delivery
**Rationale:** After the photographer reviews selections, they need to upload edited finals and mark the collection as DELIVERED. The `EditedPhoto` table and `backend/collections/edited.php` handler already exist — this phase extends `CollectionDetailsPage` with a separate "Upload finals" section and wires up the REVIEWING → DELIVERED status transition.
**Delivers:** Photographer uploads edited finals linked to originals; collection transitions to DELIVERED; client gallery switches to show edited photos with download enabled.
**Addresses:** Edited finals upload, individual photo download (DELIVERED only), download block during SELECTING
**Stack elements:** Existing `backend/collections/edited.php`, PHP status gate in download handler
**Avoids:** Status gate enforced only on frontend (enforce in `backend/gallery/download.php`)

### Phase 5: ZIP Delivery and Download UX
**Rationale:** ZIP delivery is the last piece because it depends on both edited finals (Phase 4) and the download infrastructure (Phase 4). It is separated into its own phase because it has a distinct risk profile (Hostinger timeout) that requires explicit validation with realistic data before shipping.
**Delivers:** Client can download all delivered photos as a single ZIP archive; loading state shown during generation; pre-generated ZIP cached at `Collection.processedZipPath` for repeat downloads.
**Addresses:** ZIP archive download (DELIVERED only)
**Stack elements:** `maennchen/zipstream-php@^3.1`, `Collection.processedZipPath`, `set_time_limit(0)`
**Avoids:** ZIP timeout on shared hosting (Pitfall 5); must be tested with 50+ files on Hostinger before done

### Phase Ordering Rationale

- The dependency chain from FEATURES.md drives the order: upload → token access → selection → delivery → download. Nothing downstream compiles without upstream pieces.
- Phases 1 and 2 establish the security baseline. Moving security setup to "later" is the single most common mistake in this domain.
- Phase 3 is intentionally large because the gallery and selection are tightly coupled in the client UX — splitting them would require two separate partial experiences that are harder to test and demo.
- Phase 5 is intentionally separated from Phase 4 to allow explicit load testing on Hostinger before ZIP ships.
- The v1.x features (quota enforcement, submission confirmation, expiring links, password protection) are post-validation additions. None of them block the core workflow and all of them enhance existing features rather than add new dependency chains.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (ZIP Delivery):** Hostinger-specific PHP limits (`max_execution_time`, `memory_limit`) are not publicly documented for all plans. Verify actual limits with a `phpinfo()` dump before committing to the streaming vs. pre-generation approach.
- **Phase 1 (Thumbnail generation):** GD WebP support requires PHP compiled with `--with-webp`. Verify `gd_info()` on Hostinger returns `WebP Support: true` before committing to WebP thumbnail output.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Share link):** Token generation with `bin2hex(random_bytes(24))` is a documented PHP primitive. No research needed.
- **Phase 3 (Client gallery + selection):** `react-photo-album` + `yet-another-react-lightbox` integration is covered by official docs. The token-auth PHP pattern is fully documented in ARCHITECTURE.md.
- **Phase 4 (Edited finals upload):** Same upload pattern as Phase 1; `EditedPhoto` handler already exists. Extension work only.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified on npm/packagist as of 2026-02-11. PHP built-ins are stable. ZipStream PHP 8.1 requirement is the only version risk — mitigated by `^2.4` fallback. |
| Features | HIGH | Derived from competitor analysis of 4 established products (Pixieset, ShootProof, Pic-Time, Lightfolio) plus workflow dependency mapping. Feature prioritization is well-grounded. |
| Architecture | HIGH | Based on direct codebase inspection, not external sources. Dual-auth pattern, file-serving approach, and build order all verified against existing `backend/index.php`, `utils.php`, and DB schema. |
| Pitfalls | HIGH | Security pitfalls sourced from OWASP, PortSwigger, and domain-specific knowledge of how client gallery apps fail. Performance pitfalls verified against Hostinger shared hosting constraints. |

**Overall confidence:** HIGH

### Gaps to Address

- **Hostinger PHP version:** `maennchen/zipstream-php@^3.1` requires PHP 8.1+. Verify with `php -v` on the production Hostinger server before installing. If PHP 8.0, use `^2.4`.
- **GD WebP support on Hostinger:** Thumbnail generation for WebP uploads requires GD compiled with `--with-webp`. Run `gd_info()` in a test script to confirm before Phase 1 ships WebP support.
- **Hostinger execution time ceiling:** The actual `max_execution_time` cap on the specific Hostinger plan is unknown. Test a large ZIP generation (50+ files, 200 MB) in the Hostinger environment before Phase 5 is marked done — not on local dev.
- **`processedZipPath` cache invalidation strategy:** The schema supports caching the ZIP path, but the invalidation trigger (e.g., when a new EditedPhoto is added after DELIVERED transition) is not yet defined. Decide on invalidation policy during Phase 5 planning.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `backend/index.php`, `backend/collections/*.php`, `backend/utils.php`, `frontend/src/App.jsx`, `frontend/src/pages/CollectionDetailsPage.jsx`, `database_schema.sql`
- [npmjs.com — react-photo-album](https://www.npmjs.com/package/react-photo-album) — v3.4.0 confirmed current
- [npmjs.com — yet-another-react-lightbox](https://www.npmjs.com/package/yet-another-react-lightbox) — v3.25.0 confirmed current
- [npmjs.com — react-dropzone](https://www.npmjs.com/package/react-dropzone) — v15.0.0 confirmed current
- [packagist.org — maennchen/zipstream-php](https://packagist.org/packages/maennchen/zipstream-php) — v3.x stable
- [react-photo-album.com](https://react-photo-album.com/) — layout algorithms and SSR support verified
- [yet-another-react-lightbox.com](https://yet-another-react-lightbox.com/) — plugin system verified

### Secondary (MEDIUM confidence)
- [Pixieset Client Gallery](https://pixieset.com/client-gallery/) — feature set and positioning
- [ShootProof Features](https://www.shootproof.com/features/) — download controls, PIN protection, label-based selection
- [Top 10 Client Gallery Services 2025](https://picflow.com/blog/top-client-gallery-services) — market landscape
- [Pixieset Blog: Helping Clients Choose Favorites Faster](https://blog.pixieset.com/blog/favorite-photos-online-proofing/) — UX best practices for selection workflow
- Chunked File Uploads in Native PHP — Roman Huliak / Medium — vanilla PHP chunked assembly pattern

### Tertiary (LOW confidence)
- Hostinger Knowledge Base — PHP configuration limits: exact values for `max_execution_time` and `memory_limit` on shared plans need runtime verification; documented values may not match actual plan limits.

---

*Research completed: 2026-02-11*
*Ready for roadmap: yes*
