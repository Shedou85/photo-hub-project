# Coding Conventions

**Analysis Date:** 2026-02-11

## Naming Patterns

**Files:**
- React components: PascalCase + `.jsx` (e.g., `LoginPage.jsx`, `Accordion.jsx`)
- Non-component JS files: camelCase + `.js` (e.g., `i18n.js`)
- PHP handlers: lowercase + `.php`, grouped by feature in subdirectories (e.g., `auth/login.php`, `collections/index.php`)
- Configuration files: lowercase + `.config.js` or `.js` (e.g., `tailwind.config.js`, `vite.config.js`)

**Functions:**
- React component functions: PascalCase (e.g., `function LoginPage()`, `function Accordion()`)
- Helper functions: camelCase (e.g., `getInitials()`, `photoUrl()`, `handleSubmit()`)
- Event handlers: `handle` prefix + action (e.g., `handleSubmit()`, `handleCreateCollection()`, `handleDeleteCollection()`)
- State setters: `set` prefix + state name (e.g., `setEmail()`, `setCollections()`)
- PHP functions: camelCase (e.g., `getDbConnection()`, `generateCuid()`, `isValidId()`)

**Variables:**
- State variables: camelCase (e.g., `email`, `collections`, `loading`, `error`)
- Constants: UPPERCASE_SNAKE_CASE (e.g., `LANGUAGES`, `SIDEBAR_WIDTH`, `BREAKPOINT`, `NAV_ITEMS`)
- Destructured values: camelCase (e.g., `const { isAuthenticated, user } = useAuth()`)
- Configuration/constant arrays: PascalCase or UPPERCASE (e.g., `LANGUAGES`, `NAV_ITEMS`)

**Types/Classes:**
- React Context: PascalCase + `Context` suffix (e.g., `AuthContext`)
- Enums/Status values: UPPER_CASE (e.g., `DRAFT`, `SELECTING`, `REVIEWING`, `DELIVERED`, `ARCHIVED`)
- Database table names: PascalCase backtick-quoted (e.g., `` `User` ``, `` `Collection` ``, `` `Photo` ``)

**i18n Keys:**
- Namespace.key pattern: `namespace.key` (e.g., `login.title`, `collections.createSuccess`)
- Namespaces: `nav`, `home`, `login`, `profile`, `collections`, `collection`, `payments`, `common`
- Nested keys use dot notation (e.g., `home.hero.headline1`, `profile.planLabel.STANDARD`)

## Code Style

**Formatting:**
- No explicit formatter configured (ESLint covers linting, Tailwind for CSS)
- Line ending: LF
- Indentation: 2 spaces (standard for JavaScript/JSX)
- Semicolons: Required (ESLint enforces)

**Linting:**
- Tool: ESLint v8.57.0
- Config: Flat config (no `.eslintrc` file found; default rules applied)
- Plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Rule: **Zero warnings enforced** via `--max-warnings 0` in lint script
- Run: `npm run lint` from `frontend/` directory

**Code Quality:**
- Trailing commas in multiline objects/arrays: Used
- Prefer `const` over `let` over `var`
- Arrow functions preferred for callbacks and inline functions

## Import Organization

**Order:**
1. React and React DOM (e.g., `import React, { useState } from 'react'`)
2. External libraries (e.g., `react-router-dom`, `react-i18next`, `sonner`)
3. Internal contexts/components (e.g., `import { useAuth } from '../contexts/AuthContext'`)
4. Internal utilities/helpers (e.g., `import Accordion from '../components/Accordion'`)
5. Styles (e.g., `import './index.css'`)
6. Configuration files (e.g., `import './i18n.js'`)

**Path Aliases:**
- No aliases configured (relative imports used throughout)
- Example: `import Accordion from '../components/Accordion'`

**PHP Imports:**
- `require_once` for dependencies at file start (e.g., `require_once __DIR__ . '/db.php'`)
- Session start: `session_start()` called explicitly in each handler file
- Order: required files first, then business logic

## Error Handling

**JavaScript/React:**
- Try-catch blocks for async operations (e.g., `fetch` calls)
- Error state captured in useState: `const [error, setError] = useState(null)`
- User-facing errors displayed via toast notifications: `toast.error(message)`
- Network errors caught and logged: `catch (err) => { setError(err.message); }`
- Async operations wrapped in try-catch with finally for cleanup
- Promise-based toasts: `toast.promise(promise, { loading: '...', success: '...', error: (err) => err.message })`

