# Photo Hub (PixelForge)

## What This Is

Photo Hub is a collection management app for professional photographers at pixelforge.pro. Photographers upload photos to collections, share a link with clients for photo selection, then deliver edited versions for download. The UI is available in Lithuanian, English, and Russian.

## Core Value

The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## Current Milestone: v3.0 Workflow & UX Redesign

**Goal:** Transform the UI into a world-class, venture-backed SaaS experience with intuitive workflow guidance and mobile-first client interactions.

**Target features:**
- Auto-navigation after collection creation
- Smart conditional UI based on collection state (DRAFT/SELECTING/REVIEWING/DELIVERED)
- Premium UI redesign following Linear/Stripe/Notion aesthetics
- Mobile-first client gallery and selection experience
- Desktop-optimized photographer workspace with clear workflow phases
- Elimination of unnecessary buttons and confusing UI states

## Current State (after v2.0)

**Latest release:** v2.0 Delivery & Polish (shipped 2026-02-14)

**Shipped features:**
- Complete photographer-to-client workflow with photo upload, token-based sharing, client selection, and delivery (v1.0)
- Separate delivery link system with automatic token generation and session-based download tracking (v2.0)
- Flexible download options: streaming ZIP downloads + individual photo downloads (v2.0)
- Public delivery page with photo gallery, lightbox, and one-click downloads (v2.0)
- DOWNLOADED status lifecycle integration with photographer dashboard visibility (v2.0)
- UI polish: progressive disclosure, workflow-phase organization, improved client CTAs (v2.0)

**Codebase:** 3,317 lines JS/JSX frontend + 2,434 lines PHP backend = 5,751 total
**Tech stack:** React 18 + Vite 5 frontend, vanilla PHP backend with PDO, MySQL database
**Hosting:** Hostinger server; **Cloudflare R2** for photo/thumbnail storage (migrated 2026-02-27)
**Collection lifecycle:** DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

**Pre-v1.0:**
- ✓ User can register with email and password
- ✓ User can log in and session persists across browser refresh
- ✓ User can update their profile (name, bio)
- ✓ User can create a collection
- ✓ User can view their collections as Polaroid-style cards
- ✓ User can view collection details
- ✓ User can delete a collection
- ✓ UI supports Lithuanian, English, and Russian

**v1.0 MVP:**
- ✓ Photographer can upload photos to a collection with GD thumbnail generation
- ✓ Collection cover is automatically set to the first uploaded photo; photographer can override it
- ✓ Collection card color reflects status (blue=SELECTING, green=REVIEWING)
- ✓ Photographer can generate a shareable client link (token-based, no client account required)
- ✓ Client can browse collection photos in a responsive viewer (grid + fullscreen lightbox)
- ✓ Client can mark photos for editing (selection stage) with optimistic updates
- ✓ Client cannot download any photos during the selection stage
- ✓ Photographer can view which photos the client selected, with All/Selected/Not Selected filter tabs
- ✓ Photographer can upload edited (final) versions of photos
- ✓ Collection transitions through complete lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED)

**v2.0 Delivery & Polish:**
- ✓ Client can download edited photos as ZIP file — v2.0 (streaming architecture, 100+ photos)
- ✓ Client can download individual edited photos — v2.0 (delivery token auth, cross-browser support)
- ✓ Photographer can generate separate delivery link for client — v2.0 (automatic deliveryToken generation)
- ✓ Selection link redirects to delivery page after DELIVERED status — v2.0 (automatic redirect flow)
- ✓ Collection transitions to DOWNLOADED status after client downloads — v2.0 (idempotent, both ZIP and individual)
- ✓ Upload dropzone hides after first photo upload — v2.0 (progressive disclosure with "Add More Photos" button)
- ✓ Collection details page has improved button organization — v2.0 (workflow-phase grouping: Share/Review/Deliver)
- ✓ Share page has improved client action layout — v2.0 (fixed bottom CTA with count + button)

### Active

<!-- Current scope. Building toward these. -->

**v3.0 Workflow & UX Redesign:**
- Workflow improvements (auto-navigation, state-based conditional UI)
- UI redesign with Linear/Stripe/Notion aesthetic
- Mobile-first client experience
- Desktop-optimized photographer workspace

