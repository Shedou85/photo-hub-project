---
phase: 16-testing-and-qa
plan: 01
subsystem: frontend-testing
tags: [testing, vitest, react-testing-library, unit-tests, primitives, auth]
dependency_graph:
  requires: [12-primitive-component-library, 13-responsive-layout-refactor]
  provides: [test-infrastructure, primitive-tests, auth-tests]
  affects: [all-frontend-components]
tech_stack:
  added: [vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @vitest/ui]
  patterns: [custom-render-utility, test-with-providers, semantic-queries, user-event-interactions]
key_files:
  created:
    - frontend/vitest.config.js
    - frontend/src/__tests__/setup.js
    - frontend/src/__tests__/mocks/i18n.js
    - frontend/src/__tests__/utils/test-utils.jsx
    - frontend/src/components/primitives/Button.test.jsx
    - frontend/src/components/primitives/Card.test.jsx
    - frontend/src/components/primitives/Badge.test.jsx
    - frontend/src/components/primitives/CollectionCard.test.jsx
    - frontend/src/components/ProtectedRoute.test.jsx
    - frontend/src/contexts/AuthContext.test.jsx
  modified:
    - frontend/package.json
    - frontend/src/contexts/AuthContext.jsx
decisions:
  - Custom render utility wraps with i18n + Router providers (not AuthProvider) — components under ProtectedRoute don't need it in tests
  - Use semantic queries (getByRole, getByText) over getByTestId for better accessibility alignment
  - ProtectedRoute tests use rtlRender directly to avoid nested Router from test-utils
  - AuthContext localStorage parsing wrapped in try-catch (bug fix) to handle corrupted data gracefully
metrics:
  duration: 5 minutes
  tasks_completed: 3
  test_files: 6
  test_count: 68
  commits: 4
  completed_date: 2026-02-16
---

# Phase 16 Plan 01: Testing Infrastructure and Primitive Component Tests Summary

Established Vitest + React Testing Library infrastructure and wrote comprehensive unit tests for all primitive components, AuthContext, and ProtectedRoute. Custom render utility with i18n and Router providers. All 68 tests passing with zero ESLint warnings.

## Tasks Completed

### Task 1: Install Vitest + RTL dependencies and configure test infrastructure

**Status:** Complete
**Commit:** b2adcb4

**What was done:**
- Installed testing dependencies: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @vitest/ui
- Created vitest.config.js extending vite.config.js with jsdom environment, globals enabled, CSS support
- Created test setup file importing jest-dom matchers for enhanced assertions
- Created mock i18n instance with synchronous init loading all 3 locales (en, lt, ru)
- Created custom render utility wrapping components with I18nextProvider + BrowserRouter (not AuthProvider by design)
- Added npm scripts: `test`, `test:ui`, `test:run`

**Files created:**
- `frontend/vitest.config.js`
- `frontend/src/__tests__/setup.js`
- `frontend/src/__tests__/mocks/i18n.js`
- `frontend/src/__tests__/utils/test-utils.jsx`

**Files modified:**
- `frontend/package.json` (added test scripts and devDependencies)

**Verification:** `npx vitest run --passWithNoTests` exits cleanly with 0 errors.

---

### Task 2: Write unit tests for Button, Card, Badge primitives

**Status:** Complete
**Commit:** e193924

**What was done:**
- **Button.test.jsx (19 tests):**
  - Default rendering and role assertion
  - All 4 variants: primary (gradient), secondary (blue outline), danger (red outline), ghost (transparent)
  - All 3 sizes: sm, md (default), lg with correct text/padding classes
  - fullWidth prop applies w-full class
  - onClick handler fires on user click via userEvent
  - Disabled state: button disabled, click doesn't fire handler, opacity-50 applied
  - Type defaults to 'button' (not 'submit' per project decision)
  - className passthrough merges with defaults via clsx

- **Card.test.jsx (6 tests):**
  - Renders children content
  - Default styling: bg-white, border, border-gray-200, rounded
  - Default padding: px-6 py-5
  - noPadding prop removes padding
  - Renders as div
  - className passthrough merges correctly

