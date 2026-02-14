---
phase: 10-ui-polish-and-refinement
plan: 01
subsystem: ui-polish
tags: [ui, ux, progressive-disclosure, workflow-organization, i18n]
dependency_graph:
  requires: []
  provides:
    - progressive-disclosure-upload-dropzone
    - workflow-phase-button-grouping
    - improved-share-cta-layout
    - status-border-consistency
  affects:
    - frontend/src/pages/CollectionDetailsPage.jsx
    - frontend/src/pages/SharePage.jsx
    - frontend/src/pages/CollectionsListPage.jsx
tech_stack:
  added: []
  patterns:
    - progressive-disclosure
    - workflow-phase-organization
    - fixed-bottom-bar-cta
key_files:
  created: []
  modified:
    - frontend/src/pages/CollectionDetailsPage.jsx
    - frontend/src/pages/SharePage.jsx
    - frontend/src/pages/CollectionsListPage.jsx
    - frontend/src/locales/en.json
    - frontend/src/locales/lt.json
    - frontend/src/locales/ru.json
decisions:
  - title: Progressive disclosure for upload dropzone
    rationale: Reduces visual clutter when collection already has photos - full dropzone only shown when collection is empty
    pattern: Conditional rendering based on photos.length
  - title: Workflow-phase button grouping
    rationale: Improves UX clarity by organizing actions into Share/Review/Deliver sections that match collection lifecycle
    pattern: Single card with labeled sections, conditional rendering based on status
  - title: Fixed bottom CTA for SharePage
    rationale: True fixed positioning (not sticky) ensures submit button is always visible and accessible during photo selection
    pattern: Fixed bottom bar with responsive two-column layout
  - title: Purple border colors for delivery statuses
    rationale: Visual differentiation - blue for selecting, green for reviewing, purple for delivered/downloaded
    pattern: STATUS_BORDER constant with color mapping
metrics:
  duration: 3.27
  completed: 2026-02-14T16:40:51Z
  tasks: 2
  commits: 2
  files_modified: 6
  i18n_keys_added: 4
---

# Phase 10 Plan 01: UI Polish and Progressive Disclosure Summary

**One-liner:** Progressive disclosure dropzone, workflow-phase button grouping, improved SharePage CTA, and status border consistency across photographer and client interfaces.

## Objective Achievement

Applied UI polish to the photographer dashboard (CollectionDetailsPage), client share page (SharePage), and collections list (CollectionsListPage) to improve workflow clarity and visual consistency. Implemented progressive disclosure for the upload dropzone, reorganized action buttons by workflow phase, improved the client CTA layout, and ensured status badge/border consistency for DELIVERED and DOWNLOADED statuses.

## Tasks Completed

### Task 1: Progressive disclosure dropzone and workflow-phase button grouping on CollectionDetailsPage

**Files modified:**
- `frontend/src/pages/CollectionDetailsPage.jsx`
- `frontend/src/locales/en.json`
- `frontend/src/locales/lt.json`
- `frontend/src/locales/ru.json`

**Changes:**
1. **Progressive disclosure for upload dropzone (UIPOL-01, UIPOL-02):**
   - When `photos.length === 0`: Shows full dropzone with dashed border, drag-and-drop support, upload icon, label text, and hint
   - When `photos.length > 0`: Shows compact "Add More Photos" button (blue theme with plus icon)
   - File input remains outside conditional block to ensure it's always accessible
   - Upload status indicators (anyUploading, uploadErrors, validationErrors) display below button/dropzone when active

2. **Workflow-phase button grouping (UIPOL-03):**
   - Removed flat button row from Collection Info Card
   - Created new "Actions Card with Workflow Phases" with three sections:
     - **Share section** (always visible): Copy Share Link + Start Selection button (DRAFT only)
     - **Review section** (REVIEWING status only): Mark as Delivered button (disabled when editedPhotos.length === 0)
     - **Deliver section** (DELIVERED/DOWNLOADED status only): Copy Delivery Link button
   - Each section has a labeled heading (text-[11px] uppercase gray-400) and flex-wrap button container
   - Sections separated with space-y-4

