# Phase 16: Testing & QA - Research

**Researched:** 2026-02-16
**Domain:** Frontend testing and quality assurance for React + Vite applications
**Confidence:** HIGH

## Summary

Phase 16 focuses on comprehensive testing and performance validation for the Photo Hub v3.0 Workflow & UX Redesign before launch. The application is built with React 18, Vite 5, Tailwind CSS v3, and supports three locales (LT/EN/RU) via react-i18next. Current production bundle shows 40KB CSS and 376KB JS (uncompressed), suggesting good opportunity to meet the <50KB CSS gzipped target.

The testing strategy should follow a layered pyramid approach: unit tests with Vitest + React Testing Library for component behavior, integration tests with MSW for API mocking, end-to-end tests with Playwright for critical user flows, visual regression testing for multi-locale UI validation, accessibility testing with axe-core, and performance monitoring with Lighthouse CI. This approach balances speed (fast unit tests) with confidence (realistic E2E tests) while automating quality gates in CI/CD.

**Primary recommendation:** Implement Vitest + React Testing Library as the foundation for fast component testing, add Playwright for cross-browser E2E tests of 3-5 critical flows (upload → share, create collection, client selection), integrate Lighthouse CI for automated performance regression detection, use Playwright's built-in screenshot comparison for visual regression across locales, and establish baseline task completion time metrics before launch.

## Standard Stack

### Core Testing Framework
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^2.0+ | Unit/component test runner | Native Vite integration, 4x faster than Jest, first-class ESM/TypeScript support via Vite's transformer |
| @testing-library/react | ^16.0+ | Component testing utilities | Industry standard for user-centric testing, focuses on behavior over implementation |
| @testing-library/jest-dom | ^6.0+ | Custom matchers for DOM | Provides semantic assertions like `toBeInTheDocument()`, `toHaveAccessibleName()` |
| @testing-library/user-event | ^14.0+ | User interaction simulation | More realistic than fireEvent, follows actual browser behavior |
| jsdom | ^25.0+ | Virtual DOM environment | Lightweight browser environment for Vitest tests |

### End-to-End Testing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | ^1.49+ | E2E cross-browser testing | Single API for Chromium/Firefox/WebKit, auto-waiting, built-in screenshot comparison, component testing support |
| @axe-core/playwright | ^4.10+ | Automated accessibility testing | Industry standard a11y engine, finds ~57% of WCAG issues automatically |

### API Mocking & Integration
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MSW (Mock Service Worker) | ^2.0+ | Network-level API mocking | Intercepts at network layer, reusable across test/dev/Storybook, works with any HTTP client |

### Performance & Quality Monitoring
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @lhci/cli | ^0.14+ | Lighthouse CI integration | Automates Lighthouse audits per commit, prevents performance regressions |
| rollup-plugin-visualizer | ^6.0+ | Bundle size analysis | Gold standard for Rollup/Vite bundle visualization, treemap view, source map accuracy |
| vite-bundle-analyzer | ^0.12+ | Alternative bundle analyzer | Native Vite support, interactive treemap |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/ui | ^2.0+ | Visual test UI | Development environment for test debugging |
| @vitest/coverage-v8 | ^2.0+ | Code coverage | When coverage metrics are required (optional for phase 16) |
| happy-dom | ^15.0+ | Faster DOM environment | Alternative to jsdom if speed is critical (jsdom more compatible) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest is legacy standard but slower, requires more config for ESM/Vite projects |
| Playwright | Cypress | Cypress good for component testing, but Playwright has better cross-browser support and is faster |
| Built-in screenshots | Percy/Chromatic | Percy/Chromatic offer AI-powered diff filtering and cloud rendering, but require paid plans and add complexity |
| Lighthouse CI | Manual Lighthouse | Manual testing doesn't catch regressions automatically, no baseline comparison |

