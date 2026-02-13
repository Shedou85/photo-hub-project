# Phase 3: Client Gallery and Selection - Research

**Researched:** 2026-02-13
**Domain:** Client-side photo selection UI with token-based public access and PHP PDO selection persistence
**Confidence:** HIGH

## Summary

Phase 3 adds interactive photo selection capability to the existing public SharePage. Clients browse the gallery they already have access to (Phase 2) and toggle individual photos as selected/not selected via click interaction. The core challenge is building responsive UI with optimistic updates, managing selection state across page reloads, and preventing photo downloads while the collection is in SELECTING status.

The project already has:
- Public share endpoint (`backend/collections/share.php`) returning collection + photos by shareId
- SharePage (`frontend/src/pages/SharePage.jsx`) with photo grid and lightbox
- Selection table in the database with proper foreign keys
- Selections API stub (`backend/collections/selections.php`) that requires authentication

Phase 3 must:
1. **Extend SharePage** with selection UI (checkboxes/overlay on grid, running counter badge)
2. **Build public selections API** at `POST/DELETE /share/{shareId}/selections` (no auth, token-based)
3. **Implement optimistic updates** for instant feedback when toggling selections
4. **Block downloads** with CSS and contextmenu prevention (status-gated)
5. **Gate access** to selection features based on collection status (SELECTING only)

**Primary recommendation:** Use React's built-in useState for selection state (local to SharePage), implement optimistic UI updates with useOptimistic (React 19) or manual state rollback, disable right-click and dragging with CSS + event listeners, and create a separate public selections endpoint that validates shareId and status without requiring photographer authentication.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | UI and state management | Already in use; useState sufficient for local selection state |
| react-i18next | Latest | Internationalization | Already in use; add keys to `share` namespace |
| Sonner | Latest | Toast notifications | Already in use via toast.success/error |
| PHP PDO | 7.4+ | Database queries | Already in use; prepared statements for Selection table |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React 19 useOptimistic | 19+ | Optimistic UI updates | If upgrading to React 19; otherwise manual state rollback |
| Tailwind CSS | 3.x | Styling | Already in use; checkbox overlay, badge, disabled states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState | Zustand/Jotai | Overkill for single-page selection state; no cross-component sharing needed |
| Manual optimistic updates | React Query | Adds dependency; project already uses fetch directly |
| useOptimistic (React 19) | Manual state + rollback | If staying on React 18, manual is fine; useOptimistic is cleaner but requires upgrade |

**Installation:**
No new dependencies required. All necessary libraries already in package.json.

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── collections/
│   ├── share.php              # Existing: GET /share/{shareId}
│   └── share-selections.php   # NEW: POST/DELETE /share/{shareId}/selections
frontend/src/pages/
└── SharePage.jsx              # EXTEND: Add selection UI, state, and API calls
frontend/src/locales/
├── en.json, lt.json, ru.json  # EXTEND: Add selection i18n keys to "share" namespace
```

### Pattern 1: Public Token-Based Selection API

**What:** Separate public endpoint for client selection actions that validates shareId instead of session auth

**When to use:** Client-facing actions on public pages where no user account exists

**Example:**
```php
// backend/collections/share-selections.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

// NO session_start() — public endpoint

$parts = parseRouteParts(); // /share/{shareId}/selections[/{photoId}]
$shareId = $parts[1] ?? '';
$photoId = $parts[3] ?? ''; // For DELETE: /share/{shareId}/selections/{photoId}

if (empty($shareId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Share ID required']);
    exit;
}

$pdo = getDbConnection();

// Validate shareId and get collectionId
$stmt = $pdo->prepare("SELECT id, status FROM `Collection` WHERE shareId = ? LIMIT 1");
$stmt->execute([$shareId]);
$collection = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$collection) {
    http_response_code(404);
    echo json_encode(['error' => 'Collection not found']);
    exit;
}

// Gate: Only allow selections if status is SELECTING
if ($collection['status'] !== 'SELECTING') {
    http_response_code(403);
    echo json_encode(['error' => 'Selection not available for this collection']);
    exit;
}

$collectionId = $collection['id'];

// POST: Create selection
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $photoIdToSelect = $data['photoId'] ?? '';

    if (empty($photoIdToSelect)) {
        http_response_code(400);
        echo json_encode(['error' => 'photoId required']);
        exit;
    }

    // Verify photo belongs to collection
    $stmt = $pdo->prepare("SELECT id FROM `Photo` WHERE id = ? AND collectionId = ?");
    $stmt->execute([$photoIdToSelect, $collectionId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo not found']);
        exit;
    }

    // Insert selection (UNIQUE constraint on photoId prevents duplicates)
    $selectionId = generateCuid();
    $stmt = $pdo->prepare("INSERT INTO `Selection` (id, collectionId, photoId, createdAt) VALUES (?, ?, ?, ?)");
    $stmt->execute([$selectionId, $collectionId, $photoIdToSelect, date('Y-m-d H:i:s.v')]);

    echo json_encode(['status' => 'OK', 'selection' => ['id' => $selectionId, 'photoId' => $photoIdToSelect]]);
    exit;
}