3. **i18n keys added:**
   - `collection.addMorePhotos`: EN: "Add More Photos", LT: "Pridėti daugiau nuotraukų", RU: "Добавить ещё фото"
   - `collection.sharePhase`: EN: "Share", LT: "Bendrinimas", RU: "Поделиться"
   - `collection.reviewPhase`: EN: "Review", LT: "Peržiūra", RU: "Проверка"
   - `collection.deliverPhase`: EN: "Deliver", LT: "Pristatymas", RU: "Доставка"

**Commit:** `e52ab1a`

**Verification:**
- Build succeeds with no errors
- `grep addMorePhotos` confirms progressive disclosure code exists
- `grep sharePhase` confirms i18n keys present in all 3 locale files

### Task 2: SharePage CTA improvement and CollectionsListPage status border consistency

**Files modified:**
- `frontend/src/pages/SharePage.jsx`
- `frontend/src/pages/CollectionsListPage.jsx`

**Changes:**
1. **SharePage CTA improvement (UIPOL-04):**
   - Changed submit CTA from `sticky bottom-0` to `fixed bottom-0 left-0 right-0` for true fixed positioning
   - Added z-40 to ensure CTA stays above content
   - Two-column layout within CTA bar:
     - Left: Selection count (`text-sm font-semibold text-gray-700`)
     - Right: Submit button (gradient blue, full width on mobile, auto width on desktop)
   - Responsive layout: `flex-col sm:flex-row` (stacked on mobile, inline on desktop)
   - Content container gets `pb-24` when CTA bar is visible to prevent overlap: `${canSelect && selectedPhotoIds.size > 0 && !isSubmitted ? 'pb-24' : ''}`
   - Removed unnecessary `|| 'Submitting...'` fallback (i18n key already exists)

2. **CollectionsListPage status border consistency (UIPOL-05):**
   - Updated `STATUS_BORDER` constant to include:
     - `SELECTING`: border-2 border-blue-500
     - `REVIEWING`: border-2 border-green-500
     - `DELIVERED`: border-2 border-purple-500 (new)
     - `DOWNLOADED`: border-2 border-purple-600 (new)
   - Ensures collection cards have colored borders for all active lifecycle states
   - Purple gradient distinguishes delivery phase from selection (blue) and review (green) phases

**Commit:** `a9e41ab`

**Verification:**
- Build succeeds with no errors
- `grep "fixed bottom-0"` confirms fixed bar in SharePage
- `grep DELIVERED` confirms border colors in STATUS_BORDER
- Lint passes with no warnings

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- ✅ UIPOL-01: Upload dropzone conditionally hidden when photos.length > 0
- ✅ UIPOL-02: "Add More Photos" button visible when photos exist, triggers file input
- ✅ UIPOL-03: Buttons organized into Share/Review/Deliver workflow sections
- ✅ UIPOL-04: Fixed bottom CTA bar on SharePage with count + button
- ✅ UIPOL-05: STATUS_BORDER includes DELIVERED and DOWNLOADED with purple border colors
- ✅ All UI text uses i18n — no hardcoded strings
- ✅ Build and lint pass

## Technical Details

### Progressive Disclosure Pattern

**Before:**
```jsx
<div className="border-2 border-dashed...">
  {/* Always visible dropzone */}
</div>
```

**After:**
```jsx
{photos.length === 0 ? (
  <div className="border-2 border-dashed...">
    {/* Full dropzone */}
  </div>
) : (
  <button onClick={() => fileInputRef.current?.click()}>
    {/* Compact "Add More Photos" button */}
  </button>
)}
```

### Workflow-Phase Button Grouping

**Before:**
- Flat button row with all actions mixed together
- No visual hierarchy or workflow context

