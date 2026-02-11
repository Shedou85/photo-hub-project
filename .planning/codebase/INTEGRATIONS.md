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
- Local filesystem (uploads directory)
  - Path: `backend/uploads/` (served via API)
  - Storage paths stored as relative paths in `Photo.storagePath` column
  - Frontend constructs URLs: `${VITE_API_BASE_URL}/${storagePath}`

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

Backend (`backend/config.php`):
- Database host, port, name, user, password (hardcoded - security concern)

**Secrets location:**
- Frontend: `.env` and `.env.development` files (Vite env files)
- Backend: `backend/config.php` (hardcoded - NOT in .gitignore)
- Database credentials: In config.php only

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

*Integration audit: 2026-02-11*
