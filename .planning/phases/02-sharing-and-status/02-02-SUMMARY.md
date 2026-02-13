---
phase: 02-sharing-and-status
plan: 02
subsystem: frontend-status-ui
tags: [status-colors, status-transitions, ui-enhancement, i18n]
dependency-graph:
  requires: [02-01-public-share]
  provides: [status-visual-feedback, status-transitions]
  affects: [collection-cards, collection-detail-page]
tech-stack:
  added: []
  patterns: [conditional-styling, status-badges, optimistic-ui-updates]
key-files:
  created: []
  modified:
    - frontend/src/pages/CollectionsListPage.jsx
    - frontend/src/pages/CollectionDetailsPage.jsx
    - frontend/src/pages/SharePage.jsx
    - frontend/src/locales/en.json
    - frontend/src/locales/lt.json
    - frontend/src/locales/ru.json
decisions:
  - "Status border mapping: SELECTING=blue, REVIEWING=green, no border for DRAFT/DELIVERED/ARCHIVED"
  - "Status badges only show for non-DRAFT collections to avoid visual clutter"
  - "Status transition button (DRAFT→SELECTING) placed in info card alongside share link button"
  - "SharePage lightbox uses 32px/40px arrow chevrons for subtle, non-intrusive navigation"
metrics:
  duration: 21
  completed: 2026-02-13
---

# Phase 2 Plan 2: Status Color Coding and Transitions

**One-liner:** Collection cards show status-conditional borders (blue=SELECTING, green=REVIEWING) with status badges, and photographers can transition collections from DRAFT to SELECTING via button on detail page.

## What Was Built

### Status Visual Feedback System
- **Collection cards with status borders:** Cards dynamically display colored borders based on status (SELECTING=blue 2px border, REVIEWING=green 2px border, others=no border)
- **Status badges:** Pill-style badges show translated status text on all non-DRAFT collections in both list and detail views
- **Status info row:** Detail page info card displays current status with label "Status" and translated value

### Status Transition Controls
- **"Start client selection" button:** Appears on detail page when collection is DRAFT, triggers PATCH to backend with status: SELECTING
- **Optimistic UI update:** Status badge and info row update immediately after successful API response
- **Success/error feedback:** Toast notifications confirm status change or report errors

### Internationalization
- **Status translations:** All 5 status values (DRAFT, SELECTING, REVIEWING, DELIVERED, ARCHIVED) translated in EN, LT, RU
- **Action labels:** "Start client selection", "Status updated", "Failed to update status" in all 3 languages
- **Consistent namespacing:** Status keys in both `collections.status.*` (for cards) and `collection.status.*` (for detail page)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] SharePage lightbox controls visibility**
- **Found during:** Human verification of Task 2
- **Issue:** User reported navigation arrows and close button not visible in SharePage lightbox (white background hiding white controls)
- **Fix:** Increased lightbox background opacity from bg-black/92 to bg-black/95, increased button opacity from bg-white/15 to bg-white/25, added backdrop-blur-sm for better contrast
- **Files modified:** frontend/src/pages/SharePage.jsx
- **Commit:** 44523b8

**2. [User Request] SharePage lightbox navigation redesign**
- **Found during:** Human verification of Task 2
- **Issue:** User wanted arrow-style navigation instead of circular buttons for cleaner, more standard gallery UX
- **Fix:** Replaced circular button backgrounds with large chevron arrows (< >), replaced × text with clean X icon (cross paths), added drop-shadow and scale-on-hover effects
- **Files modified:** frontend/src/pages/SharePage.jsx
- **Commit:** faa4f22

**3. [User Request] SharePage arrow size refinement**
- **Found during:** Human verification of Task 2
- **Issue:** Navigation arrows too large (48px/64px), dominating the lightbox view
- **Fix:** Reduced arrow size to 32px/40px (mobile/desktop), reduced close button to 32px/36px for better balance between visibility and subtlety
- **Files modified:** frontend/src/pages/SharePage.jsx
- **Commit:** 0bfc196

## Implementation Details

### Status Border Mapping (CollectionsListPage.jsx)
```javascript
const STATUS_BORDER = {
  SELECTING: 'border-2 border-blue-500',
  REVIEWING: 'border-2 border-green-500',
};
const statusBorder = STATUS_BORDER[collection.status] ?? '';
```
Applied conditionally to card className. DRAFT, DELIVERED, and ARCHIVED have no colored border to reduce visual noise.

