# Codebase Structure

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-03-03

## Directory Layout

```
photo-hub/
├── frontend/                        # React SPA application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── collection/         # Collection phase components
│   │   │   │   ├── DraftPhase.jsx
│   │   │   │   ├── SelectingPhase.jsx
│   │   │   │   ├── ReviewingPhase.jsx
│   │   │   │   ├── DeliveredPhase.jsx
│   │   │   │   ├── PromotionalConsentModal.jsx
│   │   │   │   ├── SortablePhotoGrid.jsx
│   │   │   │   └── SortablePhotoItem.jsx
│   │   │   ├── primitives/         # Reusable primitive components
│   │   │   │   ├── Badge.jsx (+test)
│   │   │   │   ├── Button.jsx (+test)
│   │   │   │   ├── Card.jsx (+test)
│   │   │   │   ├── CollectionCard.jsx (+test)
│   │   │   │   ├── ConfirmModal.jsx
│   │   │   │   ├── Dropdown.jsx
│   │   │   │   ├── TrialExpiredModal.jsx
│   │   │   │   ├── Input.jsx (+test)
│   │   │   │   ├── PhotoCard.jsx
│   │   │   │   ├── Select.jsx (+test)
│   │   │   │   ├── SelectionBorder.jsx
│   │   │   │   └── UploadZone.jsx
│   │   │   ├── Accordion.jsx (+test)
│   │   │   ├── ActivityStats.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── BottomNavigation.jsx
│   │   │   ├── CookieConsentBanner.jsx
│   │   │   ├── CreateCollectionModal.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   ├── PageHeader.jsx (+test)
│   │   │   ├── ProtectedRoute.jsx (+test)
│   │   │   └── SEO.jsx
│   │   ├── constants/              # Shared constants
│   │   │   ├── breakpoints.js      # MOBILE: 640, TABLET: 768, DESKTOP: 1024
│   │   │   └── styles.js           # PHOTO_GRID_CLASSES
│   │   ├── contexts/               # React context providers
│   │   │   └── AuthContext.jsx (+test)
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useApi.js
│   │   │   ├── useCollectionData.js
│   │   │   ├── useLightbox.js
│   │   │   ├── useMediaQuery.js
│   │   │   ├── usePhotoFiltering.js
│   │   │   ├── usePhotoReorder.js
│   │   │   └── usePhotoUpload.js
│   │   ├── layouts/                # App shell layouts
│   │   │   ├── MainLayout.jsx      # Desktop: 256px sidebar
│   │   │   ├── MobileLayout.jsx    # Mobile: top header + bottom nav
│   │   │   └── ResponsiveLayout.jsx # Switches at 768px
│   │   ├── lib/                    # Core libraries
│   │   │   ├── api.js (+test)      # Centralized API client with CSRF
│   │   │   └── analytics.js        # GA4 analytics (consent-gated)
│   │   ├── locales/                # i18n translation files
│   │   │   ├── en.json
│   │   │   ├── lt.json
│   │   │   └── ru.json
│   │   ├── pages/                  # Route-level page components
│   │   │   ├── AdminPage.jsx
│   │   │   ├── CollectionDetailsPage.jsx
│   │   │   ├── CollectionsListPage.jsx
│   │   │   ├── DeliveryPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotFoundPage.jsx (+test)
│   │   │   ├── PaymentsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── SharePage.jsx
│   │   │   └── VerifyEmailPage.jsx
│   │   ├── utils/                  # Utility functions
│   │   │   ├── copyScript.js (+test)
│   │   │   ├── download.js
│   │   │   └── photoUrl.js
│   │   ├── __tests__/              # Test infrastructure
│   │   │   ├── mocks/i18n.js
│   │   │   ├── setup.js
│   │   │   └── utils/test-utils.jsx
│   │   ├── App.jsx                 # Route definitions
│   │   ├── App.css
│   │   ├── main.jsx                # Entry point
│   │   ├── index.css               # Global styles (Tailwind imports)
│   │   └── i18n.js                 # i18n configuration
│   ├── e2e/                        # Playwright E2E tests
│   │   ├── accessibility/wcag-compliance.spec.js
│   │   ├── cross-browser/responsive-layout.spec.js
│   │   └── visual-regression/multi-locale.spec.js
│   ├── public/                     # Static files
│   │   ├── logo.png
│   │   ├── og-image.png
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   └── vite.svg
│   ├── scripts/
│   │   └── check-bundle-size.js    # CI bundle size validation
│   ├── dist/                       # Build output (gitignored)
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── playwright.config.js
│   ├── lighthouserc.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
├── backend/                         # PHP API backend
│   ├── auth/                       # Authentication handlers
│   │   ├── login.php
│   │   ├── logout.php
│   │   ├── me.php
│   │   ├── google.php              # Google OAuth
│   │   ├── verify-email.php
│   │   ├── resend-verification.php
│   │   ├── forgot-password.php
│   │   └── reset-password.php
│   ├── collections/                # Collection CRUD + lifecycle handlers
│   │   ├── index.php               # List/create
│   │   ├── id.php                  # Get/update/delete
│   │   ├── photos.php              # Photo list/upload/delete
│   │   ├── cover.php               # Set cover photo
│   │   ├── selections.php          # Photographer-side selections
│   │   ├── edited.php              # Edited finals
│   │   ├── share.php               # Public share gallery
│   │   ├── share-selections.php    # Client selections (share token)
│   │   ├── preview.php             # Watermarked preview (PRO)
│   │   ├── delivery.php            # Generate delivery token
│   │   ├── deliver-view.php        # Public delivery gallery
│   │   ├── photo-download.php      # Individual photo download
│   │   ├── zip-download.php        # Streaming ZIP download
│   │   ├── promotional.php         # Promotional photos
│   │   └── reorder.php             # Photo reorder (PRO)
│   ├── profile/                    # User profile handlers
│   │   ├── me.php                  # Profile update
│   │   └── stats.php               # Activity statistics
│   ├── admin/                      # Admin subsystem
│   │   ├── auth-check.php          # Admin auth guard
│   │   ├── stats.php               # Platform stats
│   │   ├── users.php               # User management
│   │   ├── collections.php         # All collections
│   │   ├── audit-log.php           # Audit trail
│   │   └── download-stats.php      # Download analytics
│   ├── helpers/                    # Shared helpers
│   │   ├── csrf.php                # CSRF token management
│   │   ├── mailer.php              # PHPMailer wrapper
│   │   ├── r2.php                  # Cloudflare R2 client
│   │   ├── watermark.php           # GD watermark generator
│   │   ├── audit-logger.php        # Admin audit logging
│   │   ├── download-tracker.php    # Download deduplication
│   │   ├── rate-limiter.php        # Rate limiting
│   │   └── session.php             # Session helper
│   ├── migrations/                 # SQL migrations
│   │   ├── add_email_verification_expires.sql
│   │   ├── add_source_folder.sql
│   │   └── migrate-to-r2.php
│   ├── assets/fonts/
│   │   └── inter-bold.ttf          # Watermark font
│   ├── index.php                   # Main router
│   ├── db.php                      # PDO connection factory
│   ├── cors.php                    # CORS headers
│   ├── config.php                  # Config loader
│   ├── config.example.php          # Config template
│   ├── utils.php                   # Photo upload/thumbnail utilities
│   ├── promotional.php             # Public promotional photos endpoint
│   ├── .htaccess                   # Apache rewrite rules
│   ├── .env                        # Environment variables (gitignored)
│   ├── composer.json
│   └── composer.lock
├── .planning/                       # Project planning docs
│   ├── codebase/                   # Architecture documentation
│   ├── phases/                     # 16 phase directories
│   ├── milestones/                 # v1.0, v2.0 milestone docs
│   ├── research/                   # Research artifacts
│   ├── PROJECT.md, ROADMAP.md, STATE.md, TODO.md, etc.
│   └── config.json
├── database_schema.sql              # MySQL table definitions
├── CLAUDE.md                        # Project instructions for Claude
└── .gitignore
```

