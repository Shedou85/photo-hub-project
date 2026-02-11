# Codebase Concerns

**Analysis Date:** 2026-02-11

## Security Issues

**Hardcoded Database Credentials:**
- Issue: Database credentials (username, password, database name) are committed to version control in plain text
- Files: `backend/config.php` (lines 8-16)
- Impact: **Critical** — Any access to the repository exposes live database credentials. If repository is cloned or accessed by unauthorized parties, database is immediately compromised.
- Fix approach: Move credentials to environment variables. Use `$_ENV` or `getenv()` to load from `.env` (which must be `.gitignore`d). Use `backend/config.example.php` as the template and commit that instead.

**Hardcoded Database Password in Version Control:**
- Issue: Password `MilanaDainyte1` is visible in `backend/config.php` line 13
- Files: `backend/config.php`
- Impact: **Critical** — Production database password is exposed
- Fix approach: (1) Immediately rotate this password in the database, (2) Remove from history with `git filter-branch` or `git filter-repo`, (3) Implement `.env` loading, (4) Add `config.php` to `.gitignore`

**Error Detail Leakage in Production:**
- Issue: Backend handlers expose detailed error messages and exception details to frontend in production
- Files: `backend/auth/login.php` (lines 72-73), `backend/collections/id.php` (line 143), `backend/collections/photos.php` (line 124), `backend/collections/selections.php` (line 156+)
- Impact: Error messages reveal database structure, handler paths, and internal logic to potential attackers
- Fix approach: Wrap error handling — log detailed errors server-side via `error_log()`, return generic "Server error" to frontend. Example pattern: `error_log($e->getMessage()); echo json_encode(["error" => "Server error"]);`

**Session Configuration Issues:**
- Issue: Session cookie uses `SameSite=None` which requires secure HTTPS context but may have compatibility issues
- Files: `backend/index.php` (lines 8-15)
- Impact: While intentionally permissive for cross-domain, this weakens CSRF protection. Medium risk if HTTPS not enforced.
- Fix approach: Ensure production serves only HTTPS. Consider `SameSite=Strict` for same-origin or `SameSite=Lax` if compatibility allows. Verify cookie flags in browser DevTools.

**CORS Allowlist Includes Localhost:**
- Issue: CORS allows `http://localhost:5173` and `http://localhost:4173` in production environment
- Files: `backend/cors.php` (lines 3-7)
- Impact: If a local service is compromised or misconfigured, it can access production API with credentials
- Fix approach: Move CORS allowlist to environment variables. Different configs for dev/prod. Production should only include `https://pixelforge.pro`.

**Client-Side Auth State in localStorage:**
- Issue: User data (including plan, role, subscription status) stored in plain localStorage
- Files: `frontend/src/contexts/AuthContext.jsx` (lines 7-8, 13, 18)
- Impact: localStorage is not secure for sensitive data. XSS attacks can steal user data. Data persists beyond logout if page not fully cleared.
- Fix approach: (1) Keep minimal data in localStorage (optional: just user ID/email for UX), (2) Load full user state from `/auth/me` endpoint on app load, (3) Validate session server-side on every request. This matches the backend's session-based auth approach better.

**Missing Input Validation for Collection Password:**
- Issue: Collection password stored in database but no constraints on length, complexity, or validation
- Files: `backend/collections/id.php` (lines 92-95)
- Impact: Weak passwords or null values accepted. No enforcement of password requirements.
- Fix approach: Validate password length (minimum 8 chars), add backend regex validation, hash before storage (already done via `password_hash`). Document password requirements to frontend.

---

## Tech Debt

**Simplified CUID Generation:**
- Issue: Custom CUID generator is not production-grade and may have collision risk
- Files: `backend/index.php` (lines 18-25)
- Impact: While unlikely with `md5()` hashing, collisions could cause data corruption. Non-standard format makes it harder to debug.
- Fix approach: Use a proper CUID library (PHP: `symfony/uid` or `getoid/cuid2-php`). Or use UUID v4 if CUID not critical to app identity.

**No Compiled Assets for Frontend:**
- Issue: Frontend uses Vite which requires build step before deployment, but backend is vanilla PHP with no build
- Files: All frontend source
- Impact: Easy to accidentally deploy unbuild code. No optimization for production.
- Fix approach: Ensure build step is in deployment pipeline. Consider adding build verification to CI (if added later).

