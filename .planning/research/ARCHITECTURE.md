# Architecture Research

**Domain:** Photo delivery web app — upload, token-based gallery sharing, client selection, and file delivery
**Researched:** 2026-02-11
**Confidence:** HIGH — based on direct codebase inspection, not external sources

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                             │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────────┐ │
│  │ Photographer UI  │  │   Public Gallery   │  │  Delivery View   │ │
│  │ (authenticated)  │  │  (token URL, no    │  │  (token URL,     │ │
│  │  React SPA       │  │   login required)  │  │   download gate) │ │
│  └────────┬─────────┘  └────────┬───────────┘  └────────┬─────────┘ │
└───────────┼─────────────────────┼──────────────────────-┼────────────┘
            │ Session cookie      │ No credentials        │ No credentials
            │ (credentials:       │ (shareId token        │ (shareId token
            │  "include")         │  in URL path)         │  in URL path)
            ▼                     ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 api.pixelforge.pro/backend/                          │
│                   backend/index.php (router)                         │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────────┐   │
│  │ Session-auth │  │  Token-auth     │  │  File delivery        │   │
│  │ routes       │  │  public routes  │  │  (ZIP handler)        │   │
│  │ (existing)   │  │  (new)          │  │  (new)                │   │
│  └──────┬───────┘  └────────┬────────┘  └──────────┬────────────┘   │
│         │                   │                       │                │
│         ▼                   ▼                       ▼                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              getDbConnection() — PDO / MySQL                │    │
│  └─────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  backend/uploads/{collectionId}/{photoId}.jpg   (Apache-served)     │
│  backend/uploads/{collectionId}/edited/{id}.jpg (Apache-served)     │
└──────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     MySQL Database                                   │
│  User  Collection  Photo  EditedPhoto  Selection  PromotionalPhoto  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `backend/index.php` | Request dispatch — single switch router | `backend/index.php` |
| `backend/collections/photos.php` | Upload (POST), list (GET), delete (DELETE) original photos — session auth | `backend/collections/photos.php` |
| `backend/collections/edited.php` | Upload (POST), list (GET), delete (DELETE) edited finals — session auth | `backend/collections/edited.php` |
| `backend/collections/selections.php` | Record/remove client photo selections — **will need token auth path** | `backend/collections/selections.php` |
| `backend/collections/id.php` | Collection CRUD + status lifecycle transitions — session auth | `backend/collections/id.php` |
| `backend/gallery/*.php` (new) | Public token-based routes: gallery view, selections, download | `backend/gallery/` (to create) |
| `backend/utils.php` | `handleFileUpload()`, `safeDeleteUploadedFile()`, `parseRouteParts()`, `isValidId()` | `backend/utils.php` |
| `backend/uploads/` | Static file serving via Apache directly (not through PHP) | `backend/uploads/` |
| `backend/uploads/.htaccess` | Prevents PHP execution; allows only JPEG/PNG/WEBP to be served | `backend/uploads/.htaccess` |
| `CollectionDetailsPage` | Photographer's upload UI, photo grid, lightbox, cover setter | `frontend/src/pages/CollectionDetailsPage.jsx` |
| `GalleryPage` (new) | Public client-facing gallery: photo grid, selection UI, download buttons | `frontend/src/pages/GalleryPage.jsx` |
| React Router `App.jsx` | Route definitions — needs unauthenticated `/gallery/:shareId` route | `frontend/src/App.jsx` |
| `AuthContext` | Session auth state for photographer routes — no change needed | `frontend/src/contexts/AuthContext.jsx` |

---

## Recommended Project Structure

