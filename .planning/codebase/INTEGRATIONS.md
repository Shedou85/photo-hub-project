# External Integrations

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-02-28

## APIs & External Services

**Payment Processing (Stripe):**
- Status: Schema fields exist (`stripeCustomerId`, `subscriptionStatus`, `plan` in User table) but no live Stripe SDK integration
- Future: Stripe checkout/webhook integration planned

**Authentication:**
- Custom email/password: `backend/auth/login.php` — validates password, creates PHP session
- Google OAuth: `backend/auth/google.php` — uses `google/apiclient ^2.16`, stores in Account table
- Email verification: `backend/auth/verify-email.php` — token-based verification after registration
- Password reset: `backend/auth/forgot-password.php` + `reset-password.php` — token-based reset flow

**Email (SMTP via PHPMailer):**
- Provider: Configured via SMTP env vars in `backend/.env`
- SDK: `phpmailer/phpmailer ^7.0`
- Helper: `backend/helpers/mailer.php`
- Functions: `sendVerificationEmail()`, `sendPasswordResetEmail()`
- Used by: Registration (verification email), forgot-password (reset email)

**Google Analytics (GA4):**
- Frontend: `frontend/src/lib/analytics.js`
- Consent-gated: Only initializes after user accepts cookies via CookieConsentBanner
- Env var: `VITE_GA_MEASUREMENT_ID`
- Tracks: Page views on route changes

## Data Storage

**Databases:**
- MySQL (primary data store)
  - Connection: `.env` loaded via phpdotenv — configurable host/port
  - Client: PHP PDO (native MySQL driver)
  - Charset: utf8mb4_unicode_ci
  - Tables: User, Account, Collection, Photo, EditedPhoto, Selection, PromotionalPhoto, Download, AuditLog

**File Storage (Cloudflare R2):**
- Type: S3-compatible object storage
- Bucket: `pixelforge-photos` (EU region)
- Public URL: Configured via `R2_PUBLIC_URL` env var
- SDK: `aws/aws-sdk-php ^3.0` with `Aws\S3\S3Client`
- Helper: `backend/helpers/r2.php`
  - `getR2Client()` — singleton S3Client
  - `r2Upload($key, $filePath, $contentType)` — upload file
  - `r2Delete($key)` — delete object
  - `r2GetStream($key)` — get PSR StreamInterface for streaming
  - `r2GetUrl($key)` — get public URL
  - `r2GetSize($key)` — get content length
- Object key pattern: `collections/{collectionId}/{photoId}.{ext}`
- Thumbnail pattern: `collections/{collectionId}/thumbs/{photoId}.{ext}`
- Frontend URL construction: `photoUrl(storagePath)` from `frontend/src/utils/photoUrl.js` → `${VITE_MEDIA_BASE_URL}/${storagePath}`
- Watermarked previews: `watermarkedPreviewUrl(shareId, photoId)` → API endpoint that applies GD watermark
- CORS: Allowed origins `pixelforge.pro`, `www.pixelforge.pro`; GET method only
- Used by:
  - `backend/utils.php` — photo upload + thumbnail generation (GD)
  - `backend/collections/zip-download.php` — streaming ZIP via ZipStream-PHP
  - `backend/collections/photo-download.php` — individual photo download
  - `backend/collections/id.php` — cascade delete on collection removal
  - `backend/collections/photos.php` — photo delete
  - `backend/helpers/watermark.php` — watermarked preview generation

**Caching:**
- None (no Redis, Memcached, or in-memory caching)

## Authentication & Identity

**Auth Provider: Custom (email/password + Google OAuth)**

**Email/Password Flow:**
1. Frontend POST to `/login` via `api.post()` with email/password
2. Backend validates credentials, checks email verification status
3. Creates PHP session, returns user object
4. Frontend stores user in AuthContext (no localStorage)
5. Subsequent requests include `credentials: "include"` for session cookies
6. On app mount, `GET /auth/me` restores session state

**Google OAuth Flow:**
1. Frontend initiates Google sign-in
2. POST to `/auth/google` with token (CSRF-exempt)
3. Backend validates via Google API Client, creates/links Account record
4. Creates PHP session, returns user object

**Session Configuration:**
- PHP sessions with cookies scoped to `.pixelforge.pro`
- Flags: secure, httponly, SameSite=Lax
- Backend helper: `backend/helpers/session.php`

