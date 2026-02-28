# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Usage Rules

- **php-pro** — PHP backend logic, route handlers, helpers, session/auth changes
- **react-specialist** — Complex React work: hooks, state management, performance, component architecture
- **frontend-developer** — Full page builds, multi-file frontend features, framework integration
- **ui-designer** — Visual design, styling, layout, UI/UX improvements
- **api-designer** — New API endpoint design, request/response contracts, API architecture
- **sql-pro** — Database schema changes, query optimization, and review after api-designer work
- **backend-developer** — Full backend features spanning multiple files (routes + helpers + DB)
- **debugger** — Investigating bugs, tracing errors, diagnosing failures
- **security-auditor** — Security reviews, vulnerability checks, auth/CSRF audits
- **code-reviewer** — Run before merge/commit on non-trivial changes

Skip agents for trivial changes (typo fixes, single-line tweaks, small styling adjustments).

## Detailed Documentation

For new features, architectural changes, or multi-file work — read the relevant `.planning/codebase/` files first:
- `ARCHITECTURE.md` — system design, data flows, component hierarchy
- `STRUCTURE.md` — full file tree with descriptions
- `STACK.md` — all dependencies, Tailwind config, npm scripts
- `CONVENTIONS.md` — coding patterns, naming, error handling
- `INTEGRATIONS.md` — R2, Google OAuth, GA4, ZipStream, @dnd-kit
- `CONCERNS.md` — known issues, tech debt, security considerations
- `TESTING.md` — test infrastructure, existing tests, how to add new tests

Do NOT read these for trivial fixes (typos, single-line changes, small styling tweaks).

## Project Overview

Photo Hub (pixelforge.pro) is a photo collection management app for professional photographers. The UI supports Lithuanian, English, and Russian via i18n. It uses a React frontend with a vanilla PHP API backend and MySQL database.

## Architecture

### Frontend (`frontend/`)

- **React 18** with **React Router DOM v7** and **Vite 5**
- **Tailwind CSS v3** for all styling — no inline styles, no CSS modules
- **react-i18next** for internationalization (LT/EN/RU). Locale files in `frontend/src/locales/`
- Entry point: `frontend/src/main.jsx` → `App.jsx` (route definitions)
- Auth state managed via React Context (`contexts/AuthContext.jsx`) — **no localStorage**, session restored via `GET /auth/me` on mount
- `AuthContext` exposes `{ user, login, logout, isAuthenticated, loading }` — `isAuthenticated` is a **boolean**, `loading` is `true` until `/auth/me` resolves
- `ProtectedRoute` and `AdminRoute` return `null` while `loading` is `true` (prevents flash redirect to /login)
- `App.jsx` also guards on `loading` before rendering routes (prevents flash of HomePage/LoginPage)
- `layouts/MainLayout.jsx` (desktop sidebar) + `MobileLayout.jsx` (bottom nav) switched via `ResponsiveLayout.jsx` at 768px
- Pages live in `frontend/src/pages/`
- Custom hooks in `frontend/src/hooks/`: `useApi`, `useCollectionData`, `usePhotoUpload`, `usePhotoFiltering`, `usePhotoReorder` (PRO, @dnd-kit), `useLightbox`, `useMediaQuery`
- Photo URL helpers: `frontend/src/utils/photoUrl.js` — `photoUrl(storagePath)`, `watermarkedPreviewUrl()`

### Styling conventions

- Use **Tailwind utility classes** exclusively. No inline `style={{}}` props except where dynamic JS values are unavoidable (e.g. sidebar `left` position for slide animation)
- Use Tailwind `hover:` and `focus:` pseudo-class variants instead of JS state for hover/focus styling
- Gradients via arbitrary value: `bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]`
- Arbitrary sizes: `text-[13px]`, `w-[52px]`, `rounded-[10px]`, etc.
- **Dark theme** across all authenticated pages (MainLayout + MobileLayout). Login/Register/HomePage have their own dark aesthetic.

#### Design tokens (dark theme)