```
backend/
├── index.php                        # Router — add /gallery/* cases here
├── cors.php                         # CORS — no change needed
├── db.php                           # DB connection — no change needed
├── utils.php                        # Shared helpers — add generateZip() here
├── collections/
│   ├── index.php                    # GET/POST /collections (session auth)
│   ├── id.php                       # GET/PATCH/DELETE /collections/:id (session auth)
│   ├── photos.php                   # GET/POST/DELETE /collections/:id/photos (session auth)
│   ├── edited.php                   # GET/POST/DELETE /collections/:id/edited (session auth)
│   ├── selections.php               # GET/POST/DELETE /collections/:id/selections (session auth)
│   └── cover.php                    # PATCH /collections/:id/cover (session auth)
├── gallery/                         # NEW — public token-auth handlers
│   ├── view.php                     # GET /gallery/:shareId — fetch collection + photos (token auth)
│   ├── selections.php               # POST/DELETE /gallery/:shareId/selections (token auth)
│   └── download.php                 # GET /gallery/:shareId/download[/:photoId] (token, status gate)
└── uploads/
    ├── .htaccess                    # PHP off; JPEG/PNG/WEBP only
    └── {collectionId}/
        ├── {photoId}.jpg            # Original photos (Apache-served directly)
        └── edited/
            └── {editedPhotoId}.jpg  # Edited finals (Apache-served directly)

frontend/src/
├── App.jsx                          # Add /gallery/:shareId route (no ProtectedRoute)
├── pages/
│   ├── CollectionDetailsPage.jsx    # Photographer view — existing + extend
│   └── GalleryPage.jsx              # NEW — client public gallery
├── contexts/
│   └── AuthContext.jsx              # No change
├── components/
│   ├── ProtectedRoute.jsx           # No change
│   └── Accordion.jsx                # No change
├── locales/
│   ├── en.json                      # Add gallery.* keys
│   ├── lt.json                      # Add gallery.* keys
│   └── ru.json                      # Add gallery.* keys
└── layouts/
    └── MainLayout.jsx               # No change (gallery is outside this layout)
```

### Structure Rationale

- **`backend/gallery/`:** Separate directory for token-auth handlers avoids contaminating session-auth handlers. All token-auth logic is self-contained here and reads `shareId` from the URL path rather than `$_SESSION['user_id']`.
- **`backend/uploads/` Apache-served:** Files are accessed directly via URL (`api.pixelforge.pro/backend/uploads/{collectionId}/{id}.jpg`) without hitting PHP at all, because `.htaccess` rewrites only non-existing files to `index.php`. This is the existing pattern and should be preserved.
- **`frontend/src/pages/GalleryPage.jsx`:** Lives in `pages/` like all other pages but is registered as an unauthenticated route in `App.jsx` outside the `ProtectedRoute`/`MainLayout` wrapper.

---

## Architectural Patterns

### Pattern 1: Dual Auth — Session Cookie vs. ShareId Token

**What:** Two separate authentication mechanisms coexist in the same PHP router. Session-auth handlers (`$_SESSION['user_id']`) serve the photographer. Token-auth handlers verify `shareId` against the `Collection` table to serve clients.

**When to use:** Any endpoint that a client (no account) must access uses token auth. Any endpoint that requires photographer identity uses session auth. These are never mixed in the same handler.

**Trade-offs:**
- Simple to implement — no JWT, no OAuth
- Token is permanent (no expiry unless `expiresAt` is set on collection) — a leaked link stays valid
- No client identity — all selections from one link are anonymous (acceptable by design)

**Pattern in PHP:**

```php
// Token-auth handler pattern (backend/gallery/view.php)
require_once __DIR__ . '/../db.php';

$parts = parseRouteParts();
$shareId = $parts[1] ?? '';  // /gallery/{shareId}

if (empty($shareId) || !isValidId($shareId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid share token."]);
    exit;
}

$pdo = getDbConnection();
$stmt = $pdo->prepare("SELECT id, name, status, expiresAt FROM `Collection` WHERE shareId = ? LIMIT 1");
$stmt->execute([$shareId]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$collection) {
    http_response_code(404);
    echo json_encode(["error" => "Gallery not found."]);
    exit;
}

// Optional: check expiresAt
if ($collection['expiresAt'] && strtotime($collection['expiresAt']) < time()) {
    http_response_code(403);
    echo json_encode(["error" => "This gallery link has expired."]);
    exit;
}

// Proceed — $collection['id'] is now trusted
```

**How this integrates into `backend/index.php`:**