**Monolithic Router in Backend:**
- Issue: `backend/index.php` (211 lines) contains main routing switch with duplicate URI parsing logic
- Files: `backend/index.php`, `backend/utils.php`
- Impact: Hard to add new routes, easy to introduce bugs with URI parsing. Duplicated logic in `id.php`, `photos.php`, etc.
- Fix approach: Extract routing to reusable function in `utils.php` or create a simple Router class. Consolidate URI parsing into single source of truth.

**Repeated Error Handling Pattern:**
- Issue: Every handler repeats auth check, error handling, and response formatting
- Files: All `backend/**/*.php` files
- Impact: 11 files contain similar boilerplate (session_start, auth check, try/catch). Inconsistent error formats.
- Fix approach: Create helper functions: `requireAuth()`, `respondError($code, $msg)`, `respondOk($data)` in `utils.php`. Use include guards or middleware pattern.

**No HTTPS Enforcement:**
- Issue: CORS and session config assume HTTPS but `.htaccess` doesn't enforce it
- Files: `backend/` (no `.htaccess` visible to enforce HTTPS)
- Impact: Session cookies marked secure, but unencrypted traffic possible if misconfigured
- Fix approach: Add `RewriteCond %{HTTPS} off` → `RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]` to `.htaccess`

**Frontend Pages Too Large:**
- Issue: `CollectionDetailsPage.jsx` is 531 lines, `HomePage.jsx` is 378 lines
- Files: `frontend/src/pages/CollectionDetailsPage.jsx`, `frontend/src/pages/HomePage.jsx`
- Impact: Hard to test, understand, and modify. Multiple concerns in single component (fetch, upload, display, editing).
- Fix approach: Break into smaller components. Extract `<PhotoUploadZone>`, `<LightboxViewer>`, `<EditPanel>` as separate components. Move fetch logic to custom hooks (`usePhotos()`, `useCollection()`).

**No API Error Handling Standardization:**
- Issue: Frontend checks `data.status === "OK"` but handlers return different error shapes
- Files: `frontend/src/pages/CollectionsListPage.jsx` (line 38), `LoginPage.jsx` (line 58)
- Impact: Inconsistent error handling. Some endpoints use `status`, others use `error`. Frontend assumes specific response structure.
- Fix approach: Standardize all responses to: `{ status: "OK|ERROR", data?: {...}, error?: "message" }`. Update all handlers and frontend accordingly.

**No Request/Response Logging:**
- Issue: Backend has no logging of API calls, authentication events, or data access
- Files: All `backend/**/*.php` files
- Impact: Cannot audit user actions, debug issues, or detect suspicious activity
- Fix approach: Add centralized logging function. Log authentication, data modifications, errors. Use `error_log()` or dedicated logging library (Monolog).

---

## Missing Critical Features

**No Password Reset Flow:**
- Issue: Users cannot recover lost passwords
- Database has `passwordResetToken` and `passwordResetExpires` columns but no handler
- Impact: Locked-out users cannot regain access
- Fix approach: Create `auth/forgot-password.php` and `auth/reset-password.php`. Generate token via `bin2hex(random_bytes(32))`, expire after 1 hour, send via email.

**No Logout Backend Handler:**
- Issue: `backend/auth/logout.php` exists but is only 5 lines with no actual session destruction
- Files: `backend/auth/logout.php`
- Impact: Session persists server-side after logout. User auth token could theoretically be replayed.
- Fix approach: Implement proper session destruction: `session_destroy()`, optionally track revoked sessions in DB for extra security.

**No Email Verification on Registration:**
- Issue: Users can register with any email, no verification step
- Files: `backend/index.php` (lines 82-131)
- Impact: Fake/invalid emails accepted. Spam registrations possible. No email delivery confirmation.
- Fix approach: Generate verification token on registration, mark user as `status = 'PENDING'`, require email click to activate. Send via mail service (Stripe/SendGrid integration needed).

**No Rate Limiting:**
- Issue: No protection against brute force login or spam uploads
- Files: All endpoints
- Impact: Attackers can repeatedly attempt login or upload massive files
- Fix approach: Implement IP-based rate limiting middleware. For logins: 5 attempts per IP per 15 min. For uploads: quota per user/day.

**No Input Sanitization/Validation Library:**
- Issue: String validation done manually with `filter_var()` and regex, no centralized validation
- Files: `backend/index.php`, `backend/auth/login.php`, `backend/collections/id.php`
- Impact: Missed edge cases. No defense-in-depth for injection attacks.
- Fix approach: Use `respect/validation` or `illuminate/validation` library. Validate all inputs before use.

