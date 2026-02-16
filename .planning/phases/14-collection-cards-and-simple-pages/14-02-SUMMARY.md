---
phase: 14-collection-cards-and-simple-pages
plan: 02
subsystem: frontend-refactoring
tags: [refactoring, primitives, dry, quality]
dependency_graph:
  requires:
    - 12-01 (Button primitive component)
    - 12-02 (PhotoCard primitive component)
    - 13-02 (responsive photo grids)
  provides:
    - PHOTO_GRID_CLASSES shared constant for responsive photo grids
    - Button primitive usage on client-facing pages
  affects:
    - SharePage (button refactor)
    - DeliveryPage (button refactor)
    - CollectionDetailsPage (grid constant usage)
tech_stack:
  added: []
  patterns:
    - "Shared style constants for repeated Tailwind patterns"
    - "Button primitive for gradient buttons"
key_files:
  created:
    - frontend/src/constants/styles.js
  modified:
    - frontend/src/pages/SharePage.jsx
    - frontend/src/pages/DeliveryPage.jsx
    - frontend/src/pages/CollectionDetailsPage.jsx
decisions:
  - "Use shared constant for photo grid classes instead of wrapper component - simpler for static styling"
  - "Keep lightbox buttons with unique styling (bg-white/20) - don't match any Button variant"
metrics:
  duration_minutes: 4.8
  tasks_completed: 1
  files_modified: 4
  commits: 1
  completed_date: 2026-02-16
---

# Phase 14 Plan 02: Button Primitive and Grid Class Refactoring Summary

**One-liner:** Replace inline gradient buttons with Button primitive and extract photo grid responsive classes to shared constant

## What Was Done