```php
// Add in the default: block alongside /collections/* handling
if (strpos($requestUri, '/gallery/') === 0) {
    $uriParts = explode('/', ltrim($requestUri, '/'));
    $subRoute = $uriParts[2] ?? '';

    switch ($subRoute) {
        case '':
            require_once __DIR__ . '/gallery/view.php';
            break;
        case 'selections':
            require_once __DIR__ . '/gallery/selections.php';
            break;
        case 'download':
            require_once __DIR__ . '/gallery/download.php';
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint Not Found']);
    }
    break;
}
```

---

### Pattern 2: Status-Gated File Access

**What:** The `Collection.status` field controls what a client can do. Download endpoints check status before serving files. This is enforced in the PHP handler, not on the frontend.

**When to use:** Any client-facing download endpoint. The frontend can also reflect the status visually (disable download button when status is not DELIVERED), but the server is the authority.

**Trade-offs:**
- Server enforcement means a clever client cannot bypass the status gate by calling the API directly
- Frontend reflection is UX-only (status badge, disabled button) — not security

**Status gates for client:**

| Collection Status | Client Can View Photos | Client Can Select | Client Can Download |
|-------------------|------------------------|-------------------|---------------------|
| DRAFT | No (share link may not be sent yet) | No | No |
| SELECTING | Yes | Yes | No |
| REVIEWING | Yes (read-only) | No (selections locked) | No |
| DELIVERED | Yes | No | Yes (EditedPhotos only) |
| ARCHIVED | Configurable (show/hide) | No | No |

**Pattern in PHP (download gate):**

```php
// backend/gallery/download.php
if ($collection['status'] !== 'DELIVERED') {
    http_response_code(403);
    echo json_encode(["error" => "Downloads are not available yet."]);
    exit;
}
```

---

### Pattern 3: Server-Side ZIP Generation

**What:** When the client requests a bulk download, PHP streams a ZIP archive built from `EditedPhoto` records using PHP's `ZipArchive` extension. The ZIP is either generated on demand (streamed) or pre-generated and cached at `Collection.processedZipPath`.

**When to use:** Client requests all delivered photos at once. The `processedZipPath` column already exists on `Collection` for caching the result.

**Trade-offs:**

| Approach | Pro | Con |
|----------|-----|-----|
| Stream on demand | No disk space waste; always fresh | CPU spike per request; regenerates every time |
| Pre-generate + cache | Fast subsequent downloads | Must invalidate when EditedPhotos change; disk cost |

**Recommended for this app:** Generate on demand first (simpler). Optionally cache to `processedZipPath` and serve the cached file if it exists and EditedPhotos haven't changed since.

**Pattern outline:**

```php
// backend/gallery/download.php (ZIP branch)
$stmt = $pdo->prepare(
    "SELECT storagePath, filename FROM `EditedPhoto` WHERE collectionId = ? ORDER BY createdAt ASC"
);
$stmt->execute([$collection['id']]);
$editedPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($editedPhotos)) {
    http_response_code(404);
    echo json_encode(["error" => "No delivered photos found."]);
    exit;
}

$zipPath = sys_get_temp_dir() . '/gallery_' . $collection['id'] . '.zip';
$zip = new ZipArchive();
$zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

foreach ($editedPhotos as $photo) {
    $fullPath = __DIR__ . '/../' . $photo['storagePath'];
    if (file_exists($fullPath)) {
        $zip->addFile($fullPath, $photo['filename']);
    }
}
$zip->close();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="photos.zip"');
header('Content-Length: ' . filesize($zipPath));
readfile($zipPath);
unlink($zipPath);
exit;
```

---

### Pattern 4: Photo URL Construction (Frontend)

**What:** The frontend constructs photo URLs by concatenating `VITE_API_BASE_URL` with `storagePath` from the API response. This works because Apache serves files from `uploads/` directly (the `.htaccess` rewrite only fires for non-existing files).

**Existing pattern (already in `CollectionDetailsPage.jsx`):**