## Directory Purposes

**frontend/src/components/collection/:**
- Purpose: Collection phase-specific UI components
- Contains: DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase (each renders phase-specific actions and views), PromotionalConsentModal, SortablePhotoGrid/Item (drag-and-drop reorder)

**frontend/src/components/primitives/:**
- Purpose: Reusable primitive UI building blocks
- Contains: Badge, Button, Card, CollectionCard, ConfirmModal, Dropdown, Input, PhotoCard (with compound Actions/Action subcomponents), Select, SelectionBorder, TrialExpiredModal, UploadZone

**frontend/src/components/ (root):**
- Purpose: App-level shared components
- Contains: Accordion, ActivityStats, AdminRoute, BottomNavigation, CookieConsentBanner, CreateCollectionModal, ErrorBoundary, LanguageSwitcher, PageHeader, ProtectedRoute, SEO

**frontend/src/constants/:**
- Purpose: Shared constants used across components
- Contains: `breakpoints.js` (MOBILE/TABLET/DESKTOP), `styles.js` (PHOTO_GRID_CLASSES)

**frontend/src/contexts/:**
- Purpose: Global state providers
- Contains: AuthContext (user, login, logout, isAuthenticated, loading — session via `/auth/me`, no localStorage)

**frontend/src/hooks/:**
- Purpose: Extracted reusable logic from page components
- Contains: useApi, useCollectionData, useLightbox, useMediaQuery, usePhotoFiltering, usePhotoReorder, usePhotoUpload

**frontend/src/layouts/:**
- Purpose: Responsive app shell system
- Contains: MainLayout (desktop 256px sidebar), MobileLayout (bottom nav), ResponsiveLayout (breakpoint switch at 768px)

**frontend/src/lib/:**
- Purpose: Core libraries and clients
- Contains: api.js (centralized HTTP client with CSRF), analytics.js (GA4 consent-gated)

