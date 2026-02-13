# Phase 4: Review and Delivery - Research

**Researched:** 2026-02-13
**Domain:** Photographer review UI with selection filtering and edited finals upload workflow
**Confidence:** HIGH

## Summary

Phase 4 enables the photographer to see which photos the client selected (REVIEWING status) and upload edited final versions for delivery. This phase builds on the existing CollectionDetailsPage, adding filter tabs (All/Selected/Not Selected) to the photo grid, and extending the backend to handle edited photo uploads separately from the original proofs.

The project already has:
- CollectionDetailsPage with photo grid, lightbox, upload zone, and status transitions
- Selection table populated by clients via Phase 3 (public share selections API)
- EditedPhoto table and backend endpoint (`backend/collections/edited.php`) for final deliverables
- Collection status workflow: DRAFT → SELECTING → REVIEWING → DELIVERED → ARCHIVED
- Status-based UI rendering (status badges, border colors on cards)

Phase 4 must:
1. **Add filter tabs** to CollectionDetailsPage grid (All/Selected/Not Selected) with visual selection indicators
2. **Query selections** for the collection to enable filter logic
3. **Add "Upload Edited Finals" UI** — separate upload zone or tab for edited photos
4. **Implement DELIVERED transition** — button to mark collection complete after finals are uploaded
5. **Visual feedback** for REVIEWING status — green border on collection card (already exists from Phase 2 status border mapping)

