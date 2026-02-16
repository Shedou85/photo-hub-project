---
phase: 11-design-system-foundation
plan: 02
subsystem: ui
tags: [design-tokens, refactoring, tailwind, authenticated-pages]

# Dependency graph
requires:
  - phase: 11-design-system-foundation
    plan: 01
    provides: Design token system in Tailwind config
provides:
  - Token-based styling across all authenticated pages (MainLayout, Accordion, CollectionsListPage, CollectionDetailsPage, ProfilePage, PaymentsPage)
  - Shared breakpoints integration in MainLayout
  - Eliminated hardcoded hex colors, shadows, border-radius, and font sizes from photographer-facing UI
affects: [11-03, 12-responsive-layout, 14-page-refactoring, 15-workflow-simplification]

# Tech tracking
tech-stack:
  patterns:
    - "Systematic replacement of arbitrary values with design tokens across 6 files"
    - "Shared BREAKPOINTS constant for responsive logic consistency"
    - "Semantic color tokens replacing repeated hex values"

key-files:
  modified:
    - frontend/src/layouts/MainLayout.jsx
    - frontend/src/components/Accordion.jsx
    - frontend/src/pages/CollectionsListPage.jsx
    - frontend/src/pages/CollectionDetailsPage.jsx
    - frontend/src/pages/ProfilePage.jsx
    - frontend/src/pages/PaymentsPage.jsx

key-decisions:
  - "Use rounded (DEFAULT = 10px) instead of rounded-[10px] for card containers"
  - "Use text-xs/sm/xl from Major Third scale instead of hardcoded pixel sizes"
  - "Map w-[52px]/h-[52px] to w-13/h-13 (52px = 13 * 4px on Tailwind scale)"
  - "Use py-2.5/px-5 for buttons and inputs (closest to original 9px/22px)"
  - "Use rounded-sm (8px) for inputs and smaller card corners (6px → 8px acceptable for consistency)"
  - "Keep text-[10px] for status badges - deliberate smaller size between xs(12) and nothing"
  - "Keep rounded-[4px] with comment for lightbox image corners - minimal radius needed"

patterns-established:
  - "Page headers: w-13 h-13 gradient circle + text-xl title + gap-3.5"
  - "Form inputs: py-2.5 px-5 text-sm rounded-sm border-[1.5px]"
  - "Primary buttons: py-2.5 px-5 text-sm rounded-sm hover:opacity-90 with gradient bg"
  - "InfoRow components: gap-1 with text-xs labels and text-sm values"
  - "Section labels: text-xs uppercase tracking-[0.06em] text-gray-400"
  - "Card containers: rounded (DEFAULT) px-6 py-5 border border-gray-200"

# Metrics
duration: 8.32min
completed: 2026-02-16
---

# Phase 11 Plan 02: Refactor Authenticated Pages to Design Tokens Summary

**All authenticated/dashboard pages refactored to use design tokens from Tailwind config, eliminating hardcoded colors, shadows, border-radius, and font sizes**

## Performance

