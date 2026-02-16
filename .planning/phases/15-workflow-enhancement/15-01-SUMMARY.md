---
phase: 15-workflow-enhancement
plan: 01
subsystem: ui-workflow
tags: [ux, workflow-guidance, navigation, i18n]
completed: 2026-02-16

dependency-graph:
  requires: [14-02]
  provides: [auto-navigation, conditional-ui, workflow-guidance]
  affects: [collections-list, collection-details]

tech-stack:
  added: []
  patterns: [progressive-disclosure, status-driven-ui]

key-files:
  created: []
  modified:
    - frontend/src/pages/CollectionsListPage.jsx
    - frontend/src/pages/CollectionDetailsPage.jsx
    - frontend/src/locales/en.json
    - frontend/src/locales/lt.json
    - frontend/src/locales/ru.json

decisions:
  - "Navigate immediately after collection creation (WORKFLOW-04) — reduces clicks, photographer lands directly on collection page to start uploading"
  - "Hide 'Start client selection' button when photos.length === 0 (WORKFLOW-03) — prevents invalid state (client sees empty gallery)"
  - "Next-step guidance as gray text below header (WORKFLOW-06) — non-intrusive workflow guidance without modal/tooltip complexity"
  - "State-specific empty states (WORKFLOW-07) — contextual messaging per collection status instead of generic 'No photos yet'"
  - "SVG photo icon instead of emoji in empty state — cross-platform visual consistency"

metrics:
  duration: 2.52 min
  tasks: 2
  files-modified: 5
  commits: 2
---

# Phase 15 Plan 01: Quick Workflow UX Improvements Summary

**One-liner:** Auto-navigate after collection creation, conditional start-selection button, next-step guidance text, and state-specific empty states to reduce friction in photographer workflow.

## What Was Built

### WORKFLOW-04: Auto-navigation after collection creation
**CollectionsListPage.jsx:**
- Added `useNavigate` from `react-router-dom`
- Navigate to `/collection/{id}` immediately after successful creation
- Removed background collections list refresh (unnecessary when navigating away)
- Toast notification persists across navigation for feedback

**Impact:** Photographers land directly on collection details page after creation — ready to upload photos without extra click. Matches mental model: "Create collection → add photos."

### WORKFLOW-03: Conditional "Start client selection" button
**CollectionDetailsPage.jsx:**
- Changed button condition from `collection.status === 'DRAFT'` to `collection.status === 'DRAFT' && photos.length > 0`
- Button hidden when collection has zero photos

**Impact:** Prevents photographers from starting client selection on empty collections (which would show clients an empty gallery). Enforces workflow constraint at UI level.

### WORKFLOW-06: Next-step guidance text
**CollectionDetailsPage.jsx:**
- Added guidance text below page header, above Collection Info Card
- Uses `text-sm text-gray-500 mb-5 -mt-4` for subtle positioning
- Pulls status-specific text via `t('collection.nextStep.${status}')`

**i18n keys added (all 3 locales):**
```
collection.nextStep.DRAFT: "Next step: Upload photos and share with your client"
collection.nextStep.SELECTING: "Next step: Waiting for client to select photos"
collection.nextStep.REVIEWING: "Next step: Upload edited finals and mark as delivered"
collection.nextStep.DELIVERED: "Next step: Share the delivery link with your client"
collection.nextStep.DOWNLOADED: "Your client has downloaded the photos"
```

**Impact:** Photographers see clear next-step guidance per collection status. No modals or tooltips — just persistent, non-intrusive text. Reduces "what do I do next?" friction.

### WORKFLOW-07: State-specific empty states
**CollectionDetailsPage.jsx:**
- Replaced generic empty state with status-driven title + subtitle
- Added 56x56px gray circle with SVG photo icon (instead of emoji)
- Uses `t('collection.emptyState.${status}.title')` and `.subtitle` with fallbacks
- Semantic structure: icon → title (semibold) → subtitle (gray)

**i18n keys added (all 3 locales):**
```
collection.emptyState.DRAFT.title: "No photos yet"
collection.emptyState.DRAFT.subtitle: "Upload photos to get started with this collection"

collection.emptyState.SELECTING.title: "Waiting for selections"
collection.emptyState.SELECTING.subtitle: "Your client hasn't made any selections yet"

collection.emptyState.REVIEWING.title: "Ready for editing"
collection.emptyState.REVIEWING.subtitle: "Your client's selections are ready — upload the edited finals above"

collection.emptyState.DELIVERED.title: "Photos delivered"
collection.emptyState.DELIVERED.subtitle: "Your client can download the edited photos using the delivery link"
```

**Impact:** Empty state messaging adapts to collection workflow phase. "No photos yet" makes sense for DRAFT. "Waiting for selections" makes sense for SELECTING. Contextual copy reduces confusion.

## Deviations from Plan

None — plan executed exactly as written.

## Technical Notes

### Pattern: Status-driven UI
This plan extends the status-driven UI pattern established in Phase 4:
- Conditional button visibility (`photos.length > 0`)
- Status-specific i18n keys (`nextStep.${status}`, `emptyState.${status}`)
- Fallback behavior for unmapped statuses (e.g., ARCHIVED)

### i18n Architecture
All new keys nested under `collection` namespace:
- `collection.nextStep.*` — workflow guidance per status
- `collection.emptyState.*.title` — empty state headings
- `collection.emptyState.*.subtitle` — empty state descriptions

Translations synchronized across LT/EN/RU. Russian translation uses full phrases (e.g., "Следующий шаг:") to maintain natural phrasing.

### Navigation Behavior
`navigate()` called BEFORE `setNewCollectionName("")` in promise chain. Toast notification configured to persist across navigation (Sonner default behavior). Collections list will refresh on next visit via existing `useEffect` dependency array.

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| `a36654c` | feat | Auto-navigation and conditional start button | CollectionsListPage.jsx, CollectionDetailsPage.jsx |
| `f75ec13` | feat | Next-step guidance and state-specific empty states | CollectionDetailsPage.jsx, en.json, lt.json, ru.json |

## Self-Check: PASSED

**Created files:** None (modifications only)

**Modified files:**
- ✓ `frontend/src/pages/CollectionsListPage.jsx` exists
- ✓ `frontend/src/pages/CollectionDetailsPage.jsx` exists
- ✓ `frontend/src/locales/en.json` exists
- ✓ `frontend/src/locales/lt.json` exists
- ✓ `frontend/src/locales/ru.json` exists

**Commits:**
- ✓ `a36654c` exists in git log
- ✓ `f75ec13` exists in git log

**Verification commands:**
```bash
npm run lint    # ✓ Zero errors
npm run build   # ✓ Production build successful
grep "useNavigate" CollectionsListPage.jsx  # ✓ Found
grep "photos.length > 0" CollectionDetailsPage.jsx  # ✓ Found (line 659)
grep "collection.nextStep" CollectionDetailsPage.jsx  # ✓ Found (line 627)
grep "collection.emptyState" CollectionDetailsPage.jsx  # ✓ Found (lines 912, 915)
grep "nextStep" locales/*.json  # ✓ Found in all 3 files
grep "emptyState" locales/*.json  # ✓ Found in all 3 files
```

All files exist. All commits present. All grep patterns match. Build succeeded with zero lint errors.