- **Badge.test.jsx (14 tests):**
  - Renders label text
  - All 5 status variants with correct colors:
    - DRAFT: gray (bg-gray-100, text-gray-600)
    - SELECTING: blue (bg-blue-100, text-blue-700)
    - REVIEWING: green (bg-green-100, text-green-700)
    - DELIVERED: purple (bg-purple-100, text-purple-700)
    - DOWNLOADED: darker purple (bg-purple-200, text-purple-800)
  - Unknown status defaults to DRAFT classes
  - showDot prop renders colored dot indicator with aria-hidden
  - Dot colors match status (gray, blue, green, purple)
  - className passthrough merges correctly

**Files created:**
- `frontend/src/components/primitives/Button.test.jsx`
- `frontend/src/components/primitives/Card.test.jsx`
- `frontend/src/components/primitives/Badge.test.jsx`

**Verification:** All 39 tests pass (19 Button + 6 Card + 14 Badge).

---

### Task 3: Write unit tests for CollectionCard, ProtectedRoute, AuthContext

**Status:** Complete
**Commit:** 1b43d27 (includes AuthContext bug fix)

**What was done:**
- **CollectionCard.test.jsx (13 tests):**
  - Renders collection title, photo count (plural/singular via i18n), formatted date
  - Status badge renders with correct translated text for non-DRAFT statuses
  - DRAFT status doesn't show badge
  - Cover image: renders img when coverImageUrl provided, placeholder with first letter when not
  - Hover scale applied to cover image (group-hover:scale-105)
  - Link to collection details page (/collection/:id)
  - Hover overlay text "View Collection" (translated)
  - Actions rendering in footer
  - Hover shadow and transform classes

- **ProtectedRoute.test.jsx (4 tests):**
  - When authenticated: renders children, doesn't redirect
  - When not authenticated: doesn't render children, redirects to /login
  - Uses rtlRender directly (not test-utils render) to avoid nested Router issue
  - Wraps with AuthProvider + MemoryRouter for controlled routing assertions

- **AuthContext.test.jsx (12 tests):**
  - Initial state: loads user from localStorage if valid JSON, null if empty/invalid
  - Handles invalid JSON gracefully (returns null instead of crashing)
  - login(): sets user in state and localStorage, isAuthenticated becomes true
  - logout(): clears user from state and localStorage, isAuthenticated becomes false
  - isAuthenticated computed value: true when user exists, false when null, updates reactively
  - Uses renderHook from RTL for testing custom hooks

**Bug fix (Rule 1 - Auto-fix bugs):**
- **Issue:** AuthContext crashed when localStorage contained invalid JSON (e.g., corrupted data)
- **Found during:** Task 3 test writing — "handles invalid JSON gracefully" test failed with SyntaxError
- **Fix:** Wrapped `JSON.parse(stored)` in try-catch block, return null on error
- **Files modified:** `frontend/src/contexts/AuthContext.jsx`
- **Commit:** Included in 1b43d27
- **Rationale:** This is a correctness bug (app crash) that prevents completing the test task. Rule 1 applies: auto-fix bugs inline.

**Files created:**
- `frontend/src/components/primitives/CollectionCard.test.jsx`
- `frontend/src/components/ProtectedRoute.test.jsx`
- `frontend/src/contexts/AuthContext.test.jsx`

**Files modified:**
- `frontend/src/contexts/AuthContext.jsx` (bug fix)

**Verification:** All 68 tests pass across 6 test files (12 AuthContext + 4 ProtectedRoute + 13 CollectionCard + 19 Button + 14 Badge + 6 Card).

---

### Lint Fix (Post-Task)

**Status:** Complete
**Commit:** a30aa19

**What was done:**
- Removed unused `vi` and `userEvent` imports from CollectionCard.test.jsx
- Removed unused `vi` import from AuthContext.test.jsx
- Added missing `afterEach` import to ProtectedRoute.test.jsx

**Files modified:**
- `frontend/src/components/primitives/CollectionCard.test.jsx`
- `frontend/src/contexts/AuthContext.test.jsx`
- `frontend/src/components/ProtectedRoute.test.jsx`