**Primary recommendation:** Extend CollectionDetailsPage with a filter tabs UI pattern (similar to Phase 3's frontend tabs), query selections on page load alongside photos, render selection badges on thumbnails, add a second upload zone for edited finals (reusing existing upload patterns from photos.php), and add a "Mark as Delivered" button that PATCH updates collection status to DELIVERED.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | UI and state management | Already in use; useState for filter state |
| react-i18next | Latest | Internationalization | Already in use; add keys to `collection` namespace |
| Sonner | Latest | Toast notifications | Already in use via toast.success/error |
| PHP PDO | 7.4+ | Database queries | Already in use; query Selection + EditedPhoto tables |
| Tailwind CSS | 3.x | Styling | Already in use; filter tabs, badges, upload zones |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Router | 7.x | URL routing | Already in use; no changes needed (same /collection/:id route) |
| FormData API | Native | File uploads | Already in use for photo uploads; reuse for edited uploads |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Filter tabs UI | Dropdown selector | Tabs are more visual, standard pattern for 3 options |
| Separate edited upload zone | Single upload with "type" selector | Two zones are clearer (proofs vs finals are conceptually different) |
| Backend /edited endpoint | Same /photos endpoint with type param | Separate endpoint is cleaner, matches separate EditedPhoto table |

**Installation:**
No new dependencies required. All necessary libraries already in package.json and backend.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/pages/
└── CollectionDetailsPage.jsx  # EXTEND: Add filter tabs, selections query, edited upload zone, DELIVERED button

backend/collections/
├── id.php                      # EXTEND: Include selections count in GET response (optional optimization)
├── edited.php                  # EXISTING: POST/DELETE for EditedPhoto (already functional)
└── selections.php              # EXISTING: GET selections by collectionId (photographer auth)

frontend/src/locales/
├── en.json, lt.json, ru.json   # EXTEND: Add filter tab labels, edited upload strings, delivery button text
```

### Pattern 1: Filter Tabs with Selection Badges

**What:** Three-tab UI (All/Selected/Not Selected) filtering the photo grid, with blue checkmark badges on selected thumbnails

**When to use:** Multi-criteria view switching where all options are equally important (not a primary + secondary pattern)

**Example:**
```jsx
// frontend/src/pages/CollectionDetailsPage.jsx — Add filter state and selections state

const [filter, setFilter] = useState('all'); // 'all' | 'selected' | 'not-selected'
const [selections, setSelections] = useState([]); // Array of Selection records from API

// Fetch selections on mount (after fetchPhotos)
useEffect(() => {
  const fetchSelections = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/selections`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') setSelections(data.selections || []);
      }
    } catch {
      // Non-critical: filters just won't work if selections fail to load
    }
  };
  fetchSelections();
}, [id]);

// Build a Set of selected photo IDs for O(1) lookup
const selectedPhotoIds = useMemo(
  () => new Set(selections.map(s => s.photoId)),
  [selections]
);

// Filter photos based on current filter state
const filteredPhotos = useMemo(() => {
  if (filter === 'all') return photos;
  if (filter === 'selected') return photos.filter(p => selectedPhotoIds.has(p.id));
  if (filter === 'not-selected') return photos.filter(p => !selectedPhotoIds.has(p.id));
  return photos;
}, [photos, filter, selectedPhotoIds]);

// Render filter tabs (place above photo grid, inside the "Photo Grid Card")
<div className="flex gap-2 mb-4 border-b border-gray-200">
  <button
    onClick={() => setFilter('all')}
    className={`px-4 py-2 text-sm font-semibold transition-colors ${
      filter === 'all'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {t('collection.filterAll')} ({photos.length})
  </button>
  <button
    onClick={() => setFilter('selected')}
    className={`px-4 py-2 text-sm font-semibold transition-colors ${
      filter === 'selected'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {t('collection.filterSelected')} ({selectedPhotoIds.size})
  </button>
  <button
    onClick={() => setFilter('not-selected')}
    className={`px-4 py-2 text-sm font-semibold transition-colors ${
      filter === 'not-selected'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {t('collection.filterNotSelected')} ({photos.length - selectedPhotoIds.size})
  </button>
</div>

// Render grid with selection badges
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
  {filteredPhotos.map((photo, index) => {
    const isSelected = selectedPhotoIds.has(photo.id);
    return (
      <div key={photo.id} className="relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100">
        {/* Existing thumbnail + lightbox button */}
        <button onClick={() => setLightboxIndex(index)} className="w-full h-full block border-none p-0 bg-transparent cursor-zoom-in">
          <img src={photoUrl(photo.thumbnailPath ?? photo.storagePath)} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
        </button>

        {/* NEW: Selection badge — show blue checkmark if selected */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Existing cover badge, action overlay, delete/set-cover buttons remain unchanged */}
      </div>
    );
  })}
</div>
```

**Why this works:**
- Filter tabs are a standard UI pattern (Gmail labels, GitHub PR filters, etc.)
- Counts in tab labels provide immediate feedback (photographer sees "12 selected" at a glance)
- Blue checkmark badge is consistent with Phase 3 client selection UI (same visual language)
- `useMemo` prevents re-filtering on every render (only recalculates when photos/filter/selections change)
- Set-based lookup (`selectedPhotoIds.has(id)`) is O(1) — efficient even for large collections

**Sources:**
- [React Tabs - Headless UI](https://headlessui.com/react/tabs) - Standard React tabs pattern
- [Material UI Tabs](https://mui.com/material-ui/react-tabs/) - Tabs with counts/badges

### Pattern 2: Edited Finals Upload Zone

**What:** Separate upload zone for edited photos, visually distinct from the proofs upload zone, with clear labeling

**When to use:** When two upload types serve different purposes and should not be mixed (proofs vs finals)

**Example:**
```jsx
// frontend/src/pages/CollectionDetailsPage.jsx — Add edited photos state and upload handlers

const [editedPhotos, setEditedPhotos] = useState([]);
const [editedUploadStates, setEditedUploadStates] = useState({});
const editedFileInputRef = useRef(null);

// Fetch edited photos on mount (alongside photos and selections)
useEffect(() => {
  const fetchEditedPhotos = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/edited`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') setEditedPhotos(data.editedPhotos || []);
      }
    } catch {
      // Non-critical
    }
  };
  fetchEditedPhotos();
}, [id]);

// Upload edited files (reuse uploadFiles pattern but target /edited endpoint)
const uploadEditedFiles = async (files) => {
  const fileArray = Array.from(files);
  if (!fileArray.length) return;

  const batchId = ++uploadBatchCounter.current;
  const validFiles = [];
  const keys = [];
  let hasValidationErrors = false;

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    const key = `edited-${batchId}-${file.name}-${i}`;
    keys.push(key);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setEditedUploadStates(prev => ({ ...prev, [key]: 'invalid-type' }));
      hasValidationErrors = true;
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      setEditedUploadStates(prev => ({ ...prev, [key]: 'too-large' }));
      hasValidationErrors = true;
      continue;
    }
    validFiles.push({ file, key });
  }

  if (hasValidationErrors) {
    toast.error(t('collection.uploadValidationError'));
  }

  if (validFiles.length > 0) {
    setEditedUploadStates(prev => {
      const next = { ...prev };
      validFiles.forEach(({ key }) => (next[key] = 'uploading'));
      return next;
    });
  }

  let idx = 0;
  let successCount = 0;
  const uploadNext = async () => {
    while (idx < validFiles.length) {
      const current = idx++;
      const { file, key } = validFiles[current];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/edited`,
          { method: 'POST', credentials: 'include', body: formData }
        );
        if (res.ok) successCount++;
        setEditedUploadStates(prev => ({ ...prev, [key]: res.ok ? 'done' : 'error' }));
      } catch {
        setEditedUploadStates(prev => ({ ...prev, [key]: 'error' }));
      }
    }
  };

  const workers = [];
  for (let w = 0; w < Math.min(MAX_CONCURRENT_UPLOADS, validFiles.length); w++) {
    workers.push(uploadNext());
  }
  await Promise.all(workers);

  // Refresh edited photos after upload
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections/${id}/edited`, { credentials: 'include' });
  if (res.ok) {
    const data = await res.json();
    if (data.status === 'OK') setEditedPhotos(data.editedPhotos || []);
  }

  if (successCount > 0) {
    toast.success(t('collection.editedUploadSuccess'));
  }

  setTimeout(() => {
    setEditedUploadStates(prev => {
      const next = { ...prev };
      keys.forEach(k => {
        if (next[k] === 'done' || next[k] === 'invalid-type' || next[k] === 'too-large') {
          delete next[k];
        }
      });
      return next;
    });
  }, 3000);
};

const handleEditedFileChange = (e) => {
  uploadEditedFiles(e.target.files);
  e.target.value = '';
};

// Render edited upload zone (place after proofs upload zone, conditionally show only in REVIEWING status)
{collection.status === 'REVIEWING' && (
  <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
    <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
      {t('collection.editedFinalsTitle')}
      {editedPhotos.length > 0 && (
        <span className="ml-2 text-xs font-normal text-gray-400 normal-case tracking-normal">
          {t('collection.editedPhotosCount', { count: editedPhotos.length })}
        </span>
      )}
    </h2>

    {/* Drop zone */}
    <div
      role="button"
      tabIndex={0}
      aria-label={t('collection.editedUploadZoneLabel')}
      onClick={() => editedFileInputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && editedFileInputRef.current?.click()}
      className="border-2 border-dashed rounded-[10px] flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none border-green-300 bg-green-50 hover:border-green-400"
    >
      <svg className="w-9 h-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p className="m-0 text-sm font-medium text-gray-600">
        {t('collection.editedUploadZoneLabel')}
      </p>
      <p className="m-0 text-xs text-gray-400">
        {t('collection.editedUploadZoneHint')}
      </p>
    </div>

    <input
      ref={editedFileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      className="hidden"
      onChange={handleEditedFileChange}
    />

    {/* Edited photos grid (optional: show uploaded finals) */}
    {editedPhotos.length > 0 && (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {editedPhotos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100">
            <img
              src={photoUrl(photo.storagePath)}
              alt={photo.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

**Why this works:**
- Separate upload zone visually distinguishes edited finals from proofs (different color scheme: green vs gray/blue)
- Reuses existing `uploadFiles` pattern and concurrency limiter (consistent UX, proven upload logic)
- Only shows in REVIEWING status (photographer sees this zone only after client has completed selections)
- Edited photos don't generate thumbnails (per `utils.php` — `generateThumbnail` is skipped for 'edited' subdirectory)
- EditedPhoto table is separate from Photo table (data model matches workflow: proofs vs finals)

**Sources:**
- Existing upload pattern in CollectionDetailsPage.jsx (lines 97-202) - Proven concurrency and validation
- backend/collections/edited.php (already functional) - POST/DELETE for EditedPhoto

### Pattern 3: Status Transition to DELIVERED

**What:** Button to mark collection as DELIVERED after edited finals are uploaded, with confirmation toast

**When to use:** Final step in a multi-stage workflow where status gates access to previous steps

**Example:**
```jsx
// frontend/src/pages/CollectionDetailsPage.jsx — Add DELIVERED transition handler

const handleMarkAsDelivered = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/collections/${id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK') {
        setCollection(data.collection);
        toast.success(t('collection.markedAsDelivered'));
      }
    } else {
      toast.error(t('collection.statusUpdateError'));
    }
  } catch {
    toast.error(t('collection.statusUpdateError'));
  }
};

// Render "Mark as Delivered" button in Collection Info Card (alongside Copy Share Link)
{collection.status === 'REVIEWING' && (
  <button
    onClick={handleMarkAsDelivered}
    disabled={editedPhotos.length === 0}
    className={`inline-flex items-center gap-2 py-[9px] px-[22px] text-[14px] font-semibold text-white border-none rounded-[6px] cursor-pointer font-sans transition-opacity duration-150 ${
      editedPhotos.length > 0
        ? 'bg-[linear-gradient(135deg,#10b981,#059669)] hover:opacity-[0.88]'
        : 'bg-gray-300 cursor-not-allowed opacity-60'
    }`}
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    {t('collection.markAsDelivered')}
  </button>
)}
```

**Why this works:**
- Button is disabled until edited photos are uploaded (prevents accidental delivery of empty collection)
- Green gradient matches REVIEWING status color (visual consistency with status system)
- Uses existing PATCH endpoint for status updates (same as SELECTING transition in Phase 2)
- Toast feedback confirms success (same pattern as all other mutations in the app)
- Status update triggers re-render with new status badge and border color

**Backend:** No changes needed. `backend/collections/id.php` already supports PATCH with `status` field (lines 57-122).

**Sources:**
- Existing status transition in CollectionDetailsPage.jsx (lines 314-337) - handleStartSelecting pattern
- backend/collections/id.php (lines 68-90) - PATCH status validation

### Anti-Patterns to Avoid

- **Mixing proofs and finals in one table:** Photo and EditedPhoto should remain separate — different lifecycle, different purpose
- **Client access to edited photos before DELIVERED:** Status gate is critical — client should NOT see finals via share link until photographer marks DELIVERED
- **Filtering without counts:** Tab labels must show counts (e.g., "Selected (12)") for awareness — counts are not optional
- **No visual selection indicator on thumbnails:** Filter tabs alone are not enough — thumbnails need badges/checkmarks for at-a-glance recognition

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload concurrency | Custom queue/worker | Existing uploadFiles pattern | Already handles concurrency, validation, error states |
| Filter logic | Custom array filtering | `useMemo` with Set lookup | O(1) lookup, React best practice for derived state |
| Status transitions | Custom state machine | Existing PATCH endpoint | Backend already validates valid statuses, returns updated collection |
| Selection badges | Custom icon component | Inline SVG (existing pattern) | Consistent with Phase 3 client selection UI |

**Key insight:** This phase extends existing patterns (photo upload, status transitions, grid rendering) rather than introducing new abstractions. Reuse what works.

## Common Pitfalls

### Pitfall 1: Edited Photos Visible to Client Before DELIVERED

**What goes wrong:** Client opens share link in REVIEWING status and sees edited finals before photographer is ready.

**Why it happens:** Share endpoint includes EditedPhoto records without status gating.

**How to avoid:** Do NOT modify `backend/collections/share.php` to include EditedPhoto. Edited finals should only be served to the client when collection status is DELIVERED (future phase, not Phase 4).

**Warning signs:** Client reports seeing "finished photos" before photographer sent the link.

### Pitfall 2: Filter Tabs Don't Update After Selection Changes

**What goes wrong:** Photographer (or client) makes a selection change in another tab/session, returns to CollectionDetailsPage, filter counts are stale.

**Why it happens:** Selections are only fetched on mount (`useEffect` with empty deps).

**How to avoid:** For v1, this is acceptable (photographer must refresh page to see latest selections). For v2, consider polling or WebSocket.

**Warning signs:** Photographer reports "Selected (12)" tab shows 10 photos after client added 2 more.

### Pitfall 3: Upload Edited Finals Without Ownership Check

**What goes wrong:** Malicious user can POST to `/collections/{id}/edited` with another photographer's collection ID.

**Why it happens:** Trusting frontend auth without backend ownership verification.

**How to avoid:** `backend/collections/edited.php` already verifies ownership (lines 42-49). No changes needed, but verify this in testing.

**Warning signs:** Security audit finds unauthorized edited photo uploads.

### Pitfall 4: DELIVERED Button Enabled with Zero Edited Photos

**What goes wrong:** Photographer clicks "Mark as Delivered" before uploading finals, status changes to DELIVERED but no edited photos exist.

**Why it happens:** Button disabled logic checks `editedPhotos.length === 0` but component renders before fetch completes.

**How to avoid:** Initialize `editedPhotos` state to empty array, fetch on mount, button stays disabled until fetch completes and `length > 0`.

**Warning signs:** Photographer reports "I marked it delivered by accident — no files were uploaded yet."

### Pitfall 5: Filter State Not Reset When Switching Collections

**What goes wrong:** Photographer opens Collection A with filter "Selected", navigates to Collection B, filter is still "Selected" but Collection B has no selections.

**Why it happens:** Filter state persists in component across route changes.

**How to avoid:** Reset filter to 'all' when collection ID changes:
```jsx
useEffect(() => {
  setFilter('all'); // Reset filter when navigating to different collection
}, [id]);
```

**Warning signs:** Empty grid when navigating to new collection, confusing "why are no photos showing?"

## Code Examples

Verified patterns from official sources and prior phase implementations:

### Fetch Selections and Build Set

```jsx
// In CollectionDetailsPage.jsx, add to existing useEffect or create new one
const [selections, setSelections] = useState([]);

useEffect(() => {
  const fetchSelections = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/selections`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') {
          setSelections(data.selections || []);
        }
      }
    } catch {
      // Non-critical: filter tabs just won't work correctly
    }
  };
  fetchSelections();
}, [id]);

// Build Set for O(1) lookup
const selectedPhotoIds = useMemo(
  () => new Set(selections.map(s => s.photoId)),
  [selections]
);
```

### Filter Photos Based on Tab Selection

```jsx
const [filter, setFilter] = useState('all');

const filteredPhotos = useMemo(() => {
  if (filter === 'all') return photos;
  if (filter === 'selected') return photos.filter(p => selectedPhotoIds.has(p.id));
  if (filter === 'not-selected') return photos.filter(p => !selectedPhotoIds.has(p.id));
  return photos;
}, [photos, filter, selectedPhotoIds]);
```

### Backend GET /collections/{id}/selections

```php
// backend/collections/selections.php — already functional (lines 47-54)
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT id, photoId, createdAt FROM `Selection` WHERE collectionId = ? ORDER BY createdAt ASC");
    $stmt->execute([$collectionId]);
    $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "OK", "selections" => $selections]);
    exit;
}
```

### Filter Tabs UI

```jsx
// Place above photo grid, inside Photo Grid Card
<div className="flex gap-2 mb-4 border-b border-gray-200">
  <button
    onClick={() => setFilter('all')}
    className={`px-4 py-2 text-sm font-semibold transition-colors ${
      filter === 'all'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {t('collection.filterAll')} ({photos.length})
  </button>
  <button
    onClick={() => setFilter('selected')}
    className={`px-4 py-2 text-sm font-semibold transition-colors ${
      filter === 'selected'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {t('collection.filterSelected')} ({selectedPhotoIds.size})
  </button>
  <button
    onClick={() => setFilter('not-selected')}
    className={`px-4 py-2 text-sm font-semibold transition-colors ${
      filter === 'not-selected'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {t('collection.filterNotSelected')} ({photos.length - selectedPhotoIds.size})
  </button>
</div>
```

### Selection Badge on Thumbnail

```jsx
// In photo grid .map(), after existing <img> element
{selectedPhotoIds.has(photo.id) && (
  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
)}
```

### Edited Finals Upload Button (REVIEWING Status Only)

```jsx
// In Collection Info Card, after "Copy Share Link" button
{collection.status === 'REVIEWING' && (
  <button
    onClick={handleMarkAsDelivered}
    disabled={editedPhotos.length === 0}
    className={`inline-flex items-center gap-2 py-[9px] px-[22px] text-[14px] font-semibold text-white border-none rounded-[6px] cursor-pointer font-sans transition-opacity duration-150 ${
      editedPhotos.length > 0
        ? 'bg-[linear-gradient(135deg,#10b981,#059669)] hover:opacity-[0.88]'
        : 'bg-gray-300 cursor-not-allowed opacity-60'
    }`}
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    {t('collection.markAsDelivered')}
  </button>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single upload zone for all photos | Separate zones for proofs and finals | 2024-2026 trend | Clearer workflow, prevents mixing |
| Plain list view with checkboxes | Filter tabs with counts | 2022-2024 standard | More visual, better discovery |
| Manual status updates via dropdown | Workflow-aware buttons (contextual actions) | 2023-2025 evolution | Prevents invalid state transitions |
| Badges only on hover | Persistent badges on selected items | 2024+ standard | At-a-glance recognition without interaction |

**Deprecated/outdated:**
- Multi-select checkboxes with "Actions" dropdown — filter tabs + badges are more modern
- Inline status editing (dropdown on collection card) — status buttons in detail view are clearer
- "Upload Edited Photos" modal/dialog — inline upload zone is faster (no extra click)

## Open Questions

1. **Should photographer be able to delete selected photos?**
   - What we know: Phase 1 allows photo deletion, Phase 3 added client selections
   - What's unclear: If photographer deletes a selected photo in REVIEWING status, should it cascade delete the Selection record?
   - Recommendation: Database already has `ON DELETE CASCADE` for `Selection_photoId_fkey` (database_schema.sql line 189). Deletion is safe. No changes needed.

2. **Should filter tabs be visible in DRAFT status?**
   - What we know: DRAFT status has no selections (client hasn't seen the link yet)
   - What's unclear: Should filter tabs appear but show zero selections, or hide entirely?
   - Recommendation: Show tabs always (consistency), but "Selected (0)" and "Not Selected (N)" make sense even in DRAFT (photographer can preselect favorites manually in v2).

3. **Should edited photo upload be allowed in DELIVERED status?**
   - What we know: DELIVERED is the "final" state, but photographer might need to re-upload corrected finals
   - What's unclear: Should status gate in `edited.php` allow POST when status is DELIVERED?
   - Recommendation: Allow uploads in both REVIEWING and DELIVERED (no status gate in edited.php). Frontend hides upload zone after DELIVERED for simplicity, but backend allows it for edge cases.

4. **Should REVIEWING status auto-transition when client completes selections?**
   - What we know: Phase 3 allows client selections in SELECTING status
   - What's unclear: Should backend auto-transition SELECTING → REVIEWING when client clicks "Done" or similar?
   - Recommendation: No auto-transition for v1. Photographer manually transitions after reviewing client selections (gives control, prevents premature status change). "Done" button is v2 feature.

## Sources

### Primary (HIGH confidence)
- Database schema (database_schema.sql) - Selection and EditedPhoto tables, ON DELETE CASCADE constraints
- Existing CollectionDetailsPage.jsx (frontend/src/pages/CollectionDetailsPage.jsx) - Upload patterns, lightbox, status transitions
- backend/collections/edited.php - EditedPhoto CRUD endpoint (already functional)
- backend/collections/selections.php - Photographer selections query endpoint
- backend/utils.php - handleFileUpload with 'edited' subdirectory support (lines 201-259)

### Secondary (MEDIUM confidence)
- [React useMemo Hook](https://react.dev/reference/react/useMemo) - Official React docs on useMemo for derived state
- [Tailwind CSS Tabs](https://tailwindui.com/components/application-ui/navigation/tabs) - Standard tabs pattern with active states
- Phase 3 research (03-RESEARCH.md) - Client selection UI patterns, optimistic updates, filter UX

### Tertiary (LOW confidence)
- WebSearch results on photo delivery workflows 2026 - Industry patterns suggest separate upload zones for proofs vs finals
- UX patterns for multi-state workflows - Contextual action buttons preferred over global status dropdowns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use; no new dependencies
- Architecture: HIGH - Extends proven patterns from Phases 1-3 (upload, status transitions, grid filters)
- Pitfalls: MEDIUM - Ownership verification and status gating are well-understood; filter state reset is inferred from React best practices

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - stable stack, no fast-moving dependencies)