**Installation:**
```bash
# Core testing (Vitest + RTL)
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui

# E2E and accessibility
npm install -D playwright @axe-core/playwright
npx playwright install chromium firefox webkit

# API mocking
npm install -D msw

# Performance monitoring
npm install -D @lhci/cli

# Bundle analysis (choose one)
npm install -D rollup-plugin-visualizer
# OR
npm install -D vite-bundle-analyzer
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── src/
│   ├── __tests__/              # Test utilities and setup
│   │   ├── setup.js            # Vitest global setup (@testing-library/jest-dom)
│   │   ├── utils/
│   │   │   ├── test-utils.jsx  # Custom render with providers (i18n, AuthContext)
│   │   │   └── msw-handlers.js # MSW request handlers for API mocking
│   │   └── mocks/
│   │       └── i18n.js         # Mock i18next for unit tests
│   ├── components/
│   │   └── primitives/
│   │       ├── Button.test.jsx       # Co-located component tests
│   │       ├── Card.test.jsx
│   │       └── CollectionCard.test.jsx
│   ├── pages/
│   │   └── CollectionDetailsPage.test.jsx
│   └── ...
├── e2e/                        # Playwright E2E tests
│   ├── auth.setup.js           # Authentication state setup
│   ├── critical-flows/
│   │   ├── upload-and-share.spec.js
│   │   ├── create-collection.spec.js
│   │   └── client-selection.spec.js
│   ├── cross-browser/
│   │   └── responsive-layout.spec.js
│   └── visual-regression/
│       └── multi-locale.spec.js
├── playwright.config.js        # Playwright configuration
├── vitest.config.js            # Vitest configuration (extends vite.config.js)
├── lighthouserc.json           # Lighthouse CI configuration
└── package.json
```

### Pattern 1: Custom Render Utility with Providers
**What:** Wrap components with necessary providers (i18n, Router, AuthContext) for realistic testing
**When to use:** All component tests that depend on context or routing
**Example:**
```javascript
// Source: https://react.i18next.com/misc/testing
// src/__tests__/utils/test-utils.jsx
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import i18n from '../mocks/i18n';

function customRender(ui, options = {}) {
  const { locale = 'en', ...renderOptions } = options;

  // Change language for this test
  i18n.changeLanguage(locale);

  return render(
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>,
    renderOptions
  );
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

### Pattern 2: Vitest Configuration with jsdom
**What:** Configure Vitest to use jsdom environment and load setup files
**When to use:** Initial project setup
**Example:**
```javascript
// Source: https://vitest.dev/guide/
// vitest.config.js
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/__tests__/setup.js',
      css: true, // Parse CSS imports (Tailwind)
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['node_modules/', 'src/__tests__/'],
      },
    },
  })
);
```

### Pattern 3: MSW API Mocking for Integration Tests
**What:** Intercept network requests at network layer, not library layer
**When to use:** Testing components that fetch data, testing loading/error states
**Example:**
```javascript
// Source: https://mswjs.io/docs/
// src/__tests__/utils/msw-handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.pixelforge.pro/backend/collections', () => {
    return HttpResponse.json([
      { id: 'c1', title: 'Wedding 2026', status: 'DRAFT', photoCount: 12 },
      { id: 'c2', title: 'Portrait Session', status: 'SELECTING', photoCount: 45 },
    ]);
  }),

  http.post('https://api.pixelforge.pro/backend/collections', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ id: 'c3', ...data }, { status: 201 });
  }),
];

// In test file:
import { setupServer } from 'msw/node';
import { handlers } from './utils/msw-handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Pattern 4: Playwright Multi-Locale Visual Regression
**What:** Take screenshots across different locales and compare against baselines
**When to use:** Validating UI doesn't break with longer translations (German +25%, Russian Cyrillic)
**Example:**
```javascript
// Source: https://playwright.dev/docs/test-snapshots
// e2e/visual-regression/multi-locale.spec.js
import { test, expect } from '@playwright/test';

const locales = ['en', 'lt', 'ru'];

for (const locale of locales) {
  test(`collections page - ${locale} locale`, async ({ page }) => {
    // Set locale in localStorage before navigation
    await page.addInitScript((loc) => {
      localStorage.setItem('i18nextLng', loc);
    }, locale);

    await page.goto('https://pixelforge.pro/collections');

    // Wait for content to load
    await page.waitForSelector('[data-testid="collection-card"]');

    // Visual snapshot with locale suffix
    await expect(page).toHaveScreenshot(`collections-${locale}.png`, {
      fullPage: true,
      maxDiffPixels: 100, // Allow small anti-aliasing differences
    });
  });
}
```

