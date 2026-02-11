# Testing Patterns

**Analysis Date:** 2026-02-11

## Test Framework

**Runner:**
- Not detected
- No test runner configured (Jest, Vitest, etc. not in package.json)

**Assertion Library:**
- Not detected
- No testing framework installed

**Current Status:**
The codebase has NO automated testing infrastructure. Testing is manual only.

## Test File Organization

**Location:**
- No test files found in repository
- No `__tests__`, `tests/`, or `*.test.js`/`*.spec.js` files detected

**Naming Convention:**
- Not applicable (no tests exist)

**Suggested Pattern for Future:**
- Co-locate test files next to components: `src/components/Accordion.jsx` with `src/components/Accordion.test.jsx`
- Or separate `/tests` directory mirroring `/src` structure

## Manual Testing Approach (Current)

**Frontend Testing:**
- Browser-based manual testing only
- No integration test framework

**Backend Testing:**
- Health check endpoints available for manual testing:
  - `GET /test` - Simple test response
  - `GET /db-test` - Database connection verification
  - Located in `backend/index.php` lines 51-80

**Example:**
```php
case '/db-test':
    if ($requestMethod == 'GET') {
        try {
            $pdo = getDbConnection();
            $stmt = $pdo->query('SELECT 1');
            if ($stmt) {
                echo json_encode(['status' => 'success', 'message' => 'Database connection successful!']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database connection failed...']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
        }
    }
    break;
```

## Mocking (Not Applicable)

**Current State:**
- No mocking framework or pattern established
- No unit tests requiring mocks

## Fixtures and Test Data (Not Applicable)

**Current State:**
- No test fixtures or test data factories in place
- Manual database seeding only

## Coverage

**Requirements:**
- Not enforced (no coverage tool integrated)
- Coverage badge/metrics: Not present

## Test Types

**Unit Tests:**
- Not implemented
- Would test: Individual functions, utility helpers, validation logic

**Integration Tests:**
- Not implemented
- Would test: API endpoint flows, database operations, auth flows

**E2E Tests:**
- Not implemented
- Could use: Playwright, Cypress for browser automation
- Priority flows to test:
  1. User registration and login
  2. Collection creation and management
  3. Photo upload workflow
  4. Client selection workflow
  5. Language switching

## Testable Areas (By Component)

**Frontend Components:**

**`LoginPage.jsx`** (`frontend/src/pages/LoginPage.jsx`)
- Test email/password input capture
- Test form submission with valid/invalid credentials
- Test error message display
- Test language switching
- Test scroll behavior for header
- Test navigation redirect on successful login

**`CollectionsListPage.jsx`** (`frontend/src/pages/CollectionsListPage.jsx`)
- Test fetch collections on mount
- Test create collection form submission
- Test delete collection confirmation and action
- Test share link copy functionality
- Test loading/error states
- Test empty state display

**`ProfilePage.jsx`** (`frontend/src/pages/ProfilePage.jsx`)
- Test name/bio input capture
- Test form submission
- Test user info display
- Test plan/role badge rendering
- Test date formatting

**`Accordion.jsx`** (`frontend/src/components/Accordion.jsx`)
- Test toggle open/close state
- Test keyboard navigation (Enter key)
- Test aria-expanded attribute
- Test animation/transition classes

**`ProtectedRoute.jsx`** (`frontend/src/components/ProtectedRoute.jsx`)
- Test redirect to login when not authenticated
- Test render children when authenticated

**`AuthContext.jsx`** (`frontend/src/contexts/AuthContext.jsx`)
- Test login/logout state management
- Test localStorage persistence
- Test isAuthenticated boolean derivation

**Backend Endpoints:**

**`auth/login.php`** (`backend/auth/login.php`)
- Test valid credentials return user data
- Test invalid credentials return 401
- Test inactive account returns 403
- Test missing email/password returns 400
- Test session is set on successful login

**`collections/index.php`** (`backend/collections/index.php`)
- Test GET returns collections for authenticated user
- Test POST creates new collection with CUID
- Test GET returns 401 when not authenticated
- Test POST validates collection name not empty
- Test collections ordered by createdAt DESC

**`collections/id.php`** (`backend/collections/id.php`)
- Test GET returns single collection by ID
- Test GET returns 404 for nonexistent collection
- Test DELETE removes collection
- Test authorization (only owner can delete)

**`profile/me.php`** (`backend/profile/me.php`)
- Test PATCH updates name and bio
- Test returns updated user object
- Test 401 when not authenticated
- Test 405 for unsupported HTTP methods

## Recommended Testing Setup

**For New Tests (Phase 0):**

1. **Install Testing Framework:**
```bash
npm install --save-dev vitest @vitest/ui happy-dom
```

2. **Create Configuration** (`frontend/vitest.config.js`):
```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
  },
})
```

3. **Example Unit Test** (`frontend/src/components/Accordion.test.jsx`):
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Accordion from './Accordion'

describe('Accordion', () => {
  it('renders title and toggles content on click', async () => {
    render(
      <Accordion title="Test Title">
        <p>Test Content</p>
      </Accordion>
    )

    expect(screen.getByText('Test Content')).toHaveClass('max-h-0')

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(screen.getByText('Test Content')).toHaveClass('max-h-[500px]')
  })
})
```

4. **Add npm Scripts** to `package.json`:
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

**For Backend Testing:**

1. **Use PHPUnit:**
```bash
cd backend && composer require --dev phpunit/phpunit
```

2. **Create Test Structure:**
```
backend/
├── tests/
│   ├── AuthTest.php
│   ├── CollectionsTest.php
│   └── Fixtures/
│       ├── user.json
│       └── collection.json
```

3. **Example PHP Test:**
```php
<?php
use PHPUnit\Framework\TestCase;

class AuthTest extends TestCase {
    public function testLoginWithValidCredentials() {
        // Setup
        // Assert login returns user object with status OK
    }

    public function testLoginWithInvalidCredentials() {
        // Setup
        // Assert response is 401
    }
}
```

## Testing Best Practices (When Implemented)

**Do:**
- Test component behavior, not implementation details
- Test user interactions: clicks, form submission, typing
- Mock API calls; don't test real backend in unit tests
- Write tests for edge cases: empty states, errors, loading
- Use semantic queries: `getByRole`, `getByLabelText` over `getByTestId`
- Test accessibility: aria attributes, keyboard navigation
- One assertion per test when possible; multiple related assertions OK
- Keep tests focused and readable

**Don't:**
- Don't test Tailwind CSS classes directly
- Don't snapshot-test unless necessary for visual regression
- Don't over-test trivial code (simple getters, style props)
- Don't test third-party libraries (react-router, react-i18next)
- Don't create brittle tests that break on minor refactors

## CI/CD Testing (Not Configured)

**Current State:**
- No CI/CD pipeline detected
- No pre-commit hooks enforcing tests

**Recommendations:**
- Add GitHub Actions workflow to run tests on PR
- Block merge if tests fail
- Run linter as gating check

---

*Testing analysis: 2026-02-11*
