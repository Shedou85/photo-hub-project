# Phase 12 Plan 02: PhotoCard and UploadZone Components Summary

**One-liner:** Extracted photo grid item (~50 lines per instance) and upload zone (~60 lines per instance) into reusable PhotoCard (compound component with hover actions) and UploadZone (default dropzone + compact button variants) primitives.

---

## Metadata

**Phase:** 12-primitive-component-library
**Plan:** 02
**Subsystem:** frontend/components/primitives
**Status:** Complete
**Completed:** 2026-02-16
**Duration:** 2.08 minutes

**Tags:** #ui-components #react #compound-components #drag-drop #performance

---

## Dependency Graph

**Requires:**
- Plan 12-01 (Button, Card, Badge components with clsx)
- React memo API (performance optimization)
- clsx library (className composition)

**Provides:**
- PhotoCard compound component with hover actions overlay pattern
- UploadZone component with default (dropzone) and compact (button) variants
- Complete primitive component library (5 total components)

**Affects:**
- Phases 13-16: Can now replace ~50-line photo card instances and ~60-line upload zone instances with single-line component calls
- CollectionDetailsPage: Photo grid pattern (lines 838-890) can be refactored
- CollectionDetailsPage: Upload zone pattern (lines 729-791) can be refactored

---

## Execution Report

### Tasks Completed

| Task | Name | Commit | Files Created |
|------|------|--------|---------------|
| 1 | Create PhotoCard compound component | 2e38e51 | PhotoCard.jsx |
| 2 | Create UploadZone with variants | fa08425 | UploadZone.jsx |

### What Was Built

**PhotoCard Component (Task 1):**
- Memo-wrapped component for photo grid performance (prevents re-renders in 100+ photo grids)
- Cover badge with gradient star indicator (`bg-[linear-gradient(135deg,#3b82f6,#6366f1)]`)
- Selection checkmark with blue circle and SVG check icon
- Compound component pattern: PhotoCard.Actions (hover overlay container) and PhotoCard.Action (individual action buttons)
- Hover actions overlay with opacity transition (opacity-0 → group-hover:opacity-100)
- Action buttons with stopPropagation to prevent triggering PhotoCard onClick
- Lazy loading on img element
- JSDoc with @param and 2 @example tags (basic usage + full featured)

**UploadZone Component (Task 2):**
- Default large dropzone with dashed border, upload icon, label, and optional hint text
- Compact button variant with plus icon for "Add More Photos" pattern
- Blue and green color themes (drag-over state for blue theme)
- Hidden file input with ref pattern for programmatic click
- Input value reset after selection (allows re-upload of same file)
- Keyboard accessible (Enter key triggers file browser, tabIndex=0, role="button")
- Drag-drop event handlers (onDragOver, onDragLeave, onDrop) passed from parent
- JSDoc with @param and 3 @example tags (default dropzone, compact button, green theme)

**Primitive Component Library Complete:**
All 5 components now exist in `frontend/src/components/primitives/`:
1. Button.jsx (4 variants, 3 sizes)
2. Card.jsx (container with optional title/description)
3. Badge.jsx (status indicators)
4. PhotoCard.jsx (photo grid item with compound component hover actions)
5. UploadZone.jsx (file upload with 2 variants, 2 themes)

### Deviations from Plan

None - plan executed exactly as written. All components match specifications from research plan patterns.

### Verification Results

**ESLint:** Zero warnings/errors across all 5 primitive components
**Build:** Production build succeeds (1.38s, 371.65 kB main bundle)
**Component count:** All 5 primitive files exist in `frontend/src/components/primitives/`
**JSDoc coverage:** All 5 components have @example tags
**Pattern verification:**
- PhotoCard uses memo() wrapper ✓
- PhotoCard has .Actions and .Action compound sub-components ✓
- UploadZone has 'default' and 'compact' variant rendering paths ✓

---

## Technical Decisions

### Key Decisions Made

1. **PhotoCard uses React.memo for grid performance**
   - **Context:** Photo grids can contain 100+ items
   - **Decision:** Wrap PhotoCard in memo() to prevent unnecessary re-renders
   - **Rationale:** Pitfall 2 from research - grids without memoization re-render all items on any state change
   - **Impact:** Significantly improves performance in large photo collections

2. **Compound component pattern for hover actions**
   - **Context:** PhotoCard needs flexible hover overlay with variable action buttons
   - **Decision:** Use PhotoCard.Actions (container) + PhotoCard.Action (button) pattern
   - **Rationale:** Allows parent components to compose custom action overlays without prop drilling
   - **Impact:** More flexible than fixed "onDelete/onSetCover" props, matches React composition patterns