### Pattern 5: Lighthouse CI Performance Budget
**What:** Automate Lighthouse audits with assertions on performance metrics
**When to use:** Every commit to prevent performance regressions
**Example:**
```json
// Source: https://github.com/GoogleChrome/lighthouse-ci
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "https://pixelforge.pro/",
        "https://pixelforge.pro/collections"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["warn", {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Pattern 6: Axe Accessibility Testing in Playwright
**What:** Run automated accessibility scans in E2E tests
**When to use:** Critical user flows and all public-facing pages
**Example:**
```javascript
// Source: https://github.com/dequelabs/axe-core
// e2e/accessibility/wcag-compliance.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('collections page should not have accessibility violations', async ({ page }) => {
  await page.goto('https://pixelforge.pro/collections');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Don't test state variables or internal methods; test user-visible behavior (what user sees/clicks)
- **Over-mocking:** Don't mock everything; use real components and MSW for APIs. Over-mocking makes tests brittle and unrepresentative
- **Hardcoded waits:** Don't use `sleep()` or `setTimeout()` in tests; use Playwright's auto-waiting or React Testing Library's `waitFor()`
- **Snapshot testing everything:** Visual snapshots are fragile; use for critical UI only, prefer semantic assertions
- **Testing third-party libraries:** Don't test that react-i18next works; assume it works, test your usage
- **Ignoring accessibility:** Don't treat a11y as optional; axe-core catches 57% of issues automatically
- **Per-commit E2E runs:** Don't run full Playwright suite on every commit; run on PR/merge only (slow and expensive)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API mocking in tests | Custom fetch interceptors, manual stubs | MSW (Mock Service Worker) | MSW works at network level (Service Worker API), so it's framework-agnostic, reusable across test/dev/Storybook, and doesn't require changing production code |
| Accessibility testing | Manual WCAG checklist | axe-core / @axe-core/playwright | Axe-core is maintained by Deque (a11y experts), finds ~57% of WCAG issues automatically, regularly updated for new standards, covers complex rules (color contrast, ARIA) |
| Visual regression | Custom screenshot diffing | Playwright's built-in `toHaveScreenshot()` (or Percy for advanced) | Playwright handles pixel diffing, baseline management, OS-specific rendering. Percy adds AI-powered noise filtering but costs money |
| Performance regression detection | Manual Lighthouse runs | Lighthouse CI | LHCI automates audits, compares against baselines, fails builds on regression, integrates with CI/CD (GitHub Actions, Jenkins, CircleCI) |
| Bundle size monitoring | Manual webpack-bundle-analyzer runs | rollup-plugin-visualizer with CI integration | Automated bundle analysis catches size regressions before merge, visualizer provides treemap, size trends, and module-level analysis |
| Cross-browser testing matrix | Custom Selenium grid setup | Playwright (built-in Chromium/Firefox/WebKit) or BrowserStack | Playwright ships with browsers, handles version management, parallelizes tests. BrowserStack provides real devices but adds cost/complexity |
| User event simulation | `fireEvent` from RTL | @testing-library/user-event | user-event follows real browser behavior (click → focus → keydown → keyup), fireEvent is too simplistic and misses edge cases |
| Test data factories | Manual object construction | MSW with realistic fixtures | MSW handlers can return realistic data, avoiding brittle inline test data. Factories add complexity without MSW's network-level benefits |

**Key insight:** Testing infrastructure has matured significantly. Don't reinvent API mocking (MSW is the standard), accessibility scanning (axe-core is battle-tested), or performance monitoring (Lighthouse CI is official Google tooling). Custom solutions miss edge cases, require maintenance, and lack community support. Use proven tools and focus effort on writing good tests, not building test infrastructure.

