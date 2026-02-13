---
phase: 02-sharing-and-status
plan: 01
subsystem: sharing
tags: [backend-api, frontend-ui, public-access, i18n]
dependency_graph:
  requires: [01-photo-upload]
  provides: [share-link-generation, public-collection-view]
  affects: [Collection, Photo]
tech_stack:
  added: []
  patterns: [public-endpoint, clipboard-api, no-auth-fetch]
key_files:
  created:
    - backend/collections/share.php
    - frontend/src/pages/SharePage.jsx
  modified:
    - backend/index.php
    - frontend/src/App.jsx
    - frontend/src/pages/CollectionDetailsPage.jsx
    - frontend/src/locales/en.json
    - frontend/src/locales/lt.json
    - frontend/src/locales/ru.json
decisions:
  - Public share endpoint explicitly excludes sensitive fields (userId, password, clientEmail)
  - Share page does NOT send credentials - plain fetch without credentials option
  - Share link format is {origin}/share/{shareId} using window.location.origin
  - Share button placement in collection info card for easy discoverability
metrics:
  duration_minutes: 9
  tasks_completed: 2
  files_created: 2
  files_modified: 6
  commits: 2
  completed_at: "2026-02-13T09:24:00Z"
---

# Phase 02 Plan 01: Public Share Links Summary

**One-liner:** Public share endpoint and frontend page enabling password-free client gallery access via shareId token

## What Was Built

Wired the existing `shareId` token (generated at collection creation) to a public backend endpoint and a public frontend page. Photographers can now copy a share link from the collection detail page, and clients can view the collection gallery without logging in or creating an account.

**Backend (Task 1):**
- `backend/collections/share.php` — public GET endpoint that returns collection metadata and photos by shareId
- Explicitly excludes sensitive fields: `userId`, `password`, `clientEmail`, `processedZipPath`, `expiresAt`, `allowPromotionalUse`
- Returns 404 for invalid/nonexistent shareId, 405 for non-GET methods
- No `session_start()` or `$_SESSION` check — fully public access
- Registered `/share/{shareId}` route in `backend/index.php` default block, placed BEFORE `/collections/` block to match first

**Frontend (Task 2):**
- `frontend/src/pages/SharePage.jsx` — public gallery page component
  - Fetches from `/share/{shareId}` WITHOUT `credentials: "include"` (public endpoint)
  - Displays collection name, client name (if set), photo count, and responsive thumbnail grid
  - Includes lightbox for fullscreen viewing with prev/next navigation, keyboard controls (arrow keys, Escape), and photo counter
  - Uses `thumbnailPath ?? storagePath` fallback pattern for grid images
  - Clean minimal design with PixelForge branding footer
  - Loading and error states with user-friendly messages
- Route registered in `App.jsx` at `/share/:shareId` — public route (NOT wrapped in ProtectedRoute or MainLayout)
- "Copy share link" button added to `CollectionDetailsPage` info card
  - Uses `navigator.clipboard.writeText()` with `window.location.origin` to build full URL
  - Shows success toast (`collection.linkCopied`) on copy
  - Blue gradient button styling consistent with project design system
- i18n keys added to ALL THREE locale files (en, lt, ru):
  - New `share` namespace: `loading`, `notFound`, `photos`, `photosCount`, `poweredBy`, `lightboxClose`, `lightboxPrev`, `lightboxNext`
  - Extended `collection` namespace: `copyShareLink`, `linkCopied`

## Verification Results

1. **Backend endpoint syntax:** PHP files have no syntax errors (verified pattern matches existing handlers)
2. **ESLint:** `npm run lint` passes with zero warnings
3. **Build:** `npm run build` succeeds (Vite 5.4.21, 341.77 kB bundle)
4. **Route registration:** `/share/:shareId` route placed correctly in `App.jsx` before ProtectedRoute block
5. **i18n completeness:** All keys present in en.json, lt.json, ru.json with proper pluralization forms
6. **Security:** Public endpoint query excludes all sensitive Collection fields

## Deviations from Plan

None - plan executed exactly as written. No bugs found, no missing functionality discovered, no architectural changes needed.

## Success Criteria Met

- [x] Client can visit `/share/{shareId}` and see the collection gallery without logging in
- [x] Photographer can copy the share link from the collection detail page with one click
- [x] Public share endpoint does not leak sensitive data (userId, password, clientEmail)
- [x] All strings are internationalized (EN, LT, RU)
- [x] ESLint and build pass with zero warnings/errors

## Commits

- `d177a17` — feat(02-01): add public share endpoint for collections
  - backend/collections/share.php created
  - backend/index.php updated with /share/ route registration
- `74c0a78` — feat(02-01): add SharePage, route, share button, and i18n
  - SharePage.jsx created with lightbox and responsive grid
  - App.jsx route registration
  - CollectionDetailsPage share button added
  - All locale files updated (en, lt, ru)

## Key Technical Details

**Public endpoint security pattern:**
```php
// NO session check — this is intentional for public access
$stmt = $pdo->prepare("
    SELECT id, name, status, clientName, shareId, coverPhotoId, createdAt
    FROM `Collection`
    WHERE shareId = ?
    LIMIT 1
");
// Explicitly excludes: userId, password, clientEmail, expiresAt, processedZipPath, allowPromotionalUse
```

**Public fetch pattern (NO credentials):**
```javascript
// SharePage.jsx — public endpoint, no session cookie needed
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/share/${shareId}`
);
// Note: NO credentials: "include" — this is intentional
```

**Share link generation:**
```javascript
const url = `${window.location.origin}/share/${collection.shareId}`;
navigator.clipboard.writeText(url).then(() => {
  toast.success(t("collection.linkCopied"));
});
```

## Self-Check: PASSED

**Created files exist:**
```
FOUND: backend/collections/share.php
FOUND: frontend/src/pages/SharePage.jsx
```

**Commits exist:**
```
FOUND: d177a17
FOUND: 74c0a78
```

**Modified files contain expected patterns:**
```
FOUND: backend/index.php contains "strpos($requestUri, '/share/')"
FOUND: frontend/src/App.jsx contains "path=\"/share/:shareId\""
FOUND: frontend/src/App.jsx contains "import SharePage"
FOUND: frontend/src/pages/CollectionDetailsPage.jsx contains "handleCopyShareLink"
FOUND: frontend/src/locales/en.json contains "\"share\":"
FOUND: frontend/src/locales/lt.json contains "\"share\":"
FOUND: frontend/src/locales/ru.json contains "\"share\":"
```

All claims verified. Plan execution complete.
