---
phase: 14-collection-cards-and-simple-pages
plan: 01
subsystem: ui-components
tags:
  - primitives
  - collection-cards
  - badge-enhancement
  - responsive-design
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      artifact: Badge.jsx
      reason: Extended with showDot prop for colored dot prefix
    - phase: 12
      plan: 01
      artifact: Button.jsx
      reason: Used for Share/Delete actions with consistent styling
  provides:
    - artifact: CollectionCard.jsx
      capability: Reusable collection card with edge-to-edge cover images and gradient overlay
      consumers:
        - CollectionsListPage.jsx
    - artifact: Badge with colored dot
      capability: Status badges with colored dot prefix for visual hierarchy
      consumers:
        - CollectionCard.jsx
  affects:
    - component: CollectionsListPage
      change: Replaced inline card markup with CollectionCard primitive
      impact: Reduced component LOC by ~50 lines, improved maintainability
tech_stack:
  added:
    - component: CollectionCard
      type: primitive
      features:
        - Edge-to-edge cover images with aspect-[3/2] ratio
        - Gradient overlay (black/70 to transparent) for text legibility
        - Hover elevation with shadow-lg and -translate-y-1
        - Cover image zoom on hover (scale-105)
        - Status badge with colored dot in top-right corner
        - Actions footer with flexible ReactNode slot
  patterns:
    - pattern: Gradient overlays for text on images
      implementation: bg-gradient-to-t from-black/70 via-black/20 to-transparent
      benefit: Ensures text legibility on any cover image
    - pattern: Compound hover effects
      implementation: Group hover triggers both shadow-lg + translate-y and image scale-105
      benefit: Cohesive interactive feedback
    - pattern: Flexible action slot
      implementation: actions prop accepts ReactNode for custom button layouts
      benefit: Supports varied action patterns across different contexts
key_files:
  created:
    - path: frontend/src/components/primitives/CollectionCard.jsx
      lines: 102
      purpose: Collection card primitive with cover image, gradient overlay, and actions
  modified:
    - path: frontend/src/components/primitives/Badge.jsx
      lines_changed: +13
      changes:
        - Added showDot prop with default false for backward compatibility
        - Changed baseClasses from inline-block to inline-flex for dot layout
        - Added dotColors mapping for status-specific colored dots
    - path: frontend/src/pages/CollectionsListPage.jsx
      lines_changed: -79 / +34
      changes:
        - Removed STATUS_BORDER constant (status via Badge colored dot now)
        - Removed inline card markup (replaced with CollectionCard)
        - Removed rotate-[0.5deg] tilt animations
        - Replaced inline submit button with Button primitive
        - Added CollectionCard and Button imports
    - path: frontend/src/locales/en.json
      lines_changed: +2
      changes:
        - Added collections.photosCount_one and collections.photosCount_other
    - path: frontend/src/locales/lt.json
      lines_changed: +3
      changes:
        - Added collections.photosCount_one, photosCount_few, photosCount_other
    - path: frontend/src/locales/ru.json
      lines_changed: +3
      changes:
        - Added collections.photosCount_one, photosCount_few, photosCount_other
decisions:
  - decision: Use gradient overlay instead of solid overlay for text on images
    rationale: Gradient from black/70 to transparent preserves top portion of cover image while ensuring bottom text legibility
    alternatives:
      - Solid black overlay: Too heavy, obscures entire image
      - No overlay: Text illegible on light images
    outcome: Balanced approach that maintains visual interest and text legibility
  - decision: Rounded-[16px] corners (not rounded-[10px] like other cards)
    rationale: Collection cards are larger and more prominent than other cards in the system, larger radius matches their scale
    alternatives:
      - Use rounded-[10px] for consistency: Too subtle for large card format
      - Use rounded-[20px]: Too soft, reduces visual weight
    outcome: 16px radius provides appropriate visual weight for collection cards
  - decision: No clsx dependency in CollectionCard
    rationale: Component has no conditional class composition beyond status badge (handled by Badge component)
    alternatives:
      - Add clsx for future flexibility: Premature abstraction, no current need
    outcome: Simpler implementation, one less dependency per import
  - decision: Status badge positioned absolute top-3 right-3 with z-10
    rationale: Floats above cover image without disrupting gradient overlay or title layout
    alternatives:
      - Position in actions footer: Separated from collection context, less prominent
      - Overlay at bottom with title: Clutters text area
    outcome: Badge visually prominent, clearly associated with collection, doesn't interfere with title
  - decision: min-h-[48px] touch targets for mobile buttons
    rationale: Exceeds WCAG 2.2 minimum (44px) for better mobile UX, especially for Russian translations with longer text
    alternatives:
      - Use default Button sm size: May be too small for longer translations
      - Increase to 56px: Unnecessarily large for desktop, unbalanced
    outcome: 48px provides comfortable mobile touch targets while remaining proportional on desktop
metrics:
  duration_minutes: 4.17
  tasks_completed: 2
  files_created: 1
  files_modified: 5
  lines_added: 150
  lines_removed: 79
  commits: 2
  completed_date: 2026-02-16
---

# Phase 14 Plan 01: Collection Cards with Edge-to-Edge Covers Summary

**One-liner:** Created CollectionCard primitive with edge-to-edge cover images, gradient overlays, hover elevation, and Badge colored dot enhancement.

## Tasks Completed

| Task | Description | Commit | Key Changes |
|------|-------------|--------|-------------|
| 1 | Create CollectionCard primitive and update Badge with colored dot | 1eb47c3 | Badge.jsx (+13 lines), CollectionCard.jsx (+102 lines) |
| 2 | Refactor CollectionsListPage to use CollectionCard and update i18n | a437a2b | CollectionsListPage.jsx (-79/+34), en.json (+2), lt.json (+3), ru.json (+3) |