## Common Pitfalls

### Pitfall 1: CSS Not Loading in Vitest Tests
**What goes wrong:** Tailwind classes aren't applied in tests, components render without styles, assertions on computed styles fail
**Why it happens:** Vitest defaults to ignoring CSS imports unless `css: true` is set in config
**How to avoid:** Add `css: true` to vitest.config.js `test` section. This processes CSS files through Vite's pipeline.
**Warning signs:** Tests pass but components look broken when visually inspected, `getComputedStyle()` returns empty values

### Pitfall 2: i18next Not Initialized in Tests
**What goes wrong:** Tests fail with "i18next not initialized" errors, `t()` function returns keys instead of translations
**Why it happens:** i18next initialization is async and happens in main.jsx, but tests don't run that code
**How to avoid:** Create mock i18n instance in `src/__tests__/mocks/i18n.js` with synchronous init, load test translations, export configured instance for test-utils.jsx
**Warning signs:** Tests fail immediately with i18n errors, translations show as "namespace.key" strings

### Pitfall 3: AuthContext `isAuthenticated` Mismatch
**What goes wrong:** Tests fail because AuthContext isn't providing expected values, protected routes don't render
**Why it happens:** Tests render components without AuthProvider, or mock doesn't match production shape (`isAuthenticated` is boolean, not function)
**How to avoid:** Include AuthProvider in custom render utility with default mock user, or override per test with `wrapper` option
**Warning signs:** "Cannot read property 'isAuthenticated' of undefined", ProtectedRoute redirects in tests

### Pitfall 4: Flaky Playwright Tests Due to Font Loading
**What goes wrong:** Visual regression tests fail inconsistently, screenshot diffs show font differences
**Why it happens:** Fonts load asynchronously, screenshots captured before fonts render
**How to avoid:** Use `page.waitForLoadState('networkidle')` before screenshots, or disable web fonts in test config, or wait for specific font-loaded class
**Warning signs:** Visual diffs show different fonts between runs, failures are non-deterministic

### Pitfall 5: CORS Errors in E2E Tests
**What goes wrong:** Playwright tests fail with CORS errors when calling api.pixelforge.pro
**Why it happens:** Cross-domain setup requires cookies with `SameSite=None; Secure`, but test environment may not use HTTPS
**How to avoid:** Either (1) run E2E tests against production/staging (real HTTPS), or (2) configure local HTTPS with mkcert, or (3) use Playwright's route interception to mock API responses without network calls
**Warning signs:** Tests work locally but fail in CI, cookie-related auth failures, preflight OPTIONS requests failing

### Pitfall 6: Cumulative Layout Shift (CLS) from Missing Image Dimensions
**What goes wrong:** Lighthouse CI fails CLS budget (<0.1), but manual testing seems fine
**Why it happens:** Images without explicit width/height cause layout shift when they load. PhotoCard/CollectionCard components may not reserve space.
**How to avoid:** Add `aspect-ratio` CSS or explicit width/height to all `<img>` tags, use placeholder dimensions for dynamic images
**Warning signs:** CLS score varies between runs, higher on slow connections, worse with more images

### Pitfall 7: Bundle Size Explosion from Lodash/Moment
**What goes wrong:** Bundle size exceeds 50KB CSS gzipped target, or JS bundle bloats unexpectedly
**Why it happens:** Importing from `lodash` instead of `lodash-es` or `lodash/func` pulls entire library. Current bundle (376KB JS uncompressed) suggests this may not be an issue yet, but watch for third-party deps.
**How to avoid:** Use rollup-plugin-visualizer to identify large dependencies, tree-shake with named imports, consider alternatives (date-fns instead of moment)
**Warning signs:** Single vendor chunk dominates bundle, visualizer shows large unused modules