// DELETE: Remove selection
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (empty($photoId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Photo ID required']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `Selection` WHERE collectionId = ? AND photoId = ?");
    $stmt->execute([$collectionId, $photoId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Selection not found']);
        exit;
    }

    echo json_encode(['status' => 'OK']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
```

**Router registration in backend/index.php:**
```php
// In default: block, after /share/{shareId} handler, add:
if (preg_match('#^/share/([^/]+)/selections(/.*)?$#', $requestUri, $matches)) {
    if (in_array($requestMethod, ['POST', 'DELETE'])) {
        require_once __DIR__ . '/collections/share-selections.php';
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
    }
    break;
}
```

**Why this works:**
- shareId acts as the authorization token — possession of the URL grants access
- Status gate (`status === 'SELECTING'`) ensures selections only work during the correct workflow stage
- No session required — fully stateless, works across devices/browsers
- Reuses existing generateCuid() and DB connection patterns

**Sources:**
- [PHP JWT & REST API Authentication Tutorial](https://www.techiediaries.com/php-jwt-authentication-tutorial/) - JWT patterns for stateless auth
- [Building a Secure User Authentication System in PHP](https://phpshare.org/building-a-secure-user-authentication-system-in-php/) - PDO security practices

### Pattern 2: Optimistic Selection UI with useState

**What:** Immediately toggle selection state in UI, send request to backend, roll back on error

**When to use:** Any user action where instant feedback improves perceived performance

**Example:**
```jsx
// frontend/src/pages/SharePage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function SharePage() {
  const { shareId } = useParams();
  const { t } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch collection + photos (existing code)
    const fetchCollection = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/share/${shareId}`);
      const data = await res.json();
      if (data.status === 'OK') {
        setCollection(data.collection);
        setPhotos(data.collection.photos || []);

        // NEW: Fetch existing selections to initialize state
        const selRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/share/${shareId}/selections`);
        if (selRes.ok) {
          const selData = await selRes.json();
          const ids = new Set((selData.selections || []).map(s => s.photoId));
          setSelectedPhotoIds(ids);
        }
      }
      setLoading(false);
    };
    fetchCollection();
  }, [shareId]);

  const toggleSelection = async (photoId) => {
    // Optimistic update
    const wasSelected = selectedPhotoIds.has(photoId);
    const nextSet = new Set(selectedPhotoIds);
    if (wasSelected) {
      nextSet.delete(photoId);
    } else {
      nextSet.add(photoId);
    }
    setSelectedPhotoIds(nextSet);

    // API call
    try {
      if (wasSelected) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/share/${shareId}/selections/${photoId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Deselect failed');
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/share/${shareId}/selections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });
        if (!res.ok) throw new Error('Select failed');
      }
    } catch (err) {
      // Rollback on error
      setSelectedPhotoIds(wasSelected ? new Set([...nextSet, photoId]) : new Set([...nextSet].filter(id => id !== photoId)));
      toast.error(t('share.selectionError'));
    }
  };

  // Render grid with selection checkboxes
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header with selection counter */}
      <div className="max-w-[720px] mx-auto py-10 px-6">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-gray-900">{collection?.name}</h1>
          {selectedPhotoIds.size > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 py-[6px] px-[14px] bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {t('share.selectedCount', { count: selectedPhotoIds.size })}
            </div>
          )}
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map(photo => {
            const isSelected = selectedPhotoIds.has(photo.id);
            return (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => toggleSelection(photo.id)}
              >
                <img
                  src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  onContextMenu={(e) => e.preventDefault()} // Block right-click
                  draggable="false" // Block drag-to-save
                />
                {/* Checkbox overlay */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white/80 border-gray-300 group-hover:border-blue-400'
                }`}>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Why this works:**
- Set-based state (`Set<photoId>`) provides O(1) lookup for "is this selected?"
- Optimistic update before API call gives instant feedback (no loading spinners on checkboxes)
- Rollback on error restores previous state, with toast notification explaining failure
- Grid click target is the entire photo card (large touch target, mobile-friendly)

**Sources:**
- [How to Use the Optimistic UI Pattern with the useOptimistic() Hook in React](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/)
- [Understanding optimistic UI and React's useOptimistic Hook](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)
- [React's useOptimistic documentation](https://react.dev/reference/react/useOptimistic)

### Pattern 3: Download Prevention (CSS + Event Listeners)

**What:** Block right-click context menu, drag-to-save, and add visual watermark/protection cues

**When to use:** Collection status is SELECTING (photos should not be downloadable yet)

**Example:**
```jsx
// In SharePage.jsx, conditionally apply protection based on collection.status
const canDownload = collection?.status === 'DELIVERED'; // Only DELIVERED allows downloads

// For each photo in grid:
<img
  src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
  alt={photo.filename}
  className="w-full h-full object-cover select-none"
  onContextMenu={(e) => !canDownload && e.preventDefault()}
  onDragStart={(e) => !canDownload && e.preventDefault()}
  draggable={canDownload}
  style={!canDownload ? { pointerEvents: 'auto', userSelect: 'none' } : {}}
/>
```

**CSS additions:**
```css
/* In Tailwind config or inline styles */
.no-download {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none; /* iOS Safari */
  pointer-events: auto; /* Allow clicks but block context menu */
}
```

**Why this works:**
- `onContextMenu={(e) => e.preventDefault()}` blocks right-click menu (save image option)
- `draggable="false"` prevents drag-to-desktop
- `user-select: none` prevents text selection of alt text
- Not foolproof (DevTools can still access), but effective deterrent for casual users
- Status-gated: only apply protections when `status !== 'DELIVERED'`

**Limitations to document:**
- These are deterrents, not security. Images are public URLs — anyone with DevTools can download.
- True protection requires watermarking (image processing) or private URLs with signed tokens.
- For v1, deterrent is sufficient; roadmap can include watermarking in v2.

**Sources:**
- [How to Disable Right Click on a Website Using JavaScript](https://coreui.io/blog/how-to-disable-right-click-on-a-website-using-javascript/)
- [Disable right click context menu on images](https://www.bloggersentral.com/2012/05/disable-right-click-on-images.html)

### Pattern 4: Running Counter Badge

**What:** Prominent badge showing "X photos selected" that updates in real-time as user toggles selections

**When to use:** Multi-select interfaces where user needs to track progress toward a goal (or just awareness)

**Example:**
```jsx
// In SharePage header, after collection name
{selectedPhotoIds.size > 0 && (
  <div className="mt-3 inline-flex items-center gap-2 py-[6px] px-[14px] bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    {t('share.selectedCount', { count: selectedPhotoIds.size })}
  </div>
)}
```

**i18n keys:**
```json
// en.json
"share": {
  "selectedCount_one": "{{count}} photo selected",
  "selectedCount_other": "{{count}} photos selected"
}

// lt.json
"share": {
  "selectedCount_one": "{{count}} nuotrauka pasirinkta",
  "selectedCount_few": "{{count}} nuotraukos pasirinktos",
  "selectedCount_many": "{{count}} nuotraukų pasirinkta",
  "selectedCount_other": "{{count}} nuotraukų pasirinkta"
}

// ru.json
"share": {
  "selectedCount_one": "{{count}} фото выбрано",
  "selectedCount_few": "{{count}} фото выбрано",
  "selectedCount_many": "{{count}} фото выбрано",
  "selectedCount_other": "{{count}} фото выбрано"
}
```

**Why this works:**
- Blue badge matches SELECTING status color (visual consistency with status system)
- Checkmark icon provides visual reinforcement
- Only shows when count > 0 (doesn't clutter UI when nothing selected)
- i18next pluralization handles "1 photo" vs "2 photos" correctly across all 3 languages

**Sources:**
- [React Badge component - Material UI](https://mui.com/material-ui/react-badge/)
- [React Badges - Flowbite](https://flowbite-react.com/docs/components/badge)

### Anti-Patterns to Avoid

- **Global state for selection:** SharePage is the only consumer — useState local to the component is sufficient. Zustand/Redux would be overkill.
- **Blocking UI during toggle:** Checkboxes should respond instantly (optimistic update), not show loading state. Loading spinners on every click are frustrating.
- **Re-fetching all selections after each toggle:** Defeats the purpose of optimistic updates. Only fetch selections on mount.
- **Using session auth for public selections API:** Client has no session — token-based (shareId) is required.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation library | Custom validation hooks | React Hook Form (if adding forms later) | Complex edge cases, error handling, accessibility |
| HTTP request management | Custom fetch wrappers | Native fetch (already in use) | Project avoids dependencies; fetch is sufficient |
| State management | Custom Context providers | useState (for local state) | Simplest solution; no cross-component sharing needed |
| Lightbox component | Custom lightbox from scratch | Existing lightbox in SharePage | Already built, keyboard nav included |

**Key insight:** This phase extends existing patterns (SharePage grid, lightbox, fetch calls) rather than introducing new abstractions. Resist the temptation to refactor what works.

## Common Pitfalls

### Pitfall 1: Status Gate Bypassed by Direct API Calls

**What goes wrong:** Client can POST to selections endpoint even when collection status is REVIEWING/DELIVERED if backend doesn't validate status.

**Why it happens:** Assuming frontend visibility toggle is sufficient security.

**How to avoid:** Always validate `collection.status === 'SELECTING'` in the backend before INSERT/DELETE on Selection table. Return 403 if status is wrong.

**Warning signs:** Selections appearing on collections in REVIEWING status; SQL constraint violations if photographer transitions status to DELIVERED before cleaning up.

### Pitfall 2: Selection State Lost on Page Reload

**What goes wrong:** User selects 10 photos, refreshes page, all selections gone.

**Why it happens:** useState initializes empty; no fetch of existing selections on mount.

**How to avoid:** On SharePage mount, after fetching collection, fetch `GET /share/{shareId}/selections` and initialize selectedPhotoIds Set from the response.

**Warning signs:** User reports "selections not saving"; selections exist in DB but don't render in UI.

### Pitfall 3: Race Condition on Rapid Toggle

**What goes wrong:** User rapidly clicks same photo 3 times, backend receives 3 requests, last one fails with "already exists" or "not found".

**Why it happens:** Optimistic updates don't prevent duplicate API calls.

**How to avoid:** Track in-flight requests with `requestInFlight` Map keyed by photoId; ignore clicks while request is pending.

```jsx
const [requestsInFlight, setRequestsInFlight] = useState(new Set());

const toggleSelection = async (photoId) => {
  if (requestsInFlight.has(photoId)) return; // Debounce
  setRequestsInFlight(prev => new Set(prev).add(photoId));

  // ... optimistic update + API call ...

  setRequestsInFlight(prev => {
    const next = new Set(prev);
    next.delete(photoId);
    return next;
  });
};
```

**Warning signs:** Console errors "Selection already exists" or "Selection not found" during rapid clicking; toast errors on every second click.

### Pitfall 4: Download Prevention Not Applied to Lightbox

**What goes wrong:** Grid images are protected, but lightbox full-resolution images can be right-click saved.

**Why it happens:** Protection event listeners only added to grid thumbnails.

**How to avoid:** Apply same `onContextMenu` and `draggable={false}` to lightbox `<img>` element.

**Warning signs:** Client reports "I can't save thumbnails but I can save the fullscreen images."

### Pitfall 5: i18n Pluralization Broken for Count Badge

**What goes wrong:** Badge shows "1 photos selected" or "2 photo selected" (wrong grammar).

**Why it happens:** Not using i18next pluralization suffixes (`_one`, `_other`, `_few`, etc.).

**How to avoid:** Use `t('share.selectedCount', { count: n })` and define all plural forms in locale files.

**Warning signs:** Grammar errors in English ("1 photos"); missing translations in LT/RU.

## Code Examples

Verified patterns from official sources and prior phase implementations:

### Fetch Existing Selections on Mount

```jsx
// In SharePage.jsx useEffect
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch collection (existing code)
      const collRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/share/${shareId}`);
      if (!collRes.ok) throw new Error('Collection fetch failed');
      const collData = await collRes.json();
      if (collData.status === 'OK') {
        setCollection(collData.collection);
        setPhotos(collData.collection.photos || []);
      }

      // NEW: Fetch existing selections
      const selRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/share/${shareId}/selections`);
      if (selRes.ok) {
        const selData = await selRes.json();
        const ids = new Set((selData.selections || []).map(s => s.photoId));
        setSelectedPhotoIds(ids);
      }
    } catch (err) {
      setError('error');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [shareId]);
