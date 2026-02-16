---
phase: 15
plan: 02
subsystem: workflow-ui
tags: [component-extraction, object-lookup-pattern, primitive-usage, code-reduction]
dependency_graph:
  requires:
    - "12-01 (Button primitive)"
    - "12-02 (Badge primitive)"
    - "15-01 (Workflow UX patterns)"
  provides:
    - "DraftPhase component for DRAFT status workflow actions"
    - "SelectingPhase component for SELECTING status workflow actions"
    - "ReviewingPhase component for REVIEWING status workflow actions"
    - "DeliveredPhase component for DELIVERED/DOWNLOADED status workflow actions"
    - "WORKFLOW_PHASES object lookup pattern in CollectionDetailsPage"
  affects:
    - "frontend/src/pages/CollectionDetailsPage.jsx (refactored to use extracted components)"
tech_stack:
  added: []
  patterns:
    - "Object lookup for component selection (WORKFLOW-09)"
    - "IIFE for inline component resolution in JSX"
    - "Presentational components with handler props"
    - "Underscore prefix for intentionally unused parameters"
key_files:
  created:
    - "frontend/src/components/collection/DraftPhase.jsx"
    - "frontend/src/components/collection/SelectingPhase.jsx"
    - "frontend/src/components/collection/ReviewingPhase.jsx"
    - "frontend/src/components/collection/DeliveredPhase.jsx"
  modified:
    - "frontend/src/pages/CollectionDetailsPage.jsx"
decisions:
  - summary: "Use IIFE for inline PhaseComponent resolution in JSX"
    rationale: "Avoids adding extra variable in render body, keeps lookup logic colocated with rendering"
  - summary: "ReviewingPhase uses primary button variant for Mark as Delivered"
    rationale: "Button primitive uses standard blue/indigo gradient instead of old custom green gradient - design system consistency over status-specific color"
  - summary: "Underscore prefix for unused collection prop in phase components"
    rationale: "Components receive collection for future extensibility but don't currently use it - underscore satisfies ESLint no-unused-vars rule"
  - summary: "DeliveredPhase serves both DELIVERED and DOWNLOADED statuses"
    rationale: "UI is identical per Phase 15 research - same actions available in both states"
metrics:
  duration: "2m 51s"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
  lines_added: 213
  lines_removed: 88
  net_change: "+125 lines (components), -52 lines (CollectionDetailsPage)"
  commits: 2
completed: 2026-02-16
---

# Phase 15 Plan 02: Extract Workflow Phase Components Summary

Extract workflow phase UI into dedicated components with object lookup pattern for status-based rendering.

**One-liner:** Extracted DraftPhase, SelectingPhase, ReviewingPhase, and DeliveredPhase components from CollectionDetailsPage using WORKFLOW_PHASES object lookup, reducing page from 1,056 to 1,004 lines while standardizing Button/Badge primitive usage.

## What Was Built

### Created Components

**1. DraftPhase (frontend/src/components/collection/DraftPhase.jsx)**
- DRAFT status workflow actions
- Primary action: Copy share link button with link icon
- Secondary action: Start client selection button (conditional on photoCount > 0 per WORKFLOW-03)
- Uses Button primitive from Phase 12
- JSDoc documentation for all props

**2. SelectingPhase (frontend/src/components/collection/SelectingPhase.jsx)**
- SELECTING status workflow actions
- Primary action: Copy share link button with link icon
- Simplest phase component - single action only
- Uses Button primitive

**3. ReviewingPhase (frontend/src/components/collection/ReviewingPhase.jsx)**
- REVIEWING status workflow actions
- Two sections: Share phase (reference) and Review phase (primary)
- Share section: Secondary copy share link button
- Review section: Primary "Mark as Delivered" button (disabled when editedPhotosCount === 0)
- Uses space-y-4 for vertical section spacing
- Button primitive handles disabled state styling

**4. DeliveredPhase (frontend/src/components/collection/DeliveredPhase.jsx)**
- DELIVERED/DOWNLOADED status workflow actions (same UI for both)
- Two sections: Share phase (reference) and Deliver phase (primary)
- Share section: Secondary copy share link button
- Deliver section: Primary copy delivery link button (conditional on collection.deliveryToken)
- Uses space-y-4 for vertical section spacing

### Refactored CollectionDetailsPage

**Object Lookup Pattern (WORKFLOW_PHASES)**
```javascript
const WORKFLOW_PHASES = {
  DRAFT: DraftPhase,
  SELECTING: SelectingPhase,
  REVIEWING: ReviewingPhase,
  DELIVERED: DeliveredPhase,
  DOWNLOADED: DeliveredPhase,
};
```

Placed outside component function for reusability and performance (not recreated on every render).

**Component Resolution with IIFE**
Replaced 75-line nested conditional JSX block (lines 647-721) with 12-line IIFE:
```jsx
{(() => {
  const PhaseComponent = WORKFLOW_PHASES[collection.status];
  if (!PhaseComponent) return null;
  return (
    <div className="bg-white border border-gray-200 rounded px-6 py-5 mb-5">
      <PhaseComponent
        collection={collection}
        photoCount={photos.length}
        onCopyShareLink={handleCopyShareLink}
        onCopyDeliveryLink={handleCopyDeliveryLink}
        onStartSelecting={handleStartSelecting}
        onMarkAsDelivered={handleMarkAsDelivered}
        editedPhotosCount={editedPhotos.length}
      />
    </div>
  );
})()}
```

**Primitive Component Usage**
1. Badge primitive for status badge in header:
   - Before: 9-line nested ternary with inline color classes
   - After: 3-line Badge component with status prop