```js
const photoUrl = (storagePath) => {
  const base = import.meta.env.VITE_API_BASE_URL;
  const path = storagePath.startsWith("/") ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};
// Result: https://api.pixelforge.pro/backend/uploads/{collectionId}/{photoId}.jpg
```

**Apply this same helper in `GalleryPage.jsx` for consistency.** The same `storagePath` format is used for both `Photo` and `EditedPhoto`.

---

## Data Flow

### Photographer Upload Flow

```
User drops files on CollectionDetailsPage
    ↓
Client-side validation (MIME type, 20 MB limit)
    ↓
FormData POST → /collections/:id/photos (session cookie)
    ↓
backend/collections/photos.php
    ├── Verify session → $_SESSION['user_id']
    ├── Verify collection ownership (SELECT WHERE userId = ?)
    ├── handleFileUpload() in utils.php
    │   ├── finfo MIME check
    │   ├── size check
    │   ├── mkdir uploads/{collectionId}/ if not exists
    │   └── move_uploaded_file() → uploads/{collectionId}/{newId}.jpg
    └── INSERT Photo row (id, filename, storagePath, collectionId)
    ↓
JSON response → photo object
    ↓
React fetchPhotos() refreshes photo list
```

### Token-Based Public Gallery Flow

```
Photographer copies share URL: pixelforge.pro/gallery/{shareId}
    ↓
Client opens URL in browser (no login, no cookie)
    ↓
React Router matches /gallery/:shareId → GalleryPage (no ProtectedRoute)
    ↓
GalleryPage fetch GET /gallery/{shareId}
    ↓
backend/gallery/view.php
    ├── SELECT Collection WHERE shareId = ?
    ├── Check expiresAt if set
    ├── Check status (must not be DRAFT for public view)
    └── SELECT Photo WHERE collectionId = ? (original photos)
    ↓
JSON → collection metadata + photos array
    ↓
GalleryPage renders photo grid
    Photos served directly: api.pixelforge.pro/backend/uploads/{colId}/{photoId}.jpg
    (Apache static serve, no PHP involved)
```

### Client Selection Flow

```
Client clicks photo in GalleryPage (status = SELECTING)
    ↓
POST /gallery/{shareId}/selections  { photoId: "..." }
    ↓
backend/gallery/selections.php
    ├── SELECT Collection WHERE shareId = ?
    ├── Verify status = SELECTING (reject otherwise)
    ├── Verify photo belongs to this collection
    └── INSERT Selection (id, collectionId, photoId)
    ↓
JSON response
    ↓
React optimistic UI update (toggle selected state)
```

### Photographer Reviews Selections Flow

```
Photographer opens CollectionDetailsPage (status = REVIEWING)
    ↓
Fetch GET /collections/:id/selections (session auth)
    ↓
backend/collections/selections.php returns { selections: [{photoId, ...}] }
    ↓
Photographer UI shows photo grid with selected/not-selected filter
    (filter is client-side: selectedPhotoIds Set, toggle view)
```

### Client Download Flow (Individual + ZIP)

```
Client on GalleryPage (status = DELIVERED)
    ↓
Individual download:
    Anchor tag href = photoUrl(editedPhoto.storagePath) + download attribute
    OR
    Fetch GET /gallery/{shareId}/download/{editedPhotoId}
    → backend/gallery/download.php validates status=DELIVERED, returns file

ZIP download:
    Button → fetch GET /gallery/{shareId}/download  (no photoId)
    → backend/gallery/download.php
        ├── Verify status = DELIVERED
        ├── SELECT EditedPhoto WHERE collectionId = ?
        ├── ZipArchive: add each file from disk
        └── Stream ZIP with Content-Disposition: attachment
    → Browser auto-downloads photos.zip
```

### State Management (Frontend)

```
AuthContext (localStorage)
    ↓ (read by)
ProtectedRoute → gates /collections, /collection/:id, etc.
    No effect on /gallery/:shareId (outside ProtectedRoute)

Page-local state (useState):
    CollectionDetailsPage: collection, photos, uploadStates, lightboxIndex
    GalleryPage:           collection, photos, selections (Set of photoIds), mode

No shared state needed between photographer and client views
(they run in separate browser sessions by definition)
```

