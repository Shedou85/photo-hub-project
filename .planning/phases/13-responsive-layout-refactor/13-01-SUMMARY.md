---
phase: 13-responsive-layout-refactor
plan: 01
subsystem: frontend-layout
tags: [responsive-design, mobile-layout, breakpoints, accessibility, ios-support]
completed: 2026-02-16

# Dependency graph
requires:
  - phase: 11-design-system-foundation
    reason: BREAKPOINTS constant for 768px tablet breakpoint
provides:
  - useMediaQuery hook for runtime responsive detection
  - BottomNavigation mobile tab bar component (3 items, 56x56px touch targets)
  - MobileLayout shell with top header and bottom nav
  - ResponsiveLayout switcher (renders MainLayout or MobileLayout based on viewport)
affects:
  - App.jsx routing (now uses ResponsiveLayout wrapper)
  - MainLayout.jsx (refactored to desktop-only, 256px sidebar)
  - All authenticated routes (now responsive via ResponsiveLayout)

# Tech stack
added:
  libraries: []
  patterns:
    - window.matchMedia API for viewport detection
    - Conditional layout rendering based on breakpoint
    - Mobile-first bottom tab navigation pattern
    - iOS safe area insets via env(safe-area-inset-bottom)
    - 56x56px touch targets (exceeds WCAG 48px minimum)

# Key files
created:
  - frontend/src/hooks/useMediaQuery.js: Custom hook wrapping window.matchMedia with SSR-safe initialization
  - frontend/src/components/BottomNavigation.jsx: Mobile bottom tab bar with 3 nav items (Collections, Profile, Payments)
  - frontend/src/layouts/MobileLayout.jsx: Mobile layout shell with top header, language switcher, bottom nav
  - frontend/src/layouts/ResponsiveLayout.jsx: Conditional layout switcher using useMediaQuery at 768px breakpoint
modified:
  - frontend/src/layouts/MainLayout.jsx: Removed all mobile code, changed sidebar to 256px, always visible/sticky
  - frontend/src/App.jsx: Changed from MainLayout to ResponsiveLayout for authenticated routes
  - frontend/index.html: Added viewport-fit=cover for iOS safe area support
  - frontend/src/locales/en.json: Added nav.mainNavigation key
  - frontend/src/locales/lt.json: Added nav.mainNavigation key (Lithuanian)
  - frontend/src/locales/ru.json: Added nav.mainNavigation key (Russian)

# Decisions
decisions:
  - decision: Use 56x56px touch targets for bottom nav instead of minimum 48px
    rationale: Exceeds WCAG minimum for better mobile UX, matches iOS Human Interface Guidelines
    alternatives: 48px (WCAG minimum) would work but feels cramped on mobile
  - decision: Use 24px SVG icons instead of emoji in BottomNavigation
    rationale: Cross-platform consistency — emoji render differently on iOS/Android/Windows
    alternatives: Emoji are simpler but inconsistent; icon library adds dependency
  - decision: Place language switcher in mobile header instead of bottom nav
    rationale: Bottom nav reserved for 3 core actions only; language change is infrequent
    alternatives: Could add 4th bottom nav item but would reduce touch target size
  - decision: Extract language switcher logic to MobileLayout instead of shared component
    rationale: Small enough to duplicate; shared component would add complexity for no clear benefit
    alternatives: Could create LanguageSwitcher component but only 2 usages (MainLayout + MobileLayout)
  - decision: 768px breakpoint for mobile/desktop split
    rationale: Tailwind 'md' breakpoint, matches tablet landscape transition point
    alternatives: 640px (Tailwind 'sm') would force tablets into mobile view

# Metrics
duration: 3.13 min
tasks_completed: 2/2
files_created: 4
files_modified: 6
commits: 2
---

# Phase 13 Plan 01: Responsive Layout Infrastructure Summary

**One-liner:** Dual-layout system with mobile bottom tab navigation (<768px) and desktop persistent sidebar (>=768px) using useMediaQuery hook.

## What was built

Created the responsive layout infrastructure for the Photo Hub app:

1. **useMediaQuery hook** - Custom React hook wrapping window.matchMedia API for runtime viewport detection. SSR-safe with synchronous initialization. Uses modern addEventListener (not deprecated addListener). Returns boolean indicating if media query matches.

2. **BottomNavigation component** - Mobile bottom tab bar with 3 items: Collections, Profile, Payments. Fixed position at bottom with 56x56px touch targets (exceeds WCAG 48px minimum). iOS safe area padding via inline style `paddingBottom: env(safe-area-inset-bottom)`. Uses 24px SVG icons for cross-platform consistency. Active state: blue background + blue text. Accessible: role="navigation", aria-label, aria-current on active link.

3. **MobileLayout** - Mobile layout shell with sticky top header (PixelForge logo + language switcher), main content area with pb-24 (96px) to prevent overlap with bottom nav, and fixed BottomNavigation at bottom. Language switcher extracted from MainLayout with same dropdown logic.

4. **ResponsiveLayout** - Conditional layout switcher using useMediaQuery at 768px breakpoint. Renders MainLayout for desktop (>=768px) or MobileLayout for mobile (<768px). Single point of truth for layout selection.

