# Phase 15: Workflow Enhancement - Research

**Researched:** 2026-02-16
**Domain:** State-based progressive disclosure UI, workflow phase component extraction, conditional rendering patterns
**Confidence:** HIGH

## Summary

Phase 15 implements workflow-aware UI enhancements through progressive disclosure patterns and component extraction. The current CollectionDetailsPage.jsx (1,041 lines) contains all workflow phases in a single component with nested conditional logic. Requirements demand: (1) adaptive upload zone UI that shows full dropzone when empty and collapses to compact button after first upload, (2) state-aware action buttons that change per collection status, (3) component extraction for workflow phases, (4) object lookup pattern for conditional UI instead of nested ternaries.

The codebase already has primitives (Button, Badge, CollectionCard from Phase 14), i18n infrastructure (react-i18next with LT/EN/RU locales), and status-based UI patterns (badges, filter tabs). Current implementation issues: CollectionsListPage doesn't auto-navigate after creating collection (WORKFLOW-04), CollectionDetailsPage shows "Start client selection" button even with 0 photos (WORKFLOW-03), and upload zone doesn't adapt to photo count (WORKFLOW-01, WORKFLOW-02).

Industry patterns from top photographer platforms (Pixieset, Pic-Time, ShootProof) consistently use progressive disclosure where UI elements appear/disappear based on collection state and photo count. Upload zones collapse after first upload, workflow actions are hidden until prerequisites are met, and primary actions change based on workflow phase. Component extraction threshold: when a single component exceeds ~500 lines or handles multiple distinct workflow phases, extract phase-specific subcomponents.

**Primary recommendation:** Extract four workflow phase components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase) from CollectionDetailsPage, each rendering phase-specific actions and guidance. Use object lookup pattern for status-based button text/handlers. Implement conditional upload zone that renders full dropzone (730-755) when photoCount === 0, compact button (756-766) otherwise. Add useNavigate() hook to CollectionsListPage handleCreateCollection (lines 54-90) to navigate to `/collection/${newCollectionId}` after successful creation. Ensure all new i18n keys follow existing namespace pattern (collection.nextStep.DRAFT, collection.emptyState.DRAFT, etc.). Budget 300ms animation transitions using Tailwind duration-300 class.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component framework with hooks | Already installed; useNavigate, useState, useMemo for phase logic |
| React Router DOM | v7 | Navigation and routing | Already installed; useNavigate for programmatic navigation (WORKFLOW-04) |
| Tailwind CSS v3 | 3.4.19 | Utility-first styling | Already configured; transition-all duration-300 for animation budget (QUALITY-06) |
| clsx | 2.x | Conditional className composition | Already installed (Phase 12); use in phase components for dynamic classes |
| react-i18next | Latest | Internationalization | Already configured (LT/EN/RU); all new UI strings MUST use t() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Primitive components | Phase 12-14 | Button, Badge, CollectionCard | Already implemented; use Button variant="primary" for state-based primary actions |
| PHOTO_GRID_CLASSES | constants/styles.js | Shared grid layout classes | Already extracted (Phase 14); reuse in phase components if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Object lookup pattern | Nested ternaries | Object mapping provides readability and scalability; nested ternaries become unreadable with 4+ conditions (WORKFLOW-09) |
| Component extraction | Keep 1,041-line monolith | Single component harder to test, violates Single Responsibility; phase components isolate state/logic per workflow stage |
| useNavigate hook | window.location.href | useNavigate preserves SPA behavior, enables state passing, better UX with no full page reload |
| Conditional rendering (photo count) | CSS display:none | Conditional rendering (photoCount === 0 ? <Dropzone /> : <Button />) is React-idiomatic; CSS display:none still renders unused DOM |

**Installation:**
```bash
# No new dependencies required
# All patterns use existing React 18 + React Router v7 + Tailwind CSS v3
```

## Architecture Patterns