---

## Performance Concerns

**N+1 Query in Collections Fetch:**
- Issue: Frontend fetches collections, but each collection card likely fetches cover photo separately (inferred from cover photo logic)
- Files: `frontend/src/pages/CollectionsListPage.jsx` (line 29), `backend/collections/index.php`
- Impact: If 50 collections, 50+ database queries needed
- Fix approach: Backend should return cover photo data inline with collection. Modify `collections/index.php` to LEFT JOIN cover photo details.

**No Pagination on Collections Endpoint:**
- Issue: Fetches all collections at once with no limit
- Files: `backend/collections/index.php` (lines 19-26)
- Impact: Hundreds of collections will be slow to serialize and transfer
- Fix approach: Add `?limit=20&offset=0` parameters. Return total count. Implement cursor-based pagination if preferred.

**No Image Optimization:**
- Issue: Uploaded photos served at full resolution. No thumbnails generated.
- Files: `backend/collections/photos.php`, `frontend/src/pages/CollectionDetailsPage.jsx`
- Impact: High bandwidth cost. Slow page loads. Large photo grids will be sluggish.
- Fix approach: Generate thumbnails (150x150px) on upload. Serve thumbnails in grid, full image on lightbox click. Use ImageMagick or GD library.

**Large Component Re-renders:**
- Issue: `CollectionDetailsPage` uploads 3 files in parallel (`MAX_CONCURRENT_UPLOADS = 3`), but all upload state managed in single object
- Files: `frontend/src/pages/CollectionDetailsPage.jsx` (lines 40, 102)
- Impact: Each upload state change re-renders entire photo grid
- Fix approach: Move upload state to separate component or context. Use `useCallback` with proper dependencies.

---

## Testing Gaps

**No Unit Tests:**
- Issue: Zero test files in codebase (no `*.test.jsx`, `*.spec.php`, etc.)
- Files: N/A
- Impact: Refactoring is high-risk. No regression detection.
- Fix approach: Add tests for critical paths: (1) Frontend: AuthContext, ProtectedRoute, LoginPage form validation, (2) Backend: Database layer, auth endpoints, collection ownership checks.

**No Integration Tests:**
- Issue: No tests for API workflows (login → create collection → upload photos → delete)
- Files: N/A
- Impact: Contract changes between frontend/backend caught only by manual testing
- Fix approach: Use Vitest (JS) for frontend integration tests, PHPUnit for backend. Mock database for fast tests.

**No E2E Tests:**
- Issue: No Playwright/Cypress tests simulating real user workflows
- Files: N/A
- Impact: UI bugs, flow breakages only discovered in production
- Fix approach: Add 3-5 critical E2E tests: login, create/delete collection, upload photos, view profile.

---

## Fragile Areas

**AuthContext Relies on Synchronized localStorage and Session:**
- Issue: Frontend stores user in localStorage, backend tracks in PHP session. They can get out of sync.
- Files: `frontend/src/contexts/AuthContext.jsx`, all `backend/**/*.php` (session-based auth)
- Why fragile: If user updates profile on backend but localStorage not refreshed, frontend shows stale data. Logout on frontend doesn't invalidate backend session immediately (logout handler missing).
- Safe modification: Add `useEffect` to call `/auth/me` on app mount to sync state. Ensure logout calls backend endpoint to destroy session.
- Test coverage: None — add test for logout flow and session invalidation.

**CUID Generation Not Centralized:**
- Issue: `generateCuid()` defined in `backend/index.php` but needs to be called in multiple handlers
- Files: `backend/index.php` (lines 18-25), `backend/collections/index.php` (line 48), `backend/collections/photos.php` (line 88), etc.
- Why fragile: If CUID format changes, must update all files. Risk of inconsistency.
- Safe modification: Move `generateCuid()` to `backend/utils.php`. Import with `require_once`. Add comment linking to single definition.
- Test coverage: None — add unit test for CUID format and uniqueness.

**URI Parsing Duplicated Across Handlers:**
- Issue: `backend/index.php`, `backend/collections/id.php`, `backend/collections/photos.php` all manually parse request URI
- Files: Multiple files
- Why fragile: Bug in one place may not exist in another. Hard to fix globally.
- Safe modification: Create `function getCollectionIdFromRequest()` in `utils.php`, return extracted ID. Use everywhere.
- Test coverage: None — URI parsing not unit tested.