5. **MainLayout refactor** - Removed all mobile code (isMobile state, sidebarOpen, hamburger menu, mobile top bar, overlay, animations). Sidebar now always visible, sticky, 256px wide (increased from 240px). Desktop-only padding (py-7 px-8).

6. **App.jsx integration** - Changed authenticated route wrapper from MainLayout to ResponsiveLayout. All protected pages now automatically responsive.

7. **iOS support** - Added viewport-fit=cover to index.html meta tag to enable env(safe-area-inset-bottom) for bottom nav padding on iOS devices with home indicator.

8. **i18n keys** - Added nav.mainNavigation key to all 3 locale files (EN: "Main navigation", LT: "Pagrindinis meniu", RU: "Основная навигация") for BottomNavigation aria-label.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification checks passed:

1. **Lint check:** `npm run lint` - zero warnings/errors across all 4 new files and 6 modified files
2. **Build check:** `npm run build` - successful production build (374.32 kB bundle)
3. **ResponsiveLayout usage:** App.jsx contains 2 references (import + usage in route element)
4. **iOS safe area:** index.html contains viewport-fit=cover in meta viewport tag
5. **Sidebar width:** MainLayout.jsx uses SIDEBAR_WIDTH = 256
6. **Mobile code removed:** MainLayout.jsx has 0 references to isMobile (was 8+ references before refactor)

## Technical Details

**useMediaQuery implementation:**
- Synchronous state initialization from window.matchMedia().matches (prevents flash of wrong layout)
- SSR-safe with typeof window check
- useEffect for addEventListener cleanup
- Dependency array includes query string for re-subscription on query change

**BottomNavigation structure:**
- Fixed positioning with z-50 to stay above content
- Flexbox layout with justify-around for equal spacing
- Each nav item is Link with aria-current for active state
- Inline style for iOS safe area (CSS env() function requires inline style or CSS variable)
- SVG icons: folder (Collections), user (Profile), credit-card (Payments)

**MainLayout changes:**
- Removed: isMobile state, sidebarOpen state, 2 resize useEffects, mobile header, overlay, sidebar animations
- Kept: Language switcher, nav items, logout button, sidebar header with user info
- Sidebar className simplified from dynamic with ternaries to static "sticky"
- Sidebar style simplified from 6 properties with conditionals to 2 static properties

**Breakpoint logic:**
- BREAKPOINTS.TABLET = 768px (from constants/breakpoints.js)
- useMediaQuery receives template literal: `` `(min-width: ${BREAKPOINTS.TABLET}px)` ``
- Returns true for desktop (>=768px), false for mobile (<768px)
- ResponsiveLayout renders based on this boolean

## Self-Check

Verifying all claimed artifacts exist:

**Created files:**
- frontend/src/hooks/useMediaQuery.js: FOUND
- frontend/src/components/BottomNavigation.jsx: FOUND
- frontend/src/layouts/MobileLayout.jsx: FOUND
- frontend/src/layouts/ResponsiveLayout.jsx: FOUND

**Modified files:**
- frontend/src/layouts/MainLayout.jsx: FOUND
- frontend/src/App.jsx: FOUND
- frontend/index.html: FOUND
- frontend/src/locales/en.json: FOUND
- frontend/src/locales/lt.json: FOUND
- frontend/src/locales/ru.json: FOUND

**Commits:**
- b72ffc8: feat(13-responsive-layout-refactor): create mobile layout infrastructure - FOUND
- d8608ee: refactor(13-responsive-layout-refactor): refactor MainLayout for desktop-only and integrate ResponsiveLayout - FOUND

## Self-Check: PASSED

All files, commits, and verification checks confirmed.

## Impact

**User-facing changes:**
- Mobile users (<768px) now see bottom tab navigation instead of hamburger menu + slide-in sidebar
- Desktop users (>=768px) see persistent 256px sidebar (16px wider than before)
- Layout switches automatically at 768px breakpoint without page reload
- iOS users have proper safe area padding preventing content hiding under home indicator

**Developer experience:**
- useMediaQuery hook available for responsive logic in any component
- Single ResponsiveLayout wrapper handles all layout switching automatically
- MainLayout simplified (57 lines removed) — easier to maintain
- Clear separation: MainLayout = desktop only, MobileLayout = mobile only, ResponsiveLayout = switcher

**Accessibility improvements:**
- 56x56px touch targets exceed WCAG 48px minimum for mobile
- aria-label on bottom navigation for screen readers
- aria-current="page" on active nav links for screen reader context
- role="navigation" semantic markup

**Performance:**
- useMediaQuery uses native window.matchMedia (no polling, event-driven)
- Synchronous state initialization prevents layout flash on load
- No unnecessary re-renders (useEffect dependency array includes query)

## Next Steps

Plan 13-02 will refactor individual pages (CollectionsListPage, CollectionDetailsPage, ProfilePage, PaymentsPage) to use responsive grid systems and mobile-optimized layouts within the new dual-layout infrastructure.

Current state: Responsive layout infrastructure complete. All authenticated routes now render through ResponsiveLayout. Mobile users see bottom nav, desktop users see sidebar. Individual page components still use desktop-first layouts and need mobile grid refactors.
