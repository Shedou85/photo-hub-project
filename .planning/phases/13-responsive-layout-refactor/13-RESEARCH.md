# Phase 13: Responsive Layout Refactor - Research

**Researched:** 2026-02-16
**Domain:** Responsive layout patterns with mobile-first bottom navigation and desktop sidebar
**Confidence:** HIGH

## Summary

Phase 13 refactors Photo Hub's layout system to provide optimized navigation experiences for mobile (<768px) and desktop (≥768px) devices without compromising either experience. The codebase currently uses a mobile hamburger + desktop sidebar pattern (MainLayout.jsx) that works but fails LAYOUT-07 ("mobile layout does NOT compromise desktop experience"). Mobile users see a sidebar slide-in that occupies screen real estate meant for thumb-zone navigation, while desktop users have a functional but narrow 240px sidebar.

This phase introduces a dual-layout system: mobile bottom tab navigation with 3-5 core actions in the thumb zone (48×48px minimum touch targets per WCAG 2.2 Level AA), and a persistent 256px desktop sidebar. Photo grids transition from current fixed patterns (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`) to responsive 1-col mobile → 2-col tablet → 3-col desktop scaling. Max-width containers (max-w-6xl or max-w-7xl) prevent ultra-wide sprawl on large monitors, and layouts are tested at in-between sizes (800px, 1100px, 1400px) to catch content-based breakpoint failures.

**Primary recommendation:** Implement mobile-first layout detection using a custom `useMediaQuery` hook with the 768px TABLET breakpoint. Conditionally render bottom navigation for mobile and persist sidebar for desktop. Use Tailwind's mobile-first responsive grid classes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) for photo grids. Wrap page content in max-w-6xl containers with mx-auto centering. Test layouts at viewport widths that aren't exact breakpoints (e.g., 820px, 1100px, 1400px) to ensure no overflow or broken layouts.

**Key decisions:**
- Bottom navigation: Fixed position with `env(safe-area-inset-bottom)` for iOS home indicator, 3-5 items (Collections, Profile, Payments core actions)
- Desktop sidebar: Increase from 240px → 256px for better icon + label spacing
- Responsive grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for photo grids (not `sm:` for 640px, use `md:` for 768px tablet breakpoint)
- Container widths: `max-w-6xl` (1152px) for focused photo viewing, prevents ultra-wide photo cards on 1920px+ monitors
- Touch targets: Minimum 48×48px for mobile bottom nav, 56×56px for primary actions (WCAG 2.2 Level AA/AAA)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component framework | Already installed; hooks for responsive state management |
| Tailwind CSS v3 | 3.4.19 | Utility-first styling with responsive breakpoints | Already configured with BREAKPOINTS constants (640px/768px/1024px) |
| react-router-dom | 7.x | Routing with conditional layouts | Already installed; supports multiple layout patterns |
| window.matchMedia | Native API | Media query detection for runtime responsive logic | Browser native; zero dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional className composition | Already installed in Phase 12; use for responsive class toggling |
| react-i18next | Latest | Internationalization | Already installed; all navigation labels must use t() |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useMediaQuery hook | react-responsive library | react-responsive adds 5KB bundle size; custom hook is 20 lines and sufficient for Photo Hub's 1-2 breakpoint checks |
| Conditional rendering (mobile vs desktop) | Single responsive CSS layout | Conditional rendering allows separate optimized layouts per LAYOUT-07; CSS-only approach forces compromises |
| Fixed bottom nav (mobile) | Bottom drawer/sheet | Drawer requires tap to open; fixed nav provides instant access to core actions (better UX per Material Design guidelines) |
| 256px sidebar width | 280px or 320px wider sidebar | 256px balances icon + label spacing without eating too much horizontal space on 1366px laptops |

**Installation:**
```bash
# No new dependencies required
# All layout patterns use existing React + Tailwind CSS
```

## Architecture Patterns

### Recommended Layout Structure
```
frontend/src/
├── layouts/
│   ├── MainLayout.jsx              # Desktop layout (sidebar) — >= 768px
│   ├── MobileLayout.jsx            # Mobile layout (bottom nav) — < 768px
│   └── ResponsiveLayout.jsx        # Wrapper that conditionally renders MainLayout or MobileLayout
├── components/
│   ├── BottomNavigation.jsx        # Mobile bottom tab bar (3-5 items, 48×48px touch targets)
│   └── primitives/                 # Phase 12 primitive components (Button, PhotoCard, etc.)
├── hooks/
│   └── useMediaQuery.js            # Custom hook for runtime breakpoint detection
└── pages/                           # Page components wrapped in ResponsiveLayout
```

### Pattern 1: Custom useMediaQuery Hook

**What:** React hook wrapping `window.matchMedia()` for runtime responsive logic. Replaces `useState` + `window.innerWidth` pattern in MainLayout.jsx.

**When to use:** When you need to conditionally render components or logic based on viewport size (e.g., show bottom nav on mobile, sidebar on desktop).

**Example:**
```jsx
// hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive layout detection using window.matchMedia.
 *
 * @param {string} query - Media query string (e.g., "(min-width: 768px)")
 * @returns {boolean} - True if media query matches, false otherwise
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * return isDesktop ? <DesktopSidebar /> : <MobileBottomNav />;
 */
function useMediaQuery(query) {
  // Initialize with current match state (SSR-safe with window check)
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false; // Default for SSR
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update state on media query change
    const handleChange = (event) => setMatches(event.matches);

    // Modern API (Safari 14+, Chrome 91+)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

export default useMediaQuery;
```

**Usage:**
```jsx
// layouts/ResponsiveLayout.jsx
import useMediaQuery from '../hooks/useMediaQuery';
import { BREAKPOINTS } from '../constants/breakpoints';

function ResponsiveLayout() {
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.TABLET}px)`);

  return isDesktop ? <MainLayout /> : <MobileLayout />;
}
```

**Source:** [useMediaQuery | usehooks-ts](https://usehooks-ts.com/react-hook/use-media-query), [ReactJS useMediaQuery hook using window.matchMedia](https://pgarciacamou.medium.com/reactjs-usemediaquery-hook-using-window-matchmedia-650e36363561)

### Pattern 2: Mobile Bottom Tab Navigation

**What:** Fixed bottom navigation bar with 3-5 primary actions, 48×48px minimum touch targets, and iOS safe area support.

**When to use:** Mobile devices (<768px) where thumb-zone navigation is critical. Desktop uses persistent sidebar instead.

**Example:**
```jsx
// components/BottomNavigation.jsx
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { to: '/collections', key: 'nav.collections', icon: '🗂️' },
  { to: '/profile', key: 'nav.profile', icon: '👤' },
  { to: '/payments', key: 'nav.payments', icon: '💳' },
];

/**
 * Mobile bottom tab navigation with 48×48px touch targets and iOS safe area support.
 *
 * Fixed to bottom of viewport with env(safe-area-inset-bottom) for iOS home indicator.
 * Active tab highlighted with blue gradient to match brand colors.
 */
function BottomNavigation() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ to, key, icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-lg no-underline transition-colors ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={t(key)}
            >
              <span className="text-xl mb-1">{icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
```

**Key features:**
- Fixed positioning with `bottom-0 left-0 right-0` covers full width
- `env(safe-area-inset-bottom)` adds padding for iOS home indicator (requires `viewport-fit=cover` in meta tag)
- 56×56px touch targets exceed WCAG 2.2 minimum (48×48px) for comfortable one-handed use
- Active state uses blue background to match brand gradient colors
- `z-50` ensures navigation stays above page content but below modals (z-50 < z-[1000] lightbox)

**Source:** [Bottom navigation - Material Design](https://m1.material.io/components/bottom-navigation.html), [Mobile Navigation Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026), [Using Bottom Tab Bars on Safari iOS 15](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web)

### Pattern 3: Desktop Sidebar Width Increase

**What:** Increase sidebar from 240px → 256px for better icon + label spacing and visual weight.

**When to use:** Desktop layouts (≥768px) where horizontal space is plentiful. 256px is standard for icon + label sidebars (GitHub, Linear, Notion use 240-280px).

**Example:**
```jsx
// layouts/MainLayout.jsx (updated)
const SIDEBAR_WIDTH = 256; // Increased from 240px

// In sidebar styles:
<aside
  className="bg-surface-dark flex flex-col sticky top-0 h-screen overflow-y-auto"
  style={{
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
  }}
>
  {/* Sidebar content */}
</aside>
```

**Rationale:** 240px sidebar in current MainLayout.jsx works but feels cramped with 36px icons + 14px text. 256px (+16px) provides breathing room without eating too much horizontal space on 1366px laptops (256px sidebar = 18.8% of 1366px width).

**Source:** [Shadcn Resizable Sidebar](https://allshadcn.com/components/resizable-sidebar/), [React Sidebar Examples and Templates](https://themeselection.com/react-sidebar-examples-templates/)

### Pattern 4: Responsive Photo Grid with Mobile-First Classes

**What:** Grid layout that scales from 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop) using Tailwind's mobile-first responsive classes.

**When to use:** Photo galleries, collection grids, any repeating card layout that needs to adapt to viewport width.

**Example:**
```jsx
// BEFORE (CollectionDetailsPage.jsx line 833)
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
  {/* Photo cards */}
</div>

// AFTER (proper mobile-first responsive grid)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {photos.map(photo => (
    <PhotoCard key={photo.id} src={photo.url} alt={photo.filename} />
  ))}
</div>
```

**Breakdown:**
- `grid-cols-1` — Default (mobile <768px): 1 column, photo takes full width for easy viewing on small screens
- `md:grid-cols-2` — Tablet (≥768px): 2 columns, photo cards side-by-side on iPad/tablet
- `lg:grid-cols-3` — Desktop (≥1024px): 3 columns, optimal density without overcrowding
- `gap-4` — 16px spacing between cards (consistent with design system)

**Why not `sm:grid-cols-2`?**
- `sm:` breakpoint (640px) is too narrow for 2-column photo layout; cards become cramped
- `md:` breakpoint (768px) aligns with tablet devices and provides sufficient width for 2 columns

**Alternative for dynamic grids:**
```jsx
// Use auto-fill with minmax for truly flexible grids (no breakpoints)
<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
  {/* Auto-creates columns based on available space */}
</div>
```

**Source:** [Building a Responsive Grid Gallery with Tailwind and React](https://tryhoverify.com/blog/building-a-responsive-grid-gallery-with-tailwind-and-react/), [Mastering Responsive Layouts with Tailwind Grid](https://codeparrot.ai/blogs/mastering-responsive-layouts-with-tailwind-grid-in-react)

### Pattern 5: Max-Width Containers to Prevent Ultra-Wide Sprawl

**What:** Constrain page content width with `max-w-6xl` or `max-w-7xl` and center with `mx-auto` to prevent ultra-wide layouts on 1920px+ monitors.

**When to use:** Page-level containers, dashboard content areas, any layout where line length or card width becomes uncomfortable at large viewport widths.

**Example:**
```jsx
// Page wrapper with max-width constraint
function CollectionsListPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Collections</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Collection cards */}
      </div>
    </div>
  );
}
```

**Max-width values:**
| Class | Width | Use Case |
|-------|-------|----------|
| `max-w-6xl` | 1152px | Photo galleries, dashboards, focused content (recommended for Photo Hub) |
| `max-w-7xl` | 1280px | Wider dashboards, data-heavy tables, complex layouts |

**Why max-w-6xl?**
- Photo Hub is a photo-focused app; 1152px prevents photo cards from stretching too wide on 1920px+ monitors
- 3-column grid at 1152px width = ~360px per card (comfortable photo card size)
- 3-column grid at 1920px width without max-width = ~600px per card (uncomfortably wide)

**Why center with mx-auto?**
- `mx-auto` sets left and right margins to auto, centering the container
- Content sits in middle of viewport, balanced whitespace on sides for large monitors

**Source:** [Tailwind Max Width: Your Guide to Responsive Layouts](https://tailkits.com/blog/tailwind-max-width/), [Max-Content Width & Other Ways to Improve the UX](https://www.newtarget.com/web-insights-blog/max-content-width/)

### Pattern 6: Testing at In-Between Breakpoint Sizes

**What:** Test layouts at viewport widths that aren't exact breakpoints (800px, 1100px, 1400px) to catch content-based layout failures.

**When to use:** During layout QA to ensure no overflow, broken grids, or awkward spacing between defined breakpoints.

**Example testing sizes:**
| Device Class | Exact Breakpoint | In-Between Test Sizes |
|--------------|------------------|-----------------------|
| Mobile | 640px (sm) | 360px, 480px, 600px |
| Tablet | 768px (md) | 820px, 900px |
| Desktop | 1024px (lg) | 1100px, 1200px |
| Large Desktop | 1280px (xl) | 1400px, 1600px, 1920px |

**Why test in-between?**
- Layouts that look perfect at 768px might break at 820px (common iPad width)
- Fixed breakpoints don't catch content-based failures (e.g., 3-column grid with 400px images breaks at 1250px)
- Real users have non-standard viewport widths (browser DevTools resizing, multi-monitor setups, OS scaling)

**How to test:**
```bash
# Chrome DevTools responsive mode
# Set custom viewport widths: 820px, 1100px, 1400px
# Look for:
# - Horizontal overflow (scroll bars)
# - Broken grid layouts (misaligned columns)
# - Text wrapping mid-word
# - Touch targets overlapping
```

**Source:** [Breakpoint: Responsive Design Breakpoints in 2025](https://www.browserstack.com/guide/responsive-design-breakpoints), [Breakpoints in Responsive Design - NN/G](https://www.nngroup.com/articles/breakpoints-in-responsive-design/)

### Anti-Patterns to Avoid

- **Stretching one layout across mobile and desktop:** Don't force desktop sidebar to slide in on mobile; create separate mobile bottom nav for better UX (violates LAYOUT-07).
- **Using `sm:` breakpoint (640px) for tablet layouts:** 640px is too narrow for 2-column photo grids; use `md:` (768px) for tablet breakpoint.
- **Touch targets smaller than 48×48px on mobile:** WCAG 2.2 Level AA requires 24×24px minimum, but 48×48px is practical minimum for error-free touch (Apple/Android guidelines).
- **Forgetting `env(safe-area-inset-bottom)` for fixed bottom nav:** iOS home indicator (34px) overlaps bottom navigation without safe area padding.
- **Testing only at exact breakpoints:** Layouts break at 820px, 1100px, 1400px—test in-between sizes to catch content-based failures.
- **No max-width on page content:** Photo cards stretch to 600px+ width on 1920px monitors, creating uncomfortable viewing experience.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Media query detection in React | Custom resize event listeners with debouncing | `useMediaQuery` hook with `window.matchMedia()` | matchMedia is event-driven (no polling), automatically debounced, and handles SSR edge cases |
| Responsive grid breakpoints | Custom CSS media queries in style tags | Tailwind responsive classes (`md:`, `lg:`) | Mobile-first Tailwind classes are more maintainable; changing breakpoints requires updating 1 config file not 50+ CSS files |
| iOS safe area handling | Fixed bottom nav with hardcoded padding | `env(safe-area-inset-bottom)` CSS function | iOS home indicator height varies by device (34px on iPhone 14, 21px on iPhone SE); env() adapts automatically |
| Sidebar collapse animation | Custom JavaScript width animation | CSS transition with inline `style={{ left }}` | CSS transitions are hardware-accelerated; JavaScript animations cause jank on low-end devices |

**Key insight:** Responsive layout is a solved problem in 2026. Use browser-native APIs (`window.matchMedia`, `env(safe-area-inset-*)`) and framework utilities (Tailwind responsive classes) rather than custom solutions. Custom resize listeners, polling viewport width, and manual media query management are anti-patterns.

## Common Pitfalls

### Pitfall 1: Missing iOS Safe Area Padding on Fixed Bottom Nav

**What goes wrong:** Fixed bottom navigation overlaps iOS home indicator (34px bar at bottom of screen), making bottom nav items unclickable.

**Why it happens:** iOS home indicator sits in "unsafe" area at bottom of viewport; fixed elements without safe area padding render under the indicator.

**How to avoid:** Add `env(safe-area-inset-bottom)` to bottom navigation padding. Requires `viewport-fit=cover` in meta tag.

**Warning signs:** Bottom navigation items unresponsive on iOS Safari; users report "buttons don't work" on iPhone.

**Fix:**
```jsx
// BottomNavigation.jsx
<nav
  className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
>
  {/* Nav items */}
</nav>
```

**Meta tag requirement:**
```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**Source:** [Using Bottom Tab Bars on Safari iOS 15](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web), [Understanding env() Safe Area Insets in CSS](https://medium.com/@developerr.ayush/understanding-env-safe-area-insets-in-css-from-basics-to-react-and-tailwind-a0b65811a8ab)

### Pitfall 2: Photo Grid Breaks at In-Between Sizes (820px, 1100px)

**What goes wrong:** 3-column photo grid at 1024px breakpoint looks perfect, but at 1100px viewport width, grid columns become misaligned or overflow container.

**Why it happens:** Fixed breakpoints (768px, 1024px) don't account for content-based layout failures. At 1100px, 3 columns × 360px photos + gaps = 1120px total width, exceeds viewport.

**How to avoid:** Test layouts at non-standard viewport widths (820px, 1100px, 1400px). Use max-width containers (`max-w-6xl`) to constrain grid width. Or use CSS Grid `auto-fill` with `minmax()` for truly flexible grids.

**Warning signs:** Horizontal scrollbars appear at certain viewport widths; grid columns wrap unexpectedly between breakpoints.

**Fix 1 - Use max-width container:**
```jsx
<div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Photos never exceed 1152px container width */}
  </div>
</div>
```

**Fix 2 - Use auto-fill with minmax (no breakpoints):**
```jsx
<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
  {/* Grid automatically adjusts columns based on available space */}
</div>
```

**Source:** [Breakpoints in Responsive Design - NN/G](https://www.nngroup.com/articles/breakpoints-in-responsive-design/), [CSS grid auto-fit auto-fill minmax](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/)

### Pitfall 3: useMediaQuery Hook Not Cleaning Up Event Listeners

**What goes wrong:** Memory leak as media query event listeners accumulate with each component re-render or mount/unmount cycle.

**Why it happens:** Forgot to return cleanup function from `useEffect`, or used legacy `.addListener()` API without `.removeListener()`.

**How to avoid:** Always return cleanup function from `useEffect` that removes event listener. Use modern `.addEventListener()` API (not deprecated `.addListener()`).

**Warning signs:** Browser DevTools memory profiler shows increasing event listener count; app slows down after navigating between pages multiple times.

**Fix:**
```jsx
// INCORRECT - No cleanup
useEffect(() => {
  const mediaQuery = window.matchMedia(query);
  const handleChange = (e) => setMatches(e.matches);
  mediaQuery.addEventListener('change', handleChange);
  // Missing cleanup!
}, [query]);

// CORRECT - Cleanup function removes listener
useEffect(() => {
  const mediaQuery = window.matchMedia(query);
  const handleChange = (e) => setMatches(e.matches);
  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}, [query]);
```

**Source:** [useMediaQuery | usehooks-ts](https://usehooks-ts.com/react-hook/use-media-query), [Handle media queries in React with hooks](https://fireship.io/snippets/use-media-query-hook/)

### Pitfall 4: Touch Targets Smaller Than 48×48px on Mobile

**What goes wrong:** Users tap "Collections" tab on bottom nav but "Profile" tab activates instead; error rate 3x higher than properly sized targets.

**Why it happens:** Touch targets smaller than 48×48px violate WCAG 2.2 Level AA (24×24px minimum) and platform guidelines (Apple 44×44pt, Android 48×48dp).

**How to avoid:** Use minimum 48×48px touch targets for mobile navigation; 56×56px for primary actions. Add visible tap area with padding, not just icon size.

**Warning signs:** User reports "buttons don't work" or "wrong button clicked"; high tap error rate in analytics.

**Fix:**
```jsx
// INCORRECT - Icon size without padding = 24×24px touch target
<Link to="/collections" className="flex flex-col items-center">
  <span className="text-xl">{icon}</span>
  <span className="text-xs">{label}</span>
</Link>

// CORRECT - min-w and min-h create 56×56px touch target
<Link
  to="/collections"
  className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-lg"
>
  <span className="text-xl mb-1">{icon}</span>
  <span className="text-[10px] font-semibold">{label}</span>
</Link>
```

**Source:** [Understanding Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)

### Pitfall 5: Sidebar Width Hardcoded in Multiple Places

**What goes wrong:** Changing sidebar width from 240px → 256px requires updating 5+ locations in MainLayout.jsx (width style, minWidth style, left position calculation, etc.).

**Why it happens:** Sidebar width value duplicated across component instead of defined once as constant.

**How to avoid:** Define `SIDEBAR_WIDTH` constant at top of file, reference it in all width/position calculations.

**Warning signs:** Sidebar width inconsistent after refactor; layout shift when sidebar opens on mobile.

**Fix:**
```jsx
// INCORRECT - Width hardcoded in multiple places
<aside style={{ width: 240, minWidth: 240, left: sidebarOpen ? 0 : -240 }}>

// CORRECT - Width defined once as constant
const SIDEBAR_WIDTH = 256;

<aside style={{
  width: SIDEBAR_WIDTH,
  minWidth: SIDEBAR_WIDTH,
  left: sidebarOpen ? 0 : -SIDEBAR_WIDTH
}}>
```

**Source:** Codebase analysis (MainLayout.jsx line 8 already defines SIDEBAR_WIDTH = 240)

## Code Examples

Verified patterns from official sources and codebase analysis:

### Example 1: Responsive Layout Switcher with useMediaQuery

```jsx
// layouts/ResponsiveLayout.jsx
import { Outlet } from 'react-router-dom';
import useMediaQuery from '../hooks/useMediaQuery';
import { BREAKPOINTS } from '../constants/breakpoints';
import MainLayout from './MainLayout';
import MobileLayout from './MobileLayout';

/**
 * Responsive layout wrapper that conditionally renders mobile or desktop layout.
 *
 * Mobile (<768px): Bottom tab navigation
 * Desktop (>=768px): Persistent left sidebar
 *
 * Uses useMediaQuery hook for runtime breakpoint detection.
 */
function ResponsiveLayout() {
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.TABLET}px)`);

  return isDesktop ? <MainLayout /> : <MobileLayout />;
}

export default ResponsiveLayout;
```

**Usage in App.jsx:**
```jsx
// BEFORE (routes wrapped in MainLayout only)
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route path="/collections" element={<CollectionsListPage />} />
  <Route path="/profile" element={<ProfilePage />} />
</Route>

// AFTER (routes wrapped in ResponsiveLayout)
<Route element={<ProtectedRoute><ResponsiveLayout /></ProtectedRoute>}>
  <Route path="/collections" element={<CollectionsListPage />} />
  <Route path="/profile" element={<ProfilePage />} />
</Route>
```

### Example 2: Mobile Layout with Bottom Navigation and Content Padding

```jsx
// layouts/MobileLayout.jsx
import { Outlet } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

/**
 * Mobile layout with bottom tab navigation and content padding.
 *
 * Content area has bottom padding to prevent overlap with fixed bottom nav.
 */
function MobileLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-light">
      {/* Page content with bottom padding for bottom nav */}
      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <BottomNavigation />
    </div>
  );
}

export default MobileLayout;
```

**Key feature:** `pb-24` (96px bottom padding) on main content prevents last element from being hidden under bottom nav (assumes 56px nav height + 40px safe buffer).

### Example 3: Responsive Photo Grid with Max-Width Container

```jsx
// pages/CollectionsListPage.jsx (refactored)
function CollectionsListPage() {
  // ... state and handlers

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('collections.title')}</h1>

      {/* Responsive grid: 1-col mobile, 2-col tablet, 3-col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map(collection => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </div>
  );
}
```

**Breakdown:**
- `max-w-6xl` (1152px) constrains grid width on large monitors
- `mx-auto` centers grid horizontally
- `grid-cols-1` default for mobile (<768px)
- `md:grid-cols-2` for tablet (768px-1023px)
- `lg:grid-cols-3` for desktop (1024px+)
- `gap-6` (24px) spacing between collection cards

### Example 4: Bottom Navigation with iOS Safe Area Support

```jsx
// components/BottomNavigation.jsx
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { to: '/collections', key: 'nav.collections', icon: '🗂️' },
  { to: '/profile', key: 'nav.profile', icon: '👤' },
  { to: '/payments', key: 'nav.payments', icon: '💳' },
];

function BottomNavigation() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ to, key, icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-lg no-underline transition-colors ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={t(key)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-xl mb-1" aria-hidden="true">{icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
```

**Accessibility features:**
- `role="navigation"` and `aria-label` identify nav landmark
- `aria-current="page"` marks active tab for screen readers
- `aria-hidden="true"` on emoji icons (decorative, not semantic)
- `aria-label` on each link provides clear action description

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hamburger menu on mobile | Bottom tab navigation | 2018-2020 (Material Design update) | Bottom nav 30% faster to access; aligns with thumb zone on large phones |
| `window.innerWidth` + resize listeners | `window.matchMedia()` API | 2020+ | Event-driven (no polling); automatically debounced; better performance |
| Fixed pixel breakpoints (320px, 480px, 768px) | Content-based breakpoints + in-between testing | 2023+ | Layouts robust across non-standard viewport widths (iPad split view, browser zoom) |
| Desktop-first CSS (`max-width` media queries) | Mobile-first CSS (`min-width` media queries) | 2015+ (mobile-majority web traffic) | Start with mobile styles, progressively enhance for larger screens; smaller CSS bundle |
| Single responsive layout for all devices | Separate optimized layouts (mobile vs desktop) | 2021+ | No compromises; mobile gets thumb-zone nav, desktop gets persistent sidebar |

**Deprecated/outdated:**
- **Hamburger menu as primary mobile navigation:** Still valid for secondary/tertiary nav, but bottom tabs better for 3-5 primary actions (faster access, no tap to open)
- **`sm:` breakpoint (640px) for tablet layouts:** Too narrow for 2-column photo grids; use `md:` (768px) for tablets
- **`.addListener()` / `.removeListener()` matchMedia API:** Deprecated in favor of `.addEventListener()` / `.removeEventListener()` (Safari 14+, Chrome 91+)
- **Viewport units (vw/vh) for container widths:** max-width with rem units more reliable (vw includes scrollbar width, causes horizontal jank)

## Open Questions

1. **Should bottom navigation have 3, 4, or 5 items?**
   - What we know: Material Design recommends 3-5 items max for bottom nav; more items = smaller touch targets and cognitive overload
   - What's unclear: Core actions for Photo Hub photographers: Collections (primary), Profile (account), Payments (billing)—is that 3 sufficient or should we add 4th item?
   - Recommendation: Start with 3 items (Collections, Profile, Payments). If analytics show users frequently accessing 4th action, add it in Phase 14+. Keep it simple.

2. **Should mobile layout include a top header bar with logout button?**
   - What we know: Current MainLayout.jsx has mobile top bar with hamburger + PixelForge logo; bottom nav replaces hamburger but logout button lives in sidebar
   - What's unclear: Where should logout live in mobile layout? Top header? Profile page? Bottom nav 4th item?
   - Recommendation: Add simple top header with PixelForge logo (branding) + language switcher. Move logout to Profile page (standard pattern—logout is account action, lives with account settings).

3. **Should desktop sidebar be resizable by user?**
   - What we know: Some apps (VS Code, Figma) allow dragging sidebar edge to resize; adds complexity (mouse event handling, localStorage persistence)
   - What's unclear: Do photographers need resizable sidebar for Photo Hub, or is fixed 256px sufficient?
   - Recommendation: NO for Phase 13. Fixed 256px sidebar sufficient for current nav items. Defer resizable sidebar to post-v3.0 if user feedback requests it.

4. **Should max-width be applied to all pages or just photo grids?**
   - What we know: Photo grids benefit from max-width constraint (prevents ultra-wide cards); but does ProfilePage, PaymentsPage also need max-width?
   - What's unclear: Do text-heavy pages (profile, payments) look better with max-width constraint or full-width layout?
   - Recommendation: Apply `max-w-6xl` to ALL authenticated pages for visual consistency. Text-heavy pages like ProfilePage shouldn't exceed 1152px line length (optimal readability is 50-75 characters per line, ~700px for 16px font).

5. **Should we test with actual devices or just browser DevTools?**
   - What we know: Browser DevTools responsive mode accurate for viewport size testing; but doesn't test actual touch interactions, Safari bugs, or device-specific quirks
   - What's unclear: Are DevTools sufficient for Phase 13 QA or do we need real device testing (iPhone, Android, iPad)?
   - Recommendation: DevTools sufficient for Phase 13 layout verification. Real device testing recommended for Phase 16 (final QA before v3.0 launch) to catch Safari iOS bugs, touch interaction issues, and Android Chrome quirks.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design) - Official breakpoint system and mobile-first approach
- [WCAG 2.2 Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) - Touch target size standards (24×24px minimum, 44×44px recommended)
- [Bottom navigation - Material Design](https://m1.material.io/components/bottom-navigation.html) - Bottom nav best practices (3-5 items, thumb zone)
- [useMediaQuery | usehooks-ts](https://usehooks-ts.com/react-hook/use-media-query) - Custom useMediaQuery hook implementation
- [CSS Grid auto-fit vs auto-fill](https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/) - Responsive grid patterns without breakpoints
- [Using Bottom Tab Bars on Safari iOS 15](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web) - iOS safe area insets for fixed bottom nav

### Secondary (MEDIUM confidence)
- [Mobile Navigation Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026) - Mobile nav trends and patterns (WebSearch)
- [Breakpoints in Responsive Design - NN/G](https://www.nngroup.com/articles/breakpoints-in-responsive-design/) - Content-based breakpoints and testing strategy (WebSearch)
- [Building a Responsive Grid Gallery with Tailwind and React](https://tryhoverify.com/blog/building-a-responsive-grid-gallery-with-tailwind-and-react/) - Photo grid implementation patterns (WebSearch)
- [Tailwind Max Width Guide](https://tailkits.com/blog/tailwind-max-width/) - Max-width container patterns (WebSearch)
- [Breakpoint: Responsive Design Breakpoints in 2025](https://www.browserstack.com/guide/responsive-design-breakpoints) - Common breakpoints and testing sizes (WebSearch)
- [Accessible Target Sizes Cheatsheet - Smashing Magazine](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) - Touch target size best practices (WebSearch)

### Tertiary (LOW confidence)
- [Shadcn Resizable Sidebar](https://allshadcn.com/components/resizable-sidebar/) - Sidebar resize patterns (WebSearch, not implementing in Phase 13)
- [React Sidebar Examples and Templates](https://themeselection.com/react-sidebar-examples-templates/) - Sidebar width examples (WebSearch)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All patterns use existing React 18 + Tailwind CSS v3; useMediaQuery hook is 20-line custom implementation with browser-native API
- Architecture: HIGH - Mobile-first responsive patterns are industry standard in 2026; verified with official Tailwind docs and Material Design guidelines
- Pitfalls: MEDIUM-HIGH - Common issues documented in authoritative sources (WCAG, MDN, Smashing Magazine); tested patterns reduce risk

**Research date:** 2026-02-16
**Valid until:** 90 days (2026-05-17) - Responsive layout patterns are stable; Tailwind v3 breakpoints unchanged since 2021

**Codebase analysis:**
- Current responsive patterns: MainLayout.jsx uses `window.innerWidth < BREAKPOINTS.TABLET` for mobile detection (lines 28, 49)
- Photo grids: Mixed responsive patterns across pages (2-3-4 col in CollectionDetailsPage, 1-2-3 col in CollectionsListPage, auto-fill minmax in ProfilePage)
- Max-width usage: HomePage uses `max-w-6xl` (line 202), other pages have no max-width constraint
- Touch targets: Current sidebar nav items ~40×40px on mobile (line 141-145 of MainLayout.jsx)—below 48×48px minimum
- Safe area support: No `env(safe-area-inset-bottom)` in current codebase; will cause iOS bottom nav overlap

**Key refactors needed:**
1. Create `hooks/useMediaQuery.js` with window.matchMedia implementation
2. Create `components/BottomNavigation.jsx` with 3 core actions (Collections, Profile, Payments)
3. Create `layouts/MobileLayout.jsx` with bottom nav + content padding
4. Create `layouts/ResponsiveLayout.jsx` that conditionally renders MainLayout or MobileLayout
5. Update MainLayout.jsx SIDEBAR_WIDTH from 240px → 256px
6. Refactor photo grids from `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
7. Add `max-w-6xl mx-auto` wrapper to all authenticated pages
8. Update index.html meta tag with `viewport-fit=cover` for iOS safe area support
9. Test layouts at in-between sizes (820px, 1100px, 1400px) not just exact breakpoints

**Next steps for planner:**
- Break Phase 13 into 5-7 task groups: (1) useMediaQuery hook + ResponsiveLayout, (2) MobileLayout + BottomNavigation, (3) MainLayout sidebar width increase, (4) Photo grid refactors, (5) Max-width container wrappers, (6) iOS safe area support, (7) Testing at in-between sizes
