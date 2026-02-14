# Architecture Research: UI/UX Redesign Integration

**Domain:** React + Tailwind CSS Design System Migration
**Researched:** 2026-02-14
**Confidence:** HIGH

## Executive Summary

This research addresses how to integrate UI/UX redesign into the existing Photo Hub architecture (React 18 + Tailwind CSS v3 + vanilla PHP backend) without breaking functionality. The recommended approach is **gradual component refactoring** with **design token extraction** using Tailwind's `theme.extend` pattern, followed by selective component rewrites for complex state-based UI (CollectionDetailsPage).

**Key finding:** Photo Hub is currently on Tailwind CSS v3 with minimal customization. Migrating to Tailwind v4's CSS-first design tokens would provide runtime CSS variables and better performance, but adds migration risk. The safer path is **staying on v3** and using `theme.extend` with semantic design tokens, then considering v4 migration post-redesign.

## Recommended Architecture for Redesign

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Design System Layer                       │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Tailwind Config  │  │ Shared Constants │                 │
│  │ (theme.extend)   │  │ (breakpoints)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│                  Component Architecture                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Layouts    │  │  Primitives  │  │  Composites  │      │
│  │ (MainLayout) │  │  (Button,    │  │ (PhotoCard,  │      │
│  │              │  │   Card, etc) │  │  UploadZone) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
├─────────┴─────────────────┴─────────────────┴───────────────┤
│                      Page Components                         │
│  ┌──────────────────┐  ┌────────────────────────────┐       │
│  │ CollectionsList  │  │  CollectionDetailsPage     │       │
│  │ (REFACTOR)       │  │  (PARTIAL REWRITE)         │       │
│  └──────────────────┘  └────────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    State & Data Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AuthContext  │  │  API Calls   │  │  i18n (3x)   │      │
│  │ (unchanged)  │  │ (unchanged)  │  │ (unchanged)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Migration Strategy |
|-----------|----------------|-------------------|
| **MainLayout** | Sidebar navigation, mobile bottom nav, language switcher | **REFACTOR** — Extract responsive breakpoint logic, add bottom nav for mobile |
| **CollectionsListPage** | Polaroid card grid, status color coding, create accordion | **REFACTOR** — Update card styles with new design tokens, improve mobile grid |
| **CollectionDetailsPage** | Upload zone, photo grid, workflow phases (DRAFT→SELECTING→REVIEWING→DELIVERED) | **PARTIAL REWRITE** — Extract workflow phase components, simplify conditional rendering |
| **SharePage** | Client gallery, selection UI | **REFACTOR** — Update card styles, improve mobile touch targets |
| **DeliveryPage** | Download interface | **REFACTOR** — Update button styles, improve download feedback |
| **Primitives (new)** | Button, Card, Badge, Input components | **NEW** — Extract from existing pages, apply design tokens |

## Refactor vs Rewrite Decisions

### Components to REFACTOR (Style-Only Changes)

**Criteria:** Sound logic, simple UI, no workflow complexity

| Component | Why Refactor | Approach |
|-----------|-------------|----------|
| **CollectionsListPage** | Card rendering is straightforward, grid logic is solid | Update Tailwind classes with design tokens, no structural changes |
| **SharePage** | Selection logic is clean, just needs styling updates | Apply new card styles, improve touch targets |
| **DeliveryPage** | Download flow is simple, minimal state | Update button/download UI styles |
| **MainLayout** | Responsive logic works, just needs mobile bottom nav addition | Add bottom nav component for mobile, refactor breakpoint constants |

**Refactor Pattern:**
```jsx
// Before (CollectionsListPage card):
<div className="bg-white rounded-[10px] shadow-md hover:shadow-lg overflow-hidden group">

// After (with design tokens):
<div className="bg-surface rounded-card shadow-card-default hover:shadow-card-hover overflow-hidden group">
```

### Components to PARTIALLY REWRITE

**Criteria:** Complex conditional state, workflow-dependent UI, pain points identified

