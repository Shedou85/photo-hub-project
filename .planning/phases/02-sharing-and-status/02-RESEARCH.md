# Phase 2: Sharing and Status - Research

**Researched:** 2026-02-12
**Domain:** Token-based public collection sharing (PHP), React public route, collection card status color coding
**Confidence:** HIGH (all findings from direct codebase inspection; no external libraries required)

---

## Summary

Phase 2 has two orthogonal concerns: (1) exposing a public URL where a client can view a collection via a token, and (2) visually indicating collection workflow status on the photographer's collection cards.

For the share token, the work is surprisingly advanced. `shareId` already exists as a `UNIQUE` `VARCHAR(191)` column on `Collection`, is generated at creation time via `bin2hex(random_bytes(8))` (16 hex chars), and is already included in all GET responses. A share button already exists on collection cards in `CollectionsListPage.jsx` — it constructs the URL `${window.location.origin}/share/${shareId}` and copies it to the clipboard. The only missing pieces are: a public PHP endpoint that serves collection data by shareId (no session required), a React route at `/share/:shareId`, and a public-facing page component that fetches from that endpoint.

For status color coding, the collection status field (`DRAFT`, `SELECTING`, `REVIEWING`, `DELIVERED`, `ARCHIVED`) is already returned by both collection list and detail APIs. The collection cards in `CollectionsListPage.jsx` currently have a fixed `shadow-md` styling with no status-conditional border. The work here is purely frontend — conditionally apply Tailwind border classes based on `collection.status`.

No new npm packages, no DB migrations, and no new DB columns are needed for either concern.

**Primary recommendation:** Do not generate a new token or add a new column. Reuse the existing `shareId`. The backend work is a single new PHP handler file. The frontend work is one new public page component plus a new route in `App.jsx`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla PHP | (existing) | Public share endpoint | Already in use; no framework needed |
| React Router DOM v7 | (existing) | Public `/share/:shareId` route | Already installed and used |
| react-i18next | (existing) | i18n strings on share page | Already installed; LT/EN/RU required |
| Tailwind CSS v3 | (existing) | Status border color classes | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | (existing) | Toast feedback | For share link copy confirmation on details page |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reuse existing `shareId` | Generate new `shareToken` column | No reason to add a column; `shareId` is already correct and already unique |
| `bin2hex(random_bytes(8))` (already in use) | UUID, CUID, nanoid | Already generating 16-char hex token on creation; sufficient entropy, already shipping |

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── collections/
│   ├── index.php          # GET /collections, POST /collections (auth required)
│   ├── id.php             # GET/PATCH/DELETE /collections/{id} (auth required)
│   └── share.php          # NEW: GET /share/{shareId} (public, no auth)
frontend/src/
├── pages/
│   ├── CollectionsListPage.jsx   # MODIFY: add status border color to cards
│   ├── CollectionDetailsPage.jsx # MODIFY: add share link button to info card
│   └── SharePage.jsx             # NEW: public view at /share/:shareId
├── App.jsx                        # MODIFY: add /share/:shareId route (no ProtectedRoute)
locales/
├── en.json   # ADD: share page and status color strings
├── lt.json   # ADD: same keys
└── ru.json   # ADD: same keys
```

### Pattern 1: Public PHP Endpoint (No Auth)
**What:** A handler file that reads by `shareId` instead of collection `id`, omits session check entirely.
**When to use:** Any endpoint intended for unauthenticated client access.
**Example:**
```php
// backend/collections/share.php
// Source: codebase pattern from backend/collections/id.php
<?php
require_once __DIR__ . '/../db.php';

$parts = parseRouteParts(); // utils.php helper
$shareId = $parts[1] ?? ''; // URL: /share/{shareId}

if (empty($shareId)) {
    http_response_code(400);
    echo json_encode(["error" => "Share ID is required."]);
    exit;
}