### Pitfall 8: Testing Task Completion Time Without Baseline
**What goes wrong:** Can't prove redesign improved UX because no "before" measurement exists
**Why it happens:** Task completion time (TEST-03) requires baseline metrics from current production UI
**How to avoid:** **CRITICAL:** Measure task completion time on current production (v2.0) BEFORE implementing phase 16 tests. Record baseline for "upload → share" and "create collection" flows. Then measure again after v3.0 launch.
**Warning signs:** No baseline data exists, can only report absolute times (not improvement percentages)

### Pitfall 9: Multi-Locale Overflow Not Caught by English-Only Tests
**What goes wrong:** German/Russian translations overflow containers, break layouts, but English tests pass
**Why it happens:** German text is ~25% longer, Russian uses wider Cyrillic characters. English-only tests don't catch this.
**How to avoid:** Run visual regression tests for all three locales (LT/EN/RU) with Playwright screenshots, add 30% width buffer to critical UI elements per TEST-04 requirement
**Warning signs:** Bug reports in non-English locales, truncated text, broken mobile layouts in LT/RU

### Pitfall 10: Touch Target Testing on Desktop-Only Emulation
**What goes wrong:** Touch targets seem fine in Chrome DevTools mobile emulation, but real devices show issues
**Why it happens:** Desktop browser emulation doesn't perfectly replicate physical device constraints (fat fingers, one-handed use)
**How to avoid:** Test on real physical devices (TEST-02 requirement): one iOS device, one Android device. Verify 48x48px minimum touch targets, comfortable one-handed reach.
**Warning signs:** Bug reports from mobile users, accidental taps on wrong elements, "hard to use" feedback

## Code Examples

Verified patterns from official sources:

### Component Test with Custom Render and User Interaction
```javascript
// Source: https://www.robinwieruch.de/vitest-react-testing-library/
import { render, screen, waitFor } from './__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    // Tailwind classes should be applied (requires css: true in vitest.config)
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Multi-Locale Translation Test
```javascript
// Source: https://react.i18next.com/misc/testing
import { render, screen } from './__tests__/utils/test-utils';
import { CollectionCard } from './CollectionCard';

const mockCollection = {
  id: 'c1',
  title: 'Wedding 2026',
  status: 'DRAFT',
  photoCount: 12,
  createdAt: '2026-02-01',
};

describe('CollectionCard - i18n', () => {
  it('renders in English', () => {
    render(<CollectionCard collection={mockCollection} />, { locale: 'en' });
    expect(screen.getByText(/12 photos/i)).toBeInTheDocument();
  });

  it('renders in Lithuanian', () => {
    render(<CollectionCard collection={mockCollection} />, { locale: 'lt' });
    expect(screen.getByText(/12 nuotraukų/i)).toBeInTheDocument();
  });

  it('renders in Russian', () => {
    render(<CollectionCard collection={mockCollection} />, { locale: 'ru' });
    expect(screen.getByText(/12 фотографий/i)).toBeInTheDocument();
  });
});
```

### MSW API Integration Test
```javascript
// Source: https://mswjs.io/docs/
import { render, screen, waitFor } from './__tests__/utils/test-utils';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { CollectionsListPage } from './CollectionsListPage';

