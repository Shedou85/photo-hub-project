# Architecture

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-02-28

## Pattern Overview

**Overall:** Distributed SPA with decoupled frontend and backend

**Key Characteristics:**
- Monolith frontend (React SPA) + thin PHP backend (stateless routing)
- Session-based authentication with cross-domain cookies (no localStorage)
- Component-driven UI with context-based state and custom hooks
- Responsive layout system (desktop sidebar + mobile bottom nav)
- Single routing layer in backend (switch-based dispatcher)
- RESTful API endpoints mapped to handler files
- Centralized API client with CSRF protection
- Cloudflare R2 cloud storage for all media
- Admin subsystem with audit logging

## Layers

**Frontend Presentation (Browser):**
- Purpose: Render UI, handle user interactions, manage client state
- Location: `frontend/src/`
- Contains: React components, pages, layouts, context providers, custom hooks, primitives
- Depends on: React Router DOM, React i18next, Tailwind CSS, Sonner (toast), @dnd-kit, react-helmet-async, clsx
- Used by: Users via browser

**Frontend Routing Layer:**
- Purpose: URL-based navigation with protected and admin route enforcement
- Location: `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/components/AdminRoute.jsx`
- Contains: Route definitions with React Router v7, auth checks, loading guards
- Depends on: AuthContext for `isAuthenticated` and `loading` state
- Used by: Main app initialization, protected page redirects
- Note: `App.jsx` guards on `loading` before rendering routes to prevent flash of wrong page

**Frontend State Management:**
- Purpose: Synchronize auth state across components
- Location: `frontend/src/contexts/AuthContext.jsx`
- Contains: User object, login/logout functions, isAuthenticated boolean, loading flag
- Depends on: `GET /auth/me` endpoint for session restoration (no localStorage)
- Used by: All authenticated pages, ProtectedRoute, AdminRoute, ResponsiveLayout

**Frontend Custom Hooks:**
- Purpose: Extract and reuse complex component logic
- Location: `frontend/src/hooks/`
- Contains:
  - `useApi.js` — generic API hook with loading/error state + AbortController cancellation
  - `useCollectionData.js` — collection fetch + status mutations (archive, delete, edit, startSelecting)
  - `usePhotoUpload.js` — concurrent upload queue (max 3), validation, edited photos, delete, cover
  - `usePhotoFiltering.js` — all/selected/not-selected filter logic
  - `usePhotoReorder.js` — drag-and-drop reorder mode with @dnd-kit (PRO-only)
  - `useLightbox.js` — lightbox open/close/prev/next with keyboard navigation
  - `useMediaQuery.js` — responsive breakpoint detection via window.matchMedia
- Depends on: `api.js` client, AuthContext
- Used by: Page components (CollectionDetailsPage, SharePage, etc.)

**Frontend API Client:**
- Purpose: Centralized HTTP client with CSRF token management
- Location: `frontend/src/lib/api.js`
- Contains: `api.get()`, `api.post()`, `api.patch()`, `api.put()`, `api.delete()` methods
- Features: Auto CSRF token fetch/attach on mutations, auto-retry on 403 CSRF errors, FormData detection, `credentials: 'include'`
- Returns: `{ data, error, status }` — never throws
- Used by: All frontend API calls (raw `fetch()` only allowed for CSRF-exempt routes)

**Frontend I18n (Internationalization):**
- Purpose: Support Lithuanian, English, Russian UI translations
- Location: `frontend/src/i18n.js`, `frontend/src/locales/*.json`
- Contains: i18next config, locale files for 3 languages
- Namespaces: common, nav, home, login, passwordReset, register, profile, collections, collection, share, delivery, plans, payments, promotional, admin, emailVerification, cookieConsent, errors, seo
- Depends on: react-i18next, i18next-browser-languagedetector
- Used by: All pages and components via `useTranslation()` hook

**Frontend Layout System:**
- Purpose: Responsive app shell for authenticated pages
- Location: `frontend/src/layouts/`
- Contains:
  - `MainLayout.jsx` — desktop: 256px persistent sidebar with navigation
  - `MobileLayout.jsx` — mobile: fixed top header + bottom tab navigation
  - `ResponsiveLayout.jsx` — switches between Main/Mobile at 768px breakpoint
