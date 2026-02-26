# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Usage Rules

- For all PHP backend changes, always use the php-pro agent
- For React component work, always use the react-specialist agent
- For any design UI UX use web-designer agent
- For any api work, always use api-designer agent
- For any work done by api-designer check hes work with sql-pro agent
- Before any merge/commit, run code-reviewer agent

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
- `layouts/MainLayout.jsx` provides sidebar navigation for authenticated pages
- Pages live in `frontend/src/pages/`

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
| Muted text | `text-white/40` |
| Dim text | `text-white/30` |
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
- Namespaces: `nav`, `home`, `login`, `register`, `profile`, `collections`, `collection`, `payments`, `emailVerification`, `passwordReset`, `share`, `delivery`, `plans`, `admin`, `promotional`, `cookieConsent`, `errors`

### Backend (`backend/`)

- **Vanilla PHP** (no framework) with **PDO** for MySQL
- `backend/index.php` is the main router — a single `switch` statement dispatching to handler files
- Route handlers are organized by feature: `auth/`, `_collections/`, `profile/`
- `backend/db.php` — PDO connection factory; `backend/config.php` — DB credentials (+ SMTP config)
- `backend/cors.php` — CORS headers for cross-domain requests
- `backend/helpers/mailer.php` — email sending via **PHPMailer ^7.0** (verification + password reset)
- IDs use CUID format (generated via `generateCuid()` in `backend/index.php`)
- Apache `.htaccess` rewrites all requests to `index.php`

### Cross-Domain Setup

- Frontend: `pixelforge.pro` / Backend API: `api.pixelforge.pro/backend/`
- PHP sessions with cookies scoped to `.pixelforge.pro`, secure, httponly, SameSite=Lax
- All frontend API calls use `credentials: "include"`

### Database

- MySQL with `utf8mb4` charset
- Schema defined in `database_schema.sql` at project root
- Key tables: `User`, `Collection`, `Photo`, `EditedPhoto`, `Selection`, `PromotionalPhoto`
- Collections have a `status` lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED
- Users have `plan` (FREE_TRIAL, STANDARD, PRO) and `role` (USER, ADMIN) enums

## Routes (frontend)

| Path              | Page                    | Auth required                                 |
| ----------------- | ----------------------- | --------------------------------------------- |
| `/`               | `HomePage`              | No (redirects to `/collections` if logged in) |
| `/login`          | `LoginPage`             | No (redirects to `/collections` if logged in) |
| `/profile`        | `ProfilePage`           | Yes                                           |
| `/collections`    | `CollectionsListPage`   | Yes                                           |
| `/collection/:id` | `CollectionDetailsPage` | Yes                                           |
| `/payments`       | `PaymentsPage`          | Yes                                           |

## Commands

All frontend commands run from the `frontend/` directory:

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build (outputs to frontend/dist/)
npm run lint      # ESLint (JS/JSX, zero warnings enforced)
npm run preview   # Preview production build locally
```

Backend has no build step. PHP files are served directly by Apache. Composer dependencies:

```bash
cd backend && composer install
```

## API Routes (backend/index.php)

| Method   | Path                | Handler                  |
| -------- | ------------------- | ------------------------ |
| POST     | `/login`            | `auth/login.php`         |
| GET      | `/auth/me`          | `auth/me.php`            |
| POST     | `/register`         | inline in `index.php`    |
| PATCH    | `/profile/me`       | `profile/me.php`         |
| GET/POST | `/collections`      | `_collections/index.php` |
| GET      | `/collections/{id}` | `_collections/id.php`    |
| GET      | `/test`, `/db-test` | inline health checks     |

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
## Key Patterns

- **Adding a new API endpoint**: Add a `case` to the switch in `backend/index.php`, create a handler file in the appropriate subdirectory
- **Adding a new page**: Create component in `frontend/src/pages/`, add route in `App.jsx`, wrap with `ProtectedRoute` if auth required. Add i18n keys to all 3 locale files.
- **Auth check in PHP**: Start session, verify `$_SESSION['user_id']` exists, return 401 if not
- **Auth check in React**: Use `const { isAuthenticated, user, loading } = useAuth()` — `isAuthenticated` is a boolean, `loading` is true until session check completes. Pages inside `<ProtectedRoute>` do NOT need their own auth check.
- **Database queries**: Get connection via `getDbConnection()` from `db.php`, use PDO prepared statements
- **Email sending**: `backend/helpers/mailer.php` provides `sendVerificationEmail()` and `sendPasswordResetEmail()`. Uses PHPMailer with SMTP config from `config.php`. Registration endpoint returns `emailSent: bool` so frontend can warn on failure.
