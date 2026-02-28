# Coding Conventions

**Analysis Date:** 2026-02-11 | **Last Updated:** 2026-02-28

## Naming Patterns

**Files:**
- React components: PascalCase + `.jsx` (e.g., `LoginPage.jsx`, `SelectionBorder.jsx`)
- Test files: same name + `.test.jsx` (e.g., `Badge.test.jsx`, `AuthContext.test.jsx`)
- Custom hooks: camelCase with `use` prefix + `.js` (e.g., `usePhotoUpload.js`, `useLightbox.js`)
- Non-component JS files: camelCase + `.js` (e.g., `api.js`, `analytics.js`, `photoUrl.js`)
- Constants: camelCase + `.js` (e.g., `breakpoints.js`, `styles.js`)
- PHP handlers: lowercase + `.php`, grouped by feature (e.g., `auth/login.php`, `collections/share.php`)
- PHP helpers: kebab-case + `.php` (e.g., `rate-limiter.php`, `audit-logger.php`, `download-tracker.php`)
- Configuration: lowercase + `.config.js` (e.g., `tailwind.config.js`, `vitest.config.js`)

**Functions:**
- React component functions: PascalCase (e.g., `function LoginPage()`, `function SelectionBorder()`)
- Helper functions: camelCase (e.g., `getInitials()`, `photoUrl()`, `watermarkedPreviewUrl()`)
- Event handlers: `handle` prefix + action (e.g., `handleSubmit()`, `handleDeleteCollection()`)
- State setters: `set` prefix + state name (e.g., `setEmail()`, `setCollections()`)
- PHP functions: camelCase (e.g., `getDbConnection()`, `generateCuid()`, `logAuditAction()`)
- R2 functions: `r2` prefix + action (e.g., `r2Upload()`, `r2Delete()`, `r2GetStream()`)

**Variables:**
- State variables: camelCase (e.g., `email`, `collections`, `loading`, `error`)
- Constants: UPPERCASE_SNAKE_CASE (e.g., `LANGUAGES`, `SIDEBAR_WIDTH`, `BREAKPOINTS`, `NAV_ITEMS`, `PHOTO_GRID_CLASSES`)
- Destructured values: camelCase (e.g., `const { isAuthenticated, user, loading } = useAuth()`)
- Booleans: prefixed with `is`, `has`, `can` (e.g., `isAuthenticated`, `isMobile`, `isReorderMode`)

**Types/Classes:**
- React Context: PascalCase + `Context` suffix (e.g., `AuthContext`)
- Enums/Status values: UPPER_CASE (e.g., `DRAFT`, `SELECTING`, `REVIEWING`, `DELIVERED`, `DOWNLOADED`, `ARCHIVED`)
- Database table names: PascalCase backtick-quoted (e.g., `` `User` ``, `` `Collection` ``, `` `AuditLog` ``)

**i18n Keys:**
- Pattern: `namespace.key` (e.g., `login.title`, `collections.createSuccess`)
- Namespaces: common, nav, home, login, passwordReset, register, profile, collections, collection, share, delivery, plans, payments, promotional, admin, emailVerification, cookieConsent, errors, seo
- Nested keys: dot notation (e.g., `home.hero.headline1`, `profile.planLabel.STANDARD`)

## Code Style

**Formatting:**
- Indentation: 2 spaces (JavaScript/JSX)
- Semicolons: Required (ESLint enforces)
- Trailing commas: Used in multiline objects/arrays
- Prefer `const` over `let` over `var`
- Arrow functions preferred for callbacks and inline functions

**Linting:**
- Tool: ESLint v8.57.0
- Plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Rule: **Zero warnings enforced** via `--max-warnings 0` in lint script
- Run: `npm run lint` from `frontend/` directory

## Import Organization

**Order:**
1. React and React DOM (e.g., `import React, { useState, useEffect } from 'react'`)
2. External libraries (e.g., `react-router-dom`, `react-i18next`, `sonner`, `clsx`, `@dnd-kit/*`)
3. Internal contexts (e.g., `import { useAuth } from '../contexts/AuthContext'`)
4. Internal hooks (e.g., `import { useCollectionData } from '../hooks/useCollectionData'`)
5. Internal components (e.g., `import Badge from '../components/primitives/Badge'`)
6. Internal lib/utils (e.g., `import { api } from '../lib/api'`, `import { photoUrl } from '../utils/photoUrl'`)
7. Constants (e.g., `import { PHOTO_GRID_CLASSES } from '../constants/styles'`)

**Path Aliases:**
- No aliases configured — relative imports used throughout