- Depends on: AuthContext, useTranslation, Router state, useMediaQuery
- Used by: All authenticated pages wrapped in ProtectedRoute

**Frontend SEO Layer:**
- Purpose: Per-page meta tags, Open Graph, structured data
- Location: `frontend/src/components/SEO.jsx`
- Contains: react-helmet-async wrapper for dynamic `<title>`, `<meta>`, OG tags
- Depends on: react-helmet-async, i18n for localized titles
- Used by: All pages (HomePage has JSON-LD structured data)

**Frontend Analytics:**
- Purpose: Privacy-respecting usage tracking
- Location: `frontend/src/lib/analytics.js`
- Contains: GA4 initialization, page view tracking, consent-gated via cookie consent
- Depends on: CookieConsentBanner approval stored in localStorage
- Used by: App.jsx (page view on route change)

**Backend API Router:**
- Purpose: Dispatch HTTP requests to appropriate handlers
- Location: `backend/index.php`
- Contains: Switch statement mapping 30+ routes to handler files
- Features: CSRF validation (via `helpers/csrf.php`), rate limiting on sensitive routes, CUID generation
- Depends on: CORS headers, session management, PDO connection
- Used by: Apache (via .htaccess rewrite to index.php)

**Backend Authentication:**
- Purpose: Validate credentials and manage sessions
- Location: `backend/auth/`
- Contains:
  - `login.php` — email/password login
  - `logout.php` — session destruction
  - `me.php` — current user from session
  - `google.php` — Google OAuth (via `google/apiclient`)
  - `verify-email.php` — email verification token validation
  - `resend-verification.php` — resend verification email
  - `forgot-password.php` — password reset request (rate-limited)
  - `reset-password.php` — password reset with token
- Depends on: MySQL User table, PHP sessions, PHPMailer, Google API Client
- Used by: Auth endpoints

**Backend CSRF Protection:**
- Purpose: Prevent cross-site request forgery
- Location: `backend/helpers/csrf.php`
- Contains: Token generation stored in `$_SESSION['csrf_token']`, validation via `hash_equals()`
- Used by: All mutation endpoints (POST/PATCH/PUT/DELETE) except exempt routes

**Backend Database Layer:**
- Purpose: PDO connection factory with error handling
- Location: `backend/db.php`
- Contains: `getDbConnection()` function
- Depends on: `.env` via `vlucas/phpdotenv` (DB credentials)
- Used by: All handler files for query execution

**Backend Collection Handlers:**
- Purpose: Full collection lifecycle management
- Location: `backend/collections/`
- Contains:
  - `index.php` — list/create collections
  - `id.php` — get/update/delete single collection
  - `photos.php` — list/upload/delete photos
  - `cover.php` — set cover photo
  - `selections.php` — photographer-side selections
  - `edited.php` — upload/list edited finals
  - `share.php` — public share gallery (password-protected)
  - `share-selections.php` — client selections via share link
  - `preview.php` — watermarked preview for PRO users (SELECTING phase)
  - `delivery.php` — generate delivery token, mark as delivered
  - `deliver-view.php` — public delivery gallery (token auth)
  - `photo-download.php` — individual photo download (delivery token)
  - `zip-download.php` — streaming ZIP download (ZipStream-PHP)
  - `promotional.php` — promotional photo management
  - `reorder.php` — drag-and-drop photo reorder (PRO-only)
- Depends on: DB layer, session auth, R2 storage, watermark helper
- Used by: Collection management + public share/delivery endpoints

**Backend Profile Handlers:**
- Purpose: User profile management
- Location: `backend/profile/`
- Contains:
  - `me.php` — PATCH profile (name, bio, password, websiteUrl)
  - `stats.php` — GET activity stats (total/active/archived collections, total photos)
- Depends on: Session auth, DB layer
- Used by: Profile endpoints

**Backend Admin Subsystem:**
- Purpose: Platform administration and audit
- Location: `backend/admin/`
- Contains:
  - `auth-check.php` — shared admin auth guard (role=ADMIN check)
  - `stats.php` — platform-wide statistics
  - `users.php` — user management (GET/PATCH/DELETE + bulk ops)
  - `collections.php` — all collections overview
  - `audit-log.php` — paginated audit trail
  - `download-stats.php` — download analytics
