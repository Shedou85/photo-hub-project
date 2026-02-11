# Technology Stack

**Analysis Date:** 2026-02-11

## Languages

**Primary:**
- JavaScript/JSX - React frontend components, Vite configuration
- PHP - Vanilla backend routing and API handlers
- SQL - MySQL database queries via PDO

**Secondary:**
- JSON - Internationalization files (`frontend/src/locales/`)
- CSS/Tailwind - Styling (no inline styles in React)

## Runtime

**Environment:**
- Node.js (version not pinned; implied compatibility with package.json)
- PHP 7.4+ (inferred from PDO and password_hash usage)
- Apache 2.x (via `.htaccess` rewrite rules)

**Package Manager:**
- npm (Frontend dependencies)
  - Lockfile: `frontend/package-lock.json` (present)
- Composer (Backend dependencies)
  - Lockfile: Not present (manually managed)

## Frameworks

**Core:**
- React 18.2.0 - Frontend UI library
- React Router DOM 7.11.0 - Client-side routing
- Vite 5.2.0 - Frontend build tool and dev server

**Internationalization:**
- i18next 25.8.4 - Translation framework
- react-i18next 16.5.4 - React bindings for i18n
- i18next-browser-languagedetector 8.2.0 - Auto language detection

**Styling:**
- Tailwind CSS 3.4.19 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS preprocessing
- Autoprefixer 10.4.24 - Vendor prefix automation

**Notifications:**
- Sonner 2.0.7 - Toast notification library

## Key Dependencies

**Critical:**
- React 18.2.0 - Core rendering engine
- React Router DOM 7.11.0 - Routing (supports dynamic segments like `/collection/:id`)
- Vite 5.2.0 - Dev server with hot reload and optimized production builds
- Tailwind CSS 3.4.19 - All visual styling

**Infrastructure:**
- nelmio/cors-bundle 2.1 - CORS handling for cross-domain PHP/JavaScript communication (defined in `backend/composer.json`, though manual CORS implemented in `backend/cors.php`)

## Configuration

**Environment:**
- Frontend env files: `frontend/.env` and `frontend/.env.development` (Vite loads these)
  - Key vars: `VITE_API_BASE_URL` (used throughout frontend for API calls)
- Backend config: `backend/config.php` (returns array with database credentials)
- Apache rewrite rules: `backend/.htaccess` (routes all requests to `backend/index.php`)

**Build:**
- Frontend build: `frontend/vite.config.js` (dev proxy configured to forward `/api/*` to `https://api.pixelforge.pro/backend/`)
- Vite dev proxy rewrites paths and normalizes cookies for localhost development

## Platform Requirements

**Development:**
- Node.js with npm
- PHP 7.4+ with PDO and MySQL extension
- Apache with mod_rewrite enabled

**Production:**
- Deployment target: `pixelforge.pro` (frontend) and `api.pixelforge.pro` (backend)
- MySQL database: `u934073279_Photo_hub` (utf8mb4 charset)
- Apache serving both frontend (Vite build output) and `/backend/` API routes

## Database

**Type:** MySQL 5.7+ with utf8mb4 collation

**Connection:**
- Host: localhost:3306 (development)
- Database: `u934073279_Photo_hub`
- Charset: utf8mb4_unicode_ci
- Connection method: PDO (PHP Data Objects)

**Key tables:**
- `User` - Authentication and profile (with Stripe integration fields: `stripeCustomerId`, subscription fields)
- `Collection` - Photo collections with lifecycle states (DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED)
- `Photo` - Photo metadata and storage paths
- `Account` - OAuth provider accounts (structure present but not integrated)

---

*Stack analysis: 2026-02-11*