**Mixed i18n Namespaces in Frontend:**
- Issue: i18n keys use multiple namespaces (`nav.`, `home.`, `login.`, `collections.`, `collection.`, `profile.`, `payments.`)
- Files: All `frontend/src/**/*.jsx` files
- Why fragile: Hard to find all usages of a key. No IDE support for finding untranslated strings.
- Safe modification: Audit all i18n calls in code. Ensure all three locale files (`en.json`, `lt.json`, `ru.json`) stay in sync. Add key existence check in CI.
- Test coverage: None — i18n completeness not validated.

---

## Deployment Risks

**No Environment Configuration:**
- Issue: API base URL (`VITE_API_BASE_URL`) must be set in `.env`, but `.env` not committed
- Files: Referenced by all fetch calls in `frontend/src`
- Risk: Deployment process must correctly configure this. Easy to point to wrong API.
- Mitigation: Document in README.md. Create `.env.example`. Add validation in `main.jsx` to error if env var missing.

**No Migration System for Database:**
- Issue: Schema defined in `database_schema.sql` but no versioning or rollback capability
- Files: `database_schema.sql`
- Risk: Changing schema requires manual SQL execution. Easy to miss in staging/prod.
- Mitigation: Implement migration tool (Flyway, Liquibase, or simple PHP migration runner). Track applied migrations in `_migrations` table.

**Production Error Details Exposed:**
- Issue: Backend error messages include exception details (seen in `backend/collections/id.php` line 143)
- Files: All backend handlers
- Risk: Stack traces, file paths, database structure revealed to attacker
- Mitigation: (Already noted under Security Issues) Wrap errors server-side, return generic messages to clients.

---

## Known Bugs / Workarounds

**Profile Update Doesn't Include Full User Data:**
- Issue: `backend/profile/me.php` (line 34) returns only `name, email, bio, createdAt` — missing `plan, role, subscriptionStatus`
- Files: `backend/profile/me.php`
- Workaround: Frontend fetches `/auth/me` after update to get full user data (not implemented — just overwrites partial data)
- Fix: Return full user object from profile update endpoint, matching login response shape

**Collection Password Field Not Used:**
- Issue: Column `password` in `Collection` table can be updated (line 92-95 in `backend/collections/id.php`) but no UI or documentation for sharing collections with a password
- Files: `database_schema.sql`, `backend/collections/id.php`
- Workaround: Feature is incomplete. Existing code doesn't break, just dead code.
- Fix: Either implement full password-protected collections feature (share link + password UI) or remove the column/field.

---

## Code Quality Observations

**Mixed Comment Languages:**
- Issue: Comments in `backend/auth/login.php` (line 6: "Tik POST", line 50: "OK → įrašom į session", line 72: "prod – išimti") mix Lithuanian and English
- Files: Several backend files
- Impact: Harder for international team to understand intent
- Recommendation: Standardize comments to English for production code

**Incomplete i18n for Errors:**
- Issue: API error messages hardcoded in English, no i18n keys
- Files: All `backend/**/*.php` files
- Impact: Non-English users see English errors
- Recommendation: For future: Return error codes instead of messages from backend, let frontend translate: `{ error: { code: "COLLECTION_NOT_FOUND" } }`

---

## Scaling Concerns

**No File Storage Strategy:**
- Issue: Uploaded photos stored in `backend/uploads/` filesystem. No CDN, no backup, no replication.
- Files: `backend/utils.php` (lines 37-56), `backend/collections/photos.php`
- Limit: Disk space is finite. Server recovery loses files.
- Scaling path: Move to S3 or similar cloud storage. Use signed URLs for delivery. Implement backup strategy.

**No Database Connection Pooling:**
- Issue: PDO creates new connection per request
- Files: `backend/db.php`
- Limit: High request volume will exhaust connections
- Scaling path: Use connection pooling library (ProxySQL, pgBouncer if upgrading to PostgreSQL). Or use managed database with scaling (e.g., AWS RDS).

**No Caching Layer:**
- Issue: Every request hits database. No Redis/Memcached.
- Files: All handlers
- Limit: High user count will cause database slowness
- Scaling path: Cache collection lists, user profiles. Invalidate on write. Use Redis or Memcached.

---

*Concerns audit: 2026-02-11*