3. **UploadZone is a "dumb" UI component**
   - **Context:** Upload zones need file validation and API calls
   - **Decision:** UploadZone only handles UI and passes raw FileList to parent via onFilesSelected callback
   - **Rationale:** Separation of concerns - validation and upload logic varies by context
   - **Impact:** Parent components control validation rules and upload behavior

4. **stopPropagation on PhotoCard.Action clicks**
   - **Context:** Action buttons are inside clickable photo card area
   - **Decision:** Call e.stopPropagation() in PhotoCard.Action onClick handler
   - **Rationale:** Prevents action button clicks from triggering PhotoCard onClick (lightbox opening)
   - **Impact:** Action buttons work correctly without interfering with card click behavior

5. **Input value reset after file selection**
   - **Context:** HTML file inputs don't fire onChange if same file selected twice
   - **Decision:** Set input.value = '' after onFilesSelected callback
   - **Rationale:** Allows users to re-upload the same file (common in photo editing workflows)
   - **Impact:** Better UX for iterative photo uploads

---

## Key Files

### Created

- `frontend/src/components/primitives/PhotoCard.jsx` - Photo grid item with compound component hover actions (127 lines)
- `frontend/src/components/primitives/UploadZone.jsx` - File upload zone with default/compact variants (157 lines)

### Modified

None (new component creation only)

---

## Code Samples

### PhotoCard Compound Component Pattern

```jsx
// Usage in CollectionDetailsPage (future refactor)
<PhotoCard
  src={photoUrl(photo.storagePath)}
  alt={photo.filename}
  onClick={() => setLightboxIndex(photoIndex)}
  isCover={collection.coverPhotoId === photo.id}
  isSelected={selectedPhotoIds.has(photo.id)}
  actions={
    <PhotoCard.Actions>
      <PhotoCard.Action onClick={() => handleDeletePhoto(photo.id)} label={t("collection.deletePhoto")}>
        ×
      </PhotoCard.Action>
      {collection.coverPhotoId !== photo.id && (
        <PhotoCard.Action onClick={() => handleSetCover(photo.id)} label={t("collection.setCover")}>
          ★
        </PhotoCard.Action>
      )}
    </PhotoCard.Actions>
  }
/>
```

### UploadZone Variants

```jsx
// Default large dropzone (empty collection)
<UploadZone
  onFilesSelected={handleFiles}
  dragOver={dragOver}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  label={t("collection.uploadZoneLabel")}
  hint={t("collection.uploadZoneHint")}
/>

// Compact button (has photos, progressive disclosure)
<UploadZone
  variant="compact"
  onFilesSelected={handleFiles}
  label={t('collection.addMorePhotos')}
/>
```

---

## Tech Stack

### Added

- React.memo (performance optimization API)

### Patterns

- Compound component pattern (PhotoCard.Actions, PhotoCard.Action)
- Event delegation with stopPropagation
- useRef for programmatic DOM manipulation (file input click)
- Conditional rendering based on variant prop

---

## Metrics

**Lines of code:** 284 (127 PhotoCard + 157 UploadZone)
**Components created:** 2 main + 2 sub-components (PhotoCard.Actions, PhotoCard.Action)
**Commits:** 2 (one per task)
**Build time:** 1.38s
**Bundle size:** 371.65 kB (no significant increase from Plan 12-01)

---

## Self-Check: PASSED

**Files exist:**
```
FOUND: frontend/src/components/primitives/PhotoCard.jsx
FOUND: frontend/src/components/primitives/UploadZone.jsx
```

**Commits exist:**
```
FOUND: 2e38e51 (feat: PhotoCard compound component)
FOUND: fa08425 (feat: UploadZone component with variants)
```

**Component features verified:**
```
✓ PhotoCard memo() wrapper present
✓ PhotoCard.Actions compound sub-component defined
✓ PhotoCard.Action compound sub-component defined
✓ UploadZone 'compact' variant code path exists
✓ All 5 primitive components have JSDoc @example tags
✓ ESLint passes with zero warnings
✓ Production build succeeds
```

---

## Next Steps

**Immediate:**
- Phase 12 complete (2/2 plans finished)
- Ready to advance to Phase 13

**Phase 13-16 Integration:**
- Refactor CollectionDetailsPage photo grid to use PhotoCard component (replace lines 838-890)
- Refactor CollectionDetailsPage upload zones to use UploadZone component (replace lines 729-791)
- Apply primitive components across all authenticated pages during v3.0 redesign
- Measure refactoring impact (lines saved, consistency improvements)

**Future Optimizations:**
- Consider adding PhotoCard.Skeleton for loading states (Phase 15)
- Consider adding UploadZone.Progress for inline upload progress indicators (Phase 15)
- Measure memo() performance impact with React DevTools Profiler in production