---

## Build Order (Dependencies Between Components)

The features are ordered by dependency — each phase unlocks the next.

```
Phase 1: Photo Upload (mostly done)
    ✓ backend/collections/photos.php — POST/GET/DELETE (already implemented)
    ✓ backend/utils.php — handleFileUpload(), safeDeleteUploadedFile()
    ✓ CollectionDetailsPage — drag/drop upload zone (already implemented)
    → Verify: cover auto-set on first upload (needs PATCH /collections/:id cover logic)

Phase 2: Status Lifecycle + Collection Card Color
    → PATCH /collections/:id { status: "SELECTING" } (id.php already handles this)
    → CollectionDetailsPage status controls (button to transition status)
    → CollectionsListPage card color based on status field

Phase 3: Public Gallery (token auth) — depends on Phase 1
    → Add /gallery/* routing in backend/index.php
    → Create backend/gallery/view.php (read collection + photos by shareId)
    → Create frontend/src/pages/GalleryPage.jsx
    → Add /gallery/:shareId route in App.jsx (outside ProtectedRoute)
    → Share link UI on CollectionDetailsPage (copy shareId URL)

Phase 4: Client Selection — depends on Phase 3
    → Create backend/gallery/selections.php (token auth, status=SELECTING gate)
    → Extend GalleryPage with selection toggle UI
    → Add selection count display to CollectionDetailsPage (photographer view)

Phase 5: Photographer Reviews Selections — depends on Phase 4
    → existing backend/collections/selections.php already returns selections
    → CollectionDetailsPage: selected/not-selected filter UI

Phase 6: Edited Photo Upload — depends on Phase 1 pattern
    ✓ backend/collections/edited.php — POST/GET/DELETE (already implemented)
    → Extend CollectionDetailsPage: "Upload finals" section (separate from originals)

Phase 7: Client Download — depends on Phase 3 + Phase 6
    → Create backend/gallery/download.php
        - Individual file: validate status=DELIVERED, serve file via readfile()
        - ZIP: ZipArchive all EditedPhotos, stream response
    → Extend GalleryPage: show EditedPhotos when status=DELIVERED, download buttons
```

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Photographer UI ↔ Backend API | `fetch()` with `credentials:"include"` (session cookie) | Cross-domain — session cookie scoped to `.pixelforge.pro` |
| Public Gallery ↔ Backend API | `fetch()` without credentials (no cookie) | `shareId` in URL path is the only identity |
| Backend ↔ MySQL | PDO prepared statements via `getDbConnection()` | All DB access must go through this factory |
| Backend ↔ Filesystem | `handleFileUpload()` writes to `backend/uploads/` | Paths are relative to `__DIR__`; validated with `realpath()` |
| Browser ↔ Static Files | Direct URL to `api.pixelforge.pro/backend/uploads/...` | Apache serves without PHP; `.htaccess` restricts to image types only |
| PHP ZIP handler ↔ Filesystem | Reads `uploads/{collectionId}/edited/` via absolute paths | Uses `sys_get_temp_dir()` for temp ZIP; deleted after stream |

### Auth Boundary (Critical)

```
Session-auth zone:                     Token-auth zone:
/collections/*                         /gallery/*
  - Verified by $_SESSION['user_id']     - Verified by shareId in URL path
  - Returns photographer's own data      - Returns public collection data
  - Can modify: photos, selections,      - Can: view photos, add/remove selections
    status, settings                       (only when status=SELECTING)
                                         - Can: download (only when status=DELIVERED)
                                         - Cannot: modify collection settings,
                                           upload photos, change status
```

The two zones must never cross-authenticate. A token route must never accept a session cookie as auth, and a session route must never accept a shareId.

---

## Anti-Patterns

### Anti-Pattern 1: Serving Files Through PHP

**What people do:** Route file download requests through PHP (`readfile()`) for all photo requests, including the regular photo grid.

**Why it's wrong:** PHP adds overhead for every image load. The existing `.htaccess` already enables Apache to serve image files directly from `uploads/` — this is fast and correct. Using PHP to proxy regular image display defeats this.