*(Detailed requirements will be defined after research phase)*

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- ~~Cloud storage (S3 / Cloudflare R2)~~ — **DONE** (shipped 2026-02-27, Cloudflare R2 with AWS SDK for PHP)
- Client accounts / authentication — deliberate; client access is link-only by design to maintain zero-friction workflow
- Email notifications — deferred; photographers share links manually, email integration planned for future milestone
- Real-time updates (WebSockets) — not needed; manual refresh is sufficient for this workflow
- ~~ARCHIVED status workflow~~ — **DONE** (shipped 2026-02-27, PRO-only archiving with Active/Archived filter)

## Context

**Current State (after v2.0):**
- **Shipped:** Complete photographer-to-client workflow with photo upload, token-based sharing, client selection, delivery, and flexible download options
- **Codebase:** 3,317 lines JS/JSX frontend + 2,434 lines PHP backend = 5,751 total
- **Requirements:** 15/15 v1.0 + 21/21 v2.0 requirements validated (100% both milestones)
- **Tech stack:** React 18 + Vite 5 frontend, vanilla PHP backend with PDO + ZipStream-PHP, MySQL database
- **Hosting:** Hostinger server; **Cloudflare R2** for photo/thumbnail storage (zero egress fees, CDN-ready)
- **Cross-domain:** frontend on pixelforge.pro, API on api.pixelforge.pro/backend/ — session cookies scoped to .pixelforge.pro
- **DB schema:** Photo, EditedPhoto, Selection, PromotionalPhoto, Download tables; collection status lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED)
- **Download tracking:** Session-based deduplication with hour-level bucketing, GDPR-compliant (no IP tracking)
- **Known tech debt:** Orphaned GET /collections/{id}/delivery endpoint (functionality works via alternate route)
- **Codebase map:** Architecture and conventions documented at .planning/codebase/

## Constraints

- **Storage**: Photos and thumbnails stored in **Cloudflare R2** (S3-compatible); object keys in `collections/{id}/` namespace
- **Auth**: Client-facing pages must be publicly accessible via token URL (no login required)
- **Download protection**: Photos must not be downloadable during the SELECTING stage; only during DELIVERED
- **Stack**: PHP backend (no framework), React frontend, MySQL — no new backend frameworks
- **i18n**: All new UI strings must be added to en.json, lt.json, and ru.json

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare R2 object storage | Zero egress fees, S3-compatible, CDN-ready; migrated from local backend/uploads/ | ✓ Good — Migrated 2026-02-27 with AWS SDK for PHP, public URL via r2.dev, streaming ZIP/download preserved |
| Token-based client access (no accounts) | Friction-free for clients; photographers share one link | ✓ Good — Core feature shipped v1.0, extended to delivery tokens in v2.0 |
| Server-side ZIP generation (PHP) | Avoids large client-side memory usage for many/large files | ✓ Good — Shipped in v2.0 with streaming architecture (ZipStream-PHP), handles 100+ photos |
| Status color coding on collection cards | Visual status at a glance without opening each collection | ✓ Good — Blue=SELECTING, green=REVIEWING (v1.0), purple=DELIVERED/DOWNLOADED (v2.0) |
| GD-based thumbnail generation (400px JPEG) | Faster grid load, reduces bandwidth; PHP GD widely available | ✓ Good — Shipped v1.0, used across share and delivery pages |
| Optimistic UI updates for selections | Instant feedback without waiting for API responses | ✓ Good — Shipped v1.0 with error rollback pattern |
| Filter tabs for photographer review | Clear separation of All/Selected/Not Selected photos | ✓ Good — Shipped v1.0 with accurate counts |
| Separate delivery link system | Security and workflow separation from selection link | ✓ Good — Shipped v2.0, automatic deliveryToken generation, share-to-delivery redirect |
| STORE compression for ZIP downloads | Skips re-compression of already-compressed JPEGs | ✓ Good — Shipped v2.0, 3x faster than DEFLATE, critical for 180s Hostinger limit |
| Session-based download deduplication | Prevents double-counting browser resume requests | ✓ Good — Shipped v2.0 with hour-level bucketing, GDPR-compliant |
| Progressive disclosure UI patterns | Reduces visual clutter as collection state changes | ✓ Good — Shipped v2.0, dropzone hides after first upload, workflow-phase button grouping |

| Shared photoUrl() utility | Single source of truth for media URL construction across 6+ frontend files | ✓ Good — Shipped 2026-02-27, uses VITE_MEDIA_BASE_URL env var |

---
*Last updated: 2026-02-27 after Cloudflare R2 integration*
