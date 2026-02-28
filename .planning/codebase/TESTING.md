# Testing Patterns

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-02-28

## Test Framework

**Unit/Component Testing:**
- Runner: Vitest 4.x
- UI: @vitest/ui for interactive test viewing
- Config: `frontend/vitest.config.js`
- Assertion: Vitest built-in + @testing-library/jest-dom
- Component rendering: @testing-library/react 16.x
- User interaction: @testing-library/user-event 14.x

**E2E Testing:**
- Runner: Playwright 1.58.x
- Config: `frontend/playwright.config.js`
- Accessibility: @axe-core/playwright 4.11.x

**Scripts (from `frontend/package.json`):**
```bash
npm run test          # Vitest watch mode
npm run test:ui       # Vitest interactive UI
npm run test:run      # Vitest single run (CI)
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Playwright interactive UI
npm run test:e2e:update-snapshots  # Update visual regression baselines
npm run lint          # ESLint (zero warnings enforced)
npm run build:analyze # Bundle size analysis
npm run lighthouse    # Lighthouse CI audit
```

## Test File Organization

**Unit/Component Tests:**
- Co-located with source files: `Component.test.jsx` next to `Component.jsx`
- Pattern: `[ComponentName].test.jsx` or `[filename].test.js`

**Test Infrastructure:**
- Location: `frontend/src/__tests__/`
- `setup.js` — Vitest global setup
- `mocks/i18n.js` — i18n mock for component tests
- `utils/test-utils.jsx` — Custom render utility with i18n + Router + Auth providers

**E2E Tests:**
- Location: `frontend/e2e/`
- `accessibility/wcag-compliance.spec.js` — WCAG accessibility checks via axe-core
- `cross-browser/responsive-layout.spec.js` — Responsive layout verification
- `visual-regression/multi-locale.spec.js` — Multi-locale screenshot comparison

## Existing Test Files

**Component Tests (Vitest + Testing Library):**
- `frontend/src/components/Accordion.test.jsx`
- `frontend/src/components/PageHeader.test.jsx`
- `frontend/src/components/ProtectedRoute.test.jsx`
- `frontend/src/components/primitives/Badge.test.jsx`
- `frontend/src/components/primitives/Button.test.jsx`
- `frontend/src/components/primitives/Card.test.jsx`
- `frontend/src/components/primitives/CollectionCard.test.jsx`
- `frontend/src/components/primitives/Input.test.jsx`
- `frontend/src/components/primitives/Select.test.jsx`

**Context Tests:**
- `frontend/src/contexts/AuthContext.test.jsx`

**Library Tests:**
- `frontend/src/lib/api.test.js`

**Utility Tests:**
- `frontend/src/utils/copyScript.test.js`

**Page Tests:**
- `frontend/src/pages/NotFoundPage.test.jsx`

**E2E Tests (Playwright):**
- `frontend/e2e/accessibility/wcag-compliance.spec.js`
- `frontend/e2e/cross-browser/responsive-layout.spec.js`
- `frontend/e2e/visual-regression/multi-locale.spec.js`

## Mocking

**i18n Mock (`__tests__/mocks/i18n.js`):**
- Mocks `react-i18next` to return key as translation
- Allows component tests without full i18n setup

**Custom Render (`__tests__/utils/test-utils.jsx`):**
- Wraps components with required providers (BrowserRouter, i18n, AuthContext)
- Provides custom `render()` function for consistent test setup

**API Mocking:**
- Tests use Vitest's `vi.mock()` for mocking API responses
- Example: `api.test.js` mocks `fetch()` globally

## Coverage

**Current Status:**
- Coverage not yet enforced via threshold
- TODO: Target 70%+ coverage
- No coverage badge or CI gate configured

**To Add Coverage:**
```bash
npm run test:run -- --coverage
```

## Test Patterns

**Component Test Pattern:**
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender } from '../__tests__/utils/test-utils';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    customRender(<Component prop="value" />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    customRender(<Component onAction={vi.fn()} />);
    await user.click(screen.getByRole('button'));
    // assertions...
  });
});
```

**API Test Pattern:**
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

beforeEach(() => {
  global.fetch = vi.fn();
});

describe('api', () => {
  it('makes GET request', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'OK' }),
    });
    const result = await api.get('/test');
    expect(result.data.status).toBe('OK');
  });
});
```

## Testing Best Practices (Established)

**Do:**
- Test component behavior, not implementation details
- Test user interactions: clicks, form submission, typing
- Mock API calls; don't test real backend in unit tests
- Use semantic queries: `getByRole`, `getByLabelText`, `getByText`
- Test accessibility: aria attributes, keyboard navigation
- Use the custom `customRender` for consistent provider wrapping
- Co-locate test files with source files

**Don't:**
- Don't test Tailwind CSS classes directly
- Don't snapshot-test unless necessary for visual regression
- Don't over-test trivial code (simple getters, style props)
- Don't test third-party libraries (react-router, react-i18next)

## Backend Testing

**Current Status:**
- No PHPUnit tests configured
- Backend has health check endpoints for manual testing:
  - `GET /test` — simple response
  - `GET /db-test` — database connectivity

**TODO:**
- Add PHPUnit: `cd backend && composer require --dev phpunit/phpunit`
- Priority test targets: auth flows, collection CRUD, selection logic, CSRF validation

## Quality Tools

**Bundle Size:**
- Script: `frontend/scripts/check-bundle-size.js`
- Validates production bundle doesn't exceed thresholds

**Lighthouse CI:**
- Config: `frontend/lighthouserc.json`
- Run: `npm run lighthouse`
- Audits: Performance, accessibility, SEO, best practices

---

*Testing analysis: 2026-02-11 | Updated: 2026-02-28 (tests now exist)*