### Recommended Component Structure
```
frontend/src/
├── components/
│   ├── primitives/
│   │   ├── Button.jsx              # Phase 12 — use for all action buttons
│   │   ├── Badge.jsx               # Phase 12 — status badges (already has status colors)
│   │   └── CollectionCard.jsx      # Phase 14 — collections list card
│   └── collection/                 # NEW directory for workflow phase components
│       ├── DraftPhase.jsx          # NEW — renders DRAFT status actions and guidance
│       ├── SelectingPhase.jsx      # NEW — renders SELECTING status actions
│       ├── ReviewingPhase.jsx      # NEW — renders REVIEWING status actions (edited upload zone)
│       └── DeliveredPhase.jsx      # NEW — renders DELIVERED/DOWNLOADED status actions
├── constants/
│   └── styles.js                   # Existing — PHOTO_GRID_CLASSES
└── pages/
    ├── CollectionsListPage.jsx     # REFACTOR — add useNavigate() in handleCreateCollection
    └── CollectionDetailsPage.jsx   # REFACTOR — extract workflow phases, conditional upload zone
```

### Pattern 1: State-Based Component Extraction

**What:** Extract workflow phase logic into separate components that receive collection state and handlers as props.

**When to use:** When a single component handles multiple distinct UI states or exceeds ~500 lines. CollectionDetailsPage (1,041 lines) qualifies.

**Example:**
```jsx
// components/collection/DraftPhase.jsx
import { useTranslation } from 'react-i18next';
import Button from '../primitives/Button';

/**
 * DRAFT workflow phase component
 * Shows "Share with Client" and "Start Selecting" actions
 *
 * @param {Object} props
 * @param {Object} props.collection - Collection object with status, shareId, photoCount
 * @param {Function} props.onCopyShareLink - Handler for copying share link
 * @param {Function} props.onStartSelecting - Handler for status transition to SELECTING
 */
function DraftPhase({ collection, onCopyShareLink, onStartSelecting }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
      <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
        {t('collection.sharePhase')}
      </h3>

      {/* Next-step guidance (WORKFLOW-06) */}
      {collection.photoCount === 0 && (
        <p className="text-sm text-gray-600 mb-3">
          {t('collection.nextStep.DRAFT')}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={onCopyShareLink}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {t('collection.copyShareLink')}
        </Button>

        {/* Hide "Start Selecting" when no photos (WORKFLOW-03) */}
        {collection.photoCount > 0 && (
          <Button
            variant="secondary"
            onClick={onStartSelecting}
          >
            {t('collection.startSelecting')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default DraftPhase;
```

**Usage in CollectionDetailsPage:**
```jsx
// pages/CollectionDetailsPage.jsx
import DraftPhase from '../components/collection/DraftPhase';
import SelectingPhase from '../components/collection/SelectingPhase';
import ReviewingPhase from '../components/collection/ReviewingPhase';
import DeliveredPhase from '../components/collection/DeliveredPhase';

// Object lookup pattern for phase components (WORKFLOW-09)
const WORKFLOW_PHASES = {
  DRAFT: DraftPhase,
  SELECTING: SelectingPhase,
  REVIEWING: ReviewingPhase,
  DELIVERED: DeliveredPhase,
  DOWNLOADED: DeliveredPhase, // Same UI as DELIVERED
};

function CollectionDetailsPage() {
  // ... existing state and handlers ...

  const PhaseComponent = WORKFLOW_PHASES[collection.status];

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ... header ... */}

      {/* Workflow phase section */}
      {PhaseComponent && (
        <PhaseComponent
          collection={collection}
          onCopyShareLink={handleCopyShareLink}
          onCopyDeliveryLink={handleCopyDeliveryLink}
          onStartSelecting={handleStartSelecting}
          onMarkAsDelivered={handleMarkAsDelivered}
          editedPhotos={editedPhotos}
        />
      )}

      {/* ... upload zone, photo grid ... */}
    </div>
  );
}
```

### Pattern 2: Progressive Disclosure Upload Zone

**What:** Show full dropzone when collection is empty (photoCount === 0), collapse to compact button after first upload.

**When to use:** File upload interfaces where initial upload needs prominent CTA but subsequent uploads are secondary actions.

