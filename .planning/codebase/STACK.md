# Technology Stack

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-02-28

## Languages

**Primary:**
- JavaScript/JSX — React frontend components, Vite configuration, test files
- PHP — Vanilla backend routing and API handlers
- SQL — MySQL database queries via PDO

**Secondary:**
- JSON — Internationalization files (`frontend/src/locales/`)
- CSS/Tailwind — Styling (utility classes only, no inline styles)

## Runtime

**Environment:**
- Node.js (version not pinned; compatible with package.json)
- PHP 7.4+ (PDO, GD extension for thumbnails/watermarks, password_hash)
- Apache 2.x (via `.htaccess` rewrite rules)

**Package Manager:**
- npm (Frontend dependencies)
  - Lockfile: `frontend/package-lock.json`
- Composer (Backend dependencies)
  - Lockfile: `backend/composer.lock`

## Frameworks

**Core:**
- React 18.2.0 — Frontend UI library
- React Router DOM 7.11.0 — Client-side routing (supports dynamic segments, outlet patterns)
- Vite 5.2.0 — Frontend build tool and dev server

**Internationalization:**
- i18next 25.8.4 — Translation framework
- react-i18next 16.5.4 — React bindings for i18n
- i18next-browser-languagedetector 8.2.0 — Auto language detection

**Styling:**
- Tailwind CSS 3.4.19 — Utility-first CSS framework with custom config
- PostCSS 8.5.6 — CSS preprocessing
- Autoprefixer 10.4.24 — Vendor prefix automation

**Notifications:**
- Sonner 2.0.7 — Toast notification library

**SEO:**
- react-helmet-async 2.x — Dynamic per-page meta tags and Open Graph

**Drag & Drop:**
- @dnd-kit/core 6.3 — DnD framework
- @dnd-kit/sortable 10.x — Sortable preset for @dnd-kit
- @dnd-kit/utilities 3.2 — DnD utilities

**Utilities:**
- clsx 2.1 — Conditional className composition

## Key Dependencies

**Critical (Frontend):**
- React 18.2.0 — Core rendering engine
- React Router DOM 7.11.0 — Routing with dynamic segments, outlet pattern
- Vite 5.2.0 — Dev server (HMR) and optimized production builds
- Tailwind CSS 3.4.19 — All visual styling (custom colors, animations, breakpoints)

**Critical (Backend):**
- aws/aws-sdk-php 3.x — Cloudflare R2 (S3-compatible) object storage
- phpmailer/phpmailer 7.x — Email sending (SMTP) for verification + password reset
- google/apiclient 2.16 — Google OAuth authentication
- maennchen/zipstream-php 3.0 — Streaming ZIP generation for delivery downloads
- vlucas/phpdotenv 5.5 — .env file loading for configuration

**Infrastructure (Backend):**
- nelmio/cors-bundle 2.1 — In composer.json but likely vestigial (CORS handled by custom `cors.php`)

## Configuration

**Environment:**
- Frontend env files: `frontend/.env` and `frontend/.env.development` (Vite loads these)
  - `VITE_API_BASE_URL` — API endpoint for all API calls
  - `VITE_MEDIA_BASE_URL` — R2 public URL for photo/thumbnail display
  - `VITE_GA_MEASUREMENT_ID` — Google Analytics 4 measurement ID
- Backend config: `backend/.env` loaded via phpdotenv
  - DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_CHARSET`
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`
  - R2: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`
  - Google: `GOOGLE_CLIENT_ID`
- Apache rewrite: `backend/.htaccess` routes all requests to `backend/index.php`

**Build:**
- `frontend/vite.config.js` — dev proxy (`/api/*` → `api.pixelforge.pro/backend/`), rollup-plugin-visualizer for bundle analysis
- `frontend/tailwind.config.js` — custom colors (surface-dark/darker/darkest, sidebar, brand), custom animations (shimmer, text-glow, fade-in-up, fade-in, scale-in), custom breakpoints (from breakpoints.js), Inter font stack

**Tailwind Custom Config:**
- Colors: `surface-dark` (#1a1a2e), `surface-darker` (#0d0f14), `surface-darkest` (#080a0f), `surface-dark-alt` (#1a1f35), `surface-light` (#f5f6fa), `sidebar-*`, `brand-blue`, `brand-indigo`
- Animations: shimmer, text-glow, fade-in-up, fade-in, scale-in
- Border-radius: sm=8px, DEFAULT=10px, md=12px, lg=16px, xl=20px
- Font sizes: Major Third (1.250) typographic scale (xs through 4xl)

## Platform Requirements

**Development:**
- Node.js with npm
- PHP 7.4+ with PDO, GD, and MySQL extensions
- Apache with mod_rewrite enabled

**Production:**
- Frontend: `pixelforge.pro` (Vite build output served by Apache)
- Backend API: `api.pixelforge.pro/backend/`
- Database: MySQL with `utf8mb4` charset
- Storage: Cloudflare R2 bucket `pixelforge-photos` (EU region)
- Email: SMTP (configured via PHPMailer)

## Database

**Type:** MySQL 5.7+ with utf8mb4_unicode_ci collation

**Connection:**
- PDO (PHP Data Objects) with prepared statements
- Options: `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES=false`
- Connection via `getDbConnection()` from `db.php`

**Tables (9):**
- `User` — auth, profile, plan, role, Stripe fields, subscription status
- `Account` — OAuth provider accounts (Google)
- `Collection` — photo collections with lifecycle states
- `Photo` — photo metadata and R2 storage paths
- `EditedPhoto` — edited/final photos for delivery
- `Selection` — client photo selections (UNIQUE per photoId)
- `PromotionalPhoto` — showcase photos for homepage
- `Download` — download tracking with session deduplication
- `AuditLog` — admin action audit trail (JSON changes field)

**Collection Status Lifecycle:**
`DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED`

**User Enums:**
- `role`: USER, ADMIN
- `plan`: FREE_TRIAL, STANDARD, PRO
- `subscriptionStatus`: FREE_TRIAL, ACTIVE, CANCELED, INACTIVE
- `status`: ACTIVE, SUSPENDED

---

*Stack analysis: 2026-02-11 | Updated: 2026-02-28 (full audit)*
