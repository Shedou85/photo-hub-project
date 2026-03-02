# Photo Hub — TODO

Updated: 2026-03-02. All v3.0 redesign phases complete. This tracks remaining work.

---

## P0 — Stripe Payment Integration (Critical for Monetization)

The plan system is fully defined but payments aren't connected. Schema ready, UI ready, no SDK.

- [ ] Install `stripe/stripe-php` SDK via Composer
- [ ] Create `.env` keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Create Stripe products/prices for STANDARD ($9/mo) and PRO ($19/mo) plans
- [ ] Backend: `POST /payments/checkout-session` — create Stripe Checkout session for plan upgrade
- [ ] Backend: `POST /webhooks/stripe` — handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Backend: `POST /payments/customer-portal` — generate Stripe Customer Portal session for managing subscriptions
- [ ] Backend: auto-set `User.stripeCustomerId` on first checkout
- [ ] Backend: update `User.plan`, `subscriptionStatus`, `subscriptionEndsAt` on webhook events
- [ ] Backend: handle subscription cancellation → downgrade plan, set `planDowngradedAt`
- [ ] Frontend: wire PaymentsPage upgrade buttons to Stripe Checkout redirect
- [ ] Frontend: handle success/cancel URL redirects from Stripe
- [ ] Frontend: add Customer Portal link on PaymentsPage for active subscribers
- [ ] Frontend: show subscription status (active, canceling, expired) on ProfilePage/PaymentsPage
- [ ] Test: FREE_TRIAL → STANDARD upgrade flow
- [ ] Test: FREE_TRIAL → PRO upgrade flow
- [ ] Test: STANDARD → PRO upgrade
- [ ] Test: subscription cancellation + downgrade
- [ ] Test: webhook signature verification
- [ ] Add i18n keys for payment-related strings (LT/EN/RU)

## P0 — Collection Password (Share Page)

Currently clients can view and download collection photos without any restrictions when they have the share/delivery link. Need to add optional password protection so photographers can control access.

- [ ] SharePage: password prompt UI when collection has password set
- [ ] DeliveryPage: consider adding optional password protection (currently token-only)
- [ ] Rate limiting on password attempts (already exists for share, verify for delivery)

## P1 — Email Notifications for Workflow Events

PHPMailer is installed and working (verification + password reset). Add workflow triggers.

- [ ] Email to photographer when client submits selections (SELECTING → REVIEWING)
- [ ] Email to photographer when client downloads photos (first download)
- [ ] Consider: email to client when delivery is ready (photographer triggers DELIVERED)
- [ ] Add email notification preferences to ProfilePage (opt-in/opt-out)
- [ ] Add i18n email templates (LT/EN/RU)

## P1 — Backend Tests (PHPUnit)

No backend test coverage. Target: key endpoints and helpers.

- [ ] Set up PHPUnit configuration (`phpunit.xml`)
- [ ] Test auth endpoints: login, register, logout, /auth/me
- [ ] Test collection CRUD: create, read, update, delete
- [ ] Test collection status transitions: DRAFT → SELECTING → REVIEWING → DELIVERED
- [ ] Test share endpoint: password verification, rate limiting
- [ ] Test delivery endpoint: token validation, expiration check
- [ ] Test download tracking: deduplication, Download table entries
- [ ] Test admin auth guard: non-admin gets 403
- [ ] Test rate limiter helper
- [ ] Test R2 helper (mock AWS SDK)

## P2 — Frontend Test Coverage

Current: 13 Vitest tests. Target: 70%+.

- [ ] Test AuthContext: login/logout/session restore
- [ ] Test api.js: CSRF token handling, retry logic, error responses
- [ ] Test phase components: DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase
- [ ] Test useCollectionData hook
- [ ] Test usePhotoUpload hook
- [ ] Test SharePage: password flow, selection labels, submission
- [ ] Test DeliveryPage: download buttons, ZIP download
- [ ] Increase Playwright E2E coverage (currently 3 suites)

## P2 — Collection Expiration Automation

`expiresAt` field exists and is checked on access, but no automated cleanup.

- [ ] Cron job / scheduled task to find expired collections
- [ ] Auto-archive or delete expired collections (decide policy)
- [ ] Auto-cleanup R2 storage for expired collections
- [ ] Email reminder to photographer X days before expiration
- [ ] Email reminder to client X days before expiration (if email available)

## P2 — Selection Quota Enforcement

Photographer can't limit how many photos client selects.

- [ ] Add `selectionLimit` field to Collection table
- [ ] Backend: enforce limit in POST /share/{shareId}/selections
- [ ] Frontend: show "X of Y selected" counter on SharePage
- [ ] Frontend: disable selection buttons when limit reached
- [ ] Add i18n keys (LT/EN/RU)

## P3 — API Documentation

No formal API docs.

- [ ] Create OpenAPI/Swagger spec for all 30+ endpoints
- [ ] Document request/response schemas
- [ ] Document authentication requirements per endpoint
- [ ] Consider auto-generating from PHP route annotations

## P3 — Minor Improvements

- [ ] CSP header — security hardening
- [ ] Dropdown arrow key navigation (language switchers) — accessibility
- [ ] Bulk operations (multi-delete photos, multi-status change collections)
- [ ] CDN integration for R2 downloads (direct R2 URLs instead of PHP proxy)
- [ ] Per-photo client notes / editing instructions
- [ ] Multiple ZIP size options (full/web resolution)

---

## Completed (Archive)

### v3.0 Redesign (16 phases — ALL DONE)
- [x] Dark theme across all authenticated pages
- [x] Responsive layout (MainLayout + MobileLayout at 768px)
- [x] Phase components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase)
- [x] Primitive components (Button, Card, Input, PhotoCard, UploadZone, SelectionBorder)
- [x] PRO features (watermarked previews, custom branding, drag-and-drop reorder)
- [x] Cloudflare R2 storage migration
- [x] Email infrastructure (PHPMailer — verification + password reset)
- [x] Admin subsystem (stats, users, collections, audit log, download stats)
- [x] Google OAuth
- [x] Auto-cleanup originals 7 days after delivery
- [x] Session expired modal
- [x] Rate limiting (login, register, forgot-password, share password)
- [x] Collection status lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED → ARCHIVED)

### Post-Audit Fixes (2026-02-26)
- [x] Sync database_schema.sql
- [x] 404 catch-all route + NotFoundPage
- [x] Rate limiting on delivery endpoints
- [x] Collection expiration checking
- [x] Accessibility fixes (aria-labels, keyboard nav, skip-to-content, form validation)
- [x] Color contrast audit
- [x] Dead code removal
- [x] Download analytics endpoint
- [x] Promotional photo reorder endpoint
- [x] Database documentation cleanup