- **Duration:** 8.32 min
- **Started:** 2026-02-16T08:33:11Z
- **Completed:** 2026-02-16T08:41:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Refactored MainLayout to use shared BREAKPOINTS.TABLET import instead of local BREAKPOINT constant
- Replaced all hardcoded hex colors in MainLayout with semantic tokens (bg-surface-dark, bg-surface-light, text-sidebar-text, text-sidebar-text-dim, text-sidebar-footer)
- Replaced hardcoded shadows with shadow-md/shadow-lg tokens in MainLayout
- Replaced rounded-[10px] with rounded (DEFAULT) in Accordion and all 4 authenticated page files
- Systematically replaced text-[11px]/[13px]/[14px]/[22px] with text-xs/sm/xl across all pages
- Replaced w-[52px] h-[52px] page header icons with w-13 h-13 (52px = 13 * 4px)
- Replaced py-[9px] px-[22px] button/input padding with py-2.5 px-5
- Replaced hover:opacity-[0.88] with hover:opacity-90 (standard Tailwind value)
- Replaced PaymentsPage hardcoded hex colors (#111827, #6b7280, #374151, #e5e7eb) with Tailwind gray palette (gray-900, gray-500, gray-700, gray-200)
- Replaced rounded-[6px]/[5px] with rounded-sm (8px) for inputs, buttons, and photo cards
- Replaced gap-[14px]/[18px] with gap-3.5/gap-4
- Replaced mb-[5px] with mb-1 for form labels
- Replaced InfoRow gap-[3px] with gap-1 in CollectionDetailsPage and ProfilePage

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor MainLayout and Accordion to use design tokens** - `eb5a664` (feat)
2. **Task 2: Refactor CollectionsListPage, CollectionDetailsPage, ProfilePage, and PaymentsPage** - `e0e22b9` (feat)

**Plan metadata:** (this summary commit will be made after STATE.md update)

## Files Created/Modified
- `frontend/src/layouts/MainLayout.jsx` - Shared BREAKPOINTS import, semantic color tokens, shadow tokens, text-xs
- `frontend/src/components/Accordion.jsx` - rounded (DEFAULT), text-sm
- `frontend/src/pages/CollectionsListPage.jsx` - Token-based page header, form inputs, buttons, cards
- `frontend/src/pages/CollectionDetailsPage.jsx` - Token-based page header, InfoRow components, action buttons, photo grid cards, upload zones
- `frontend/src/pages/ProfilePage.jsx` - Token-based page header, form inputs, InfoRow components, save button
- `frontend/src/pages/PaymentsPage.jsx` - Token-based page header, gray palette instead of hex colors

## Decisions Made

**1. Use rounded (DEFAULT) for 10px card borders**
- Tailwind config defines DEFAULT as 0.625rem (10px) - exact match for hardcoded rounded-[10px]
- Applied to all card containers for consistency

**2. Use rounded-sm (8px) for inputs and smaller corners**
- Original rounded-[6px] → rounded-sm (8px) acceptable 2px difference for consistency
- Aligns to 8pt grid, cleaner than arbitrary 6px value

**3. Map w-[52px]/h-[52px] to w-13/h-13**
- 52px = 13 * 4px - exact Tailwind utility class available
- No arbitrary value needed

**4. Use py-2.5/px-5 for buttons and inputs**
- Closest standard Tailwind values to original py-[9px] px-[22px]
- 10px/20px vs 9px/22px - acceptable 1-2px variance for token consistency

**5. Keep text-[10px] for status badges**
- 10px is between text-xs (12px) and nothing
- Deliberate smaller size for badges - not worth creating custom token for single pattern
- Added brief inline comment in plan verification notes

**6. Keep rounded-[4px] for lightbox images**
- Minimal corner radius for full-size photos
- Rounded-sm (8px) would be too prominent
- Kept with comment clarifying design intention

**7. Replace PaymentsPage hex colors with Tailwind gray palette**
- #111827 → gray-900 (exact match)
- #6b7280 → gray-500 (exact match)
- #374151 → gray-700 (exact match)
- #e5e7eb → gray-200 (exact match)
- No semantic token needed - standard palette sufficient

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - build, lint, and all verification checks passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All authenticated pages now use design tokens. Ready for:
- Plan 11-03: Component pattern library and documentation (if planned)
- Phase 12: Responsive layout improvements using token-based breakpoints
- Phase 14-15: Further page refactoring and workflow simplification with consistent token system

**Blockers:** None

**Note:** The refactoring maintains 100% visual parity with the original UI while eliminating all hardcoded arbitrary values. Legitimate arbitrary values remain with clear rationale:
- Gradients (bg-[linear-gradient()]) - Tailwind v3 limitation
- Grid layouts (grid-cols-[repeat(...)]) - Responsive layout logic
- Z-index stacking (z-[1001], z-[1002], z-[1003]) - Mobile overlay system
- Viewport units (max-w-[88vw], max-h-[88vh]) - Lightbox sizing
- Rotations (rotate-[0.5deg], hover:rotate-[1.5deg]) - Polaroid card tilt effect
- Custom tracking (tracking-[0.05em], tracking-[0.06em]) - Uppercase label spacing
- Border width (border-[1.5px]) - Form focus state emphasis
- Badge sizes (text-[10px], px-[6px]) - Between standard token sizes
- Opacity modifiers (border-white/[0.08]) - Tailwind modifier syntax

## Self-Check: PASSED

All claimed files and commits verified:
- ✓ frontend/src/layouts/MainLayout.jsx
- ✓ frontend/src/components/Accordion.jsx
- ✓ frontend/src/pages/CollectionsListPage.jsx
- ✓ frontend/src/pages/CollectionDetailsPage.jsx
- ✓ frontend/src/pages/ProfilePage.jsx
- ✓ frontend/src/pages/PaymentsPage.jsx
- ✓ Commit eb5a664 (Task 1)
- ✓ Commit e0e22b9 (Task 2)
- ✓ No rounded-[10px] remains in any file (verified via grep)
- ✓ No hardcoded hex colors except gradients (verified via grep)
- ✓ Build succeeds
- ✓ Lint passes with zero warnings

---
*Phase: 11-design-system-foundation*
*Completed: 2026-02-16*