| Component | Why Rewrite | Scope |
|-----------|------------|-------|
| **CollectionDetailsPage** | 1040 lines, complex status-based rendering (DRAFT vs SELECTING vs REVIEWING vs DELIVERED), workflow pain point | Extract 4 workflow phase components, simplify state management, improve photo grid filter UI |

**Workflow Phase Components (NEW):**
```jsx
// Extract from CollectionDetailsPage:
<DraftPhase />      // Upload zone, share link
<SelectingPhase />  // Filter tabs, selection badges
<ReviewingPhase />  // Edited finals upload zone
<DeliveredPhase />  // Delivery link
```

**Rewrite Justification:** CollectionDetailsPage has workflow-dependent UI across 4 states (DRAFT, SELECTING, REVIEWING, DELIVERED). Current implementation uses inline conditionals that make mobile-first redesign difficult. Extracting workflow phases into components allows:
- Clearer conditional rendering (one component per phase vs nested ternaries)
- Easier mobile adaptation (phase components own responsive logic)
- Better testing (phase components are isolated)

## Design Token System (Tailwind v3 theme.extend)

### Recommended Tailwind Config Changes

**File:** `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Color design tokens
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          card: '#ffffff',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#6366f1',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        },
        status: {
          draft: '#6b7280',      // gray
          selecting: '#3b82f6',  // blue
          reviewing: '#10b981',  // green
          delivered: '#a855f7',  // purple
          downloaded: '#9333ea', // purple-dark
        },
      },
      // Spacing design tokens
      spacing: {
        'card-padding': '1.5rem',       // px-6 py-5 → p-card-padding
        'page-padding': '1.75rem',      // px-6 py-7 → p-page-padding
        'mobile-padding': '1rem',       // p-4 → p-mobile-padding
      },
      // Border radius design tokens
      borderRadius: {
        'card': '10px',         // rounded-[10px] → rounded-card
        'button': '6px',        // rounded-[6px] → rounded-button
        'badge': '9999px',      // rounded-full → rounded-badge
      },
      // Shadow design tokens
      boxShadow: {
        'card-default': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      // Typography design tokens
      fontSize: {
        'heading-lg': ['22px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-sm': ['14px', { lineHeight: '1.2', fontWeight: '700' }],
        'label': ['13px', { lineHeight: '1.2', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5' }],
        'caption': ['11px', { lineHeight: '1.3' }],
      },
      // Breakpoints (shared constants)
      screens: {
        'mobile': '640px',    // sm
        'tablet': '768px',    // md
        'desktop': '1024px',  // lg
      },
    },
  },
  plugins: [],
}
```

### Design Token Migration Strategy

**Phase 1: Extract tokens (Week 1)**
- Add `theme.extend` to `tailwind.config.js`
- No component changes yet, just define tokens
- Validate tokens compile correctly

**Phase 2: Migrate components (Weeks 2-4)**
- Replace arbitrary values with tokens, one component at a time:
  - `rounded-[10px]` → `rounded-card`
  - `text-[22px] font-bold` → `text-heading-lg`
  - `px-6 py-5` → `p-card-padding`
- Use find-and-replace for common patterns
- Test visually after each component migration

**Phase 3: New components use tokens only (Week 5+)**
- All new primitive components (Button, Card, Badge) reference tokens
- No arbitrary values allowed in new code

**Benefits:**
- Semantic naming improves readability
- Single source of truth for design values
- Easier to update design system globally
- Prepares for potential Tailwind v4 migration later

## Mobile-First Responsive Strategy

### Breakpoint Architecture

**Current state:** `MainLayout.jsx` uses `BREAKPOINT = 768` for mobile vs desktop sidebar logic.

**Recommended:** Extract breakpoints to shared constants file and Tailwind config.

**File:** `frontend/src/constants/breakpoints.js`

```javascript
// Shared breakpoints for JS and Tailwind
export const BREAKPOINTS = {
  MOBILE: 640,   // sm
  TABLET: 768,   // md
  DESKTOP: 1024, // lg
};
```

