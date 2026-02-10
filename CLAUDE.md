# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photo Hub (pixelforge.pro) is a photo collection management app for professional photographers. The UI supports Lithuanian, English, and Russian via i18n. It uses a React frontend with a vanilla PHP API backend and MySQL database.

## Architecture

### Frontend (`frontend/`)
- **React 18** with **React Router DOM v7** and **Vite 5**
- **Tailwind CSS v3** for all styling — no inline styles, no CSS modules
- **react-i18next** for internationalization (LT/EN/RU). Locale files in `frontend/src/locales/`
- Entry point: `frontend/src/main.jsx` → `App.jsx` (route definitions)
- Auth state managed via React Context (`contexts/AuthContext.jsx`) with synchronous localStorage initialization
- `isAuthenticated` is a **boolean** (not a function) exposed from `AuthContext`
- Protected routes wrap pages with `components/ProtectedRoute.jsx`
- `layouts/MainLayout.jsx` provides sidebar navigation for authenticated pages
- Pages live in `frontend/src/pages/`

### Styling conventions
- Use **Tailwind utility classes** exclusively. No inline `style={{}}` props except where dynamic JS values are unavoidable (e.g. sidebar `left` position for slide animation)
- Use Tailwind `hover:` and `focus:` pseudo-class variants instead of JS state for hover/focus styling
- Gradients via arbitrary value: `bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]`
- Arbitrary sizes: `text-[13px]`, `w-[52px]`, `rounded-[10px]`, etc.
- Design system: white cards with `border border-gray-200 rounded-[10px] px-6 py-5`, blue/indigo gradient accents

### i18n conventions
- All user-visible strings must use `t('namespace.key')` — no hardcoded strings in JSX
- Locale files: `frontend/src/locales/en.json`, `lt.json`, `ru.json` — keep all three in sync
- Namespaces: `nav`, `home`, `login`, `profile`, `collections`, `collection`, `payments`

### Backend (`backend/`)
- **Vanilla PHP** (no framework) with **PDO** for MySQL
- `backend/index.php` is the main router — a single `switch` statement dispatching to handler files
- Route handlers are organized by feature: `auth/`, `_collections/`, `profile/`
- `backend/db.php` — PDO connection factory; `backend/config.php` — DB credentials
- `backend/cors.php` — CORS headers for cross-domain requests
- IDs use CUID format (generated via `generateCuid()` in `backend/index.php`)
- Apache `.htaccess` rewrites all requests to `index.php`

### Cross-Domain Setup
- Frontend: `pixelforge.pro` / Backend API: `api.pixelforge.pro/backend/`
- PHP sessions with cookies scoped to `.pixelforge.pro`, secure, httponly, SameSite=None
- All frontend API calls use `credentials: "include"`

### Database
- MySQL with `utf8mb4` charset
- Schema defined in `database_schema.sql` at project root
- Key tables: `User`, `Collection`, `Photo`, `EditedPhoto`, `Selection`, `PromotionalPhoto`
- Collections have a `status` lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED
- Users have `plan` (FREE_TRIAL, STANDARD, PRO) and `role` (USER, ADMIN) enums

## Routes (frontend)

| Path | Page | Auth required |
|------|------|---------------|
| `/` | `HomePage` | No (redirects to `/collections` if logged in) |
| `/login` | `LoginPage` | No (redirects to `/collections` if logged in) |
| `/profile` | `ProfilePage` | Yes |
| `/collections` | `CollectionsListPage` | Yes |
| `/collection/:id` | `CollectionDetailsPage` | Yes |
| `/payments` | `PaymentsPage` | Yes |

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

| Method | Path | Handler |
|--------|------|---------|
| POST | `/login` | `auth/login.php` |
| GET | `/auth/me` | `auth/me.php` |
| POST | `/register` | inline in `index.php` |
| PATCH | `/profile/me` | `profile/me.php` |
| GET/POST | `/collections` | `_collections/index.php` |
| GET | `/collections/{id}` | `_collections/id.php` |
| GET | `/test`, `/db-test` | inline health checks |

## Key Patterns

- **Adding a new API endpoint**: Add a `case` to the switch in `backend/index.php`, create a handler file in the appropriate subdirectory
- **Adding a new page**: Create component in `frontend/src/pages/`, add route in `App.jsx`, wrap with `ProtectedRoute` if auth required. Add i18n keys to all 3 locale files.
- **Auth check in PHP**: Start session, verify `$_SESSION['user_id']` exists, return 401 if not
- **Auth check in React**: Use `const { isAuthenticated, user } = useAuth()` — `isAuthenticated` is a boolean. Pages inside `<ProtectedRoute>` do NOT need their own auth check.
- **Database queries**: Get connection via `getDbConnection()` from `db.php`, use PDO prepared statements
