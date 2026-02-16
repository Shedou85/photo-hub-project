# Phase 14: Collection Cards & Simple Pages - Research

**Researched:** 2026-02-16
**Domain:** Collection card redesign with edge-to-edge images, gradient overlays, and status badge enhancements
**Confidence:** HIGH

## Summary

Phase 14 refactors collection cards on CollectionsListPage and applies primitive components to client-facing pages (SharePage, DeliveryPage). The current implementation uses tilt animations, status borders, and standard card layouts, but fails CARDS-01 through CARDS-05 requirements. Collection cards need edge-to-edge cover images with gradient overlays for text legibility, rounded corners with hover elevation effects, and status badges with colored dots instead of full-color backgrounds.

The codebase already has primitive components from Phase 12 (Button, Card, Badge, PhotoCard, UploadZone) and responsive layouts from Phase 13 (mobile bottom nav, desktop sidebar, responsive photo grids). Phase 14 applies these primitives to client-facing pages and creates a new CollectionCard component that enforces the edge-to-edge cover image pattern with gradient overlay.

Photo grids already use native lazy loading (`loading="lazy"` on PhotoCard.jsx line 61, SharePage.jsx line 228, DeliveryPage.jsx line 173), satisfying QUALITY-05. The challenge is extracting Tailwind class duplication across pages (QUALITY-07) and ensuring all new UI strings maintain i18n (QUALITY-08).

**Primary recommendation:** Create CollectionCard component with edge-to-edge cover image, multi-stop gradient overlay (from-black/70 via-black/20 to-transparent), and status badge with colored dot prefix. Apply Button and Card primitives to SharePage and DeliveryPage to eliminate inline gradient buttons and repeated card patterns. Extract photo grid pattern to shared constant or utility component if used 3+ times. Test touch targets on mobile (48×48px minimum per LAYOUT-03) and hover states on collection cards (300ms transition, shadow-lg elevation).

**Key decisions:**
- CollectionCard: Edge-to-edge image with absolute positioned content overlay using gradient `from-black/70 via-black/20 to-transparent`
- Status badges: Add colored dot prefix with `w-2 h-2 rounded-full` inline element matching badge color
- Hover effects: `transition-all duration-300 hover:-translate-y-1 hover:shadow-lg` for subtle elevation
- Border radius: `rounded-[16px]` for collection cards (16px per CARDS-04), maintain `rounded-sm` (8px) for photo cards
- Touch targets: Increase Share/Delete buttons on collection cards from current 24×24px icons to 48×48px tap areas

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component framework | Already installed; used for all pages and components |
| Tailwind CSS v3 | 3.4.19 | Utility-first styling | Already configured with design tokens; gradient overlays use arbitrary values |
| Primitive components | Phase 12 | Button, Card, Badge, PhotoCard | Already implemented; refactor pages to use these instead of inline patterns |
| clsx | 2.x | Conditional className composition | Already installed (Phase 12); use for conditional status badge dot colors |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-i18next | Latest | Internationalization | Already installed; all new UI strings MUST use `t()` with keys in en.json, lt.json, ru.json |
| Native lazy loading | Browser native | Image lazy loading with `loading="lazy"` | Already implemented in PhotoCard; no additional library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `loading="lazy"` | react-lazy-load-image-component | Native lazy loading supported in all modern browsers (2026); no need for external library (2KB savings) |
| Multi-stop gradient overlay | Single-color overlay with opacity | Multi-stop gradient (black/70 → black/20 → transparent) provides better text legibility across varied image content; single-color less flexible |
| CollectionCard component | Extract to @apply CSS class | React component allows prop-based customization (onClick, status, coverImage); @apply only suitable for small utilities |
| Colored dot in Badge | Separate DotBadge component | Dot is 5-line addition to existing Badge; no need for separate component (YAGNI principle) |

**Installation:**
```bash
# No new dependencies required
# All patterns use existing React 18 + Tailwind CSS v3 + Phase 12 primitives
```

## Architecture Patterns

### Recommended Component Structure
```
frontend/src/
├── components/
│   ├── primitives/
│   │   ├── Button.jsx              # Phase 12 — already implemented
│   │   ├── Card.jsx                # Phase 12 — already implemented
│   │   ├── Badge.jsx               # Phase 12 — UPDATE with colored dot variant
│   │   ├── PhotoCard.jsx           # Phase 12 — already has lazy loading
│   │   ├── CollectionCard.jsx      # NEW — edge-to-edge cover with gradient overlay
│   │   └── UploadZone.jsx          # Phase 12 — already implemented
│   └── BottomNavigation.jsx        # Phase 13 — already implemented
└── pages/
    ├── CollectionsListPage.jsx     # REFACTOR — use CollectionCard component
    ├── SharePage.jsx               # REFACTOR — replace inline buttons with Button primitive
    └── DeliveryPage.jsx            # REFACTOR — replace inline buttons with Button primitive
```

