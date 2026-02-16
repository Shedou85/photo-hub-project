import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA accessibility compliance tests
 *
 * Runs axe-core accessibility scans on public pages.
 * Uses only chromium-desktop project (axe results are browser-independent).
 */

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/login', name: 'Login page' },
];

// Only run on chromium-desktop to avoid duplicate axe scans
test.describe('WCAG 2.1 AA compliance', () => {
  for (const page of PAGES) {
    test(`${page.name} has no accessibility violations`, async ({ page: playwrightPage, browserName }) => {
      // Skip non-chromium browsers (axe results are browser-independent)
      test.skip(browserName !== 'chromium', 'Accessibility tests only run on Chromium');

      // Navigate to page
      await playwrightPage.goto(page.path);

      // Run axe-core scan with WCAG 2.1 AA tags
      const accessibilityScanResults = await new AxeBuilder({ page: playwrightPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Assert no violations
      const violations = accessibilityScanResults.violations;

      if (violations.length > 0) {
        // Format violations for readable error message
        const violationMessages = violations.map((violation) => {
          const affectedElements = violation.nodes
            .map((node) => `  - ${node.html}`)
            .join('\n');

          return `
Rule: ${violation.id} (${violation.impact} impact)
Description: ${violation.description}
Help: ${violation.help}
Affected elements:
${affectedElements}
          `.trim();
        });

        throw new Error(
          `Found ${violations.length} accessibility violation(s):\n\n${violationMessages.join('\n\n')}`
        );
      }

      expect(violations).toHaveLength(0);
    });
  }
});