$pdo = getDbConnection();
$stmt = $pdo->prepare("
    SELECT id, name, status, clientName, shareId, coverPhotoId, createdAt
    FROM `Collection`
    WHERE shareId = ?
    LIMIT 1
");
$stmt->execute([$shareId]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$collection) {
    http_response_code(404);
    echo json_encode(["error" => "Collection not found."]);
    exit;
}

// Optionally include photos
$photoStmt = $pdo->prepare("
    SELECT id, filename, storagePath, thumbnailPath, createdAt
    FROM `Photo`
    WHERE collectionId = ?
    ORDER BY createdAt ASC
");
$photoStmt->execute([$collection['id']]);
$collection['photos'] = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "OK", "collection" => $collection]);
```

### Pattern 2: Router Registration for /share/{shareId}
**What:** Add a new route case to `backend/index.php` switch/default block, parallel to the `/collections/` default handler.
**When to use:** Any new top-level URI namespace.
**Example:**
```php
// In backend/index.php default: block, BEFORE the 404 fallback
if (strpos($requestUri, '/share/') === 0) {
    if ($requestMethod === 'GET') {
        require_once __DIR__ . '/collections/share.php';
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
    }
    break;
}
```

### Pattern 3: Public React Route (No ProtectedRoute wrapper)
**What:** A route outside the `<ProtectedRoute>` wrapper and outside `<MainLayout>` — renders without sidebar.
**When to use:** Any page accessible without login.
**Example:**
```jsx
// In App.jsx — add alongside the existing public routes
<Route path="/share/:shareId" element={<SharePage />} />
```

### Pattern 4: Status Color Coding via Tailwind Conditional Classes
**What:** Map `collection.status` to Tailwind border/accent classes inline in JSX.
**When to use:** Status-driven visual differentiation.
**Example:**
```jsx
// In CollectionsListPage.jsx — replace or extend the card wrapper className
const statusBorderClass = {
  SELECTING: 'border-blue-500 border-2',
  REVIEWING: 'border-green-500 border-2',
}[collection.status] ?? 'border-gray-200';