### Pattern 1: CollectionCard with Edge-to-Edge Cover Image and Gradient Overlay

**What:** Reusable collection card component with edge-to-edge cover image, multi-stop gradient overlay for text legibility, and hover elevation effect.

**When to use:** CollectionsListPage grid of collection cards. Replaces current inline card implementation (lines 217-293).

**Example:**
```jsx
// components/primitives/CollectionCard.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import Badge from './Badge';

/**
 * Collection card with edge-to-edge cover image and gradient overlay.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Collection ID for navigation
 * @param {string} props.name - Collection name
 * @param {string} props.createdAt - ISO date string
 * @param {number} props.photoCount - Number of photos in collection
 * @param {string} props.status - Collection status (DRAFT, SELECTING, REVIEWING, DELIVERED, DOWNLOADED)
 * @param {string} [props.coverImageUrl] - Cover photo URL (optional)
 * @param {React.ReactNode} props.actions - Action buttons (Share, Delete)
 * @returns {JSX.Element} CollectionCard component
 *
 * @example
 * <CollectionCard
 *   id="cuid123"
 *   name="Wedding Photos"
 *   createdAt="2026-02-16T10:00:00Z"
 *   photoCount={42}
 *   status="SELECTING"
 *   coverImageUrl="/uploads/cover.jpg"
 *   actions={
 *     <>
 *       <Button variant="secondary" size="sm" onClick={handleShare}>Share</Button>
 *       <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * />
 */
function CollectionCard({
  id,
  name,
  createdAt,
  photoCount,
  status,
  coverImageUrl,
  actions,
}) {
  const { t } = useTranslation();

  return (
    <div className="group relative bg-white rounded-[16px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Clickable cover image area */}
      <Link
        to={`/collection/${id}`}
        className="block relative w-full aspect-[3/2] overflow-hidden no-underline"
      >
        {/* Cover image (edge-to-edge, no padding) */}
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white text-5xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-bold mb-1 truncate drop-shadow-md">
            {name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <span>{t('collections.photosCount', { count: photoCount })}</span>
            <span>•</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Hover overlay with "View Collection" text */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-lg font-semibold px-4 py-2 bg-black/50 rounded-md">
            {t('collections.viewCollection')}
          </span>
        </div>
      </Link>

      {/* Status badge (top-right, absolute positioned) */}
      {status !== 'DRAFT' && (
        <div className="absolute top-3 right-3 z-10">
          <Badge status={status} showDot>
            {t(`collections.status.${status}`)}
          </Badge>
        </div>
      )}

      {/* Actions section */}
      <div className="p-4 flex gap-2">
        {actions}
      </div>
    </div>
  );
}

export default CollectionCard;
```

**Key features:**
- Edge-to-edge cover image with `aspect-[3/2]` (3:2 aspect ratio common for photo collections)
- Multi-stop gradient overlay: `from-black/70 via-black/20 to-transparent` ensures text legibility on both dark and light images
- Hover effects: `hover:-translate-y-1 hover:shadow-lg` creates subtle elevation (300ms duration)
- `rounded-[16px]` for collection card corners (16px per CARDS-04)
- `group-hover:scale-105` on image creates Ken Burns zoom effect
- Status badge absolutely positioned top-right with z-10 to stay above gradient overlay

