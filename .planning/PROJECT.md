# Photo Hub (PixelForge)

## What This Is

Photo Hub is a collection management app for professional photographers at pixelforge.pro. Photographers upload photos to collections, share a link with clients for photo selection, then deliver edited versions for download. The UI is available in Lithuanian, English, and Russian.

## Core Value

The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ User can register with email and password — existing
- ✓ User can log in and session persists across browser refresh — existing
- ✓ User can update their profile (name, bio) — existing
- ✓ User can create a collection — existing
- ✓ User can view their collections as Polaroid-style cards — existing
- ✓ User can view collection details — existing
- ✓ User can delete a collection — existing
- ✓ UI supports Lithuanian, English, and Russian — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Photographer can upload photos to a collection (stored in backend/uploads/)
- [ ] Collection cover is automatically set to the first uploaded photo; photographer can override it
- [ ] Collection card color reflects status (default = grey/white, SELECTING = blue, REVIEWING = green, DELIVERED = purple)
- [ ] Photographer can generate a shareable client link (token-based, no client account required)
- [ ] Client can browse collection photos in a responsive viewer (grid + fullscreen modes)
- [ ] Client can mark photos for editing (selection stage)
- [ ] Client cannot download any photos during the selection stage
- [ ] Photographer can view which photos the client selected, with selected/not-selected filter
- [ ] Photographer can upload edited (final) versions of photos
- [ ] Photographer can send a delivery link to the client
- [ ] Client can download individual photos from the delivery view
- [ ] Client can download all delivered photos as a ZIP archive (server-side ZIP via PHP)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Cloud storage (S3 / Cloudflare R2) — deferred; using backend/uploads/ for now, migration planned for a future milestone
- Client accounts / authentication — deliberate; client access is link-only by design
- Email notifications — not in scope for this milestone
- Real-time updates (WebSockets) — not needed; polling or manual refresh is sufficient

## Context

- Stack: React 18 + Vite 5 frontend, vanilla PHP backend, MySQL database
- Hosting: Hostinger server; backend/uploads/ for file storage (S3 migration planned later)
- Cross-domain: frontend on pixelforge.pro, API on api.pixelforge.pro/backend/ — session cookies scoped to .pixelforge.pro
- DB schema already includes: Photo, EditedPhoto, Selection, PromotionalPhoto tables and collection status enum (DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED)
- Codebase map exists at .planning/codebase/ — architecture, stack, conventions documented

## Constraints

- **Storage**: Files stored in `backend/uploads/` — no external storage service yet
- **Auth**: Client-facing pages must be publicly accessible via token URL (no login required)
- **Download protection**: Photos must not be downloadable during the SELECTING stage; only during DELIVERED
- **Stack**: PHP backend (no framework), React frontend, MySQL — no new backend frameworks
- **i18n**: All new UI strings must be added to en.json, lt.json, and ru.json

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local file storage (backend/uploads/) | Simplest path to ship; cloud migration planned but not needed now | — Pending |
| Token-based client access (no accounts) | Friction-free for clients; photographers share one link | — Pending |
| Server-side ZIP generation (PHP) | Avoids large client-side memory usage for many/large files | — Pending |
| Status color coding on collection cards | Visual status at a glance without opening each collection | — Pending |

---
*Last updated: 2026-02-11 after initialization*