| Element | Tailwind class |
|---------|---------------|
| Page background | `bg-surface-darker` (#0d0f14) |
| Card | `bg-white/[0.04] border border-white/10 rounded-lg shadow-xl` |
| Card padding | `px-6 py-5` |
| Input | `bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/20` |
| Input focus | `focus:border-indigo-500/70 focus:bg-white/[0.08]` |
| Heading | `text-white` |
| Section heading | `text-white/70 uppercase tracking-[0.05em]` |
| Body text | `text-white/90` |
| Subtitle / label | `text-white/50` or `text-white/60` |
| Muted text | `text-white/50` |
| Dim text | `text-white/40` |
| Dividers | `border-white/[0.08]` |
| Primary button | `bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)]` |
| Secondary button | `bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/[0.1]` |
| Danger button | `bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20` |
| Ghost button | `bg-transparent text-white/60 hover:bg-white/[0.06]` |
| Modal | `bg-surface-dark border border-white/10 rounded-[10px] shadow-xl` |
| Upload zone (idle) | `border-white/[0.15] bg-white/[0.02]` |
| Upload zone (drag) | `border-indigo-500 bg-indigo-500/10` |

#### Custom Tailwind colors (tailwind.config.js)

- `surface-dark`: #1a1a2e
- `surface-darker`: #0d0f14
- `surface-darkest`: #080a0f

### i18n conventions

- All user-visible strings must use `t('namespace.key')` — no hardcoded strings in JSX
- Locale files: `frontend/src/locales/en.json`, `lt.json`, `ru.json` — keep all three in sync
- Namespaces: `common`, `nav`, `home`, `login`, `register`, `profile`, `collections`, `collection`, `payments`, `emailVerification`, `passwordReset`, `share`, `delivery`, `plans`, `admin`, `promotional`, `cookieConsent`, `errors`, `seo`

### Backend (`backend/`)

- **Vanilla PHP** (no framework) with **PDO** for MySQL
- `backend/index.php` is the main router — a single `switch` statement dispatching to handler files
- Route handlers are organized by feature: `auth/`, `_collections/`, `profile/`, `admin/`
- `backend/db.php` — PDO connection factory; `backend/config.php` — loads `.env` via **phpdotenv**
- `backend/cors.php` — CORS headers for cross-domain requests
- `backend/utils.php` — photo upload + thumbnail generation (GD)
- Key helpers in `backend/helpers/`: `mailer.php` (PHPMailer), `csrf.php`, `r2.php` (Cloudflare R2), `watermark.php` (GD preview watermark), `audit-logger.php`, `rate-limiter.php`, `download-tracker.php`, `session.php`
- Key dependencies: **PHPMailer ^7.0**, **aws/aws-sdk-php ^3.0** (R2), **google/apiclient ^2.16** (OAuth), **maennchen/zipstream-php 3.0**, **vlucas/phpdotenv 5.5**
- IDs use CUID format (generated via `generateCuid()` in `backend/index.php`)
- Apache `.htaccess` rewrites all requests to `index.php`

### Cross-Domain Setup

- Frontend: `pixelforge.pro` / Backend API: `api.pixelforge.pro/backend/`
- PHP sessions with cookies scoped to `.pixelforge.pro`, secure, httponly, SameSite=Lax
- All frontend API calls use `credentials: "include"`

### Database

- MySQL with `utf8mb4` charset
- Schema defined in `database_schema.sql` at project root
- Key tables: `User`, `Account` (OAuth), `Collection`, `Photo`, `EditedPhoto`, `Selection`, `PromotionalPhoto`, `Download`, `AuditLog`
- Collections have a `status` lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED
- Users have `plan` (FREE_TRIAL, STANDARD, PRO), `role` (USER, ADMIN), `subscriptionStatus` (FREE_TRIAL, ACTIVE, CANCELED, INACTIVE), `status` (ACTIVE, SUSPENDED)

## Routes (frontend)

| Path | Page | Auth |
|------|------|------|
| `/` | `HomePage` | No (redirects to `/collections` if logged in) |
| `/login` | `LoginPage` | No (redirects to `/collections` if logged in) |
| `/register` | `RegisterPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/verify-email` | `VerifyEmailPage` | No |
| `/share/:shareId` | `SharePage` | No (password-protected) |
| `/deliver/:deliveryToken` | `DeliveryPage` | No (token-based) |
| `/profile` | `ProfilePage` | Yes (`ProtectedRoute`) |
| `/collections` | `CollectionsListPage` | Yes (`ProtectedRoute`) |
| `/collection/:id` | `CollectionDetailsPage` | Yes (`ProtectedRoute`) |
| `/payments` | `PaymentsPage` | Yes (`ProtectedRoute`) |
| `/admin` | `AdminPage` | Yes (`AdminRoute`, role=ADMIN) |
| `*` | `NotFoundPage` | No |

## Commands

All frontend commands run from the `frontend/` directory:

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (outputs to frontend/dist/)
npm run lint         # ESLint (JS/JSX, zero warnings enforced)
npm run preview      # Preview production build locally
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:e2e     # Playwright E2E tests
```

Backend has no build step. PHP files are served directly by Apache. Composer dependencies:

```bash
cd backend && composer install
```

## API Routes (backend/index.php)

34+ routes organized by feature group. Full list in `backend/index.php` switch statement.

| Group | Routes | Handler dir |
|-------|--------|-------------|
| **Auth** | `/login`, `/logout`, `/register`, `/auth/me`, `/auth/google`, `/csrf-token` | `auth/` |
| **Email/Password** | `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password` | `auth/` |
| **Profile** | `/profile/me` (PATCH), `/profile/stats` (GET) | `profile/` |
| **Collections** | CRUD `/collections`, `/collections/{id}` | `_collections/` |
| **Photos** | `/collections/{id}/photos`, `/collections/{id}/edited`, `/collections/{id}/cover`, `/collections/{id}/reorder` (PRO) | `_collections/` |
| **Selections** | `/collections/{id}/selections` | `_collections/` |
| **Delivery** | `/collections/{id}/delivery`, `/deliver/{token}`, `/deliver/{token}/zip`, `/deliver/{token}/photo/{id}` | `_collections/` |
| **Share** | `/share/{shareId}`, `/share/{shareId}/selections`, `/share/{shareId}/preview/{id}` (watermarked, PRO) | `_collections/` |
| **Promotional** | `/collections/{id}/promotional`, `/promotional` (public) | `_collections/` |
| **Admin** | `/admin/stats`, `/admin/users`, `/admin/collections`, `/admin/audit-log`, `/admin/download-stats` | `admin/` |

### API Client & CSRF Protection

- **All frontend API calls MUST use the centralized client** from `frontend/src/lib/api.js` — **NEVER use raw `fetch()`**
- Import: `import { api } from '../lib/api'`
- Methods: `api.get(path)`, `api.post(path, body)`, `api.patch(path, body)`, `api.put(path, body)`, `api.delete(path)`
- The client automatically:
  - Adds `credentials: 'include'` for cross-domain cookies
  - Fetches and attaches `X-CSRF-Token` header on POST/PATCH/PUT/DELETE
  - Retries once on 403 CSRF errors with a fresh token
  - Returns `{ data, error, status }` — never throws
- **FormData uploads**: Pass `FormData` as body directly — the client auto-detects it, skips `Content-Type` and `JSON.stringify()`
- **CSRF-exempt routes** (these are the ONLY places where raw `fetch()` is acceptable): `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/resend-verification`, `/auth/google`, `/share/*`, `/deliver/*`
- Backend CSRF logic: `backend/helpers/csrf.php` — token stored in `$_SESSION['csrf_token']`, validated via `hash_equals()`

### Utilities (`frontend/src/utils/`)

- **`copyScript.js`** — `generateCopyScript(sourceFolder, selectedPhotos, collectionName)` generates a platform-specific script (.bat on Windows, .command on macOS/Linux) that copies client-selected photos into a `_Selected` subfolder and opens it in the file explorer. Used in the REVIEWING banner of `CollectionDetailsPage`. No backend calls — purely client-side blob download.
- **`photoUrl.js`** — `photoUrl(storagePath)` constructs full R2 URL, `watermarkedPreviewUrl(collectionId, photoId)` for PRO watermarked previews
- **`download.js`** — anchor-click download helpers

### Integrations

- **Cloudflare R2** — photo/thumbnail storage via `helpers/r2.php`, keys: `collections/{collectionId}/{photoId}.{ext}`, frontend URLs via `VITE_MEDIA_BASE_URL`
- **Google OAuth** — `auth/google.php` + `Account` table, `google/apiclient ^2.16`
- **Google Analytics 4** — `frontend/src/lib/analytics.js`, consent-gated via CookieConsentBanner
- **@dnd-kit** — PRO-only drag-and-drop photo reorder (`usePhotoReorder` hook)
- **react-helmet-async** — per-page SEO meta via `components/SEO.jsx`

### Testing

- **Vitest** — unit/component tests in `*.test.js(x)` files next to source. Setup: `__tests__/setup.js`, mock: `__tests__/mocks/i18n.js`, render helper: `__tests__/utils/test-utils.jsx`
- **Playwright** — E2E suites in `frontend/e2e/`. Config: `playwright.config.js`
- No PHPUnit yet for backend

## Key Patterns

- **Adding a new API endpoint**: Add a `case` to the switch in `backend/index.php`, create a handler file in the appropriate subdirectory
- **Adding a new page**: Create component in `frontend/src/pages/`, add route in `App.jsx`, wrap with `ProtectedRoute` if auth required. Add i18n keys to all 3 locale files.
- **Auth check in PHP**: Start session, verify `$_SESSION['user_id']` exists, return 401 if not
- **Auth check in React**: Use `const { isAuthenticated, user, loading } = useAuth()` — `isAuthenticated` is a boolean, `loading` is true until session check completes. Pages inside `<ProtectedRoute>` do NOT need their own auth check.
- **Database queries**: Get connection via `getDbConnection()` from `db.php`, use PDO prepared statements
- **Email sending**: `backend/helpers/mailer.php` provides `sendVerificationEmail()` and `sendPasswordResetEmail()`. Uses PHPMailer with SMTP config from `.env`. Registration endpoint returns `emailSent: bool` so frontend can warn on failure.
- **Admin endpoints**: Require `require_once 'auth-check.php'` (validates role=ADMIN). Actions logged via `logAuditAction()`.
- **Photo URLs**: Use `photoUrl(storagePath)` from `utils/photoUrl.js` — never construct R2 URLs manually
- **Rate limiting**: Applied to `/login`, `/register`, `/forgot-password` via `helpers/rate-limiter.php`
- **Collection phase components**: `DraftPhase`, `SelectingPhase`, `ReviewingPhase`, `DeliveredPhase` in `components/collection/` — each renders phase-specific UI inside `CollectionDetailsPage`
