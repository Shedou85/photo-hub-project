# Photo Hub — Post-Audit TODO

Generated from `project-review.txt` audit (2026-02-26).
Skipped: Payments (Stripe), CSP header, composer changes.

## Critical

- [x] Sync `database_schema.sql` — add `emailVerificationTokenExpires`, `sourceFolder`, `lightroomPath`
- [x] Add 404 catch-all route + `NotFoundPage`

## Security

- [ ] ~~Add CSP header~~ (skipped — separate task)
- [x] Add rate limiting to delivery endpoints (`photo-download`, `zip-download`)
- [x] Add collection expiration (`expiresAt`) checking in `deliver-view`, `photo-download`, `zip-download`, `share`
- [x] Review session timeout (currently 30 min) — documented rationale, 30 min is appropriate

## Frontend

- [x] Fix Accordion accessibility — `aria-label`, `aria-controls`
- [x] Add auth loading splash screen (replace blank screen during `/auth/me`)
- [x] Remove dead code — `lightroomScript.js`
- [x] Add `aria-label` to icon-only buttons — already done (18/18 have aria-labels)
- [x] Lightbox keyboard navigation — already done (ArrowLeft/Right/Escape in useLightbox, DeliveryPage, SharePage)
- [x] Color contrast audit — bumped `text-white/40` → `/50`, `text-white/30` → `/40` for body text
- [x] Skip-to-main-content link — added to MainLayout + MobileLayout
- [x] Form `aria-invalid` + `aria-describedby` — LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
- [x] UserDetailModal Escape key handler — added to AdminPage
- [ ] Dropdown arrow key navigation (language switchers) — low priority, click/tab works
- [ ] Increase test coverage to 70%+

## Backend

- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add backend tests (PHPUnit)
- [ ] Add cron job for collection expiration cleanup
- [x] Add promotional photo reorder endpoint (PATCH) — `collections/promotional.php`
- [x] Add download analytics API endpoint — `GET /admin/download-stats`

## Unfinished Features

- [ ] ~~Stripe payments~~ (skipped — separate milestone)
- [ ] ~~SharePage password prompt UI~~ (removed — passwordless by design)
- [x] ZIP download button in DeliveryPage UI — already implemented
- [ ] Bulk operations (multi-delete photos, multi-status change)

## Database

- [x] Clean up commented-out migration SQL at bottom of `database_schema.sql`
- [x] Document DOWNLOADED status intentional restriction (auto-only) — comment in `collections/id.php`
- [x] Document PromotionalPhoto FK removal rationale — comment in `database_schema.sql`