**Update MainLayout.jsx:**
```javascript
import { BREAKPOINTS } from '../constants/breakpoints';

const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINTS.TABLET);
```

### Mobile Navigation Pattern

**Current:** Sidebar (desktop) + hamburger menu (mobile)

**Recommended for redesign:** Sidebar (desktop) + bottom tab navigation (mobile)

**Pattern:** Bottom navigation on mobile for 3-5 core actions (recommended by [Mobile Navigation Design: 6 Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026))

**Implementation:**
- Keep sidebar for desktop (`>= 768px`)
- Add bottom tab bar for mobile (`< 768px`) with same nav items
- Bottom tabs in thumb-friendly zone (recommended 48×48px touch targets)
- Persistent bottom nav (sticky)

**Component structure:**
```jsx
// MainLayout.jsx
{isMobile ? (
  <>
    <TopBar />  {/* Logo, hamburger for profile/settings */}
    <main>{children}</main>
    <BottomNav items={NAV_ITEMS} />  {/* NEW: Collections, Profile, Payments */}
  </>
) : (
  <>
    <Sidebar />
    <main>{children}</main>
  </>
)}
```

### Responsive Grid Patterns

**Current:** `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` (photo grids)

**Recommended:** Maintain mobile-first approach with new breakpoints

```jsx
// CollectionsListPage Polaroid cards:
<div className="grid grid-cols-1 mobile:grid-cols-2 desktop:grid-cols-3 gap-6">

// CollectionDetailsPage photo grid:
<div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-2">
```

**Touch Targets (Mobile):**
- Minimum 48×48px for buttons (Tailwind: `min-w-[48px] min-h-[48px]`)
- Card tap areas (entire card clickable, not just photo)
- Photo grid overlay actions (larger hit areas on mobile)

## State-Based Conditional Rendering Patterns

### Current Pattern (CollectionDetailsPage)

**Problem:** Nested ternaries for workflow phases make mobile-first redesign complex.

```jsx
// Current (lines 642-714):
<div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5 space-y-4">
  {/* Share section (always visible) */}
  <div>...</div>

  {/* Review section (only when REVIEWING) */}
  {collection.status === 'REVIEWING' && (
    <div>...</div>
  )}

  {/* Deliver section (only when DELIVERED or DOWNLOADED) */}
  {(collection.status === 'DELIVERED' || collection.status === 'DOWNLOADED') && (
    <div>...</div>
  )}
</div>
```

### Recommended Pattern: Phase Components

**Pattern:** Extract workflow phases into dedicated components, use object lookup for cleaner conditional rendering.

**File:** `frontend/src/components/collection-workflow/`

```jsx
// WorkflowPhaseCard.jsx (container)
const WORKFLOW_PHASES = {
  DRAFT: DraftPhase,
  SELECTING: SelectingPhase,
  REVIEWING: ReviewingPhase,
  DELIVERED: DeliveredPhase,
  DOWNLOADED: DeliveredPhase, // Same as DELIVERED
};

function WorkflowPhaseCard({ collection, onShareLink, onStartSelecting, onMarkDelivered, onDeliverLink }) {
  const PhaseComponent = WORKFLOW_PHASES[collection.status] || DraftPhase;

  return (
    <Card>
      <PhaseComponent
        collection={collection}
        onShareLink={onShareLink}
        onStartSelecting={onStartSelecting}
        onMarkDelivered={onMarkDelivered}
        onDeliverLink={onDeliverLink}
      />
    </Card>
  );
}
```

**DraftPhase.jsx:**
```jsx
function DraftPhase({ collection, onShareLink, onStartSelecting }) {
  return (
    <div>
      <PhaseHeader title="Share Phase" />
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => onShareLink(collection.shareId)}>
          Copy Share Link
        </Button>
        <Button onClick={onStartSelecting} variant="primary">
          Start Selecting
        </Button>
      </div>
    </div>
  );
}
```

