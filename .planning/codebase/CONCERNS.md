# Codebase Concerns

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-02-28

## Resolved Since Initial Audit

The following concerns from the original 2026-02-11 audit have been **resolved**:

- ~~Client-Side Auth State in localStorage~~ → Auth now uses `GET /auth/me` session restoration, no localStorage
- ~~No Password Reset Flow~~ → Implemented: `forgot-password.php`, `reset-password.php` with token + email
- ~~No Logout Backend Handler~~ → Implemented: proper session destruction in `auth/logout.php`
- ~~No Email Verification on Registration~~ → Implemented: `verify-email.php`, `resend-verification.php`
- ~~No Rate Limiting~~ → Implemented: `helpers/rate-limiter.php` on login, register, forgot-password
- ~~No Unit Tests~~ → Vitest configured with tests for primitives, AuthContext, ProtectedRoute, api.js, copyScript.js
- ~~No E2E Tests~~ → Playwright configured with accessibility, responsive, and visual regression tests
- ~~No File Storage Strategy~~ → Migrated to Cloudflare R2 cloud storage
- ~~No Image Optimization~~ → Thumbnails generated on upload via GD library
- ~~Frontend Pages Too Large~~ → CollectionDetailsPage refactored: logic extracted into hooks (useCollectionData, usePhotoUpload, usePhotoFiltering, usePhotoReorder, useLightbox) and phase components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase)
- ~~Collection Password Field Not Used~~ → Implemented: SharePage uses password-protected access
- ~~No Request/Response Logging~~ → Admin audit logging implemented via `audit-logger.php` + AuditLog table
- ~~Profile Update Doesn't Include Full User Data~~ → Profile endpoint now handles name, bio, password, websiteUrl

---

## Security Issues

**CORS Allowlist Includes Localhost:**
- Issue: CORS allows `http://localhost:5173` and `http://localhost:4173` in production
- Files: `backend/cors.php`
- Impact: Medium — local services could potentially access production API
- Fix: Move CORS allowlist to env vars; separate dev/prod configs

**Error Detail Leakage in Production:**
- Issue: Some backend handlers still expose exception details in error responses
- Files: Various backend handlers
- Impact: Medium — reveals internal structure to potential attackers
- Fix: Use `error_log()` server-side, return generic "Server error" to frontend

**Session Cookie SameSite:**
- Issue: Session cookie uses `SameSite=Lax` which is appropriate but review periodically
- Files: `backend/index.php` session config
- Impact: Low — current config is reasonable for cross-domain setup

---

## Tech Debt

**Simplified CUID Generation:**
- Issue: Custom CUID generator uses `md5()` — not production-grade
- Files: `backend/index.php` (generateCuid function)
- Impact: Low collision risk but non-standard format
- Fix: Use proper CUID2 library or UUID v4

**Monolithic Router:**
- Issue: `backend/index.php` contains a large switch statement (~30+ cases)
- Impact: Growing complexity, harder to maintain
- Fix: Consider extracting to a simple Router class or table-based dispatcher

**Repeated Error Handling Pattern:**
- Issue: Every handler repeats auth check, error handling boilerplate
- Impact: Inconsistency across handlers
- Fix: Create middleware functions: `requireAuth()`, `respondError()`, `respondOk()`

**nelmio/cors-bundle in composer.json:**
- Issue: Symfony CORS bundle is in dependencies but CORS is handled by custom `cors.php`
- Impact: Dead dependency weight
- Fix: Remove from composer.json

**No HTTPS Enforcement:**
- Issue: `.htaccess` doesn't enforce HTTPS redirect
- Impact: Low (hosting likely handles this at server level)
- Fix: Add HTTPS rewrite rule to `.htaccess`

---

## Missing Features

**Stripe Payment Integration:**
- Issue: Schema has `stripeCustomerId`, `subscriptionStatus`, `plan` fields but no Stripe SDK
- Impact: Plans and payments are display-only — no actual billing
- Fix: Integrate Stripe checkout + webhooks for subscription management

**Cron Job for Collection Expiration:**
- Issue: Collections have `expiresAt` field but no automated cleanup
- Impact: Expired collections remain accessible
- Fix: Add cron job to check and archive/delete expired collections

**Bulk Operations:**
- Issue: Admin can manage users individually but bulk operations are limited
- Impact: Admin efficiency for large user base
- Fix: Implement bulk suspend/delete/plan-change in admin users endpoint

**API Documentation:**
- Issue: No OpenAPI/Swagger documentation for backend endpoints
- Impact: No self-service API docs for future developers
- Fix: Generate OpenAPI spec from route definitions

---

## Performance Concerns

**No Database Connection Pooling:**
- Issue: PDO creates new connection per request
- Files: `backend/db.php`
- Impact: Under high load, may exhaust connections
- Scaling: Use ProxySQL or managed database with pooling

**No Caching Layer:**
- Issue: Every request hits database — no Redis/Memcached
- Impact: Database load increases linearly with users
- Scaling: Cache collection lists, user profiles; invalidate on write

**No CDN for Static Assets:**
- Issue: Frontend static assets served directly by Apache
- Impact: Higher latency for distant users
- Scaling: Use Cloudflare CDN or similar for frontend assets

---

## Testing Gaps

**Backend Unit Tests:**
- Issue: No PHPUnit tests for backend endpoints
- Impact: Backend changes require manual testing only
- Fix: Add PHPUnit with tests for auth flows, collection CRUD, selection logic

**Test Coverage Target:**
- Issue: Current coverage not measured — TODO target is 70%+
- Impact: Unknown coverage of critical paths
- Fix: Add coverage reporting to Vitest config, enforce minimum threshold

---

## Code Quality Observations

**Mixed Comment Languages:**
- Issue: Some backend comments in Lithuanian (e.g., "Tik POST", "OK → įrašom į session")
- Impact: Low — readable by project team
- Recommendation: Standardize to English for any public/shared code

**Incomplete i18n for Backend Errors:**
- Issue: Backend error messages are hardcoded in English
- Impact: Non-English users see English errors from API
- Recommendation: Return error codes from backend, let frontend translate

---

## Scaling Concerns

**Single-Server Architecture:**
- Issue: Frontend and backend on same server, no horizontal scaling
- Impact: Single point of failure, limited throughput
- Scaling: Separate frontend (static hosting/CDN) from backend (scalable PHP/container)

**No Background Job Processing:**
- Issue: All operations are synchronous in request lifecycle
- Impact: Large file uploads, ZIP generation block the request
- Scaling: Add job queue for heavy operations (thumbnail generation, ZIP creation)

---

*Concerns audit: 2026-02-11 | Updated: 2026-02-28 (full audit — many original concerns resolved)*