**Verification:** `npm run lint` passes with 0 warnings.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AuthContext doesn't handle invalid localStorage JSON**
- **Found during:** Task 3 test writing
- **Issue:** AuthContext crashes with SyntaxError when localStorage contains invalid JSON (corrupted data, manual editing, etc.). The test "handles invalid JSON gracefully" exposed this crash.
- **Fix:** Wrapped `JSON.parse(stored)` in try-catch block at line 7-11 of AuthContext.jsx. Returns null on parse error instead of crashing.
- **Files modified:** `frontend/src/contexts/AuthContext.jsx`
- **Commit:** 1b43d27 (included with Task 3 tests)
- **Rationale:** This is a correctness bug (app crash) that blocks test execution. Per Rule 1 (auto-fix bugs), fixed inline without user permission. The bug existed in production code and would crash the app if localStorage was ever corrupted.

---

## Verification Results

1. **Test execution:** `npm test -- --run` passes with 68 tests across 6 files, 0 failures
2. **Test scripts:** `npm test`, `npm test:ui`, `npm test:run` all work correctly
3. **Custom render utility:** All tests use `render` from `__tests__/utils/test-utils.jsx`, wrapping with i18n + Router
4. **Semantic queries:** Tests use `getByRole`, `getByText`, `getByAltText` — no `getByTestId`
5. **Translations:** i18n mock loads real locale files, tests verify translated strings (e.g., "Selecting", "View Collection")
6. **ESLint:** `npm run lint` exits with 0 warnings

---

## Test Coverage Summary

| Component | Tests | Coverage Areas |
|-----------|-------|----------------|
| Button | 19 | variants (4), sizes (3), fullWidth, onClick, disabled, type default, className |
| Card | 6 | children, default styling, padding, noPadding, className |
| Badge | 14 | status variants (5), colored dot, className |
| CollectionCard | 13 | title, photo count, status badge, date, cover image, link, hover, actions |
| ProtectedRoute | 4 | authenticated (renders children), unauthenticated (redirects) |
| AuthContext | 12 | initial state, login, logout, localStorage persistence, isAuthenticated |

**Total:** 68 passing tests

---

## Key Patterns Established

1. **Custom render utility:** `render` from `test-utils.jsx` wraps with I18nextProvider + BrowserRouter (not AuthProvider)
2. **Semantic queries:** Prefer `getByRole`, `getByText` over `getByTestId` for accessibility alignment
3. **User interactions:** Use `@testing-library/user-event` for realistic user interactions (click, type)
4. **Provider testing:** For components needing specific providers (AuthContext), use rtlRender directly with custom wrappers
5. **Hook testing:** Use `renderHook` from RTL for testing custom hooks like `useAuth`
6. **i18n in tests:** Mock i18n instance with synchronous init loads real translations for verification
7. **localStorage mocking:** Use `localStorage.setItem/removeItem/getItem` directly in tests (jsdom provides Web Storage API)

---

## Self-Check: PASSED

**Files created (all found):**
- frontend/vitest.config.js
- frontend/src/__tests__/setup.js
- frontend/src/__tests__/mocks/i18n.js
- frontend/src/__tests__/utils/test-utils.jsx
- frontend/src/components/primitives/Button.test.jsx
- frontend/src/components/primitives/Card.test.jsx
- frontend/src/components/primitives/Badge.test.jsx
- frontend/src/components/primitives/CollectionCard.test.jsx
- frontend/src/components/ProtectedRoute.test.jsx
- frontend/src/contexts/AuthContext.test.jsx

**Commits (all found):**
- b2adcb4: chore(16-01): install Vitest + RTL and configure test infrastructure
- e193924: test(16-01): add unit tests for Button, Card, Badge primitives
- 1b43d27: test(16-01): add unit tests for CollectionCard, ProtectedRoute, AuthContext
- a30aa19: fix(16-01): remove unused imports from test files

**Test execution:** All 68 tests pass, 0 failures
**ESLint:** 0 warnings
**npm test scripts:** All work correctly

---

## Next Steps

With testing infrastructure and primitive component tests complete, next plans can:
- Add integration tests for page components (CollectionsListPage, CollectionDetailsPage)
- Add E2E tests for critical user flows (upload → share → select → deliver)
- Add visual regression tests with Chromatic or Percy
- Add performance tests with Lighthouse CI (already configured in 16-02)