```

### Backend GET /share/{shareId}/selections

```php
// NEW endpoint in backend/collections/share-selections.php
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // No status gate for GET — photographer may want to see selections even after transitioning to REVIEWING
    $stmt = $pdo->prepare("
        SELECT id, photoId, createdAt
        FROM `Selection`
        WHERE collectionId = ?
        ORDER BY createdAt ASC
    ");
    $stmt->execute([$collectionId]);
    $selections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'OK', 'selections' => $selections]);
    exit;
}
```

### Checkbox Overlay Component

```jsx
// In SharePage.jsx grid rendering
{photos.map(photo => {
  const isSelected = selectedPhotoIds.has(photo.id);
  const canSelect = collection?.status === 'SELECTING';

  return (
    <div
      key={photo.id}
      className={`relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100 ${canSelect ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={() => canSelect && toggleSelection(photo.id)}
    >
      <img
        src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
        alt={photo.filename}
        className="w-full h-full object-cover select-none"
        onContextMenu={(e) => collection?.status !== 'DELIVERED' && e.preventDefault()}
        draggable={collection?.status === 'DELIVERED'}
      />

      {/* Selection checkbox overlay (only show if status allows selection) */}
      {canSelect && (
        <div className={`absolute top-2 right-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white/80 border-gray-300 group-hover:border-blue-400'
        }`}>
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Visual indicator for download-disabled state (optional) */}
      {collection?.status === 'SELECTING' && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded">
          {t('share.selectOnly')}
        </div>
      )}
    </div>
  );
})}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session-based auth for all endpoints | Token-based public endpoints (shareId) | Phase 2 (2026-02-13) | Enables client access without accounts |
| Full page reload after mutations | Optimistic UI updates | React 19 (2024) | Instant feedback, better perceived performance |
| Checkbox-only selection UI | Whole-card click target with overlay | 2024-2026 trend | Larger touch targets, mobile-friendly |
| Download via separate button | Right-click + drag prevention | 2020s standard | Simpler UI, fewer actions |

**Deprecated/outdated:**
- jQuery-based lightbox plugins — React components are now standard
- Inline event handlers (`onclick="..."`) — React synthetic events and hooks are preferred
- CSS sprites for checkboxes — SVG icons inline are cleaner and scalable

## Open Questions

1. **Should selections persist after status transitions?**
   - What we know: Selections should be readable in REVIEWING status (photographer needs to see them)
   - What's unclear: Should clients be able to modify selections after photographer transitions to REVIEWING?
   - Recommendation: POST/DELETE return 403 if status !== SELECTING; GET always works. Photographer can see selections in Phase 4 even if client can't modify.

2. **Should there be a maximum selection limit?**
   - What we know: Requirements don't mention a limit; SELEC-03 (max selection count) is v2
   - What's unclear: Should v1 allow unlimited selections, or soft-cap with UI warning?
   - Recommendation: No hard limit for v1. Running counter provides awareness; photographer can request changes manually. Hard limit is complex (requires collection.maxSelections field, validation, UI blocking).

3. **Should selection state be synced across tabs?**
   - What we know: Client might open share link in multiple tabs
   - What's unclear: Should toggling selection in Tab A immediately update Tab B?
   - Recommendation: No for v1. Requires WebSocket or polling. Last-write-wins is acceptable; client refreshes to see latest state.

## Sources

### Primary (HIGH confidence)
- Database schema (C:\Users\Marius\Documents\Gemini\photo-hub\database_schema.sql) - Selection table structure
- Existing SharePage.jsx (frontend/src/pages/SharePage.jsx) - Current public gallery implementation
- Existing backend patterns (backend/collections/share.php, selections.php) - API structure and auth patterns
- [React's useOptimistic documentation](https://react.dev/reference/react/useOptimistic) - Official React 19 optimistic updates

### Secondary (MEDIUM confidence)
- [How to Use the Optimistic UI Pattern with useOptimistic Hook](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) - FreeCodeCamp tutorial on optimistic UI
- [Understanding optimistic UI and React's useOptimistic Hook](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/) - LogRocket deep dive
- [PHP JWT Authentication Tutorial](https://www.techiediaries.com/php-jwt-authentication-tutorial/) - Token-based auth patterns for PHP
- [Checkbox UI Design Best Practices](https://blog.logrocket.com/ux-design/checkbox-ui-design-best-practices-examples/) - LogRocket UX research
- [Gallery UI Design Best Practices - Mobbin](https://mobbin.com/glossary/gallery) - Industry patterns for photo galleries
- [How to Disable Right Click Using JavaScript - CoreUI](https://coreui.io/blog/how-to-disable-right-click-on-a-website-using-javascript/) - Download prevention techniques

### Tertiary (LOW confidence)
- WebSearch results on React state management 2026 - Multiple sources agree on useState for local state, Zustand/Jotai for global
- WebSearch results on gallery selection patterns - Consistent recommendations for whole-card click targets and overlay checkboxes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use; no new dependencies
- Architecture: HIGH - Extends proven patterns from Phases 1 and 2 (SharePage grid, lightbox, public endpoint)
- Pitfalls: MEDIUM - Some inferred from general React patterns; status gate and race condition risks are domain-specific

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - stable stack, no fast-moving dependencies)