- Depends on: Admin role verification, audit-logger helper
- Used by: AdminPage frontend

**Backend Helpers:**
- Purpose: Shared backend utilities
- Location: `backend/helpers/`
- Contains:
  - `csrf.php` — CSRF token generation + validation
  - `mailer.php` — PHPMailer wrapper (verification + password reset emails)
  - `r2.php` — Cloudflare R2 client (upload, delete, stream, URL, size via AWS SDK)
  - `watermark.php` — GD diagonal "PREVIEW" watermark for PRO users
  - `audit-logger.php` — `logAuditAction()` writing to AuditLog table
  - `download-tracker.php` — session-based download deduplication
  - `rate-limiter.php` — rate limiting for sensitive endpoints
  - `session.php` — session configuration helper

**Backend File Storage (Cloudflare R2):**
- Purpose: Store photos, thumbnails, and edited photos in cloud object storage
- Location: R2 bucket `pixelforge-photos`, helper at `backend/helpers/r2.php`
- Contains: `getR2Client()` singleton, `r2Upload()`, `r2Delete()`, `r2GetStream()`, `r2GetUrl()`, `r2GetSize()`
- Depends on: `aws/aws-sdk-php`, R2 credentials in `backend/.env`
- Used by: `utils.php` (upload/delete), `zip-download.php` (streaming ZIP), `photo-download.php` (individual download), `collections/id.php` (cascade delete)

**Database (MySQL):**
- Purpose: Persistent data store
- Location: MySQL server, schema in `database_schema.sql`
- Contains: User, Account, Collection, Photo, EditedPhoto, Selection, PromotionalPhoto, Download, AuditLog tables
- Depends on: PDO connection
- Used by: All backend handlers

## Data Flow

**Authentication Flow:**

1. User submits email/password on LoginPage (or uses Google OAuth)
2. Frontend sends POST to `/login` via `api.post()` (or `/auth/google`)
3. Backend verifies password/OAuth, creates PHP session, returns user object
4. Frontend stores user in AuthContext state (no localStorage)
5. React Router redirects to /collections
6. Subsequent API calls include session cookie automatically (`credentials: "include"`)
7. On app mount, `AuthContext` calls `GET /auth/me` to restore session
8. Backend checks `$_SESSION['user_id']` on protected endpoints

**Collection Lifecycle Flow:**

1. DRAFT — Photographer creates collection, uploads photos
2. SELECTING — Share link generated, client selects photos (with optional PRO watermark previews)
3. REVIEWING — Photographer reviews client selections (with review confirmation step)
4. DELIVERED — Photographer uploads edited finals, generates delivery token
5. DOWNLOADED — Client downloads via delivery page (ZIP or individual)
6. ARCHIVED — Collection archived

**Share/Delivery Flow (Public):**

1. Photographer generates share link (password-protected)
2. Client opens `/share/:shareId`, enters password
3. Client selects/deselects photos, confirms selections in review step
4. Photographer reviews, uploads edited photos
5. Delivery token generated, client receives `/deliver/:deliveryToken` link
6. Client downloads edited photos (individual or ZIP)
7. Downloads tracked with session-based deduplication

**State Management:**

- **Auth state:** Lives in AuthContext, restored from `GET /auth/me` on mount (no localStorage)
- **Collection state:** Managed by `useCollectionData` hook (fetch, mutations)
- **Photo state:** Managed by `usePhotoUpload` hook (upload queue, delete, cover)
- **Filter state:** Managed by `usePhotoFiltering` hook (all/selected/not-selected)
- **Reorder state:** Managed by `usePhotoReorder` hook (@dnd-kit, PRO-only)
- **Lightbox state:** Managed by `useLightbox` hook (open/close/navigation)
- **Transient state:** Toast notifications via Sonner (no persistence)
- **Form state:** Local component state (email, password, name fields)
- **Cookie consent:** localStorage flag gating GA4 analytics

## Key Abstractions

**ProtectedRoute / AdminRoute Components:**
- Purpose: Enforce authentication/authorization before rendering child components
- Location: `frontend/src/components/ProtectedRoute.jsx`, `AdminRoute.jsx`
- Pattern: Returns `null` while `loading` is true, redirects to `/login` if not authenticated. AdminRoute additionally checks `user.role === 'ADMIN'`.