**After:**
```jsx
<div className="space-y-4">
  {/* Share section (always) */}
  <div>
    <h3>{t('collection.sharePhase')}</h3>
    <div className="flex gap-3 flex-wrap">
      {/* Share buttons */}
    </div>
  </div>

  {/* Review section (REVIEWING only) */}
  {collection.status === 'REVIEWING' && (
    <div>...</div>
  )}

  {/* Deliver section (DELIVERED/DOWNLOADED only) */}
  {(collection.status === 'DELIVERED' || collection.status === 'DOWNLOADED') && (
    <div>...</div>
  )}
</div>
```

### Fixed Bottom CTA Pattern

**Before:**
```jsx
<div className="sticky bottom-0">
  <button className="w-full max-w-[400px] mx-auto">Submit</button>
</div>
```

**After:**
```jsx
<div className="fixed bottom-0 left-0 right-0 z-40">
  <div className="max-w-[720px] mx-auto flex flex-col sm:flex-row justify-between">
    <div>{t('share.selectedCount', { count })}</div>
    <button className="w-full sm:w-auto">Submit</button>
  </div>
</div>
```

## Impact

**User Experience:**
- **Photographers:** Cleaner upload interface that adapts to collection state; workflow actions clearly organized by phase
- **Clients:** More prominent and informative submit button on SharePage with selection count visible at all times

**Visual Consistency:**
- All active collection statuses now have distinct border colors in the collections list
- Purple theme consistently represents delivery phase (matching DELIVERED and DOWNLOADED badges)

**Code Maintainability:**
- Conditional rendering pattern is clear and maintainable
- Workflow-phase organization makes button logic easier to understand and modify
- i18n keys follow existing naming conventions

## Self-Check

### Created Files Verification
No new files created in this plan.

### Modified Files Verification
```bash
[ -f "frontend/src/pages/CollectionDetailsPage.jsx" ] && echo "FOUND: frontend/src/pages/CollectionDetailsPage.jsx" || echo "MISSING: frontend/src/pages/CollectionDetailsPage.jsx"
[ -f "frontend/src/pages/SharePage.jsx" ] && echo "FOUND: frontend/src/pages/SharePage.jsx" || echo "MISSING: frontend/src/pages/SharePage.jsx"
[ -f "frontend/src/pages/CollectionsListPage.jsx" ] && echo "FOUND: frontend/src/pages/CollectionsListPage.jsx" || echo "MISSING: frontend/src/pages/CollectionsListPage.jsx"
[ -f "frontend/src/locales/en.json" ] && echo "FOUND: frontend/src/locales/en.json" || echo "MISSING: frontend/src/locales/en.json"
[ -f "frontend/src/locales/lt.json" ] && echo "FOUND: frontend/src/locales/lt.json" || echo "MISSING: frontend/src/locales/lt.json"
[ -f "frontend/src/locales/ru.json" ] && echo "FOUND: frontend/src/locales/ru.json" || echo "MISSING: frontend/src/locales/ru.json"
```

### Commits Verification
```bash
git log --oneline --all | grep -q "e52ab1a" && echo "FOUND: e52ab1a" || echo "MISSING: e52ab1a"
git log --oneline --all | grep -q "a9e41ab" && echo "FOUND: a9e41ab" || echo "MISSING: a9e41ab"
```

## Self-Check: PASSED

All modified files exist:
- FOUND: frontend/src/pages/CollectionDetailsPage.jsx
- FOUND: frontend/src/pages/SharePage.jsx
- FOUND: frontend/src/pages/CollectionsListPage.jsx
- FOUND: frontend/src/locales/en.json
- FOUND: frontend/src/locales/lt.json
- FOUND: frontend/src/locales/ru.json

All commits exist:
- FOUND: e52ab1a (Task 1: Progressive disclosure dropzone and workflow-phase button grouping)
- FOUND: a9e41ab (Task 2: SharePage CTA improvement and status border consistency)