**Example from `CollectionsListPage.jsx`:**
```javascript
try {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch collections");
  }
  const data = await response.json();
  if (data.status === "OK") {
    setCollections(data.collections);
  } else {
    setError(data.error || "An unknown error occurred.");
  }
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

**PHP:**
- HTTP status codes set explicitly: `http_response_code(400)`, `http_response_code(401)`
- Errors returned as JSON: `echo json_encode(["error" => "message"])`
- Try-catch for database operations: catches `PDOException` and `Throwable`
- Validation before database operations (e.g., empty email check, email format validation)
- Session check at start of protected endpoints: `if (!isset($_SESSION['user_id'])) { http_response_code(401); ... }`

**Example from `auth/login.php`:**
```php
try {
  // ... database query ...
  if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
    exit;
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "error" => "Server error",
    "details" => $e->getMessage()
  ]);
}
```

## Logging

**Framework:** Console and Sonner toast notifications (no structured logging)

**Patterns:**
- User feedback: Always via `toast` notifications (`sonner` package)
- Success: `toast.success(t('namespace.key'))`
- Error: `toast.error(t('namespace.key'))`
- Generic: `toast(message, { ... })`
- Confirm dialogs: `toast(confirmMessage, { action: { label, onClick }, cancel: { label, onClick } })`
- No console.log for production — only error states logged to user
- Server-side: PHP errors logged to error response JSON in development (commented note: "prod – išimti" = remove in prod)

**Example from `CollectionsListPage.jsx`:**
```javascript
const handleDeleteCollection = (id) => {
  toast(t('collections.confirmDeleteCollection'), {
    position: 'bottom-center',
    action: {
      label: t('collections.deleteCollection'),
      onClick: () => doDeleteCollection(id),
    },
    cancel: {
      label: t('common.cancel'),
      onClick: () => {},
    },
    duration: 8000,
  });
};
```

## Comments

**When to Comment:**
- Complex logic or non-obvious algorithm steps
- Temporary workarounds or known issues (prefix with `TODO`, `FIXME`, `HACK`)
- JSDoc for utility functions and reusable helpers
- Inline comments for conditionals that aren't self-documenting

**JSDoc/TSDoc:**
- Minimal JSDoc usage observed in codebase
- Example from `utils.php`:
```php
/**
 * Parse the request URI and extract path parts after the /backend base path.
 *
 * @return array The URI segments
 */
function parseRouteParts() { ... }
```

## Function Design

**Size:**
- Keep functions small and focused (most React components under 200 lines)
- Extract sub-components for reusable UI patterns (e.g., `InfoRow`, `Badge` in `ProfilePage.jsx`)
- Helper functions grouped at top of file (e.g., `getInitials()` in `ProfilePage.jsx`)

**Parameters:**
- Destructure props in component definitions: `function Accordion({ title, children }) { ... }`
- Avoid excessive parameters; use objects for optional configs
- Single responsibility: each function does one thing

**Return Values:**
- React components return JSX
- Event handlers return void (side-effect based)
- Utility functions return single typed value or object
- PHP handlers echo JSON response (no explicit return)

## Module Design

**Exports:**
- Named exports rarely used; default exports preferred
- Example: `export default App;` instead of `export const App = () => ...`
- React components always use `export default ComponentName;`

**Barrel Files:**
- Not extensively used; direct imports from files preferred
- Example: import directly from `../components/Accordion.jsx` rather than an `index.js`

## Component Patterns

**Hooks Usage:**
- `useState` for local state: `const [value, setValue] = useState(initialState)`
- `useEffect` for side effects with cleanup: `useEffect(() => { ... return () => { cleanup }; }, [deps])`
- `useContext` for auth/i18n: `const { isAuthenticated } = useAuth()`
- Custom hooks: `useAuth()`, `useTranslation()` from `react-i18next`
- `useRef` for DOM references and dropdown management

**Props Pattern:**
- Destructure in function signature
- Spread operator used rarely; specific props preferred for clarity

## Styling Conventions

**CSS Framework:** Tailwind CSS v3 exclusively

**Rules:**
- NO inline `style={{}}` props except for dynamic values that cannot be expressed in Tailwind
- Example exception in `MainLayout.jsx`:
```javascript
style={{
  width: SIDEBAR_WIDTH,
  left: isMobile ? (sidebarOpen ? 0 : -SIDEBAR_WIDTH) : 0,
  transition: 'left 0.25s ease'
}}
```
- Use Tailwind utility classes for all static styling
- Use hover/focus pseudo-class variants: `hover:bg-blue-100`, `focus:border-blue-500`
- Arbitrary values for custom sizes: `w-[52px]`, `text-[13px]`, `rounded-[10px]`
- Gradients via arbitrary value: `bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)]`
- No CSS modules, no component-scoped CSS, no inline styles for theme/colors
- Responsive utilities: `sm:`, `lg:` breakpoints used (Tailwind default)

## API Client Pattern

**Pattern:** Fetch API with `credentials: "include"`

**Example:**
```javascript
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/collections`,
  {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }
);
```

**Environment:**
- `VITE_API_BASE_URL` environment variable used for all API calls
- CORS: Credentials included for cookie-based sessions across `.pixelforge.pro` domain

## Database Patterns (PHP Backend)

**Connection:**
- Always via `getDbConnection()` from `db.php`
- PDO with prepared statements for all queries
- Options: `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, `EMULATE_PREPARES=false`

**Queries:**
- Parameterized queries: `$stmt = $pdo->prepare(...); $stmt->execute([$param])`
- No string interpolation in SQL
- Table/column names backtick-quoted: `` SELECT * FROM `User` WHERE email = ? ``

**IDs:**
- CUID format generated via `generateCuid()` in `index.php`
- Format: `'cl' . substr(md5(...), 0, 22)` = 24-char identifier
- Used for: User IDs, Collection IDs, Photo IDs

---

*Convention analysis: 2026-02-11*