**Benefits:**
- Each phase owns its responsive layout logic
- Easier to test (phase components are isolated)
- Clearer code (no nested ternaries)
- Mobile-first variants per phase (e.g., vertical button stack on mobile, horizontal on desktop)

**Reference:** [React Conditional Rendering: Patterns for Beginners UI](https://blog.newtum.com/conditional-rendering-in-react-patterns/) recommends object lookup over nested ternaries for state-based UI.

## Component Extraction Priorities

### Primitive Components (NEW)

Extract reusable primitives from existing pages to enforce design token consistency.

**Priority 1: Button**
```jsx
// frontend/src/components/primitives/Button.jsx
const VARIANTS = {
  primary: 'bg-gradient-to-r from-primary to-primary-hover text-white',
  secondary: 'bg-blue-50 text-blue-600 border border-blue-200',
  danger: 'bg-red-50 text-red-600 border border-red-200',
};

function Button({ variant = 'primary', size = 'md', children, ...props }) {
  return (
    <button
      className={`
        ${VARIANTS[variant]}
        ${size === 'sm' ? 'py-1 px-2 text-caption' : 'py-[9px] px-[22px] text-body'}
        rounded-button font-semibold transition-opacity hover:opacity-88
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Extracted from:** All pages (currently inline gradient buttons)

**Priority 2: Card**
```jsx
// frontend/src/components/primitives/Card.jsx
function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface-card border border-gray-200 rounded-card p-card-padding ${className}`}>
      {children}
    </div>
  );
}
```

**Extracted from:** All pages (repeated `bg-white border border-gray-200 rounded-[10px] px-6 py-5`)

**Priority 3: Badge**
```jsx
// frontend/src/components/primitives/Badge.jsx
const STATUS_STYLES = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SELECTING: 'bg-blue-100 text-blue-700',
  REVIEWING: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-purple-100 text-purple-700',
  DOWNLOADED: 'bg-purple-200 text-purple-800',
};