const server = setupServer(
  http.get('https://api.pixelforge.pro/backend/collections', () => {
    return HttpResponse.json([
      { id: 'c1', title: 'Wedding 2026', status: 'DRAFT', photoCount: 12 },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CollectionsListPage - API integration', () => {
  it('displays collections from API', async () => {
    render(<CollectionsListPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Wedding 2026')).toBeInTheDocument();
    expect(screen.getByText(/12 photos/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('https://api.pixelforge.pro/backend/collections', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    render(<CollectionsListPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading collections/i)).toBeInTheDocument();
    });
  });
});
```

### Playwright Critical Flow Test
```javascript
// Source: https://playwright.dev/docs/test-fixtures
import { test, expect } from '@playwright/test';

test.describe('Upload and Share Flow', () => {
  test.use({ storageState: 'e2e/auth.json' }); // Pre-authenticated state

  test('photographer can upload photos and share collection', async ({ page }) => {
    // Navigate to collections
    await page.goto('https://pixelforge.pro/collections');

    // Create new collection
    await page.getByRole('button', { name: /new collection/i }).click();
    await page.getByLabel(/collection name/i).fill('Test Wedding 2026');
    await page.getByRole('button', { name: /create/i }).click();

    // Should navigate to collection details
    await expect(page).toHaveURL(/\/collection\/c[a-z0-9]+/);
    await expect(page.getByText('Test Wedding 2026')).toBeVisible();

    // Upload photos (simulate file input)
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      'e2e/fixtures/photo1.jpg',
      'e2e/fixtures/photo2.jpg',
    ]);

    // Wait for upload to complete
    await expect(page.getByText(/2 photos/i)).toBeVisible({ timeout: 10000 });

    // Share with client
    await page.getByRole('button', { name: /share with client/i }).click();

    // Should show share link
    await expect(page.getByText(/share link/i)).toBeVisible();
    const shareLink = await page.getByTestId('share-link').textContent();
    expect(shareLink).toMatch(/pixelforge\.pro\/share\//);
  });
});
```

### Playwright Visual Regression with Locale
```javascript
// Source: https://playwright.dev/docs/test-snapshots
import { test, expect } from '@playwright/test';

test('collection details page - visual regression across locales', async ({ page }) => {
  const locales = [
    { code: 'en', name: 'English' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'ru', name: 'Russian' },
  ];

  for (const locale of locales) {
    await test.step(`${locale.name} locale`, async () => {
      // Set locale before navigation
      await page.addInitScript((loc) => {
        localStorage.setItem('i18nextLng', loc);
      }, locale.code);

      await page.goto('https://pixelforge.pro/collection/c1234567890');

      // Wait for i18n to load
      await page.waitForLoadState('networkidle');

      // Take full-page screenshot
      await expect(page).toHaveScreenshot(`collection-details-${locale.code}.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });
  }
});
```

### Lighthouse CI in GitHub Actions
```yaml
# Source: https://github.com/GoogleChrome/lighthouse-ci
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build production bundle
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### Bundle Size Monitoring with rollup-plugin-visualizer
```javascript
// Source: https://github.com/btd/rollup-plugin-visualizer
// vite.config.js (add to plugins array)
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      // Visualizer must be in rollupOptions.plugins for Vite
      plugins: [],
    },
  },
});
```

### Accessibility Test with axe-core
```javascript
// Source: https://github.com/dequelabs/axe-core
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('share page should meet WCAG 2.1 AA standards', async ({ page }) => {
  await page.goto('https://pixelforge.pro/share/abc123');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('#third-party-widget') // Exclude third-party content
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('touch targets meet minimum size (48x48dp)', async ({ page }) => {
  await page.goto('https://pixelforge.pro/share/abc123');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag22aa']) // WCAG 2.2 includes touch target size
    .analyze();

  const touchTargetViolations = accessibilityScanResults.violations.filter(
    (v) => v.id === 'target-size'
  );

  expect(touchTargetViolations).toEqual([]);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + create-react-app | Vitest + Vite | 2021-2023 | 4x faster test runs, native ESM/TypeScript, no Babel config needed |
| Enzyme (Airbnb) | React Testing Library | 2018-2020 | Focus shifted from implementation to user behavior, Enzyme deprecated |
| Manual Lighthouse audits | Lighthouse CI automation | 2019-2020 | Performance regressions caught in CI, not production |
| Percy/Chromatic required for visual regression | Playwright built-in screenshots | 2021-2023 | Visual regression now free/open-source, though Percy still better for teams needing AI diff filtering |
| Separate Selenium grid for cross-browser | Playwright with bundled browsers | 2020-2021 | No external grid setup, browsers version-managed by Playwright, faster execution |
| fireEvent for user interaction | @testing-library/user-event | 2020-2021 | More realistic user interaction simulation (follows real browser event sequences) |
| fetch mocking with jest.mock | MSW (Mock Service Worker) | 2020-2022 | Network-level mocking works across test/dev/Storybook, no production code changes |
| WCAG 2.1 Level AA | WCAG 2.2 Level AA (touch targets) | 2023-2024 | New success criterion 2.5.8 for 24x24px minimum touch targets (48x48px recommended remains best practice) |
| Manual bundle analysis | Automated bundle size monitoring in CI | 2021-2023 | Bundle regressions caught before merge, treemap visualization standard |

**Deprecated/outdated:**
- **Enzyme:** Officially deprecated in favor of React Testing Library. Don't use for new projects.
- **Jest for Vite projects:** Jest works but requires extra config (babel, ESM transforms). Vitest is the modern standard for Vite.
- **karma + jasmine:** Legacy Angular testing stack, replaced by Vitest or Jest for modern frameworks.
- **Protractor:** Deprecated by Angular team, replaced by Playwright or Cypress.
- **CasperJS / PhantomJS:** Headless browser testing replaced by Playwright/Puppeteer with real browsers.
- **Manual screenshot comparison:** Replaced by Playwright's `toHaveScreenshot()` or Percy/Chromatic for visual regression.

## Open Questions

1. **Physical Device Testing Scope (TEST-02)**
   - What we know: Requirements specify "physical device testing on mobile (one-handed use, touch targets validated)"
   - What's unclear: Which specific devices? How many? iOS + Android minimum? Any specific screen sizes?
   - Recommendation: Test on at least one iOS device (iPhone 13+ for current sizes) and one Android device (Pixel 6+ or Samsung Galaxy S21+). Focus on most common screen sizes from analytics if available. BrowserStack Device Lab offers cloud access if physical devices unavailable.

2. **Task Completion Time Baseline (TEST-03)**
   - What we know: Need to measure task completion time before/after redesign for "upload → share, create collection"
   - What's unclear: Baseline measurement doesn't exist yet (v2.0 is current production). Need to measure BEFORE running phase 16.
   - Recommendation: **CRITICAL PRE-PHASE TASK:** Run usability testing on current production (v2.0) with 5-10 users to establish baseline task completion times. Use tools like Maze, UserTesting, or manual observation. Record mean and standard deviation for statistical comparison.

3. **Visual Regression Baseline Storage**
   - What we know: Playwright screenshots need baseline images to compare against
   - What's unclear: Where to store baseline screenshots? In git (bloats repo)? Separate storage?
   - Recommendation: For small project, commit baselines to git in `e2e/__screenshots__/`. For larger teams, use Playwright's cloud storage or Percy for centralized baseline management. Update baselines only when UI intentionally changes.

4. **CI/CD Integration for Lighthouse**
   - What we know: Lighthouse CI should run automatically
   - What's unclear: Run on every commit (slow) or just PR merges? Which URLs to audit?
   - Recommendation: Run Lighthouse CI on PR open/update only, not every commit. Audit homepage, /collections, and /collection/:id (with test data). Store results in GitHub Actions artifacts or Lighthouse CI server for trend tracking.

5. **Multi-Locale Overflow 30% Width Buffer (TEST-04)**
   - What we know: Requirements specify "30% width buffer" for overflow checks
   - What's unclear: How to implement programmatically? Just visual inspection?
   - Recommendation: Use Playwright visual regression screenshots across locales as primary check. Add explicit container width tests for critical UI (buttons, cards) to verify they don't truncate at +30% text length. German translations are typically +25%, so 30% buffer should catch issues.

6. **Bundle Size Target: CSS Only or JS Too?**
   - What we know: QUALITY-01 specifies "<50KB CSS gzipped", current is 40KB uncompressed (~10KB gzipped likely)
   - What's unclear: Is 376KB JS bundle acceptable? No JS budget specified in requirements.
   - Recommendation: Focus on CSS budget as specified. JS bundle seems reasonable for React SPA (React + React Router + i18next ≈ 150KB, rest is app code). Monitor with visualizer but don't block on JS size unless exceeds 500KB gzipped.

7. **E2E Test Data Management**
   - What we know: E2E tests need test collections, photos, user accounts
   - What's unclear: Create test data per test? Share fixtures? Use production-like staging data?
   - Recommendation: Use Playwright's `storageState` for pre-authenticated sessions. Create test collections via API setup scripts before tests (faster than UI). Use small fixture images (<100KB) in `e2e/fixtures/`. Reset test database between runs if possible, or use unique IDs per test run to avoid conflicts.

## Sources

### Primary (HIGH confidence)
- [Vitest Official Documentation](https://vitest.dev/guide/) - Vitest configuration, browser mode, component testing
- [React Testing Library Official Docs](https://testing-library.com/docs/react-testing-library/intro/) - Testing philosophy, best practices
- [Playwright Official Documentation](https://playwright.dev/) - E2E testing, visual regression, cross-browser support
- [Lighthouse CI GitHub](https://github.com/GoogleChrome/lighthouse-ci) - CI/CD integration, configuration
- [MSW Official Documentation](https://mswjs.io/docs/) - API mocking patterns
- [axe-core GitHub](https://github.com/dequelabs/axe-core) - Accessibility testing standards
- [Web.dev - Core Web Vitals](https://web.dev/articles/vitals) - LCP, CLS metrics and thresholds
- [react-i18next Testing Docs](https://react.i18next.com/misc/testing) - i18n testing patterns

### Secondary (MEDIUM confidence)
- [Component Testing with Vitest](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view) - January 2026 guide, recent best practices
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies) - 2026 ecosystem overview
- [Playwright Visual Regression Testing](https://www.browserstack.com/guide/visual-regression-testing-using-playwright) - Visual regression patterns
- [Lighthouse Test Automation](https://www.debugbear.com/software/lighthouse-automation) - CI/CD integration patterns
- [MSW with React](https://oneuptime.com/blog/post/2026-01-15-mock-api-calls-react-msw/view) - January 2026 React integration guide
- [Internationalization Testing 2026](https://www.browserstack.com/guide/internationalization-testing-of-websites-and-apps) - Multi-locale testing strategies
- [Mobile Accessibility Testing](https://www.browserstack.com/guide/accessibility-testing-for-mobile-apps) - Touch target standards, WCAG 2.2
- [Cumulative Layout Shift Guide](https://medium.com/@sahoo.arpan7/cumulative-layout-shift-guide-to-one-of-the-most-misunderstood-core-web-vitals-5f135c68cb6f) - January 2026 CLS deep dive
- [LCP Optimization for React](https://web.dev/articles/optimize-lcp) - Core Web Vitals optimization
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) - Bundle analysis tooling

### Tertiary (LOW confidence)
- WebSearch results for general testing trends - Used for ecosystem awareness, verified against official docs
- Stack Overflow discussions on Vitest + i18next - Community patterns, not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vitest, RTL, Playwright, MSW, Lighthouse CI are all officially documented and industry-standard for 2026
- Architecture: HIGH - Patterns sourced from official documentation (Vitest, Playwright, MSW, axe-core)
- Pitfalls: MEDIUM-HIGH - Based on common issues documented in GitHub issues, official troubleshooting guides, and verified community patterns
- Open questions: MEDIUM - Identified specific gaps (baseline task time, device selection, test data strategy) that require project-specific decisions

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable testing ecosystem, but Playwright/Vitest update frequently)

**Notes:**
- Current production bundle: 40KB CSS (uncompressed), 376KB JS (uncompressed). CSS likely ~10KB gzipped, well under 50KB target.
- No existing test infrastructure found (no `.test.jsx` files, no `vitest.config.js`, no `playwright.config.js`).
- Project has 27 JSX files total, 6 primitive components, 8 pages - manageable test coverage scope.
- Multi-locale support (LT/EN/RU) via react-i18next requires special testing attention (custom render utility, visual regression per locale).
- Cross-domain API setup (pixelforge.pro → api.pixelforge.pro) may complicate E2E tests; consider Playwright route interception for faster tests.
- WCAG 2.2 Level AA now includes touch target size criterion (2.5.8: 24x24px minimum), recommend 48x48px per Material Design.
