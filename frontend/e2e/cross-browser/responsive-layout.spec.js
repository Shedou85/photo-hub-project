import { test, expect } from '@playwright/test';

/**
 * Cross-browser responsive layout tests (TEST-01, TEST-05)
 *
 * Tests homepage and login page at multiple viewport sizes:
 * - Mobile: 375x667 (iPhone SE)
 * - Tablet: 768x1024 (iPad portrait)
 * - Desktop: 1920x1080 (Full HD)
 * - Ultrawide: 2560x1440 (QHD monitor, TEST-05)
 *
 * Runs across all 5 Playwright projects (Chrome, Firefox, Safari desktop + mobile).
 */

const VIEWPORTS = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 2560, height: 1440, name: 'ultrawide' },
];

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/login', name: 'login' },
];

for (const viewport of VIEWPORTS) {
  for (const page of PAGES) {
    test(`${page.name} renders correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page: playwrightPage }) => {
      // Set viewport size
      await playwrightPage.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Navigate to page
      await playwrightPage.goto(page.path);

      // Wait for network idle
      await playwrightPage.waitForLoadState('networkidle');

      // Take screenshot at this viewport size
      await expect(playwrightPage).toHaveScreenshot(
        `${page.name}-${viewport.width}x${viewport.height}.png`
      );
    });
  }
}