function Badge({ status }) {
  return (
    <span className={`
      inline-block text-caption font-bold uppercase tracking-wider
      px-2 py-0.5 rounded-badge
      ${STATUS_STYLES[status]}
    `}>
      {t(`collection.status.${status}`)}
    </span>
  );
}
```

**Extracted from:** CollectionsListPage, CollectionDetailsPage (repeated status badge logic)

### Composite Components (NEW)

Combine primitives into domain-specific components.

**Priority 1: PhotoCard**
```jsx
// frontend/src/components/collection/PhotoCard.jsx
function PhotoCard({ photo, isCover, isSelected, onDelete, onSetCover, onView }) {
  return (
    <div className="relative group aspect-square rounded-button overflow-hidden bg-gray-100">
      <button onClick={onView} className="w-full h-full">
        <img src={photoUrl(photo.storagePath)} alt={photo.filename} />
      </button>
      {isCover && <Badge variant="cover">★</Badge>}
      {isSelected && <Badge variant="selected">✓</Badge>}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100">
        <button onClick={onDelete}>×</button>
        {!isCover && <button onClick={onSetCover}>★</button>}
      </div>
    </div>
  );
}
```

**Extracted from:** CollectionDetailsPage photo grid logic

**Priority 2: UploadZone**
```jsx
// frontend/src/components/collection/UploadZone.jsx
function UploadZone({ onUpload, uploading, variant = 'default' }) {
  const VARIANT_STYLES = {
    default: 'border-gray-300 bg-gray-50 hover:border-blue-400',
    edited: 'border-green-300 bg-green-50 hover:border-green-400',
  };

  return (
    <div
      onClick={triggerFileInput}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-card
        flex flex-col items-center justify-center gap-2 py-10
        cursor-pointer transition-colors
        ${VARIANT_STYLES[variant]}
      `}
    >
      <Icon name="upload" />
      <p className="text-body">{t('collection.uploadZoneLabel')}</p>
      <p className="text-caption text-gray-400">{t('collection.uploadZoneHint')}</p>
      {uploading && <Spinner />}
    </div>
  );
}
```

**Extracted from:** CollectionDetailsPage (DRAFT upload, REVIEWING edited finals upload)

## Integration Points (What NOT to Touch)

### Backend API (Unchanged)

**Do NOT modify:**
- `backend/index.php` router
- API endpoint contracts (request/response formats)
- Database schema
- PHP session handling
- CORS configuration

**Why:** UI/UX redesign is frontend-only. Backend changes introduce risk and are out of scope.

**What this means:**
- Collection status lifecycle (`DRAFT → SELECTING → REVIEWING → DELIVERED`) remains unchanged
- Photo upload endpoints remain unchanged
- Auth flow remains unchanged

### React Architecture (Unchanged)

**Do NOT modify:**
- `AuthContext` (authentication state management)
- `ProtectedRoute` (auth guards)
- `App.jsx` route structure
- i18n setup (`react-i18next`)

**What this means:**
- `isAuthenticated` boolean remains the same
- Protected routes still wrap pages with `ProtectedRoute`
- All 3 locale files (LT/EN/RU) must stay in sync
- i18n keys are added for new UI elements, existing keys unchanged

## Build Order (Dependency-Aware)

### Phase 1: Design System Foundation (Week 1)
**Goal:** Establish design tokens and shared constants without breaking existing UI.

1. **Tailwind config setup**
   - Add `theme.extend` with design tokens
   - Test token compilation (`npm run dev`, check Tailwind build)
   - Validate no regressions (visual QA of existing pages)

2. **Shared constants**
   - Extract `BREAKPOINTS` to `frontend/src/constants/breakpoints.js`
   - Update `MainLayout.jsx` to import from constants
   - Test responsive sidebar behavior

**Success criteria:** Existing UI unchanged, tokens available for use.

### Phase 2: Primitive Components (Week 2)
**Goal:** Extract reusable primitives, migrate one page to validate.

1. **Create primitives**
   - `Button.jsx` (variants: primary, secondary, danger)
   - `Card.jsx` (standard white card)
   - `Badge.jsx` (status badges)

2. **Migrate one page (PaymentsPage)**
   - Replace inline buttons with `<Button>` components
   - Replace card divs with `<Card>` components
   - Validate visual parity

**Success criteria:** PaymentsPage uses primitives, looks identical to before.

### Phase 3: Layout Refactor (Week 3)
**Goal:** Add mobile bottom navigation without breaking desktop sidebar.

1. **Bottom navigation component**
   - `frontend/src/components/navigation/BottomNav.jsx`
   - 3 tabs: Collections, Profile, Payments
   - Touch-friendly (48×48px targets)

2. **MainLayout.jsx refactor**
   - Add conditional bottom nav for mobile
   - Keep sidebar for desktop
   - Test breakpoint transitions

**Success criteria:** Mobile shows bottom nav, desktop shows sidebar, no layout breaks.

### Phase 4: Page Refactors (Weeks 4-5)
**Goal:** Update page styles with design tokens, extract composite components.

1. **CollectionsListPage refactor**
   - Replace arbitrary values with design tokens
   - Update Polaroid card styles
   - Migrate to primitives (`<Button>`, `<Card>`, `<Badge>`)
   - Test grid responsiveness (mobile 1-col, tablet 2-col, desktop 3-col)

2. **SharePage refactor**
   - Update card styles with tokens
   - Improve mobile touch targets (selection checkboxes)
   - Test selection flow on mobile

3. **DeliveryPage refactor**
   - Update download button styles
   - Improve download feedback UI

**Success criteria:** Pages use design tokens, improved mobile UX, no functional regressions.

### Phase 5: CollectionDetailsPage Rewrite (Weeks 6-7)
**Goal:** Extract workflow phase components, simplify conditional rendering.

1. **Extract workflow phase components**
   - `DraftPhase.jsx` (upload zone, share link)
   - `SelectingPhase.jsx` (filter tabs, selection badges)
   - `ReviewingPhase.jsx` (edited finals upload zone)
   - `DeliveredPhase.jsx` (delivery link)

2. **Extract composite components**
   - `PhotoCard.jsx` (photo grid item)
   - `UploadZone.jsx` (file upload UI)

3. **Refactor CollectionDetailsPage**
   - Replace workflow sections with `<WorkflowPhaseCard>`
   - Replace photo grid with `<PhotoCard>` components
   - Replace upload zones with `<UploadZone>` components
   - Test all workflow phases (DRAFT, SELECTING, REVIEWING, DELIVERED)

**Success criteria:** CollectionDetailsPage is modular, all workflows function correctly, improved mobile UX.

### Phase 6: Visual QA & Polish (Week 8)
**Goal:** Cross-browser testing, mobile device testing, polish.

1. **Cross-browser QA**
   - Chrome, Firefox, Safari (desktop)
   - Chrome, Safari (mobile)

2. **Mobile device testing**
   - Test bottom navigation on real devices
   - Validate touch targets (48×48px minimum)
   - Test photo selection on mobile (thumb-friendly)

3. **Performance check**
   - Lighthouse audit (performance, accessibility)
   - Bundle size check (ensure primitives don't bloat bundle)

**Success criteria:** No visual regressions, mobile UX improved, performance unchanged.

## Risk Areas

### High Risk: Collection Workflow State

**What could break:** CollectionDetailsPage workflow phases (DRAFT → SELECTING → REVIEWING → DELIVERED)

**Why risky:** Complex conditional rendering based on collection status, backend depends on status transitions

**Mitigation:**
- Extract phase components with unit tests (test each phase in isolation)
- Test status transitions manually (DRAFT → SELECTING button, REVIEWING → DELIVERED button)
- Keep API calls unchanged (workflow logic is backend-driven)

### Medium Risk: Responsive Breakpoints

**What could break:** Sidebar/bottom nav switching logic, photo grid responsiveness

**Why risky:** Shared breakpoint constants used in JS and Tailwind, mismatch causes layout breaks

**Mitigation:**
- Extract `BREAKPOINTS` to single source of truth
- Test resize behavior manually (drag browser window, test breakpoint transitions)
- Use React DevTools to verify `isMobile` state changes at correct breakpoint

### Medium Risk: Design Token Migration

**What could break:** Visual regressions if tokens don't match existing arbitrary values

**Why risky:** Find-and-replace errors, token naming inconsistencies

**Mitigation:**
- Visual QA after each component migration (screenshot before/after)
- Migrate one component at a time (not all at once)
- Keep Tailwind's arbitrary values as fallback during transition

### Low Risk: i18n Keys

**What could break:** Missing translations for new UI elements

**Why risky:** 3 locale files must stay in sync (LT, EN, RU)

**Mitigation:**
- Add i18n keys to all 3 files at once (not one at a time)
- Test language switcher for new UI elements
- Use i18n key naming convention: `component.element.label` (e.g., `collection.workflow.draftPhase`)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Premature Tailwind v4 Migration

**What people do:** Migrate to Tailwind v4 during redesign to use CSS-first design tokens

**Why it's wrong:**
- Adds migration risk on top of redesign risk
- v4 requires Safari 16.4+, Chrome 111+, Firefox 128+ ([Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide))
- v4 class renames (`bg-opacity-*` → `bg-blue-500/50`) require codebase-wide changes
- Redesign already complex, adding v4 migration multiplies failure modes

**Do this instead:**
- Stay on Tailwind v3 for redesign
- Use `theme.extend` for design tokens (v3-compatible)
- Consider v4 migration as separate milestone post-redesign

### Anti-Pattern 2: Big-Bang Component Rewrite

**What people do:** Rewrite all page components at once

**Why it's wrong:**
- High regression risk (breaks multiple pages simultaneously)
- Difficult to isolate failures (which change caused the bug?)
- Long feedback loop (can't ship partial progress)

**Do this instead:**
- Migrate one component at a time ([Refactor vs Rewrite: Best Strategy to Modernize Software](https://imaginovation.net/blog/refactor-vs-rewrite-modernization-strategy-guide/))
- Start with simplest page (PaymentsPage) to validate primitives
- Ship progress incrementally (one page per PR)

### Anti-Pattern 3: Inline Design Values in Components

**What people do:** Use arbitrary Tailwind values in new components (`rounded-[10px]`, `text-[22px]`)

**Why it's wrong:**
- Defeats purpose of design tokens
- Hard to update design system globally
- No single source of truth

**Do this instead:**
- All new components use design tokens only
- `rounded-card`, `text-heading-lg` (semantic names)
- Enforce in code review (no arbitrary values allowed)

### Anti-Pattern 4: Conditional Rendering with Nested Ternaries

**What people do:** Inline nested ternaries for workflow phases

```jsx
{collection.status === 'DRAFT' ? (
  <DraftUI />
) : collection.status === 'SELECTING' ? (
  <SelectingUI />
) : collection.status === 'REVIEWING' ? (
  <ReviewingUI />
) : (
  <DeliveredUI />
)}
```

**Why it's wrong:**
- Hard to read and maintain
- Difficult to add responsive variants per phase
- No component isolation (can't test phases independently)

**Do this instead:**
- Use object lookup pattern ([React Conditional Rendering: Patterns for Beginners UI](https://blog.newtum.com/conditional-rendering-in-react-patterns/))
- Extract phase components
- Clearer, testable, mobile-first variants per phase

### Anti-Pattern 5: Breakpoint Duplication

**What people do:** Hardcode breakpoint values in multiple places

```jsx
// MainLayout.jsx
const BREAKPOINT = 768;

// CollectionsListPage.jsx
const isMobile = window.innerWidth < 768;

// tailwind.config.js
md: '768px'
```

**Why it's wrong:**
- Single breakpoint change requires multiple file edits
- Mismatch between JS and Tailwind causes layout bugs

**Do this instead:**
- Single source of truth: `frontend/src/constants/breakpoints.js`
- Import in all JS files that need breakpoint logic
- Reference in `tailwind.config.js` via `theme.screens`

## Tailwind v4 Considerations (Future)

**Current recommendation:** Stay on Tailwind v3 for redesign.

**Why consider v4 later:**
- **Performance:** 5x faster full builds, 100x faster incremental builds ([Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4))
- **CSS variables:** Design tokens exposed as runtime CSS variables (no rebuild needed for theme changes)
- **Modern syntax:** Cleaner opacity syntax (`bg-blue-500/50` vs `bg-opacity-50`)

**Migration path (post-redesign):**
1. Automated upgrade tool available ([Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide))
2. Most v3 configs work with minimal changes
3. Gradual migration supported via `@config "./tailwind.config.js"`

**When to migrate:**
- After redesign is stable (separate milestone)
- When browser support allows (Safari 16.4+, Chrome 111+, Firefox 128+)
- When performance gains justify migration effort

## Sources

### Architecture References
- [Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide)
- [Tailwind CSS Best Practices 2025-2026: Design Tokens](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)

### Component Strategy
- [Refactor vs Rewrite: Best Strategy to Modernize Software](https://imaginovation.net/blog/refactor-vs-rewrite-modernization-strategy-guide/)
- [Refactor or Rewrite? How I Chose the Right Path in a Real-World Project](https://senthilk979.medium.com/refactor-or-rewrite-how-i-chose-the-right-path-in-a-real-world-project-6be108b106da)
- [Building Reusable React Components in 2026](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4)

### Responsive Design
- [Mobile Navigation Design: 6 Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026)
- [Mobile Navigation UX Best Practices, Patterns & Examples (2026)](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)

### Conditional Rendering
- [React Conditional Rendering: Patterns for Beginners UI](https://blog.newtum.com/conditional-rendering-in-react-patterns/)
- [React Design Patterns for 2026 Projects (Complete Guide)](https://www.sayonetech.com/blog/react-design-patterns/)

---
*Architecture research for: Photo Hub UI/UX Redesign Integration*
*Researched: 2026-02-14*
*Confidence: HIGH (verified with official docs + current codebase analysis)*
