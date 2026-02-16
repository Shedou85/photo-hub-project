import { test, expect } from '@playwright/test';

/**
 * Multi-locale visual regression tests (TEST-04)
 *
 * Tests homepage and login page in all 3 locales (EN, LT, RU).
 * Screenshots will reveal layout overflow if translations break design.
 * The 30% width buffer check is visual — overflow appears in screenshots.
 */

const LOCALES = ['en', 'lt', 'ru'];
const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/login', name: 'login' },
];

for (const locale of LOCALES) {
  for (const page of PAGES) {
    test(`${page.name} renders correctly in ${locale.toUpperCase()}`, async ({ page: playwrightPage }) => {
      // Set locale before navigation via localStorage
      await playwrightPage.addInitScript((localeCode) => {
        localStorage.setItem('i18nextLng', localeCode);
      }, locale);

      // Navigate to page
      await playwrightPage.goto(page.path);

      // Wait for network idle to ensure fonts and i18n loaded
      await playwrightPage.waitForLoadState('networkidle');

      // Take full-page screenshot for comparison
      await expect(playwrightPage).toHaveScreenshot(`${page.name}-${locale}.png`, {
        fullPage: true,
      });
    });
  }
}