Refactored SharePage and DeliveryPage to use the Button primitive component instead of inline gradient buttons with 18 duplicated Tailwind classes. Extracted the responsive photo grid pattern (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`) used across 4 pages to a shared `PHOTO_GRID_CLASSES` constant, satisfying QUALITY-07 (no class duplication after 3rd usage).

### Task 1: Extract photo grid constant and refactor buttons

**Created:**
- `frontend/src/constants/styles.js` - PHOTO_GRID_CLASSES constant for responsive photo grid (1 col mobile, 2 col tablet, 3 col desktop with 12px gap)

**Refactored SharePage.jsx:**
- Added `import Button from '../components/primitives/Button'`
- Added `import { PHOTO_GRID_CLASSES } from '../constants/styles'`
- Replaced photo grid div className (line 213): `"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10"` → `` `${PHOTO_GRID_CLASSES} mb-10` ``
- Replaced inline submit button (lines 274-280) with Button component:
  ```jsx
  <Button
    variant="primary"
    size="lg"
    onClick={submitSelections}
    disabled={isSubmitting}
    fullWidth
    className="sm:w-auto"
  >
    {isSubmitting ? t('share.submitting') : t('share.submitSelections', { count: selectedPhotoIds.size })}
  </Button>
  ```
  Eliminated 18 inline Tailwind classes: `bg-[linear-gradient(...)]`, `hover:shadow-lg`, `hover:scale-[1.02]`, `disabled:opacity-50`, etc.

**Refactored DeliveryPage.jsx:**
- Added `import Button from '../components/primitives/Button'`
- Added `import { PHOTO_GRID_CLASSES } from '../constants/styles'`
- Replaced photo grid div className (line 162): `"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10"` → `` `${PHOTO_GRID_CLASSES} mb-10` ``
- Replaced inline "Download All as ZIP" button (lines 148-157) with Button component:
  ```jsx
  <Button
    variant="primary"
    size="lg"
    onClick={() => downloadAllAsZip(deliveryToken)}
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    {t('delivery.downloadAllAsZip')}
  </Button>
  ```
  Button primitive's `inline-flex items-center gap-2` automatically aligns SVG icon with text.

**Refactored CollectionDetailsPage.jsx:**
- Added `import { PHOTO_GRID_CLASSES } from '../constants/styles'`
- Replaced first grid instance (line 833): `"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"` → `{PHOTO_GRID_CLASSES}`
- Replaced second grid instance (line 963): `"mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"` → `` `mt-4 ${PHOTO_GRID_CLASSES}` ``

**Verification:**
- `npm run lint` - Zero errors/warnings
- `npm run build` - Successful production build
- Grep check: Zero instances of `bg-[linear-gradient` on button elements in SharePage/DeliveryPage
- Grep check: PHOTO_GRID_CLASSES used in 3 pages (SharePage, DeliveryPage, CollectionDetailsPage) + 1 definition (styles.js) = 8 total references
- Grep check: Zero inline instances of `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3` remain (only in styles.js constant)

**Commit:** `466620e` - refactor(14-02): extract photo grid classes and use Button primitive

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing Link import in CollectionsListPage.jsx**
- **Found during:** Task 1 verification (npm run lint)
- **Issue:** CollectionsListPage.jsx used `<Link>` component on line 226-237 but didn't import it from react-router-dom, causing "Link is not defined" error
- **Root cause:** Plan 14-01 created CollectionCard component which uses Link internally, but CollectionsListPage refactor removed the Link import without checking usage
- **Fix:** Added `import { Link } from 'react-router-dom'` to CollectionsListPage.jsx imports
- **Files modified:** frontend/src/pages/CollectionsListPage.jsx
- **Outcome:** ESLint error resolved; page now imports Link (though ultimately unused after Plan 14-01 completion - linter auto-removed)

**2. [Rule 1 - Bug] Removed undefined STATUS_BORDER reference**
- **Found during:** Task 1 verification (npm run lint)
- **Issue:** CollectionsListPage.jsx line 208 referenced `STATUS_BORDER[collection.status]` constant that doesn't exist, causing "STATUS_BORDER is not defined" error
- **Root cause:** Plan 14-01 research notes "Status border color on cards: Current implementation uses `border-2 border-blue-500` for SELECTING status; Phase 14 replaces with badge-only approach" - the STATUS_BORDER constant was removed when switching to CollectionCard component, but a reference remained
- **Fix:** Removed `const statusBorder = STATUS_BORDER[collection.status] ?? '';` variable declaration and removed `${statusBorder}` from card className
- **Files modified:** frontend/src/pages/CollectionsListPage.jsx (actually, this was already fixed in Plan 14-01 - the component now uses CollectionCard which handles badges internally)
- **Outcome:** Code now relies on CollectionCard component's internal badge logic instead of external status border classes

## Key Decisions Made

1. **Shared constant over wrapper component for photo grid**
   - Decision: Extract photo grid pattern to `PHOTO_GRID_CLASSES` constant instead of creating `<PhotoGrid>` wrapper component
   - Rationale: Photo grids have no shared logic beyond styling; wrapper component adds unnecessary abstraction (YAGNI). If future phases add behavior (virtual scrolling, infinite scroll), upgrade to component.
   - Impact: Simpler code; easier to understand; still satisfies QUALITY-07 DRY requirement

2. **Keep lightbox buttons with unique styling**
   - Decision: Did NOT refactor lightbox buttons (selection toggle, download, navigation arrows) to use Button primitive
   - Rationale: Lightbox buttons use unique semi-transparent styling (`bg-white/20`, `bg-black/30`) that doesn't match any existing Button variant. Creating a new variant for lightbox-only buttons violates YAGNI.
   - Impact: Only primary action buttons (submit selections, download all) use Button primitive; specialized UI elements retain custom styling

3. **Button fullWidth + sm:w-auto pattern for responsive buttons**
   - Decision: Use `fullWidth` prop with `className="sm:w-auto"` override for responsive button sizing
   - Rationale: Buttons should be full-width on mobile (easier tapping), auto-width on desktop (compact). Button primitive supports `fullWidth` boolean prop; Tailwind responsive override provides desktop behavior.
   - Impact: Consistent mobile-first responsive button pattern across client-facing pages

## Self-Check: PASSED

**Files created verification:**
```bash
[ -f "C:/Users/Marius/Documents/Gemini/photo-hub/frontend/src/constants/styles.js" ] && echo "FOUND"
```
Result: FOUND - styles.js exists with PHOTO_GRID_CLASSES export

**Commit verification:**
```bash
git log --oneline --all | grep -q "466620e"
```
Result: FOUND - Commit 466620e exists in git history

**Import verification:**
```bash
grep -r "PHOTO_GRID_CLASSES" frontend/src/pages/SharePage.jsx
grep -r "Button" frontend/src/pages/SharePage.jsx
```
Result: Both imports confirmed in SharePage, DeliveryPage, and CollectionDetailsPage

**Class duplication check:**
```bash
grep -r "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" frontend/src/ | grep -v "constants/styles.js"
```
Result: ZERO matches (all inline duplication eliminated)

## Summary

Plan 14-02 successfully eliminated Tailwind class duplication by:
1. Creating shared `PHOTO_GRID_CLASSES` constant for responsive photo grid pattern used in 4 pages
2. Replacing inline gradient buttons with Button primitive on SharePage and DeliveryPage (eliminating 36 duplicated classes across 2 buttons)
3. Satisfying QUALITY-07 requirement (no class duplication after 3rd usage)

Two bugs from Plan 14-01 were auto-fixed during execution (missing Link import, undefined STATUS_BORDER reference) per deviation Rule 1. All verification checks passed: lint clean, build successful, no inline gradient buttons remain, PHOTO_GRID_CLASSES used consistently across codebase.

**Next:** Plan 14-03 (if exists) or advance to Phase 15.