**CSRF Protection:**
- Token: Stored in `$_SESSION['csrf_token']`
- Validation: `hash_equals()` comparison via `backend/helpers/csrf.php`
- Frontend: Auto-fetched by `api.js` client, attached as `X-CSRF-Token` header
- Exempt routes: login, register, forgot/reset-password, verify-email, share/*, deliver/*

**Rate Limiting:**
- Helper: `backend/helpers/rate-limiter.php`
- Applied to: login, register, forgot-password

## Monitoring & Observability

**Error Tracking:**
- No external service (no Sentry, LogRocket)

**Audit Logging:**
- Backend: `backend/helpers/audit-logger.php` → `logAuditAction()` writes to AuditLog table
- Tracks: Admin actions (user management, changes), with JSON diff of changes
- Viewable: Admin panel → Audit Log page

**Download Analytics:**
- Backend: `backend/helpers/download-tracker.php` — session-based deduplication
- Table: `Download` — tracks ZIP/individual downloads per collection
- Viewable: Admin panel → Download Stats page

**Logs:**
- Backend: PHP `error_log()` for server errors
- Frontend: Browser console (dev only)

## CI/CD & Deployment

**Hosting:**
- Frontend: `pixelforge.pro` (Vite production build served by Apache)
- Backend: `api.pixelforge.pro/backend/` (PHP served by Apache)
- Storage: Cloudflare R2 (EU region)
- Database: Remote MySQL host

**CI Pipeline:**
- No automated CI/CD pipeline configured
- Frontend has quality scripts: `npm run lint`, `npm run test`, `npm run build:analyze`
- Bundle size check: `frontend/scripts/check-bundle-size.js`
- Lighthouse: `frontend/lighthouserc.json` configured
- Deployment: Manual

## Environment Configuration

**Frontend (`frontend/.env`):**
- `VITE_API_BASE_URL` — API endpoint
  - Dev: `http://localhost:5173/api` (proxied via Vite)
  - Prod: `https://api.pixelforge.pro`
- `VITE_MEDIA_BASE_URL` — R2 public URL for media
  - Dev: `/api` (proxied via Vite to R2)
  - Prod: R2 public URL
- `VITE_GA_MEASUREMENT_ID` — Google Analytics 4 ID

**Backend (`backend/.env`):**
- DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_CHARSET`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`
- R2: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`
- Google: `GOOGLE_CLIENT_ID`

**Secrets:**
- Frontend: `.env` files (Vite env, gitignored)
- Backend: `backend/.env` (phpdotenv, gitignored)

## CORS Configuration

- Implementation: Custom `backend/cors.php` (not using nelmio bundle)
- Allowed origins:
  - `https://pixelforge.pro`
  - `http://localhost:5173` (dev frontend)
  - `http://localhost:4173` (preview build)
- Methods: GET, POST, OPTIONS, PATCH, PUT, DELETE
- Credentials: true (for session cookies)

## Complete API Routes

**Authentication (6 routes):**
- `GET /csrf-token` — generate CSRF token
- `POST /login` → `auth/login.php`
- `POST /logout` → `auth/logout.php`
- `GET /auth/me` → `auth/me.php`
- `POST /register` → inline in index.php (rate-limited)
- `POST /auth/google` → `auth/google.php` (CSRF-exempt)

**Email/Password Recovery (4 routes):**
- `GET /verify-email` → `auth/verify-email.php`
- `POST /resend-verification` → `auth/resend-verification.php`
- `POST /forgot-password` → `auth/forgot-password.php` (rate-limited)
- `POST /reset-password` → `auth/reset-password.php`

**Profile (2 routes):**
- `PATCH /profile/me` → `profile/me.php`
- `GET /profile/stats` → `profile/stats.php`

**Collections (10 routes):**
- `GET/POST /collections` → `collections/index.php`
- `GET/PATCH/DELETE /collections/{id}` → `collections/id.php`
- `GET/POST /collections/{id}/photos` → `collections/photos.php`
- `PATCH /collections/{id}/cover` → `collections/cover.php`
- `GET/POST/DELETE /collections/{id}/selections` → `collections/selections.php`
- `GET/POST /collections/{id}/edited` → `collections/edited.php`
- `POST /collections/{id}/delivery` → `collections/delivery.php`
- `GET/POST/PATCH/DELETE /collections/{id}/promotional` → `collections/promotional.php`
- `PATCH /collections/{id}/reorder` → `collections/reorder.php` (PRO-only)

**Public Share (3 routes, CSRF-exempt):**
- `GET/PATCH /share/{shareId}` → `collections/share.php`
- `GET/POST/DELETE /share/{shareId}/selections[/{photoId}]` → `collections/share-selections.php`
- `GET /share/{shareId}/preview/{photoId}` → `collections/preview.php`

**Public Delivery (3 routes, CSRF-exempt):**
- `GET /deliver/{token}` → `collections/deliver-view.php`
- `GET /deliver/{token}/zip` → `collections/zip-download.php`
- `GET /deliver/{token}/photo/{photoId}` → `collections/photo-download.php`

**Public Content (1 route):**
- `GET /promotional` → `promotional.php`

**Admin (5 routes):**
- `GET /admin/stats` → `admin/stats.php`
- `GET/PATCH/DELETE /admin/users` → `admin/users.php`
- `GET /admin/collections` → `admin/collections.php`
- `GET /admin/audit-log` → `admin/audit-log.php`
- `GET /admin/download-stats` → `admin/download-stats.php`

---

*Integration audit: 2026-02-11 | Updated: 2026-02-28 (full audit)*