**Do this instead:** Use Apache-direct URLs for the photo grid (`photoUrl(storagePath)` helper). Only use PHP `readfile()` for the download endpoint where you need to enforce the status gate and add `Content-Disposition: attachment`.

---

### Anti-Pattern 2: Checking Auth Token in CORS Headers Instead of Request Body/Path

**What people do:** Pass the `shareId` as a custom HTTP header (e.g., `X-Share-Token`) and read it in PHP.

**Why it's wrong:** The `cors.php` CORS config only whitelists `Content-Type` and `Authorization` headers. Custom headers require adding them to `Access-Control-Allow-Headers`, creating an unnecessary coupling between auth and CORS config.

**Do this instead:** Pass `shareId` as part of the URL path (`/gallery/{shareId}/...`). This is already consistent with how collection IDs are handled and requires no CORS changes.

---

### Anti-Pattern 3: Storing shareId on the Client to Authenticate Later Requests

**What people do:** After loading `/gallery/:shareId`, store the shareId in localStorage or React context and use it for subsequent requests without it being in the URL.

**Why it's wrong:** The shareId is the entire access credential. If the user bookmarks or shares the URL, the shareId must be in the URL for the link to be self-contained. Removing it from the URL after first load breaks bookmarks and the copy-link share flow.

**Do this instead:** Always keep the shareId in the URL. React Router's `useParams()` provides it on every render of `GalleryPage`. Each API call constructs the endpoint from the shareId directly: `fetch(\`${API}/gallery/${shareId}/selections\`)`.

---

### Anti-Pattern 4: Client-Side Download Gate

**What people do:** Disable the download button in React when `collection.status !== 'DELIVERED'` and consider that sufficient protection.

**Why it's wrong:** A user with DevTools can call the download API directly, bypassing the React UI. Client-side gates are UX only.

**Do this instead:** Enforce the status gate in `backend/gallery/download.php`. The server must check `status === 'DELIVERED'` and return 403 otherwise. The frontend gate is additive (hides the button to avoid confusion) but not the authority.

---

### Anti-Pattern 5: One Giant Handler File

**What people do:** Add token-auth gallery logic as extra cases inside existing session-auth handler files (e.g., adding an unauthenticated path to `collections/id.php`).

**Why it's wrong:** Session-auth and token-auth have different security models. Mixing them in one file makes it easy to accidentally skip the session check in one code path, or forget to check the status gate in another. It also makes the code harder to audit.

**Do this instead:** Keep all token-auth handlers in a separate `backend/gallery/` directory. Session-auth files (`backend/collections/`) always start with the session check and never fall through to unauthenticated code.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (small, Hostinger) | Local file storage in `backend/uploads/` — acceptable. ZIP on demand in PHP. Session auth. |
| Growing (many concurrent downloads) | Pre-generate ZIP and cache at `Collection.processedZipPath`. Invalidate cache when EditedPhotos change. |
| Large (many photographers, large files) | Migrate `uploads/` to object storage (S3/R2) — `processedZipPath` and `storagePath` columns already anticipate this. Change `handleFileUpload()` and the photo URL helper. The DB schema and API contract stay the same. |

### Scaling Priorities

1. **First bottleneck:** ZIP generation blocking PHP — large collections with many files. Fix: pre-generate ZIP on upload, cache at `processedZipPath`.
2. **Second bottleneck:** Disk space on Hostinger — photos accumulate. Fix: cloud storage migration (already noted as planned in `PROJECT.md`).

---

## Sources

- Direct codebase inspection: `backend/index.php`, `backend/collections/*.php`, `backend/utils.php`, `backend/uploads/.htaccess`, `frontend/src/App.jsx`, `frontend/src/pages/CollectionDetailsPage.jsx`
- Database schema: `database_schema.sql`
- Project requirements: `.planning/PROJECT.md`
- Existing architecture map: `.planning/codebase/ARCHITECTURE.md`

---

*Architecture research for: Photo Hub — upload, token-based gallery, selection, and delivery features*
*Researched: 2026-02-11*