**frontend/src/locales/:**
- Purpose: i18n translation files (19 namespaces)
- Contains: en.json, lt.json, ru.json — always kept in sync

**frontend/src/pages/:**
- Purpose: Route-level page components (15 pages)
- Key: HomePage (JSON-LD), LoginPage, RegisterPage, CollectionsListPage (search/sort), CollectionDetailsPage (workflow phases), ProfilePage (password change, activity stats), AdminPage (stats/users/audit), SharePage (review confirmation step), DeliveryPage (redesigned with animations)

**frontend/src/utils/:**
- Purpose: Pure utility functions
- Contains: copyScript.js (generates .bat/.command for photo copying), download.js (anchor-click download helpers), photoUrl.js (R2 URL construction + watermarked preview URL)

**frontend/src/__tests__/:**
- Purpose: Test infrastructure
- Contains: i18n mock, Vitest setup, custom render utility with providers

**frontend/e2e/:**
- Purpose: Playwright E2E test suites
- Contains: WCAG accessibility, responsive layout, multi-locale visual regression tests

**backend/auth/:**
- Purpose: Full authentication system (8 handlers)
- Contains: Login, logout, session check, Google OAuth, email verification, password reset

**backend/collections/:**
- Purpose: Full collection lifecycle handlers (15 handlers)
- Contains: CRUD, photos, selections, share, delivery, downloads, promotional, reorder, watermark preview

**backend/profile/:**
- Purpose: User profile management (2 handlers)
- Contains: Profile update (name/bio/password/websiteUrl), activity stats

**backend/admin/:**
- Purpose: Admin platform management (6 handlers)
- Contains: Auth guard, platform stats, user management, collections view, audit log, download stats

**backend/helpers/:**
- Purpose: Shared backend utilities (8 helpers)
- Contains: CSRF, mailer, R2 storage, watermark, audit logger, download tracker, rate limiter, session

**backend/migrations/:**
- Purpose: Database migration scripts
- Contains: SQL migration files + R2 migration PHP script

## Key File Locations

**Entry Points:**
- `frontend/src/main.jsx` — React app mount (HelmetProvider, BrowserRouter, AuthProvider, ErrorBoundary, i18n)
- `frontend/src/App.jsx` — Route definitions, loading guard, Sonner toast, CookieConsentBanner
- `backend/index.php` — HTTP router, CORS, session, CSRF, CUID generator

**Configuration:**
- `frontend/vite.config.js` — Vite config (React plugin, dev proxy, rollup-plugin-visualizer)
- `frontend/tailwind.config.js` — Custom colors, fonts, animations, breakpoints
- `frontend/vitest.config.js` — Vitest test runner config
- `frontend/playwright.config.js` — Playwright E2E config
- `backend/config.php` — Config loader (loads .env via phpdotenv)
- `backend/.htaccess` — Apache rewrite rules

**Core Logic:**
- `frontend/src/contexts/AuthContext.jsx` — Auth state (session-based, no localStorage)
- `frontend/src/lib/api.js` — Centralized API client with CSRF
- `frontend/src/hooks/` — All extracted custom hooks
- `backend/db.php` — PDO connection factory
- `backend/helpers/r2.php` — Cloudflare R2 storage client

## Naming Conventions

**Files:**
- React components: PascalCase + `.jsx` (e.g., `LoginPage.jsx`, `SelectionBorder.jsx`)
- Tests: same name + `.test.jsx` (e.g., `Badge.test.jsx`)
- Hooks: camelCase with `use` prefix + `.js` (e.g., `usePhotoUpload.js`)
- Utilities/libs: camelCase + `.js` (e.g., `api.js`, `photoUrl.js`)
- PHP handlers: lowercase + `.php`, grouped by feature (e.g., `auth/login.php`)
- PHP helpers: kebab-case + `.php` (e.g., `rate-limiter.php`, `audit-logger.php`)

**Frontend Routes:**
- Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- Public (token-based): `/share/:shareId`, `/deliver/:deliveryToken`
- Authenticated: `/profile`, `/collections`, `/collection/:id`, `/payments`
- Admin: `/admin`
- Catch-all: `*` → NotFoundPage

## Where to Add New Code

**New Feature (end-to-end):**
1. Backend endpoint: create handler in `backend/[feature]/`, add case to `backend/index.php`
2. Frontend page/component: create in `pages/` or `components/`, add route in `App.jsx`
3. Use `api.js` client for all API calls (never raw `fetch()`)
4. i18n: add keys to all 3 locale files
5. Database: update `database_schema.sql`

**New Reusable Component:**
- Primitive: `frontend/src/components/primitives/[Name].jsx`
- Collection-specific: `frontend/src/components/collection/[Name].jsx`
- App-level: `frontend/src/components/[Name].jsx`

**New Hook:**
- `frontend/src/hooks/use[Name].js`

**New Backend Helper:**
- `backend/helpers/[name].php`

---

*Structure analysis: 2026-02-11 | Updated: 2026-03-03 (added TrialExpiredModal)*