**PHP Imports:**
- `require_once` for dependencies at file start
- Session start: `session_start()` called explicitly in each handler
- Order: required files first, then business logic

## API Client Pattern

**Pattern:** Centralized client via `frontend/src/lib/api.js`

```javascript
import { api } from '../lib/api';

// GET request
const { data, error, status } = await api.get('/collections');

// POST with JSON
const { data, error } = await api.post('/collections', { name: 'My Collection' });

// POST with FormData (auto-detected)
const formData = new FormData();
formData.append('file', file);
const { data, error } = await api.post(`/collections/${id}/photos`, formData);
```

**Rules:**
- All authenticated API calls MUST use `api.js` — never raw `fetch()`
- Raw `fetch()` only allowed for CSRF-exempt routes (login, register, share/*, deliver/*, etc.)
- Client returns `{ data, error, status }` — never throws
- Auto-handles CSRF tokens on mutations (POST/PATCH/PUT/DELETE)
- Auto-retries once on 403 CSRF errors with fresh token

## Error Handling

**JavaScript/React:**
- API client returns `{ error }` — check for error in response
- Toast notifications for user feedback: `toast.success()`, `toast.error()`
- ErrorBoundary wraps all routes for uncaught React errors
- `useApi` hook provides `{ loading, error }` state

**PHP:**
- HTTP status codes set explicitly: `http_response_code(400/401/403/404/429/500)`
- Errors returned as JSON: `echo json_encode(["error" => "message"])`
- Try-catch for database operations: catches `PDOException` and `Throwable`
- Session check at start of protected endpoints
- Rate limiter returns 429 on excessive requests

## Logging

**Patterns:**
- User feedback: Always via `toast` notifications (`sonner` package)
- Admin actions: `logAuditAction()` writes to AuditLog table
- Server errors: `error_log()` for PHP errors
- Analytics: GA4 page views (consent-gated)

## Component Patterns

**Hooks Usage:**
- `useState` for local state
- `useEffect` for side effects with cleanup and AbortController
- `useAuth()` for auth state
- `useTranslation()` for i18n
- Custom hooks for complex logic extraction (7 hooks in `hooks/` directory)
- `useRef` for DOM references and dropdown management

**Props Pattern:**
- Destructure in function signature
- Specific props preferred over spread operator

**Component Organization:**
- Phase components in `components/collection/` (DraftPhase, SelectingPhase, etc.)
- Primitive components in `components/primitives/` (Badge, Button, Card, etc.)
- PhotoCard uses compound pattern: `<PhotoCard.Actions>`, `<PhotoCard.Action>`

**Exports:**
- Default exports preferred for React components
- Named exports for hooks and utilities
- Example: `export default SelectionBorder;` for components, `export { api }` for lib

## Styling Conventions

**CSS Framework:** Tailwind CSS v3 exclusively

**Rules:**
- NO inline `style={{}}` props except for dynamic values that cannot be expressed in Tailwind (e.g., sidebar slide animation `left` position)
- Use Tailwind utility classes for all static styling
- Use `hover:`, `focus:` pseudo-class variants instead of JS state
- Arbitrary values for custom sizes: `w-[52px]`, `text-[13px]`, `rounded-[10px]`
- Gradients: `bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]`
- Custom colors from tailwind.config.js: `bg-surface-darker`, `bg-surface-dark`
- Custom animations: `animate-fade-in`, `animate-fade-in-up`, `animate-scale-in`, `animate-shimmer`
- Responsive: `sm:`, `md:`, `lg:` breakpoints
- Dark theme across all authenticated pages (see CLAUDE.md design tokens)

**Shared Style Constants:**
- `PHOTO_GRID_CLASSES` from `constants/styles.js`: `'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'`

## Database Patterns (PHP Backend)

**Connection:**
- Always via `getDbConnection()` from `db.php`
- PDO with prepared statements for all queries
- Options: `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES=false`

**Queries:**
- Parameterized: `$stmt = $pdo->prepare(...); $stmt->execute([$param])`
- No string interpolation in SQL
- Table/column names backtick-quoted

**IDs:**
- CUID format via `generateCuid()` in `index.php`
- Format: `'cl' . substr(md5(...), 0, 22)` = 24-char identifier

**Auth Check Pattern:**
```php
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
```

**Admin Check Pattern:**
```php
require_once __DIR__ . '/auth-check.php';
// auth-check.php verifies session + role=ADMIN
```

---

*Convention analysis: 2026-02-11 | Updated: 2026-02-28 (full audit)*