**Source:** [Why Your Card Design Needs a Gradient Overlay (and How to Do It)](https://medium.com/@lilskyjuicebytes/why-your-card-design-needs-a-gradient-overlay-and-how-to-do-it-b142393572e1), [Card Hover Effects in Tailwind CSS](https://www.tailwindtap.com/blog/card-hover-effects-in-tailwind-css)

### Pattern 2: Badge Component with Colored Dot Prefix

**What:** Enhance existing Badge component (Phase 12) with optional colored dot prefix for status indication.

**When to use:** Status badges on collection cards where colored dot provides quick visual cue without requiring user to read text.

**Example:**
```jsx
// components/primitives/Badge.jsx (UPDATE existing component)
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Status badge component with optional colored dot prefix.
 *
 * @param {Object} props - Component props
 * @param {'DRAFT' | 'SELECTING' | 'REVIEWING' | 'DELIVERED' | 'DOWNLOADED'} props.status - Collection status
 * @param {boolean} [props.showDot=false] - Show colored dot prefix
 * @param {React.ReactNode} props.children - Badge text
 * @returns {JSX.Element} Badge component
 *
 * @example
 * // Without dot (existing behavior)
 * <Badge status="SELECTING">Selecting</Badge>
 *
 * @example
 * // With colored dot (new for Phase 14 collection cards)
 * <Badge status="SELECTING" showDot>Selecting</Badge>
 */
function Badge({ status, showDot = false, children }) {
  const baseClasses = 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full';

  const statusClasses = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SELECTING: 'bg-blue-100 text-blue-700',
    REVIEWING: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-purple-100 text-purple-700',
    DOWNLOADED: 'bg-purple-200 text-purple-800',
  };

  const dotColors = {
    DRAFT: 'bg-gray-600',
    SELECTING: 'bg-blue-700',
    REVIEWING: 'bg-green-700',
    DELIVERED: 'bg-purple-700',
    DOWNLOADED: 'bg-purple-800',
  };

  return (
    <span className={clsx(baseClasses, statusClasses[status])}>
      {showDot && (
        <span className={clsx('w-2 h-2 rounded-full', dotColors[status])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

Badge.propTypes = {
  status: PropTypes.oneOf(['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED']).isRequired,
  showDot: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Badge;
```

**Key features:**
- `showDot` prop preserves backward compatibility (defaults to false)
- Colored dot uses `w-2 h-2 rounded-full` (8×8px, per CARDS-05)
- Dot color matches status text color for visual consistency
- `inline-flex items-center gap-1.5` aligns dot and text with 6px spacing
- `aria-hidden="true"` on dot prevents screen readers from announcing decorative element

**Source:** [Carbon Design System - Status Indicator Pattern](https://carbondesignsystem.com/patterns/status-indicator-pattern/), [Status badge | Agriculture Design System](https://design-system.agriculture.gov.au/components/status-badge)

### Pattern 3: Replacing Inline Gradient Buttons with Button Primitive

**What:** Refactor SharePage and DeliveryPage to use Button primitive instead of inline gradient buttons with repeated classes.

**When to use:** Any page with gradient buttons that duplicate Phase 12 Button component styling.

**Example:**
```jsx
// BEFORE (SharePage.jsx lines 274-280)
<button
  onClick={submitSelections}
  disabled={isSubmitting}
  className="w-full sm:w-auto bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white font-semibold text-base py-3.5 px-8 rounded hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer border-none font-sans"
>
  {isSubmitting ? t('share.submitting') : t('share.submitSelections', { count: selectedPhotoIds.size })}
</button>

// AFTER (use Button primitive)
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

**Benefit:** Eliminates 18 inline Tailwind classes repeated 3+ times across SharePage and DeliveryPage. Button component already handles gradient, hover states, disabled state, and responsive sizing. Satisfies QUALITY-07 (no class duplication after 3rd usage).

**Source:** [Reusing Styles - Tailwind CSS](https://v3.tailwindcss.com/docs/reusing-styles), [Building Reusable React Components Using Tailwind — Smashing Magazine](https://www.smashingmagazine.com/2020/05/reusable-react-components-tailwind/)

### Pattern 4: Touch Target Sizing for Mobile

**What:** Ensure all interactive elements on collection cards meet LAYOUT-03 minimum touch target size (48×48px).

**When to use:** Collection card action buttons (Share, Delete) that are currently too small for comfortable mobile tapping.

**Example:**
```jsx
// BEFORE (CollectionsListPage.jsx lines 270-288 — buttons with 24×24px icons, insufficient touch area)
<button
  onClick={() => handleShareCollection(collection.id, collection.shareId)}
  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-sm transition-colors duration-150"
>
  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {/* ... */}
  </svg>
  {copiedId === collection.id ? t('collections.linkCopied') : t('collections.shareCollection')}
</button>

// AFTER (use Button primitive with proper touch targets)
<Button
  variant="secondary"
  size="sm"
  onClick={() => handleShareCollection(collection.id, collection.shareId)}
  className="min-h-[48px] flex-1"
>
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {/* ... */}
  </svg>
  {copiedId === collection.id ? t('collections.linkCopied') : t('collections.shareCollection')}
</Button>
```

**Key features:**
- `min-h-[48px]` ensures 48px minimum tap area (WCAG 2.2 Level AA per LAYOUT-03)
- Button primitive `size="sm"` provides `py-1.5 px-3` (6px/12px padding) which with icon + text = 48px height
- Icon size increased from `w-3 h-3` (12×12px) to `w-4 h-4` (16×16px) for better visibility
- `flex-1` allows buttons to share available width equally

**Source:** [WCAG 2.2 Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)

### Pattern 5: Extracting Photo Grid Pattern

**What:** Photo grids appear in CollectionDetailsPage, SharePage, DeliveryPage with identical responsive classes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`).

**When to use:** When a Tailwind class pattern appears 3+ times across the codebase (QUALITY-07).

**Example:**
```jsx
// Option 1: Extract to shared constant (simple, no logic)
// src/constants/styles.js
export const PHOTO_GRID_CLASSES = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';

// Usage in pages:
<div className={PHOTO_GRID_CLASSES}>
  {photos.map(photo => <PhotoCard key={photo.id} {...photo} />)}
</div>

// Option 2: Create wrapper component (if logic needed)
// components/PhotoGrid.jsx
function PhotoGrid({ photos, renderPhoto }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {photos.map(renderPhoto)}
    </div>
  );
}

// Usage:
<PhotoGrid
  photos={photos}
  renderPhoto={(photo) => <PhotoCard key={photo.id} {...photo} />}
/>
```

**Recommendation for Phase 14:** Use Option 1 (shared constant). Photo grids have no shared logic beyond styling; extracting to component adds unnecessary abstraction. If future phases add shared behavior (e.g., virtual scrolling, infinite scroll), upgrade to wrapper component.

**Source:** [Extracting Components - Tailwind CSS](https://v1.tailwindcss.com/docs/extracting-components), [Tailwind Repetition](https://domchristie.co.uk/posts/tailwind-repetition/)

### Anti-Patterns to Avoid

- **Gradient overlay with single opacity:** Don't use `bg-black/50` full overlay; use multi-stop gradient (`from-black/70 via-black/20 to-transparent`) for better text legibility across varied image content.
- **Missing lazy loading on new images:** Don't forget `loading="lazy"` on CollectionCard cover images; already implemented in PhotoCard but must be added to new components.
- **Touch targets <48×48px on mobile:** Don't use icon-only buttons without padding; current Share/Delete buttons on collection cards are ~32×24px, insufficient for mobile tapping.
- **Inline gradient buttons after primitives exist:** Don't duplicate `bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]` classes when Button primitive exists; violates QUALITY-07.
- **Forgetting i18n for new strings:** Don't add hardcoded English text like "View Collection"; must use `t('collections.viewCollection')` and add to en.json, lt.json, ru.json (QUALITY-08).
- **Testing only at exact breakpoints:** Don't test collection card grids at 768px, 1024px only; test at 820px, 900px, 1100px to catch content-based layout failures (LAYOUT-06).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gradient overlay on images | Custom rgba() colors with manual opacity calculation | Multi-stop Tailwind gradient (`from-black/70 via-black/20 to-transparent`) | Tailwind gradients handle browser prefixes and provide better readability; manual rgba() requires opacity math and lacks semantic clarity |
| Lazy loading images | Custom Intersection Observer with state management | Native `loading="lazy"` attribute | Supported in all modern browsers (2026); zero dependencies; browser-optimized threshold detection |
| Collection card hover effects | JavaScript state for hover + CSS classes | Tailwind `hover:` pseudo-class variants | CSS-only hover avoids React re-renders; hardware-accelerated; simpler code |
| Status badge colored dots | Separate DotBadge component | Add `showDot` prop to existing Badge | 5-line addition to Badge component; separate component is premature abstraction (YAGNI) |
| Touch target sizing | JavaScript click area expansion | Tailwind `min-h-[48px]` and proper padding | CSS-only solution; no JavaScript overhead; easier to test and maintain |
| Extracting repeated classes | @apply directive in CSS | React component or shared constant | @apply creates implicit dependencies; component extraction preserves JSX clarity and allows prop-based customization |

**Key insight:** Phase 14 is primarily a refactoring phase applying existing primitives (Phase 12) and responsive patterns (Phase 13) to collection cards and client-facing pages. No new architectural patterns needed; focus on eliminating class duplication and ensuring mobile touch targets meet WCAG 2.2 Level AA standards.

## Common Pitfalls

### Pitfall 1: Gradient Overlay Too Dark or Too Light

**What goes wrong:** Single-opacity gradient overlay (`bg-black/50`) either obscures dark images or provides insufficient contrast on light images, making text illegible.

**Why it happens:** Image content varies wildly (dark concert photos, bright beach photos); single opacity gradient can't adapt to both extremes.

**How to avoid:** Use multi-stop gradient with high opacity at text area and low opacity at image top: `bg-gradient-to-t from-black/70 via-black/20 to-transparent`. This ensures text area always has sufficient contrast while preserving image visibility.

**Warning signs:** QA reports "can't read collection name on white/light images" or "gradient too dark, can't see photo content."

**Fix:**
```jsx
// INCORRECT — Single opacity gradient
<div className="absolute inset-0 bg-black/50" />

// CORRECT — Multi-stop gradient for adaptive legibility
<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
```

**Source:** [Why Your Card Design Needs a Gradient Overlay (and How to Do It)](https://medium.com/@lilskyjuicebytes/why-your-card-design-needs-a-gradient-overlay-and-how-to-do-it-b142393572e1)

### Pitfall 2: CollectionCard Cover Image Not Lazy Loading

**What goes wrong:** Collection cards load all cover images on page mount, causing slow initial load time when user has 50+ collections.

**Why it happens:** Developer forgets `loading="lazy"` attribute on new CollectionCard component; PhotoCard already has it but new components don't inherit.

**How to avoid:** Always add `loading="lazy"` to `<img>` tags in new components. Verify with Network tab in DevTools (images below fold should not load until user scrolls).

**Warning signs:** Slow CollectionsListPage load time; Lighthouse flags "Defer offscreen images" opportunity.

**Fix:**
```jsx
// CollectionCard.jsx
<img
  src={coverImageUrl}
  alt={name}
  className="w-full h-full object-cover"
  loading="lazy" // <-- CRITICAL for performance
/>
```

**Source:** [Implementing lazy loading for images and videos in React | Transloadit](https://transloadit.com/devtips/cdn-fotos/), [Lazy loading - Performance | MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)

### Pitfall 3: Touch Targets Too Small on Mobile Collection Cards

**What goes wrong:** User tries to tap "Share" button on collection card on mobile; taps "Delete" instead because touch targets overlap or are too small (<48×48px).

**Why it happens:** Current buttons use `py-1 px-2 text-xs` with 12×12px icons = ~28×24px tap area, below WCAG 2.2 minimum (24×24px) and well below comfortable minimum (48×48px).

**How to avoid:** Use Button primitive with `size="sm"` which provides proper padding. Add `min-h-[48px]` to ensure touch target meets LAYOUT-03 requirement.

**Warning signs:** Mobile QA reports "buttons hard to tap" or "wrong button activates"; analytics show high error rate on mobile collection card actions.

**Fix:**
```jsx
// BEFORE — Insufficient touch target
<button className="py-1 px-2 text-xs">
  <svg className="w-3 h-3">...</svg>
  Share
</button>

// AFTER — Proper 48×48px touch target
<Button variant="secondary" size="sm" className="min-h-[48px]">
  <svg className="w-4 h-4">...</svg>
  {t('collections.shareCollection')}
</Button>
```

**Source:** [WCAG 2.2 Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### Pitfall 4: Collection Card Grid Breaks at In-Between Viewport Sizes

**What goes wrong:** Collection card grid at 900px viewport shows 2 cards with awkward spacing; at 1100px shows 3 cards that overflow container.

**Why it happens:** Fixed breakpoints (768px md:, 1024px lg:) don't account for collection card width + gap. At 900px, 2 cards × 400px + 24px gap = 824px fits but wastes 76px horizontal space.

**How to avoid:** Test collection card grid at non-standard viewport widths (820px, 900px, 1100px). Use `max-w-6xl mx-auto` container to constrain grid width and prevent ultra-wide cards on large monitors.

**Warning signs:** QA reports "weird spacing between cards on iPad" or "cards too wide on 1440p monitor."

**Fix:**
```jsx
// CollectionsListPage.jsx
<div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {collections.map(collection => (
      <CollectionCard key={collection.id} {...collection} />
    ))}
  </div>
</div>
```

**Breakdown:**
- `max-w-6xl` (1152px) constrains grid: 3 columns × 360px + 2 gaps × 24px = 1128px fits comfortably
- At 900px viewport: 2 columns × 420px + 1 gap × 24px = 864px, centered with mx-auto
- At 1100px viewport: Still 2 columns (below 1024px lg: breakpoint), no overflow

**Source:** [Breakpoints in Responsive Design - NN/G](https://www.nngroup.com/articles/breakpoints-in-responsive-design/)

### Pitfall 5: Missing i18n Strings for New UI Text

**What goes wrong:** Collection card shows "View Collection" in English even when user's language is set to Lithuanian or Russian; breaks i18n consistency.

**Why it happens:** Developer adds hardcoded English string `"View Collection"` instead of using `t('collections.viewCollection')` and adding keys to locale files.

**How to avoid:** Before committing, grep codebase for hardcoded strings: `grep -r "View Collection" frontend/src`. All user-visible text MUST use `t()` with keys in en.json, lt.json, ru.json (QUALITY-08).

**Warning signs:** QA reports "English text appears in Lithuanian UI" or "missing translations for collection cards."

**Fix:**
```jsx
// INCORRECT — Hardcoded English
<span className="text-white text-lg font-semibold">
  View Collection
</span>

// CORRECT — i18n with t()
<span className="text-white text-lg font-semibold">
  {t('collections.viewCollection')}
</span>

// Add to frontend/src/locales/en.json:
{
  "collections": {
    "viewCollection": "View Collection",
    "photosCount": "{{count}} photos",
    // ...
  }
}

// Add to lt.json and ru.json with translations
```

**Source:** Codebase CLAUDE.md line 34 ("All user-visible strings must use `t('namespace.key')` — no hardcoded strings in JSX")

## Code Examples

Verified patterns from official sources and codebase analysis:

### Example 1: CollectionCard with Edge-to-Edge Cover and Gradient Overlay

```jsx
// components/primitives/CollectionCard.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from './Badge';

function CollectionCard({ id, name, createdAt, photoCount, status, coverImageUrl, actions }) {
  const { t } = useTranslation();

  return (
    <div className="group relative bg-white rounded-[16px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Clickable cover area */}
      <Link to={`/collection/${id}`} className="block relative w-full aspect-[3/2] overflow-hidden no-underline">
        {/* Cover image (edge-to-edge) */}
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white text-5xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Multi-stop gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-bold mb-1 truncate drop-shadow-md">{name}</h3>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <span>{t('collections.photosCount', { count: photoCount })}</span>
            <span>•</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-lg font-semibold px-4 py-2 bg-black/50 rounded-md">
            {t('collections.viewCollection')}
          </span>
        </div>
      </Link>

      {/* Status badge */}
      {status !== 'DRAFT' && (
        <div className="absolute top-3 right-3 z-10">
          <Badge status={status} showDot>{t(`collections.status.${status}`)}</Badge>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex gap-2">{actions}</div>
    </div>
  );
}

export default CollectionCard;
```

**Source:** [Why Your Card Design Needs a Gradient Overlay](https://medium.com/@lilskyjuicebytes/why-your-card-design-needs-a-gradient-overlay-and-how-to-do-it-b142393572e1), [Card Hover Effects in Tailwind CSS](https://www.tailwindtap.com/blog/card-hover-effects-in-tailwind-css)

### Example 2: Badge with Colored Dot Prefix

```jsx
// components/primitives/Badge.jsx (updated from Phase 12)
import clsx from 'clsx';

function Badge({ status, showDot = false, children }) {
  const baseClasses = 'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full';

  const statusClasses = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SELECTING: 'bg-blue-100 text-blue-700',
    REVIEWING: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-purple-100 text-purple-700',
    DOWNLOADED: 'bg-purple-200 text-purple-800',
  };

  const dotColors = {
    DRAFT: 'bg-gray-600',
    SELECTING: 'bg-blue-700',
    REVIEWING: 'bg-green-700',
    DELIVERED: 'bg-purple-700',
    DOWNLOADED: 'bg-purple-800',
  };

  return (
    <span className={clsx(baseClasses, statusClasses[status])}>
      {showDot && <span className={clsx('w-2 h-2 rounded-full', dotColors[status])} aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
```

**Source:** [Carbon Design System - Status Indicator Pattern](https://carbondesignsystem.com/patterns/status-indicator-pattern/)

### Example 3: Refactoring SharePage to Use Button Primitive

```jsx
// BEFORE (SharePage.jsx lines 274-280)
<button
  onClick={submitSelections}
  disabled={isSubmitting}
  className="w-full sm:w-auto bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white font-semibold text-base py-3.5 px-8 rounded hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer border-none font-sans"
>
  {isSubmitting ? t('share.submitting') : t('share.submitSelections', { count: selectedPhotoIds.size })}
</button>

// AFTER (using Button primitive from Phase 12)
import Button from '../components/primitives/Button';

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

**Benefit:** Eliminates 18 repeated Tailwind classes; Button primitive handles all styling, hover states, and disabled logic.

**Source:** [Reusing Styles - Tailwind CSS](https://v3.tailwindcss.com/docs/reusing-styles)

### Example 4: Photo Grid Shared Constant

```jsx
// src/constants/styles.js (NEW file)
/**
 * Responsive photo grid classes used across CollectionDetailsPage, SharePage, DeliveryPage.
 * 1 column mobile, 2 columns tablet, 3 columns desktop with 12px gap.
 */
export const PHOTO_GRID_CLASSES = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';

// Usage in SharePage.jsx (line 213)
import { PHOTO_GRID_CLASSES } from '../constants/styles';

<div className={PHOTO_GRID_CLASSES}>
  {photos.map((photo, index) => (
    <PhotoCard key={photo.id} src={photoUrl(photo.storagePath)} alt={photo.filename} onClick={() => setLightboxIndex(index)} />
  ))}
</div>
```

**Source:** [Extracting Components - Tailwind CSS](https://v1.tailwindcss.com/docs/extracting-components)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-opacity overlay | Multi-stop gradient overlay (`from-black/70 via-black/20 to-transparent`) | 2020-2022 | Better text legibility across varied image content; adaptive contrast |
| Icon-only buttons | Buttons with min 48×48px touch targets | 2021+ (WCAG 2.2) | Reduced tap errors on mobile; improved accessibility |
| Inline gradient classes | Button primitive component | 2020+ (component-driven design) | DRY code; consistent styling; easier to maintain |
| Status badge solid background | Status badge with colored dot prefix | 2023+ | Quick visual scanning without reading text; common in modern design systems |
| Native lazy loading (`loading="lazy"`) | Intersection Observer libraries (react-lazy-load-image-component) | 2022-2024 shift back to native | Browser-native solution now supported everywhere; zero dependencies; better performance |

**Deprecated/outdated:**
- **Tilt animations on collection cards:** Photo Hub currently uses `rotate-[0.5deg] hover:rotate-[1.5deg]` (CollectionsListPage line 222); trendy in 2020-2022 but dated in 2026; Phase 14 removes tilt in favor of subtle elevation (`hover:-translate-y-1 hover:shadow-lg`)
- **Status border color on cards:** Current implementation uses `border-2 border-blue-500` for SELECTING status (CollectionsListPage lines 18-23); Phase 14 replaces with badge-only approach for cleaner design
- **@apply directive for extracting classes:** Tailwind community shifted away from @apply in favor of React components or shared constants; @apply creates implicit dependencies and reduces clarity

## Open Questions

1. **Should CollectionCard support 16:9 aspect ratio as well as 3:2?**
   - What we know: Current implementation uses `aspect-[3/2]` for collection cards; common for photo collections
   - What's unclear: Do photographers ever want 16:9 (video standard) for collection cards? Or should all collection cards use consistent aspect ratio?
   - Recommendation: NO for Phase 14. Use `aspect-[3/2]` (1.5 ratio) for all collection cards. If future feedback requests alternative aspect ratios, add `aspectRatio` prop in Phase 15+. Keep it simple for v3.0.

2. **Should hover elevation apply on mobile touch devices?**
   - What we know: Collection cards use `hover:-translate-y-1 hover:shadow-lg` for desktop hover effect
   - What's unclear: Mobile devices don't have hover state; tap creates brief hover on some browsers, awkward UX
   - Recommendation: Add `@media (hover: hover)` media query to hover effects: `group-hover:opacity-100` → `@media (hover: hover) { .group:hover { opacity: 100 } }`. But Tailwind v3 doesn't support this natively. Simplest approach: Keep hover effects for both desktop and mobile; mobile users won't see them (no hover state) but won't break UX. Defer hover media query to Tailwind v4 migration (out of scope for v3.0).

3. **Should collection card actions (Share, Delete) be in hover overlay or always visible?**
   - What we know: Current implementation shows actions below cover image in white section (CollectionsListPage lines 269-289)
   - What's unclear: Should actions move to hover overlay (like PhotoCard.Actions) or remain always visible for mobile accessibility?
   - Recommendation: KEEP actions always visible below cover image. Mobile users don't have hover; hiding actions in hover overlay breaks mobile UX. PhotoCard hover actions are acceptable because lightbox opens on tap (primary action), but collection card actions are secondary (Share/Delete) and must be always accessible.

4. **Should status badge appear on collection card when status is DRAFT?**
   - What we know: Current implementation hides status badge when `collection.status === 'DRAFT'` (CollectionsListPage line 258)
   - What's unclear: Is DRAFT status useful information for photographer, or is absence of badge sufficient?
   - Recommendation: KEEP current behavior (hide badge for DRAFT). DRAFT is default state; showing "Draft" badge on every new collection adds visual noise. Absence of badge = DRAFT is intuitive. If analytics show photographers confused about DRAFT status, add badge in Phase 15+.

5. **Should photo grid gap be `gap-3` (12px) or `gap-4` (16px)?**
   - What we know: Current implementation uses `gap-3` (12px) on SharePage (line 213) and DeliveryPage (line 162); Phase 13 decisions say "Increase gap from gap-2 to gap-3"
   - What's unclear: Is 12px sufficient breathing room, or should it be 16px (`gap-4`)?
   - Recommendation: KEEP `gap-3` (12px) for v3.0. Phase 13 decision was deliberate increase from `gap-2` (8px); 12px provides breathing room without excessive whitespace on mobile. If QA feedback says "photos feel cramped," increase to `gap-4` in Phase 15+.

## Sources

### Primary (HIGH confidence)
- [Why Your Card Design Needs a Gradient Overlay (and How to Do It) - Medium](https://medium.com/@lilskyjuicebytes/why-your-card-design-needs-a-gradient-overlay-and-how-to-do-it-b142393572e1) - Multi-stop gradient overlay pattern
- [Card Hover Effects in Tailwind CSS - TailwindTap](https://www.tailwindtap.com/blog/card-hover-effects-in-tailwind-css) - Shadow and transform hover effects with 300ms duration
- [Carbon Design System - Status Indicator Pattern](https://carbondesignsystem.com/patterns/status-indicator-pattern/) - Colored dot badge pattern with semantic colors
- [WCAG 2.2 Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) - 24×24px minimum touch target, 44×44px recommended
- [Implementing lazy loading for images and videos in React | Transloadit](https://transloadit.com/devtips/cdn-fotos/) - Native `loading="lazy"` best practices
- [Lazy loading - Performance | MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading) - Browser-native lazy loading documentation
- [Reusing Styles - Tailwind CSS](https://v3.tailwindcss.com/docs/reusing-styles) - Official guidance on extracting repeated classes

### Secondary (MEDIUM confidence)
- [Status badge | Agriculture Design System](https://design-system.agriculture.gov.au/components/status-badge) - Status badge with tone prop and colored dots (WebSearch, verified with official docs)
- [How to Lazy Load Images in React - freeCodeCamp](https://www.freecodecamp.org/news/how-to-lazy-load-images-in-react/) - React lazy loading patterns (WebSearch, corroborated with MDN)
- [Building Reusable React Components Using Tailwind — Smashing Magazine](https://www.smashingmagazine.com/2020/05/reusable-react-components-tailwind/) - Component extraction patterns (WebSearch)
- [Breakpoints in Responsive Design - NN/G](https://www.nngroup.com/articles/breakpoints-in-responsive-design/) - Content-based breakpoint testing (WebSearch)
- [Accessible Target Sizes Cheatsheet - Smashing Magazine](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) - Touch target sizing guidelines (WebSearch)
- [Extracting Components - Tailwind CSS](https://v1.tailwindcss.com/docs/extracting-components) - Legacy Tailwind docs on component extraction (official, but v1)
- [Tailwind Repetition - Dom Christie](https://domchristie.co.uk/posts/tailwind-repetition/) - DRY approaches for Tailwind (WebSearch, personal blog with good patterns)

### Tertiary (LOW confidence)
- [React Card component - Joy UI](https://mui.com/joy-ui/react-card/) - Card overflow pattern for edge-to-edge images (WebSearch, MUI-specific but transferable concepts)
- [Tailwind CSS Hover Effects | Pagedone](https://pagedone.io/docs/hover-effect) - Hover effect examples (WebSearch, tutorial site)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All patterns use existing React 18 + Tailwind CSS v3 + Phase 12 primitives; no new dependencies
- Architecture: HIGH - Gradient overlay and status badge patterns verified in official design systems (Carbon, Agriculture); touch target sizing from WCAG 2.2 spec
- Pitfalls: MEDIUM-HIGH - Common issues documented in authoritative sources (MDN, WCAG, Smashing Magazine); preventable with proper testing

**Research date:** 2026-02-16
**Valid until:** 90 days (2026-05-17) - Collection card design patterns are stable; gradient overlays and hover effects are established 2026 practices

**Codebase analysis:**
- Collection cards: Current implementation (CollectionsListPage lines 217-293) uses tilt animations, status border colors, and inline gradient buttons — all need refactoring
- Photo grids: Already use `loading="lazy"` (PhotoCard line 61, SharePage line 228, DeliveryPage line 173) — QUALITY-05 satisfied
- Inline gradient buttons: SharePage lines 274-280, DeliveryPage lines 147-156 duplicate Button primitive pattern — violates QUALITY-07
- Touch targets: Current Share/Delete buttons ~28×24px (CollectionsListPage lines 270-288) — below LAYOUT-03 minimum
- i18n: All existing pages use `t()` for strings — Phase 14 must maintain this for new UI text (QUALITY-08)

**Key refactors needed:**
1. Create `components/primitives/CollectionCard.jsx` with edge-to-edge cover, gradient overlay, rounded-[16px] corners
2. Update `components/primitives/Badge.jsx` with `showDot` prop for colored dot prefix
3. Refactor SharePage to use Button primitive (lines 274-280 → Button component)
4. Refactor DeliveryPage to use Button primitive (lines 147-156 → Button component)
5. Extract photo grid classes to `constants/styles.js` shared constant (`PHOTO_GRID_CLASSES`)
6. Update CollectionsListPage to use CollectionCard component (lines 217-293 → CollectionCard)
7. Ensure all action buttons have `min-h-[48px]` for LAYOUT-03 compliance
8. Add i18n keys for new UI strings ("View Collection", "Photos Count") to en.json, lt.json, ru.json
9. Test collection card grid at 820px, 900px, 1100px viewports (LAYOUT-06)

**Next steps for planner:**
- Break Phase 14 into 4-5 task groups: (1) CollectionCard component with edge-to-edge cover, (2) Badge update with colored dot, (3) SharePage/DeliveryPage refactor to use Button primitive, (4) Photo grid constant extraction, (5) Touch target compliance and i18n verification
- Each task should include verification steps: Lighthouse performance check (lazy loading working), DevTools mobile emulator (48×48px touch targets), visual regression at 820px/900px/1100px viewports
