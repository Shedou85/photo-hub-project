# Photo Hub (PixelForge)

## What This Is

Photo Hub is a collection management app for professional photographers at pixelforge.pro. Photographers upload photos to collections, share a link with clients for photo selection, then deliver edited versions for download. The UI is available in Lithuanian, English, and Russian.

## Core Value

The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## Current Milestone: v2.0 Delivery & Polish

**Goal:** Enable client delivery of edited photos with flexible download options (ZIP + individual) and improve UI/UX across the photographer workflow.

**Target features:**
- Separate delivery link system for edited finals
- ZIP download all finals + individual photo downloads
- DOWNLOADED status tracking (collection lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED)
- UI polish: hide upload dropzone after first upload, reorganize collection details and share page buttons, improve action flow clarity

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ User can register with email and password — pre-v1.0
- ✓ User can log in and session persists across browser refresh — pre-v1.0
- ✓ User can update their profile (name, bio) — pre-v1.0
- ✓ User can create a collection — pre-v1.0
- ✓ User can view their collections as Polaroid-style cards — pre-v1.0
- ✓ User can view collection details — pre-v1.0
- ✓ User can delete a collection — pre-v1.0
- ✓ UI supports Lithuanian, English, and Russian — pre-v1.0
- ✓ Photographer can upload photos to a collection with GD thumbnail generation — v1.0
- ✓ Collection cover is automatically set to the first uploaded photo; photographer can override it — v1.0
- ✓ Collection card color reflects status (blue=SELECTING, green=REVIEWING) — v1.0
- ✓ Photographer can generate a shareable client link (token-based, no client account required) — v1.0
- ✓ Client can browse collection photos in a responsive viewer (grid + fullscreen lightbox) — v1.0
- ✓ Client can mark photos for editing (selection stage) with optimistic updates — v1.0
- ✓ Client cannot download any photos during the selection stage — v1.0
- ✓ Photographer can view which photos the client selected, with All/Selected/Not Selected filter tabs — v1.0
- ✓ Photographer can upload edited (final) versions of photos — v1.0
- ✓ Collection transitions through complete lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED) — v1.0

### Active

<!-- Current scope. Building toward these. -->

- [ ] Client can download edited photos as ZIP file
- [ ] Client can download individual edited photos
- [ ] Photographer can generate separate delivery link for client
- [ ] Selection link redirects to delivery page after DELIVERED status
- [ ] Collection transitions to DOWNLOADED status after client downloads
- [ ] Upload dropzone hides after first photo upload
- [ ] Collection details page has improved button organization
- [ ] Share page has improved client action layout

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Cloud storage (S3 / Cloudflare R2) — deferred; using backend/uploads/ for now, migration planned for future milestone when storage costs justify migration effort
- Client accounts / authentication — deliberate; client access is link-only by design to maintain zero-friction workflow
- Email notifications — deferred; photographers share links manually, email integration planned for future milestone
- Real-time updates (WebSockets) — not needed; manual refresh is sufficient for this workflow
- ARCHIVED status workflow — deferred; not needed for v2.0 release

## Context

**Current State (after v1.0):**
- **Shipped:** Complete photographer-to-client workflow with photo upload, token-based sharing, client selection, and delivery
- **Codebase:** 2,886 lines JS/JSX frontend + 1,777 lines PHP backend
- **Requirements:** 15/15 v1.0 requirements validated, 100% cross-phase integration, E2E flows verified
- **Tech stack:** React 18 + Vite 5 frontend, vanilla PHP backend with PDO, MySQL database
- **Hosting:** Hostinger server; backend/uploads/ for file storage (S3 migration planned for future milestone)
- **Cross-domain:** frontend on pixelforge.pro, API on api.pixelforge.pro/backend/ — session cookies scoped to .pixelforge.pro
- **DB schema:** Photo, EditedPhoto, Selection, PromotionalPhoto tables; collection status lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED)
- **Known tech debt:** GD WebP support verification needed on Hostinger; ZIP download delivery deferred to v2.0
- **Codebase map:** Architecture and conventions documented at .planning/codebase/

## Constraints

- **Storage**: Files stored in `backend/uploads/` — no external storage service yet
- **Auth**: Client-facing pages must be publicly accessible via token URL (no login required)
- **Download protection**: Photos must not be downloadable during the SELECTING stage; only during DELIVERED
- **Stack**: PHP backend (no framework), React frontend, MySQL — no new backend frameworks
- **i18n**: All new UI strings must be added to en.json, lt.json, and ru.json

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local file storage (backend/uploads/) | Simplest path to ship; cloud migration planned but not needed now | ✓ Good — Shipped in v1.0, works well for initial scale |
| Token-based client access (no accounts) | Friction-free for clients; photographers share one link | ✓ Good — Core feature shipped, validated by audit |
| Server-side ZIP generation (PHP) | Avoids large client-side memory usage for many/large files | — Deferred to v2.0 — Not needed for core workflow |
| Status color coding on collection cards | Visual status at a glance without opening each collection | ✓ Good — Blue=SELECTING, green=REVIEWING shipped in v1.0 |
| GD-based thumbnail generation (400px JPEG) | Faster grid load, reduces bandwidth; PHP GD widely available | ✓ Good — Shipped, requires Hostinger WebP verification |
| Optimistic UI updates for selections | Instant feedback without waiting for API responses | ✓ Good — Shipped with error rollback pattern |
| Filter tabs for photographer review | Clear separation of All/Selected/Not Selected photos | ✓ Good — Shipped with accurate counts |
| Single share link for entire lifecycle | Simpler UX than separate gallery/delivery links | ✓ Good — Shipped, may revisit for v2.0 if client feedback requests separation |

---
*Last updated: 2026-02-13 after v2.0 milestone initialization*