### Status Badge Component (Reusable Pattern)
```jsx
{collection.status !== 'DRAFT' && (
  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
    collection.status === 'SELECTING' ? 'bg-blue-100 text-blue-700' :
    collection.status === 'REVIEWING' ? 'bg-green-100 text-green-700' :
    collection.status === 'DELIVERED' ? 'bg-purple-100 text-purple-700' :
    'bg-gray-100 text-gray-600'
  }`}>
    {t(`collection.status.${collection.status}`)}
  </span>
)}
```
Shows on collection cards (list) and in page header (detail). Purple for DELIVERED, gray fallback for ARCHIVED.

### Status Transition Handler (CollectionDetailsPage.jsx)
```javascript
const handleStartSelecting = async () => {
  const res = await fetch(`${BASE_URL}/collections/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'SELECTING' }),
  });
  if (res.ok) {
    const data = await res.json();
    setCollection(data.collection); // Optimistic update
    toast.success(t('collection.statusUpdated'));
  }
};
```
Button conditionally rendered: `{collection.status === 'DRAFT' && <button onClick={handleStartSelecting}>...}`

### SharePage Lightbox Navigation (Final Design)
- **Background:** `bg-black/95` for near-opaque dark overlay
- **Arrows:** 32px (mobile) / 40px (desktop) chevrons with `text-white/70 hover:text-white hover:scale-110`
- **Close button:** 32px/36px X icon with same hover effects
- **Drop shadow:** `drop-shadow-lg` on all controls for visibility against any image
- **Positioning:** Left/right arrows at edges, close button top-right, counter bottom-center

## Verification Results

### Automated Checks
- ✅ ESLint: Zero warnings
- ✅ Build: Success (Vite production build)

### Human Verification (Approved)
- ✅ Collection cards show blue border for SELECTING status
- ✅ Collection cards show green border for REVIEWING status
- ✅ Status badges visible on non-DRAFT collections
- ✅ "Start client selection" button transitions DRAFT → SELECTING
- ✅ Status updates reflected immediately in UI (optimistic update)
- ✅ SharePage lightbox has dark background with visible, subtle arrow navigation
- ✅ All strings internationalized in EN, LT, RU
- ✅ Edge case: Invalid share link shows "not found" message without crash

## Files Changed

| File | Changes | Lines |
|------|---------|-------|
| CollectionsListPage.jsx | Added STATUS_BORDER mapping, status badge in card text area, applied conditional border class | +24 |
| CollectionDetailsPage.jsx | Added status InfoRow, handleStartSelecting handler, transition button, status badge in header | +35 |
| SharePage.jsx | Enhanced lightbox controls visibility and refined arrow navigation | +12 |
| en.json | Added collections.status.* and collection.status.* keys, startSelecting, statusUpdated, statusUpdateError | +17 |
| lt.json | Same structure as en.json with Lithuanian translations | +17 |
| ru.json | Same structure as en.json with Russian translations | +17 |

**Total:** 6 files modified, 122 lines added

## Commits

| Hash | Type | Message |
|------|------|---------|
| 882520b | feat | Add status color coding and transition buttons |
| 44523b8 | fix | Improve SharePage lightbox controls visibility |
| faa4f22 | refactor | Replace circular buttons with clean arrow navigation in SharePage lightbox |
| 0bfc196 | refactor | Reduce SharePage lightbox arrow size for subtlety |

## Next Steps

**Immediate:**
- Plan 02-02 completes Phase 2 (Sharing and Status)
- Phase 2 fully delivers SHARE-03 (collection cards display status color) and enables the transition from DRAFT to SELECTING for Phase 3 client selection workflow

**Phase 3 (Client Selection):**
- Public selection UI on SharePage (/share/{shareId}) for clients to mark favorite photos
- Selection persistence to database (SelectionPhoto table)
- Photographer view of client selections on CollectionDetailsPage
- Status transition from SELECTING → REVIEWING when client completes selection

**Future Enhancements:**
- Status history/audit log (track who changed status and when)
- Email notification when status changes (e.g., photographer notified when client completes selection)
- Bulk status operations (select multiple collections, transition all at once)
- Custom status colors (let photographers choose their own color scheme)

## Self-Check: PASSED

**Created files:** None (all modifications to existing files)

**Modified files:**
```bash
[✓] frontend/src/pages/CollectionsListPage.jsx exists
[✓] frontend/src/pages/CollectionDetailsPage.jsx exists
[✓] frontend/src/pages/SharePage.jsx exists
[✓] frontend/src/locales/en.json exists
[✓] frontend/src/locales/lt.json exists
[✓] frontend/src/locales/ru.json exists
```

**Commits:**
```bash
[✓] 882520b exists: feat(02-02): add status color coding and transition buttons
[✓] 44523b8 exists: fix(02-02): improve SharePage lightbox controls visibility
[✓] faa4f22 exists: refactor(02-02): replace circular buttons with clean arrow navigation
[✓] 0bfc196 exists: refactor(02-02): reduce SharePage lightbox arrow size for subtlety
```

All claimed files and commits verified. Plan execution complete.