// Apply on the card div:
<div className={`bg-white rounded-[10px] shadow-md ... ${statusBorderClass}`}>
```

### Pattern 5: Share Link on Collection Detail Page
**What:** A "Copy share link" button in the CollectionDetailsPage info card using the existing `navigator.clipboard` pattern already seen in `CollectionsListPage.jsx`.
**When to use:** Share functionality that lives on the detail page (SHARE-01 requirement).
**Example:**
```jsx
// Reuse the existing handleShareCollection pattern from CollectionsListPage.jsx
const handleCopyShareLink = () => {
  const url = `${window.location.origin}/share/${collection.shareId}`;
  navigator.clipboard.writeText(url).then(() => {
    toast.success(t('collection.linkCopied'));
  });
};
```

### Anti-Patterns to Avoid
- **Wrapping /share/:shareId with ProtectedRoute:** The client must access this page without an account. Do not add auth guards.
- **Creating a new `shareToken` column:** `shareId` already exists, is unique, and is already populated for all collections. No migration needed.
- **Generating a shareId on demand (lazy generation):** All collections already have a shareId generated at creation time. The photographer simply copies the pre-existing link; no "generate" step is needed.
- **Using MainLayout for the share page:** The share page is a standalone public view. It must NOT render the authenticated sidebar.
- **Sharing user-sensitive fields via public endpoint:** The public endpoint must NOT return `userId`, `password`, `clientEmail`, or other photographer-private data.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token generation | Custom PRNG | `bin2hex(random_bytes(8))` — already in use | Already generates cryptographically secure 16-char hex tokens at creation time |
| Clipboard copy | Custom clipboard API wrapper | `navigator.clipboard.writeText()` — already used in `CollectionsListPage.jsx` | Pattern is already established in the codebase |
| Toast feedback | Custom notification component | `sonner` (`toast.success`) — already installed | Already used everywhere |

**Key insight:** The entire token infrastructure already exists. This phase is about wiring the existing token to a public endpoint and a public frontend page, plus adding CSS-level status indicators.

---

## Common Pitfalls

### Pitfall 1: CORS on the Public Endpoint
**What goes wrong:** The public `/share/{shareId}` endpoint is called from the same frontend origin as all other API calls. However, if `cors.php` only allows credentialed requests (which it likely does for the session-based auth endpoints), the public endpoint would fail in a browser if it requires credentials.
**Why it happens:** The public share page must call the backend without `credentials: "include"` (client has no session cookie). If the CORS policy only sends `Access-Control-Allow-Origin` for credentialed requests, it may still work — but the fetch should omit `credentials: "include"` for the public endpoint.
**How to avoid:** In the `SharePage` React component, call the share API without `credentials: "include"`. Verify that `cors.php` permits non-credentialed cross-origin requests to the domain.
**Warning signs:** Browser console showing CORS error on `fetch('/share/...')` from the frontend.

### Pitfall 2: `parseRouteParts()` URI Segments for `/share/{shareId}`
**What goes wrong:** `parseRouteParts()` in `utils.php` strips the `/backend` base path and splits on `/`. For the path `/share/abc123`, `$parts[0]` = `'share'` and `$parts[1]` = `'abc123'`. The share handler must read `$parts[1]`, not `$parts[2]` (which is what `/collections/{id}/...` sub-routes use).
**Why it happens:** Different URI depth from `/collections/{id}/photos` pattern.
**How to avoid:** In `share.php`, use `$parts[1]` for the shareId. Verify against the pattern in `id.php` which uses `$parts[1]` for the collection ID.

### Pitfall 3: Tailwind Status Border Overwrites Existing Card Border
**What goes wrong:** The card currently uses `shadow-md` and no explicit border. If the `statusBorderClass` adds `border-2` but the card wrapper already computes `border border-gray-200` from a different className string, they will conflict.
**Why it happens:** Tailwind class conflicts in JSX string concatenation.
**How to avoid:** Structure the conditional border class so it fully replaces the default border class (not appended alongside it). Use a single expression that outputs either the default grey border or the status border, never both.

### Pitfall 4: i18n Keys Must Be Added to All Three Locale Files
**What goes wrong:** New keys added only to `en.json` will show key-string fallbacks in LT/RU views.
**Why it happens:** react-i18next shows the key path as fallback when a translation is missing.
**How to avoid:** Add every new i18n key to `en.json`, `lt.json`, AND `ru.json` in the same commit. New keys needed: `collection.linkCopied` (already exists), plus any new keys for the share page (`share.title`, `share.notFound`, `share.loading`, etc.).

### Pitfall 5: Share Page Accessing Wrong API Base URL
**What goes wrong:** The share page fetches from `VITE_API_BASE_URL` which points to `api.pixelforge.pro/backend`. The new share endpoint must be registered at `/share/{shareId}` in the backend router (i.e. `api.pixelforge.pro/backend/share/{shareId}`), not at a frontend-only path.
**Why it happens:** Confusion between the React Router `/share/:shareId` path (frontend) and the API path `/share/{shareId}` (backend).
**How to avoid:** Be explicit in planning: the React route is `/share/:shareId` (rendered by `App.jsx`). The API call from that page is `GET ${VITE_API_BASE_URL}/share/{shareId}`. These are distinct paths on distinct domains.

---

## Code Examples

Verified patterns from codebase inspection:

### Existing shareId generation (backend/collections/index.php, line 49)
```php
// Source: backend/collections/index.php line 49
$shareId = bin2hex(random_bytes(8)); // 16 hex chars, already set on every collection
```

### Existing share button (frontend/src/pages/CollectionsListPage.jsx, lines 127-134)
```jsx
// Source: CollectionsListPage.jsx — handleShareCollection already implements copy
const handleShareCollection = (id, shareId) => {
  const shareUrl = `${window.location.origin}/share/${shareId}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    setCopiedId(id);
    toast.success(t('collections.linkCopied'));
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  });
};
```

### Existing route registration pattern (backend/index.php, lines 179-205)
```php
// Source: backend/index.php — the default: block pattern to add new URI namespaces
if (strpos($requestUri, '/collections/') === 0) {
    // ... dispatches to sub-handlers
    break;
}
// New /share/ block goes here, before the 404:
if (strpos($requestUri, '/share/') === 0) {
    // ...
    break;
}
http_response_code(404);
echo json_encode(['error' => 'Endpoint Not Found']);
```

### Existing public route in App.jsx (pattern)
```jsx
// Source: App.jsx lines 21-22 — public routes live outside ProtectedRoute
<Route path="/" element={isAuthenticated ? <Navigate to="/collections" replace /> : <HomePage />} />
<Route path="/login" element={isAuthenticated ? <Navigate to="/collections" replace /> : <LoginPage />} />
// Share page should be similar — accessible by anyone, no redirect logic needed
<Route path="/share/:shareId" element={<SharePage />} />
```

### Existing collection card structure (CollectionsListPage.jsx, line 212)
```jsx
// Source: CollectionsListPage.jsx line 212 — the card wrapper to modify
<div
  key={collection.id}
  className="bg-white rounded-[10px] shadow-md hover:shadow-lg overflow-hidden group rotate-[0.5deg] hover:rotate-[1.5deg] hover:-translate-y-1 transition-all duration-300 ease-out"
>
// Add status border by prepending/replacing with conditional class
```

### Tailwind status color mapping (recommended pattern)
```jsx
// Recommended pattern — keeps default styling for non-status states
const STATUS_BORDER = {
  SELECTING: 'border-2 border-blue-500',
  REVIEWING: 'border-2 border-green-500',
};
const statusBorder = STATUS_BORDER[collection.status] ?? '';
// Then in className: `bg-white rounded-[10px] shadow-md ... ${statusBorder}`
// Note: the card currently has no explicit border class, so no conflict.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generate share token on demand (lazy) | Token generated at collection creation | Already shipped | No "generate link" button needed — link already exists |
| Share button only on card list | Also needs share button on detail page | Phase 2 requirement | Need to add to `CollectionDetailsPage.jsx` |

**Deprecated/outdated:**
- None applicable. `shareId` approach is aligned with the schema design.

---

## Open Questions

1. **What should the public share page show?**
   - What we know: SHARE-02 says "client can access the collection via share link without creating an account." The schema has `clientName` on the collection.
   - What's unclear: Should the share page show photos (with thumbnails)? Should it show the selection UI (Phase 3)? For Phase 2, a read-only gallery view is the safe default.
   - Recommendation: Render collection name, `clientName` (if set), photo count, and a thumbnail grid. Keep it read-only for Phase 2. Selection UI is Phase 3.

2. **Does the share page need the photos list, or just collection metadata?**
   - What we know: The public endpoint currently doesn't exist. The question is whether `share.php` should join `Photo` rows in the same response.
   - What's unclear: If the share page renders a gallery, it needs photos. If it only confirms the link is valid, metadata is enough.
   - Recommendation: Include photos in the share endpoint response to avoid a second round-trip. Return only `id`, `filename`, `thumbnailPath`, `storagePath` — no sensitive fields.

3. **Should the share link on the detail page use the same copy-to-clipboard UX as the card list, or a visible URL field?**
   - What we know: The card list already has a small "Share" button that copies. The success criteria says "one click."
   - What's unclear: A visible input with the URL is more transparent for users. A simple button is simpler.
   - Recommendation: A button matching the existing copy pattern is sufficient for Phase 2 (success criteria only requires "one click"). A visible URL input is a nice-to-have.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `backend/collections/index.php`, `backend/collections/id.php`, `backend/index.php`, `backend/utils.php`
- Direct codebase inspection — `database_schema.sql` (Collection table definition, shareId column)
- Direct codebase inspection — `frontend/src/pages/CollectionsListPage.jsx` (existing share button logic)
- Direct codebase inspection — `frontend/src/pages/CollectionDetailsPage.jsx` (no share button present)
- Direct codebase inspection — `frontend/src/App.jsx` (public route pattern)
- Direct codebase inspection — `frontend/src/locales/en.json` (existing i18n keys)

### Secondary (MEDIUM confidence)
- None required. All findings are directly from the codebase.

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; everything is existing project infrastructure
- Architecture: HIGH — patterns directly derived from existing codebase (id.php, index.php router, App.jsx routes)
- Pitfalls: HIGH — identified from direct code analysis of collision points (CORS headers, URI parse depth, Tailwind class conflicts)

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (stable; only invalidated by schema changes or major refactor)
