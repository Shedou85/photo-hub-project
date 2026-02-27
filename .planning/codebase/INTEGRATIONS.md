# External Integrations

**Analysis Date:** 2026-02-11

## APIs & External Services

**Payment Processing:**
- Stripe (partially integrated)
  - SDK/Client: Not detected in code; schema has `stripeCustomerId` field in `User` table but no implementation
  - Auth: Not detected
  - Status: Fields exist for future integration but no live integration yet

**Authentication:**
- Custom email/password authentication via `backend/auth/login.php`
  - OAuth provider structure exists (`Account` table) but not integrated
  - Session-based auth with PHP sessions scoped to `.pixelforge.pro`

## Data Storage

**Databases:**
- MySQL (primary data store)
  - Connection: `backend/config.php` - host: localhost:3306
  - Client: PHP PDO (native MySQL driver)
  - Database: `u934073279_Photo_hub` (utf8mb4)

**File Storage:**
- Cloudflare R2 (S3-compatible object storage)
  - Bucket: `pixelforge-photos` (EU region)
  - Public URL: `https://pub-dc582663b11f4828aa8a1fd7e5674c43.r2.dev`
  - SDK: `aws/aws-sdk-php ^3.0` with `Aws\S3\S3Client`
  - Helper: `backend/helpers/r2.php` — `r2Upload()`, `r2Delete()`, `r2GetStream()`, `r2GetUrl()`, `r2GetSize()`
  - Object keys stored in `Photo.storagePath` column (e.g. `collections/{collId}/{photoId}.jpg`)
  - Frontend constructs URLs: `${VITE_MEDIA_BASE_URL}/${storagePath}` via shared `photoUrl()` utility
  - CORS: Allowed origins `pixelforge.pro`, `www.pixelforge.pro`; GET method only

**Caching:**
- None detected (no Redis, Memcached, or in-memory caching)

## Authentication & Identity

**Auth Provider:**
- Custom (email/password)
  - Implementation: `backend/auth/login.php` - validates email/password against hashed `User.password`
  - Session management: PHP `$_SESSION['user_id']` with domain cookie `.pixelforge.pro`
  - Frontend: React Context (`frontend/src/contexts/AuthContext.jsx`) with localStorage persistence

**Auth Flow:**
1. Frontend POST to `/login` with email/password
2. Backend validates, sets session, returns user object
3. Frontend stores user in localStorage via `AuthContext`
4. Subsequent requests include `credentials: "include"` for session cookies

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, LogRocket, or similar)

**Logs:**
- Backend: PHP error logs (standard Apache/PHP error log)
- Frontend: Browser console only (no external logging)
- Database: MySQL slow query log (not configured)

## CI/CD & Deployment

**Hosting:**
- Frontend: Deployed to `pixelforge.pro` (Vite production build)
- Backend: PHP on `api.pixelforge.pro/backend/`
- Database: Remote MySQL host

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, Jenkins, etc.)
- Manual deployment assumed

## Environment Configuration

**Required env vars:**

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL` - API endpoint (used in all fetch calls)
  - Dev: http://localhost:5173/api (proxied to api.pixelforge.pro)
  - Prod: https://api.pixelforge.pro
- `VITE_MEDIA_BASE_URL` - Media CDN base URL for photo/thumbnail display
  - Dev: `/api` (proxied via Vite)
  - Prod: `https://pub-dc582663b11f4828aa8a1fd7e5674c43.r2.dev`

Backend (`backend/.env`):
- Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_CHARSET`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`
- R2: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`
- Google: `GOOGLE_CLIENT_ID`

**Secrets location:**
- Frontend: `.env` and `.env.development` files (Vite env files)
- Backend: `backend/.env` (dotenv-loaded via config.php, gitignored)
- R2 credentials: In backend/.env only

## Webhooks & Callbacks

**Incoming:**
- Not detected (no webhook endpoints)

**Outgoing:**
- Not detected (no external service callbacks)

**CORS Configuration:**
- Implemented in `backend/cors.php` (custom, not using nelmio bundle)
- Allowed origins:
  - `https://pixelforge.pro`
  - `http://localhost:5173` (dev frontend)
  - `http://localhost:4173` (preview build)
- Methods: GET, POST, OPTIONS, PATCH, PUT, DELETE
- Credentials: true (for session cookies)

## Cross-Domain Communication

**Frontend to Backend:**
- Vite dev proxy: `/api/*` → `https://api.pixelforge.pro/backend/`
- Production: Direct HTTPS fetch to `api.pixelforge.pro` with credentials
- All API calls use `credentials: "include"` for session cookies
- Session cookies scoped to `.pixelforge.pro` (shared domain)

## API Routes

**Authentication:**
- POST `/login` - Session-based login
- GET `/auth/me` - Get current user
- POST `/logout` - Clear session
- POST `/register` - User registration

**Collections:**
- GET/POST `/collections` - List and create collections
- GET `/collections/{id}` - Get collection details
- GET/POST `/collections/{id}/photos` - Manage photos in collection
- GET/PATCH `/collections/{id}/cover` - Set cover photo
- GET/POST `/collections/{id}/selections` - Handle user selections
- GET/POST `/collections/{id}/edited` - Manage edited photos

**Profile:**
- PATCH `/profile/me` - Update user profile

**Health:**
- GET `/test` - Basic health check
- GET `/db-test` - Database connectivity test

---

*Integration audit: 2026-02-11 | Updated: 2026-02-27 (R2 migration)*