2. Button primitive for "Add More Photos":
   - Before: Inline button with manual hover/transition classes
   - After: Button variant="secondary" with consistent design system styling

3. Upload zone animation: Updated from `transition-colors` to `transition-all duration-300` for animation budget compliance (QUALITY-06)

**Code Reduction**
- Before: 1,056 lines
- After: 1,004 lines
- Net reduction: 52 lines in CollectionDetailsPage
- Replaced 88 lines of inline JSX with 36 lines using extracted components

## Deviations from Plan

None - plan executed exactly as written. All tasks completed, all verification criteria met, production build successful.

## Testing & Verification

**Lint Check**
```bash
npm run lint
# ✓ Zero errors, zero warnings
```

**Production Build**
```bash
npm run build
# ✓ Successfully built in 1.47s
# ✓ Output: 380.08 kB JS (gzip: 112.68 kB)
```

**Code Verification**
- ✓ WORKFLOW_PHASES object exists and maps all 5 statuses
- ✓ Badge import present in CollectionDetailsPage
- ✓ Button import present in CollectionDetailsPage
- ✓ All 4 phase components import Button from ../primitives/Button
- ✓ transition-all duration-300 present on upload zone dropzone div
- ✓ No inline gradient button classes in actions section (only in page header icon)
- ✓ Unused collection props prefixed with underscore to satisfy ESLint

## Key Decisions & Rationale

**1. IIFE vs Variable Assignment**
Used IIFE `{(() => { ... })()}` for inline component resolution instead of computing PhaseComponent in render body.
- **Rationale:** Keeps lookup logic colocated with rendering, avoids adding extra variable in already-large render function, reads clearly as "compute and render this component inline."

**2. Primary Button for Mark as Delivered**
ReviewingPhase uses Button variant="primary" (blue/indigo gradient) instead of the old custom green gradient (`bg-[linear-gradient(135deg,#10b981,#059669)]`).
- **Rationale:** Design system consistency trumps status-specific color. Button primitive provides uniform styling across all CTAs. Green gradient was an outlier introduced in early workflow implementation before primitive components existed.

**3. Underscore Prefix for Unused Props**
Phase components receive `collection` prop but rename to `_collection` since it's not currently used.
- **Rationale:** Future-proofs components for when collection properties (e.g., clientEmail, event name) might be needed in phase UI. Satisfies ESLint no-unused-vars rule with underscore convention. Clear signal: "intentionally unused, reserved for future use."

**4. DeliveredPhase for Both DELIVERED and DOWNLOADED**
Single DeliveredPhase component mapped to both DELIVERED and DOWNLOADED statuses in WORKFLOW_PHASES.
- **Rationale:** Per Phase 15-01 research (WORKFLOW-12), UI is identical - client downloads don't change photographer workflow actions. Avoids duplication, single source of truth.

## Impact

**Before:**
- CollectionDetailsPage: 1,056 lines with interleaved workflow logic
- Inline gradient buttons with manual hover/transition styles
- Nested ternary for status badge colors
- Difficult to understand which actions are available in which workflow phase

**After:**
- CollectionDetailsPage: 1,004 lines (52 line reduction, 4.9% smaller)
- 4 isolated workflow phase components with clear boundaries
- WORKFLOW_PHASES object lookup makes status → UI mapping explicit
- Badge and Button primitives enforce design system consistency
- Easier to modify per-status actions (edit one component vs hunting through 1,000-line page)
- Foundation for progressive disclosure enhancements in future phases

**Readability Improvement:**
Understanding workflow actions went from "scan 75 lines of nested conditionals" to "read 5-entry object lookup + visit relevant component." Phase-specific logic is now isolated in 40-50 line components instead of scattered across large page file.

## Self-Check: PASSED

**Created files exist:**
```bash
[ -f "frontend/src/components/collection/DraftPhase.jsx" ] && echo "FOUND: DraftPhase.jsx"
# FOUND: DraftPhase.jsx

[ -f "frontend/src/components/collection/SelectingPhase.jsx" ] && echo "FOUND: SelectingPhase.jsx"
# FOUND: SelectingPhase.jsx

[ -f "frontend/src/components/collection/ReviewingPhase.jsx" ] && echo "FOUND: ReviewingPhase.jsx"
# FOUND: ReviewingPhase.jsx

[ -f "frontend/src/components/collection/DeliveredPhase.jsx" ] && echo "FOUND: DeliveredPhase.jsx"
# FOUND: DeliveredPhase.jsx
```

**Commits exist:**
```bash
git log --oneline --all | grep "06de654"
# FOUND: 06de654 feat(15-02): create workflow phase components

git log --oneline --all | grep "d3e58b8"
# FOUND: d3e58b8 refactor(15-02): use workflow phase components with object lookup in CollectionDetailsPage
```

**All verification criteria met.**

## Commits

1. **06de654** - `feat(15-02): create workflow phase components`
   - Created DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase
   - All components use Button primitive, JSDoc documentation
   - 4 files created, 177 lines added

2. **d3e58b8** - `refactor(15-02): use workflow phase components with object lookup in CollectionDetailsPage`
   - Replaced 75-line actions card with WORKFLOW_PHASES object lookup
   - Badge primitive for status badge, Button primitive for "Add More Photos"
   - transition-all duration-300 on upload zone
   - 1 file modified, -52 net lines (36 added, 88 removed)

## Next Steps

Phase 15-03: Further workflow enhancements (collection list page improvements, bulk actions, or additional progressive disclosure refinements per Phase 15 roadmap).