**Example:**
```jsx
// pages/CollectionDetailsPage.jsx (lines 718-793 refactored)
<div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
  <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
    {t("collection.photos")}
    {photos.length > 0 && (
      <span className="ml-2 text-xs font-normal text-gray-400 normal-case tracking-normal">
        {t("collection.photosCount", { count: photos.length })}
      </span>
    )}
  </h2>

  {/* Progressive disclosure: WORKFLOW-01, WORKFLOW-02 */}
  {photos.length === 0 ? (
    // Full dropzone when empty (WORKFLOW-01)
    <div
      role="button"
      tabIndex={0}
      aria-label={t("collection.uploadZoneLabel")}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-[10px] flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-all duration-300 select-none
        ${dragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
        }`}
    >
      <svg className={`w-9 h-9 ${dragOver ? "text-blue-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p className="m-0 text-sm font-medium text-gray-600">
        {t("collection.uploadZoneLabel")}
      </p>
      <p className="m-0 text-xs text-gray-400">
        {t("collection.uploadZoneHint")}
      </p>
    </div>
  ) : (
    // Compact button after first upload (WORKFLOW-02)
    <Button
      variant="secondary"
      onClick={() => fileInputRef.current?.click()}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {t('collection.addMorePhotos')}
    </Button>
  )}

  {/* Upload status indicators */}
  {anyUploading && (
    <p className="mt-3 mb-0 text-xs text-blue-600 font-medium animate-pulse">
      {t("collection.uploading")}
    </p>
  )}

  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    className="hidden"
    onChange={handleFileChange}
  />
</div>
```

### Pattern 3: Auto-Navigation After Form Submit

**What:** Use React Router's useNavigate hook to redirect user to collection details page after creating a new collection.

**When to use:** Form submissions where the next logical action is viewing/editing the created resource.

**Example:**
```jsx
// pages/CollectionsListPage.jsx (refactor lines 54-90)
import { useNavigate } from 'react-router-dom'; // ADD import

function CollectionsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ADD hook

  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");

  const handleCreateCollection = (event) => {
    event.preventDefault();

    if (!newCollectionName.trim()) {
      toast.error(t('collections.nameRequired'));
      return;
    }

    const name = newCollectionName;

    const createPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok && data.status === "OK") {
        setNewCollectionName("");

        // Auto-navigate to collection details (WORKFLOW-04)
        const newCollectionId = data.collection.id;
        navigate(`/collection/${newCollectionId}`);

        // Background: refresh collections list for accurate counts
        fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
          credentials: "include",
        }).then(async (updatedResponse) => {
          const updatedData = await updatedResponse.json();
          if (updatedData.status === "OK") {
            setCollections(updatedData.collections);
          }
        });
      } else {
        throw new Error(data.error || t('collections.createFailed'));
      }
    });

    toast.promise(createPromise, {
      loading: t('collections.creating'),
      success: t('collections.createSuccess'),
      error: (err) => err.message,
    });
  };

  // ... rest of component ...
}
```

**References:**
- [React Router useNavigate documentation](https://reactrouter.com/api/hooks/useNavigate)
- [Redirect on form submit pattern](https://bobbyhadz.com/blog/react-redirect-after-form-submit)

### Pattern 4: Object Lookup for Conditional Rendering

**What:** Use object/enum pattern instead of nested ternaries for readability and maintainability when rendering based on status.

**When to use:** Conditional UI with 3+ branches (collection status has 5+ states).

**Example:**
```jsx
// Anti-pattern: Nested ternaries (HARD TO READ)
const primaryAction = collection.status === 'DRAFT'
  ? handleCopyShareLink
  : collection.status === 'SELECTING'
  ? handleCopyShareLink
  : collection.status === 'REVIEWING'
  ? handleMarkAsDelivered
  : collection.status === 'DELIVERED'
  ? handleCopyDeliveryLink
  : null;

// Better: Object lookup pattern (WORKFLOW-09)
const PRIMARY_ACTIONS = {
  DRAFT: {
    label: t('collection.copyShareLink'),
    handler: handleCopyShareLink,
    icon: 'share',
  },
  SELECTING: {
    label: t('collection.copyShareLink'),
    handler: handleCopyShareLink,
    icon: 'share',
  },
  REVIEWING: {
    label: t('collection.markAsDelivered'),
    handler: handleMarkAsDelivered,
    icon: 'check',
    disabled: editedPhotos.length === 0,
  },
  DELIVERED: {
    label: t('collection.copyDeliveryLink'),
    handler: handleCopyDeliveryLink,
    icon: 'download',
  },
  DOWNLOADED: {
    label: t('collection.copyDeliveryLink'),
    handler: handleCopyDeliveryLink,
    icon: 'download',
  },
};

const primaryAction = PRIMARY_ACTIONS[collection.status];

// Usage
{primaryAction && (
  <Button
    variant="primary"
    onClick={primaryAction.handler}
    disabled={primaryAction.disabled}
  >
    {primaryAction.label}
  </Button>
)}
```

**References:**
- [React conditional rendering patterns](https://www.robinwieruch.de/conditional-rendering-react/)
- [Object mapping vs ternary operators](https://profy.dev/article/react-conditional-render)

### Anti-Patterns to Avoid

- **Monolithic page components:** CollectionDetailsPage at 1,041 lines violates Single Responsibility Principle. Extract phase-specific logic into subcomponents.
- **Nested ternaries for multi-state UI:** Unreadable with 4+ conditions. Use object lookup pattern.
- **Static upload UI:** Upload zone should adapt to photo count. Progressive disclosure improves UX.
- **Manual navigation after form submit:** `window.location.href` breaks SPA behavior. Use `useNavigate()`.
- **Hardcoded strings in JSX:** All user-visible text must use `t()` for i18n (QUALITY-08).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Programmatic navigation | Custom history management with window.location | React Router's `useNavigate()` hook | Built-in SPA state preservation, cleaner API, handles edge cases (base path, hash routing) |
| Conditional class composition | Manual string concatenation with ternaries | `clsx` library | Handles null/undefined, array flattening, object conditionals cleanly |
| Animation timing | Custom setTimeout/setInterval for transitions | Tailwind duration utilities (duration-300) | Hardware-accelerated CSS transitions, no JS overhead, declarative |
| Component state management | Prop drilling through 5+ levels | Context or custom hooks | Cleaner API, avoids prop threading, easier testing |

**Key insight:** React Router, clsx, and Tailwind provide battle-tested solutions for navigation, class composition, and animations. Custom solutions miss edge cases (base URLs, SSR, browser inconsistencies) that libraries already handle.

## Common Pitfalls

### Pitfall 1: Extracting Components Too Early or Too Late

**What goes wrong:** Extracting tiny components with single <div> creates unnecessary abstraction. Waiting until 2,000-line components creates technical debt.

**Why it happens:** Misunderstanding Single Responsibility Principle or premature optimization.

**How to avoid:** Extract when:
1. Component exceeds ~500 lines
2. Component handles multiple distinct workflow phases/states
3. Logic is reusable in 2+ places
4. Testing requires complex setup due to intertwined concerns

**Warning signs:**
- Scrolling to find code within single component
- Difficult to name component because it "does everything"
- Tests require mocking 10+ dependencies

**References:**
- [When to break up a component](https://kentcdodds.com/blog/when-to-break-up-a-component-into-multiple-components)
- [React component composition patterns](https://www.developerway.com/posts/components-composition-how-to-get-it-right)

### Pitfall 2: Breaking SPA Behavior with Manual Navigation

**What goes wrong:** Using `window.location.href = '/path'` causes full page reload, losing SPA benefits (state, performance, transitions).

**Why it happens:** Unfamiliarity with React Router programmatic navigation patterns.

**How to avoid:** Always use `useNavigate()` hook from React Router v7 for programmatic navigation. Pass state via second argument if needed: `navigate('/path', { state: { data } })`.

**Warning signs:**
- Page flash/reload after form submit
- Loss of scroll position after navigation
- State reset when user navigates back

**References:**
- [React Router useNavigate](https://reactrouter.com/api/hooks/useNavigate)
- [Programmatic navigation in React Router](https://crsinfosolutions.com/how-can-you-master-programmatically-navigation-in-react-router/)

### Pitfall 3: Nested Ternaries for Complex Conditional Logic

**What goes wrong:** Chaining 4+ ternary operators creates unreadable, unmaintainable code. Adding new conditions requires rewriting entire expression.

**Why it happens:** Quick fix mentality ("just one more condition") or lack of awareness of object lookup pattern.

**How to avoid:** Use object lookup pattern when rendering based on enum with 3+ values. Example: `const config = CONFIG_MAP[status]; return <Component {...config} />`

**Warning signs:**
- Ternaries nested 3+ levels deep
- ESLint warnings about complexity
- Difficulty explaining logic to teammates

**References:**
- [React conditional rendering best practices](https://profy.dev/article/react-conditional-render)
- [Object mapping for conditional UI](https://www.robinwieruch.de/conditional-rendering-react/)

### Pitfall 4: Ignoring Animation Performance Budget

**What goes wrong:** Long animations (500ms+) feel sluggish. Multiple simultaneous animations cause jank on low-end devices.

**Why it happens:** Lack of performance testing on target hardware or arbitrary duration choices.

**How to avoid:**
- Use 200-400ms for most UI transitions (300ms is balanced target)
- Test on mid-range mobile devices (not just desktop)
- Use hardware-accelerated properties (transform, opacity) not layout properties (width, height, top, left)
- Limit concurrent animations to 2-3 elements

**Warning signs:**
- User feedback about "slow" UI
- Frame drops in Chrome DevTools Performance tab
- Animations feel "floaty" or unresponsive

**References:**
- [CSS animation performance guide](https://devtoolbox.dedyn.io/blog/css-animations-complete-guide)
- [React animation optimization](https://www.angularminds.com/blog/must-know-tips-and-tricks-to-optimize-performance-in-react-animations)

### Pitfall 5: Missing i18n for Workflow Guidance Text

**What goes wrong:** Adding new UI strings without i18n keys breaks non-English users. Mixing hardcoded and translated strings creates inconsistent UX.

**Why it happens:** Forgetting to add keys to all three locale files (en.json, lt.json, ru.json) or using hardcoded strings during rapid prototyping.

**How to avoid:**
1. Add i18n keys before writing JSX: `collection.nextStep.DRAFT`, `collection.emptyState.DRAFT`
2. Add translations to ALL locale files simultaneously (en, lt, ru)
3. Use `t()` for ALL user-visible strings, even "obvious" ones like "OK" or "Cancel"
4. Run project-wide search for `>{` and `"` to find hardcoded strings in JSX

**Warning signs:**
- Language switcher shows English fallback for new features
- Mixed language UI (some parts translated, others English)
- Translation keys logged as missing in console

## Code Examples

Verified patterns from React Router v7 and Phase 14 implementation:

### Example 1: Auto-Navigation After Collection Create (WORKFLOW-04)

```jsx
// pages/CollectionsListPage.jsx
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function CollectionsListPage() {
  const navigate = useNavigate();

  const handleCreateCollection = async (event) => {
    event.preventDefault();

    const createPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCollectionName }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok && data.status === "OK") {
        // Navigate immediately to new collection details
        navigate(`/collection/${data.collection.id}`);
        setNewCollectionName("");
      } else {
        throw new Error(data.error || t('collections.createFailed'));
      }
    });

    toast.promise(createPromise, {
      loading: t('collections.creating'),
      success: t('collections.createSuccess'),
      error: (err) => err.message,
    });
  };

  // ... rest of component
}
```

### Example 2: Conditional Upload Zone with Progressive Disclosure (WORKFLOW-01, WORKFLOW-02)

```jsx
// pages/CollectionDetailsPage.jsx
function CollectionDetailsPage() {
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
      <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
        {t("collection.photos")}
        {photos.length > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-400 normal-case tracking-normal">
            {t("collection.photosCount", { count: photos.length })}
          </span>
        )}
      </h2>

      {/* Show full dropzone when empty */}
      {photos.length === 0 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-[10px] flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-all duration-300 border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
        >
          <svg className="w-9 h-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="m-0 text-sm font-medium text-gray-600">
            {t("collection.uploadZoneLabel")}
          </p>
          <p className="m-0 text-xs text-gray-400">
            {t("collection.uploadZoneHint")}
          </p>
        </div>
      ) : (
        /* Show compact button after first upload */
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('collection.addMorePhotos')}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
```

### Example 3: Workflow Phase Component with Object Lookup (WORKFLOW-08, WORKFLOW-09)

```jsx
// components/collection/DraftPhase.jsx
import { useTranslation } from 'react-i18next';
import Button from '../primitives/Button';

function DraftPhase({ collection, onCopyShareLink, onStartSelecting }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
      <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
        {t('collection.sharePhase')}
      </h3>

      {/* Next-step guidance (WORKFLOW-06) */}
      {collection.photoCount === 0 && (
        <p className="text-sm text-gray-600 mb-3">
          {t('collection.nextStep.DRAFT')}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={onCopyShareLink}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {t('collection.copyShareLink')}
        </Button>

        {/* Hide "Start Selecting" when no photos (WORKFLOW-03) */}
        {collection.photoCount > 0 && (
          <Button variant="secondary" onClick={onStartSelecting}>
            {t('collection.startSelecting')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default DraftPhase;

// pages/CollectionDetailsPage.jsx - Usage
import DraftPhase from '../components/collection/DraftPhase';
import SelectingPhase from '../components/collection/SelectingPhase';
import ReviewingPhase from '../components/collection/ReviewingPhase';
import DeliveredPhase from '../components/collection/DeliveredPhase';

// Object lookup pattern (WORKFLOW-09)
const WORKFLOW_PHASES = {
  DRAFT: DraftPhase,
  SELECTING: SelectingPhase,
  REVIEWING: ReviewingPhase,
  DELIVERED: DeliveredPhase,
  DOWNLOADED: DeliveredPhase,
};

function CollectionDetailsPage() {
  const [collection, setCollection] = useState(null);

  const PhaseComponent = WORKFLOW_PHASES[collection?.status];

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {PhaseComponent && (
        <PhaseComponent
          collection={collection}
          onCopyShareLink={handleCopyShareLink}
          onCopyDeliveryLink={handleCopyDeliveryLink}
          onStartSelecting={handleStartSelecting}
          onMarkAsDelivered={handleMarkAsDelivered}
          editedPhotos={editedPhotos}
        />
      )}
    </div>
  );
}
```

### Example 4: Empty State with State-Specific Guidance (WORKFLOW-07)

```jsx
// Object lookup pattern for empty state messages
const EMPTY_STATE_MESSAGES = {
  DRAFT: {
    title: t('collection.emptyState.DRAFT.title'),
    subtitle: t('collection.emptyState.DRAFT.subtitle'),
    icon: 'upload',
  },
  SELECTING: {
    title: t('collection.emptyState.SELECTING.title'),
    subtitle: t('collection.emptyState.SELECTING.subtitle'),
    icon: 'waiting',
  },
  REVIEWING: {
    title: t('collection.emptyState.REVIEWING.title'),
    subtitle: t('collection.emptyState.REVIEWING.subtitle'),
    icon: 'edit',
  },
  DELIVERED: {
    title: t('collection.emptyState.DELIVERED.title'),
    subtitle: t('collection.emptyState.DELIVERED.subtitle'),
    icon: 'check',
  },
};

// Usage
{photos.length === 0 && !anyUploading && (
  <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {/* Icon based on status */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {/* Render icon based on EMPTY_STATE_MESSAGES[collection.status].icon */}
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        {EMPTY_STATE_MESSAGES[collection.status]?.title}
      </h3>
      <p className="text-sm text-gray-500">
        {EMPTY_STATE_MESSAGES[collection.status]?.subtitle}
      </p>
    </div>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic page components (1,000+ lines) | Extract phase-specific components (~100-200 lines each) | 2024-2026 React best practices | Improved testability, readability, maintenance |
| Nested ternaries for multi-state UI | Object lookup pattern with enum keys | 2025+ React patterns | Cleaner conditional logic, easier to extend |
| window.location.href for navigation | React Router useNavigate() hook | React Router v6+ (2021) | SPA-native navigation, state preservation |
| Static upload UI | Progressive disclosure (adapt to state) | Industry standard (Pixieset, Pic-Time) | Better UX, clearer workflow guidance |
| CSS transitions with JS setTimeout | Tailwind duration utilities | Tailwind v3+ (2021) | Declarative, hardware-accelerated, no JS overhead |

**Deprecated/outdated:**
- **withRouter HOC:** Replaced by useNavigate() hook in React Router v6+
- **Manual CSS class strings:** Replaced by clsx for conditional composition
- **Component class mixins:** Replaced by custom hooks for shared logic
- **Prop drilling for deep state:** Replaced by Context or state management libraries

## Open Questions

1. **Should ReviewingPhase show edited photo count in header?**
   - What we know: Current UI shows edited photo count as "(X files)" in card header (line 911)
   - What's unclear: Whether this duplicates info shown in phase component actions
   - Recommendation: Keep count in header for quick status check; phase component focuses on actions

2. **Should DeliveredPhase/DownloadedPhase merge into single component?**
   - What we know: Both statuses show same UI (copy delivery link button)
   - What's unclear: Whether future requirements will diverge these UIs
   - Recommendation: Create single DeliveredPhase component, handle both statuses in object lookup (DOWNLOADED: DeliveredPhase)

3. **Empty state icons — use emoji or SVG?**
   - What we know: Current UI uses emoji (🗂️) for collection icon (line 604)
   - What's unclear: Whether empty states should follow same pattern or use styled SVG icons
   - Recommendation: Use SVG for empty states (more control over size/color); keep emoji for collection avatar

4. **Next-step guidance placement — above or below primary action?**
   - What we know: Industry patterns show contextual help near primary CTA
   - What's unclear: Whether guidance text should be prominent header or subtle helper text
   - Recommendation: Show as subtle helper text below status badge (WORKFLOW-06) to avoid overwhelming interface

5. **Animation timing for upload zone collapse — instant or fade?**
   - What we know: Phase requires <300ms animation budget (QUALITY-06)
   - What's unclear: Whether progressive disclosure should be instant swap or transitional fade
   - Recommendation: Use instant conditional render (no animation) — transition between completely different UI patterns (dropzone vs button) looks jarring; instant swap is clearer

## Sources

### Primary (HIGH confidence)
- **Phase 14 RESEARCH.md** — CollectionCard patterns, primitive component usage, Tailwind patterns
- **CollectionDetailsPage.jsx** (lines 1-1041) — Current implementation, state management, handler patterns
- **CollectionsListPage.jsx** (lines 1-253) — Collection creation flow, current list UI
- **Button.jsx, Badge.jsx, CollectionCard.jsx** — Primitive components for reuse in phase components
- **WORKFLOW-PATTERNS.md** — Industry research on photographer platform workflows (Pixieset, Pic-Time, ShootProof)
- **REQUIREMENTS.md** — WORKFLOW-01 through WORKFLOW-09, QUALITY-06 specifications
- [React Router useNavigate](https://reactrouter.com/api/hooks/useNavigate) — Official v7 navigation documentation
- [React conditional rendering](https://react.dev/learn/conditional-rendering) — Official React patterns

### Secondary (MEDIUM confidence)
- [When to break up a component into multiple components](https://kentcdodds.com/blog/when-to-break-up-a-component-into-multiple-components) — Component extraction heuristics
- [React components composition: how to get it right](https://www.developerway.com/posts/components-composition-how-to-get-it-right) — Composition patterns
- [React conditional rendering best practices](https://profy.dev/article/react-conditional-render) — Object lookup vs nested ternaries
- [React conditional rendering guide](https://www.robinwieruch.de/conditional-rendering-react/) — Multiple pattern comparisons
- [CSS Animations: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/css-animations-complete-guide) — Animation performance budgets
- [Progressive Disclosure - Interaction Design Foundation](https://www.interaction-design.org/literature/topics/progressive-disclosure) — UI pattern principles
- [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/) — UX best practices

### Tertiary (LOW confidence)
- [Building Reusable React Components in 2026](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4) — General React patterns (not specifically verified for this project)
- [Redirect on form submit using React Router](https://bobbyhadz.com/blog/react-redirect-after-form-submit) — useNavigate examples (general pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — All libraries already installed (React 18, React Router v7, Tailwind v3, clsx)
- Architecture patterns: **HIGH** — Phase component extraction verified from Kent C. Dodds guidance; object lookup pattern documented in React docs
- Progressive disclosure: **HIGH** — Pattern verified from industry research (WORKFLOW-PATTERNS.md) and IxDF/NN/G sources
- Animation budget: **MEDIUM** — 300ms guideline from CSS animation research; needs verification on target devices
- Pitfalls: **HIGH** — Based on current codebase issues (1,041-line component, nested ternaries in lines 659-666)

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days — stable patterns, no fast-moving dependencies)

**Phase dependencies:**
- Phase 12: Button, Badge primitives (stable)
- Phase 13: Responsive layouts, mobile nav (stable)
- Phase 14: CollectionCard, grid classes (just shipped)

**Key risks:**
1. **Component extraction scope creep** — Temptation to over-extract tiny components. Mitigation: Only extract 4 phase components per requirements.
2. **i18n key sprawl** — Adding 20+ new keys across 3 locales. Mitigation: Use structured namespace (collection.nextStep.DRAFT, collection.emptyState.DRAFT).
3. **Breaking existing features** — Refactoring 1,041-line component risks regressions. Mitigation: Incremental refactor (extract one phase component, test, repeat).

**Planner handoff notes:**
- WORKFLOW-04 (auto-navigation) is HIGH priority — small change, big UX win
- WORKFLOW-01/02 (upload zone progressive disclosure) is LOW complexity, already has current implementation as reference (lines 730-793)
- WORKFLOW-08 (component extraction) is MEDIUM complexity — needs careful prop design for phase components
- All new i18n keys need to be added to en.json, lt.json, ru.json simultaneously to avoid broken translations
