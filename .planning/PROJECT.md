# Photo Hub (PixelForge)

## What This Is

Photo Hub is a collection management app for professional photographers at pixelforge.pro. Photographers upload photos to collections, share a link with clients for photo selection, then deliver edited versions for download. The UI is available in Lithuanian, English, and Russian.

## Core Value

The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## Current Focus: Post-v3.0 Enhancements

**Goal:** Hardening, SEO, quality-of-life improvements, and preparing for growth.

**Recent features shipped (post-v3.0):**
- Email verification flow (registration + resend)
- Password reset flow (forgot + reset)
- Google OAuth login/register
- Cookie consent banner with GA integration
- Admin panel (stats, user management, audit log)
- Collection archiving (PRO-only, Active/Archived filter)
- Collection search & sort on /collections page
- Password change/set on profile page
- Promotional photos system (photographer opt-in, homepage showcase)
- Gallery password protection (share page)
- Foundational SEO (meta tags, OG, sitemap, robots.txt, react-helmet-async, JSON-LD)

## Current State

**Latest milestone:** v3.0 Workflow & UX Redesign (shipped 2026-02-16)
**Latest work:** Post-v3.0 enhancements (ongoing, latest: drag-and-drop photo reordering 2026-02-27)

**Shipped features:**
- Complete photographer-to-client workflow with photo upload, token-based sharing, client selection, and delivery (v1.0)
- Separate delivery link system with automatic token generation and session-based download tracking (v2.0)
- Flexible download options: streaming ZIP downloads + individual photo downloads (v2.0)
- Design system, responsive layouts, primitive components, workflow-aware UI, testing infrastructure (v3.0)
- Email verification, password reset, Google OAuth, cookie consent, admin panel (post-v3.0)
- Collection archiving, search/sort, promotional photos, gallery password protection (post-v3.0)
- Foundational SEO: meta tags, OG/Twitter cards, sitemap, robots.txt, react-helmet-async, JSON-LD (post-v3.0)
- Drag-and-drop photo reordering (PRO-only, @dnd-kit with desktop + mobile touch support) (post-v3.0)

**Tech stack:** React 18 + Vite 5 + react-helmet-async frontend, vanilla PHP backend with PDO, MySQL database
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

**v3.0 Workflow & UX Redesign:**
- ✓ Design system foundation with tokens and responsive infrastructure
- ✓ Primitive component library (Button, Card, Badge, CollectionCard, PhotoCard, UploadZone)
- ✓ Mobile bottom navigation with responsive layouts (mobile/tablet/desktop)
- ✓ Workflow-aware UI with phase components and auto-navigation
- ✓ Comprehensive testing infrastructure (unit/E2E/visual regression/accessibility)
- ✓ WCAG 2.1 AA compliance

**Post-v3.0 Enhancements:**
- ✓ Email verification flow with PHPMailer SMTP
- ✓ Password reset flow (forgot + reset with token)
- ✓ Google OAuth login/register
- ✓ Cookie consent banner with Google Analytics integration
- ✓ Admin panel (platform stats, user management with bulk ops, audit log)
- ✓ Collection archiving (PRO-only with Active/Archived filter)
- ✓ Collection search & sort on /collections page
- ✓ Password change/set on profile page
- ✓ Promotional photos system (photographer opt-in, homepage showcase)
- ✓ Gallery password protection on share page
- ✓ Foundational SEO: robots.txt, sitemap.xml, OG/Twitter meta tags, react-helmet-async, JSON-LD structured data, dynamic per-page titles, html lang sync with i18n
- ✓ Drag-and-drop photo reordering in collections (PRO-only, @dnd-kit, desktop + mobile touch support)

### Active

<!-- Current scope. Building toward these. -->

*(No active milestone — post-v3.0 enhancement mode)*

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- ~~Cloud storage (S3 / Cloudflare R2)~~ — **DONE** (shipped 2026-02-27, Cloudflare R2 with AWS SDK for PHP)
- ~~ARCHIVED status workflow~~ — **DONE** (shipped 2026-02-27, PRO-only archiving with Active/Archived filter)
- ~~SEO foundation~~ — **DONE** (shipped 2026-02-27, robots.txt, sitemap, OG tags, react-helmet-async, JSON-LD)
- Client accounts / authentication — deliberate; client access is link-only by design to maintain zero-friction workflow
- Email notifications to clients — deferred; photographers share links manually
- Real-time updates (WebSockets) — not needed; manual refresh is sufficient for this workflow
- Stripe payments — separate milestone, pricing page structure exists but no payment processing yet

## Context

**Current State (post-v3.0 enhancements):**
- **Shipped:** Complete photographer-to-client workflow, design system, responsive layouts, admin panel, auth flows, SEO
- **Tech stack:** React 18 + Vite 5 + react-helmet-async frontend, vanilla PHP backend with PDO + ZipStream-PHP + PHPMailer + AWS SDK, MySQL database
- **Hosting:** Hostinger server; **Cloudflare R2** for photo/thumbnail storage (zero egress fees, CDN-ready)
- **Cross-domain:** frontend on pixelforge.pro, API on api.pixelforge.pro/backend/ — session cookies scoped to .pixelforge.pro
- **SEO:** robots.txt, sitemap.xml (3 public routes), OG/Twitter meta tags in static HTML, react-helmet-async for dynamic per-page titles, JSON-LD structured data (Organization + SoftwareApplication), html lang synced with i18n
- **Auth:** Email/password registration with email verification, Google OAuth, password reset, session-based auth
- **DB schema:** User, Collection, Photo, EditedPhoto, Selection, PromotionalPhoto, Download, AuditLog tables; collection status lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED)
- **Download tracking:** Session-based deduplication with hour-level bucketing, GDPR-compliant (no IP tracking)
- **Known tech debt:** Orphaned GET /collections/{id}/delivery endpoint (functionality works via alternate route), pre-existing lint error in api.test.js
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
| react-helmet-async for dynamic SEO | Per-page title/description/OG overrides in SPA without SSR | ✓ Good — Shipped 2026-02-27, reusable SEO.jsx component, static fallbacks in index.html |
| Static index.html meta tags as baseline | Bing/social crawlers can't render JS; static tags ensure correct preview | ✓ Good — OG, Twitter Card, hreflang, canonical all in static HTML |
| JSON-LD structured data on homepage | Rich results for Organization + SoftwareApplication with pricing | ✓ Good — Schema.org compliant, 3 pricing offers (Free/$0, Standard/$15, Pro/$29) |
| noindex on utility pages | Login, forgot-password, verify-email etc. have no SEO value | ✓ Good — Only /, /register indexed; auth/utility pages noindexed |

| @dnd-kit for drag-and-drop reordering | Modern, maintained, first-class touch + keyboard support, ~12KB gzipped | ✓ Good — Shipped 2026-02-27, PRO-only with smooth desktop + mobile long-press support |

---
*Last updated: 2026-02-27 after drag-and-drop photo reordering*
