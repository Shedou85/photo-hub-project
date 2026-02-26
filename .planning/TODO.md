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
- [ ] Review session timeout (currently 30 min)

## Frontend

- [x] Fix Accordion accessibility — `aria-label`, `aria-controls`
- [x] Add auth loading splash screen (replace blank screen during `/auth/me`)
- [x] Remove dead code — `lightroomScript.js`
- [ ] Add `aria-label` to icon-only buttons (9+)
- [ ] Lightbox keyboard navigation (arrow keys)
- [ ] Color contrast audit (`text-white/40` on dark bg)
- [ ] Skip-to-main-content link
- [ ] Increase test coverage to 70%+

## Backend

- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add backend tests (PHPUnit)
- [ ] Add cron job for collection expiration cleanup
- [ ] Add collection password set/update endpoint
- [ ] Add promotional photo reorder endpoint (PATCH)

## Unfinished Features

- [ ] ~~Stripe payments~~ (skipped — separate milestone)
- [ ] SharePage password prompt UI (backend ready, i18n keys exist)
- [ ] Download analytics API endpoint
- [ ] Bulk operations (multi-delete photos, multi-status change)
- [ ] ZIP download button in DeliveryPage UI

## Database

- [ ] Clean up commented-out migration SQL at bottom of `database_schema.sql`
- [ ] Document DOWNLOADED status intentional restriction (auto-only)
- [ ] Document PromotionalPhoto FK removal rationale