## What Was Built

### CollectionCard Primitive

Created a reusable collection card component with:

- **Edge-to-edge cover images** with aspect-[3/2] ratio (no padding around image)
- **Gradient overlay** (`bg-gradient-to-t from-black/70 via-black/20 to-transparent`) for text legibility on any cover image
- **Hover elevation** with shadow-lg and -translate-y-1 transform
- **Cover image zoom** on hover (scale-105 with 300ms transition)
- **Status badge** with colored dot positioned absolutely in top-right corner (only for non-DRAFT statuses)
- **Content overlay** at bottom with title, photo count, and creation date
- **Hover overlay** with "View Collection" prompt centered on dark semi-transparent background
- **Actions footer** with flexible ReactNode slot for custom button layouts

Fallback for collections without cover images: gradient background (blue-to-indigo) with first letter of collection name as large white text.

### Badge Enhancement

Extended Badge component with:

- **showDot prop** (default false) for colored dot prefix
- **Layout change** from inline-block to inline-flex items-center gap-1.5 for dot + text alignment
- **dotColors mapping** for status-specific dot colors:
  - DRAFT: gray-600
  - SELECTING: blue-700
  - REVIEWING: green-700
  - DELIVERED: purple-700
  - DOWNLOADED: purple-800
- **Backward compatible** - existing Badge usage without showDot works unchanged

### CollectionsListPage Refactor

Replaced 79 lines of inline card markup with 34-line CollectionCard usage:

- Removed STATUS_BORDER constant (status now indicated by Badge colored dot)
- Removed rotate-[0.5deg] tilt animations
- Replaced inline submit button with Button primitive
- Added min-h-[48px] touch targets to Share/Delete buttons for mobile accessibility
- Actions use Button variant="secondary" (Share) and variant="danger" (Delete)

### i18n Updates

Added `collections.photosCount` keys to all 3 locale files:

- **English:** photosCount_one / photosCount_other (e.g., "1 photo" / "5 photos")
- **Lithuanian:** photosCount_one / photosCount_few / photosCount_other (Lithuanian has 3 plural forms)
- **Russian:** photosCount_one / photosCount_few / photosCount_other (Russian has 3 plural forms)

All locales already had `collections.viewCollection` key from previous phases.

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **CARDS-01:** Collection cards use edge-to-edge cover images (aspect-[3/2]) with no padding around image ✓
- **CARDS-02:** Gradient overlay (black/70 to transparent) ensures text legibility on cover images ✓
- **CARDS-03:** Collection cards display title, date, photo count (via i18n), and status badge ✓
- **CARDS-04:** Rounded-[16px] corners with hover elevation (shadow-lg + -translate-y-1) ✓
- **CARDS-05:** Status badges show colored dot prefix matching status (DRAFT shows no badge) ✓
- **QUALITY-08:** All new UI strings use t() with keys in en.json, lt.json, ru.json ✓

## Technical Notes

### Gradient Overlay Implementation

The gradient overlay uses three stops:
- `from-black/70` (bottom): Solid enough for white text legibility
- `via-black/20` (middle): Subtle fade
- `to-transparent` (top): Preserves top portion of image

This ensures titles remain legible on any cover image while preserving visual interest in the upper half.

### Hover Interaction Pattern

Collection cards use compound hover effects:
1. Card elevation: `hover:shadow-lg hover:-translate-y-1` on outer div
2. Image zoom: `group-hover:scale-105` on cover image
3. Overlay visibility: `group-hover:opacity-100` on "View Collection" prompt

All transitions use 300ms duration for cohesive animation.

### Status Badge Positioning

Badge is positioned `absolute top-3 right-3 z-10` to:
- Float above cover image without disrupting gradient overlay
- Remain visible during hover state
- Not interfere with title text at bottom
- Be clearly associated with the collection (not the actions)

DRAFT status shows no badge (per CARDS-05 requirement) to reduce visual clutter for work-in-progress collections.

### Touch Target Accessibility

Share and Delete buttons use `min-h-[48px]` (via className passthrough) to exceed WCAG 2.2 minimum (44px). This is especially important for Russian translations, which tend to be longer than English/Lithuanian.

Button component uses `size="sm"` for appropriate padding, but min-height override ensures comfortable mobile tap targets.

## Verification Results

- **ESLint:** ✓ Zero errors/warnings
- **Production build:** ✓ Successful (1.38s)
- **i18n keys:** ✓ photosCount exists in all 3 locales
- **Removed patterns:** ✓ STATUS_BORDER, rotate-[0.5deg], inline badge markup removed
- **Component structure:** ✓ CollectionCard uses Badge and Link imports
- **Backward compatibility:** ✓ Badge without showDot works unchanged

## Self-Check: PASSED

### Created Files
- ✓ frontend/src/components/primitives/CollectionCard.jsx exists

### Modified Files
- ✓ frontend/src/components/primitives/Badge.jsx modified
- ✓ frontend/src/pages/CollectionsListPage.jsx modified
- ✓ frontend/src/locales/en.json modified
- ✓ frontend/src/locales/lt.json modified
- ✓ frontend/src/locales/ru.json modified

### Commits
- ✓ 1eb47c3: feat(14-01): create CollectionCard primitive and add Badge colored dot
- ✓ a437a2b: feat(14-01): refactor CollectionsListPage with CollectionCard primitive

All artifacts verified on disk and in git history.
