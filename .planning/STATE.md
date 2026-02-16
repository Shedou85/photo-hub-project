# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.
**Current focus:** Phase 16: Testing & QA

## Current Position

Phase: 16 of 16 (Testing & QA)
Plan: 3 of TBD in current phase
Status: In Progress
Last activity: 2026-02-16 — Completed 16-03 (Playwright E2E Testing) - 80 tests across 5 browser projects, multi-locale visual regression, cross-browser responsive layouts, WCAG accessibility scanning

Progress: [███████████████████░] 94% (15 of 16 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 30
- Average duration: 5.86 min
- Total execution time: 3.84 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-photo-upload | 3/3 | 32 min | 10.7 min |
| 02-sharing-and-status | 2/2 | 30 min | 15.0 min |
| 03-client-gallery-and-selection | 2/2 | 27 min | 13.5 min |
| 04-review-and-delivery | 2/2 | 55 min | 27.5 min |
| 05-delivery-infrastructure | 2/2 | 3.25 min | 1.6 min |
| 06-server-side-zip-downloads | 1/1 | 2 min | 2.0 min |
| 07-individual-photo-downloads | 1/1 | 2.6 min | 2.6 min |
| 08-client-delivery-interface | 1/1 | 3.15 min | 3.15 min |
| 09-photographer-dashboard-integration | 1/1 | 2.47 min | 2.47 min |
| 10-ui-polish-and-refinement | 1/1 | 3.27 min | 3.27 min |
| 11-design-system-foundation | 3/3 | 16.07 min | 5.4 min |
| 12-primitive-component-library | 2/2 | 3.41 min | 1.7 min |
| 13-responsive-layout-refactor | 2/2 | 5.33 min | 2.7 min |
| 14-collection-cards-and-simple-pages | 2/2 | 8.97 min | 4.5 min |
| 15-workflow-enhancement | 2/2 | 5.37 min | 2.69 min |
| 16-testing-and-qa | 3/? | 14.57 min | 4.86 min (in progress) |

**Recent Trend:**
- Last 5 plans: 15-02 (2.85 min), 16-02 (2.25 min), 16-01 (5.0 min), 16-03 (7.32 min)
- Trend: Phase 16 plans scale with test scope — infrastructure (2.25 min) < unit tests (5.0 min) < E2E tests (7.32 min)

*Updated after 16-01 completion*
| Phase 16 P01 | 5.0 | 3 tasks | 10 files |
| Phase 16 P02 | 2.25 | 2 tasks | 4 files |
| Phase 16 P03 | 7.32 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Progressive disclosure UI patterns (v2.0) — Dropzone hides after first upload, workflow-phase button grouping - Good, shipped v2.0
- Stay on Tailwind v3 for v3.0 redesign — Defer v4 migration to separate milestone post-v3.0 to reduce risk during redesign
- Major Third typography scale (1.250 ratio) for balanced hierarchy (11-01)
- Gradients remain as arbitrary values - Tailwind v3 has no native multi-stop gradient token system (11-01)
- No custom spacing tokens - Tailwind default spacing scale satisfies 8pt grid requirement (11-01)
- Design tokens in theme.extend not theme override to preserve Tailwind defaults (11-01)
- Use rounded (DEFAULT) for card containers and rounded-sm for inputs/buttons (11-02)
- Map w-52px/h-52px to w-13/h-13 - exact Tailwind utility (13 * 4px = 52px) (11-02)
- Keep text-[10px] for status badges - deliberate size between xs(12px) and nothing (11-02)
- Button type defaults to 'button' not 'submit' to prevent accidental form submission (12-01)
- Use clsx for className composition in primitive components (12-01)
- [Phase 12-primitive-component-library]: PhotoCard uses React.memo for grid performance to prevent re-renders in 100+ photo collections
- [Phase 12-primitive-component-library]: Compound component pattern (PhotoCard.Actions, PhotoCard.Action) for flexible hover overlays without prop drilling
- [Phase 13-responsive-layout-refactor]: 56x56px touch targets in bottom nav exceed WCAG 48px minimum for better mobile UX
- [Phase 13-responsive-layout-refactor]: Use 24px SVG icons instead of emoji for cross-platform consistency in mobile navigation
- [Phase 13-responsive-layout-refactor]: 768px breakpoint (Tailwind 'md') for mobile/desktop split matches tablet landscape transition
- [Phase 13-responsive-layout-refactor]: Remove page-level padding from authenticated pages - MainLayout/MobileLayout provide padding (DRY principle)
- [Phase 13-responsive-layout-refactor]: Client-facing pages (SharePage, DeliveryPage) keep max-w-[720px] for focused photo browsing vs photographer dashboard max-w-6xl for wider layouts
- [Phase 13-responsive-layout-refactor]: Increase photo grid gap from gap-2 to gap-3 for better breathing room with 1-col mobile layout
- [Phase 14]: CollectionCard uses rounded-[16px] corners (larger than standard rounded-[10px]) to match prominent card scale
- [Phase 14]: Badge colored dots enhance status hierarchy without adding text clutter (DRAFT shows no badge)
- [Phase 14-02]: Shared constants for repeated Tailwind patterns (PHOTO_GRID_CLASSES) preferred over wrapper components when no logic needed
- [Phase 14-02]: Button primitive fullWidth + sm:w-auto pattern for responsive sizing (mobile full-width, desktop auto)
- [Phase 15-01]: Navigate immediately after collection creation (WORKFLOW-04) — reduces clicks, photographer lands directly on collection page to start uploading
- [Phase 15-01]: Hide 'Start client selection' button when photos.length === 0 (WORKFLOW-03) — prevents invalid state (client sees empty gallery)
- [Phase 15-01]: Next-step guidance as gray text below header (WORKFLOW-06) — non-intrusive workflow guidance without modal/tooltip complexity
- [Phase 15-01]: State-specific empty states (WORKFLOW-07) — contextual messaging per collection status instead of generic "No photos yet"
- [Phase 15-02]: Use IIFE for inline PhaseComponent resolution in JSX to keep lookup logic colocated with rendering
- [Phase 15-02]: ReviewingPhase uses primary button variant instead of custom green gradient for design system consistency
- [Phase 15-02]: Underscore prefix for unused collection prop in phase components for future extensibility
- [Phase 16-01]: Custom render utility wraps with i18n + Router providers (not AuthProvider) — components under ProtectedRoute don't need it in tests, AuthContext tests need to test provider itself
- [Phase 16-01]: Use semantic queries (getByRole, getByText) over getByTestId for better accessibility alignment in tests
- [Phase 16-01]: AuthContext localStorage parsing wrapped in try-catch to handle corrupted data gracefully (bug fix discovered during test writing)
- [Phase 16-02]: Use rollup-plugin-visualizer for bundle analysis — native Rollup integration with Vite, generates interactive treemap HTML
- [Phase 16-02]: Do not install @lhci/cli locally (200MB+) — recommend global install for on-demand Lighthouse auditing
- [Phase 16-02]: CSS bundle budget 50KB gzipped (QUALITY-01) — current usage 7.64 KB leaves 42 KB headroom for future styling
- [Phase 16-03]: Run E2E tests against production (pixelforge.pro) not local dev — tests real-world deployment conditions
- [Phase 16-03]: Use localStorage i18nextLng for locale switching in tests — matches how i18next detects locale
- [Phase 16-03]: Skip accessibility tests on non-chromium browsers — axe-core results browser-independent, avoid duplicate scans
- [Phase 16-03]: Test 4 viewport sizes (375/768/1920/2560px) — covers mobile/tablet/desktop/ultrawide per TEST-05
- [Phase 16-03]: maxDiffPixels 100 for screenshot comparison — tolerates minor anti-aliasing differences

### Pending Todos

- Verify GD WebP support on Hostinger: `curl https://api.pixelforge.pro/backend/gd-test.php`
- Delete `backend/gd-test.php` after WebP support confirmed on Hostinger
- Measure baseline task completion times (upload → share, create collection) before starting Phase 15 — required to validate redesign doesn't slow users down

### Blockers/Concerns

**From v3.0 research:**
- Photographer workflow muscle memory: Need to measure current task completion times (upload → share, create collection) before any changes to validate redesign doesn't slow users down
- Russian translation overflow: Design with 30% width buffer for buttons, test in all three locales (LT/EN/RU) during page refactors (Phase 14-15)

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 16-03 (Playwright E2E Testing) - 80 E2E tests across 5 browser projects with visual regression and accessibility scanning
Resume file: None
Next step: Continue Phase 16 (Testing & QA) - Plan 16-04 or final integration testing