**AuthContext (State Container):**
- Purpose: Centralize auth state and provide actions across the app
- Location: `frontend/src/contexts/AuthContext.jsx`
- Pattern: React Context with custom hook (`useAuth()`); session restored via `GET /auth/me` on mount. No localStorage.

**ResponsiveLayout (App Shell):**
- Purpose: Adaptive layout switching based on viewport
- Location: `frontend/src/layouts/ResponsiveLayout.jsx`
- Pattern: Uses `useMediaQuery` to switch between `MainLayout` (desktop sidebar) and `MobileLayout` (bottom nav) at 768px

**Collection Phase Components:**
- Purpose: Render phase-specific UI for collection workflow
- Location: `frontend/src/components/collection/`
- Pattern: `DraftPhase`, `SelectingPhase`, `ReviewingPhase`, `DeliveredPhase` — each encapsulates the UI and actions for one collection status

**Primitive Components:**
- Purpose: Reusable, composable UI building blocks
- Location: `frontend/src/components/primitives/`
- Contains: Badge, Button, Card, CollectionCard, ConfirmModal, Dropdown, Input, PhotoCard, Select, SelectionBorder, UploadZone

**API Client:**
- Purpose: Centralized HTTP client with CSRF handling
- Location: `frontend/src/lib/api.js`
- Pattern: Returns `{ data, error, status }`, auto-manages CSRF tokens, supports FormData

**Handler Files (Backend):**
- Purpose: Isolate route-specific logic into separate files
- Pattern: Each file is a self-contained HTTP handler; included by index.php router

**Locale Files (i18n):**
- Purpose: Centralize translatable strings by namespace
- Location: `frontend/src/locales/en.json`, `lt.json`, `ru.json`
- Pattern: Nested JSON with 19 namespaces; all 3 locales kept in sync

## Entry Points

**Frontend Entry Point:**
- Location: `frontend/src/main.jsx`
- Responsibilities: Mount React app; initialize HelmetProvider, BrowserRouter, AuthProvider, i18n, ErrorBoundary

**Frontend App Router:**
- Location: `frontend/src/App.jsx`
- Responsibilities: Define all route paths; guard on `loading` state; Sonner toast container; CookieConsentBanner

**Backend API Entry Point:**
- Location: `backend/index.php`
- Responsibilities: Parse request URI; dispatch to handler; CORS, session, CSRF

## Error Handling

**Strategy:** Defensive HTTP status codes + JSON error responses

**Backend Patterns:**
- 400 Bad Request — missing/invalid input
- 401 Unauthorized — not authenticated or session expired
- 403 Forbidden — not authorized (suspended account, CSRF failure)
- 404 Not Found — resource doesn't exist or not owned
- 405 Method Not Allowed — wrong HTTP method
- 409 Conflict — resource already exists (duplicate email)
- 429 Too Many Requests — rate limit exceeded
- 500 Internal Server Error — unexpected server error

**Frontend Error Handling:**
- Centralized API client returns `{ error }` — never throws
- Network errors: Display toast via Sonner
- Auth errors: 401 triggers redirect to /login
- ErrorBoundary wraps all routes for uncaught React errors

## Cross-Cutting Concerns

**Logging/Audit:**
- Backend: `audit-logger.php` logs admin actions to AuditLog table
- Backend: PHP `error_log()` for server errors
- Frontend: Sonner toasts for user feedback

**Security:**
- CSRF: Token-based protection on all mutation endpoints
- Rate limiting: On login, register, forgot-password
- Input validation: Backend validates all inputs; PDO prepared statements
- Session: Secure cookies scoped to `.pixelforge.pro`, SameSite=Lax
- Download tracking: Session-based deduplication prevents count inflation

**CORS:**
- Backend: `backend/cors.php` whitelists origins
- Credentials: `include` on all frontend fetch calls

**I18n:**
- Language detection: localStorage first, then browser language
- All user-visible strings via `t('namespace.key')`

---

*Architecture analysis: 2026-02-11 | Updated: 2026-02-28 (full audit)*
