# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
photo-hub/
├── frontend/                    # React SPA application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React context providers (auth state)
│   │   ├── layouts/            # App shell layout
│   │   ├── locales/            # i18n translation files (LT/EN/RU)
│   │   ├── pages/              # Page components (routed views)
│   │   ├── assets/             # Static assets (images, icons)
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # Entry point
│   │   ├── i18n.js             # i18n configuration
│   │   └── index.css           # Global styles (Tailwind imports)
│   ├── public/                 # Static files served as-is
│   ├── dist/                   # Build output (Vite production build)
│   ├── package.json            # Dependencies and scripts
│   └── vite.config.js          # Vite bundler configuration
├── backend/                     # PHP API backend
│   ├── auth/                   # Authentication handlers
│   ├── collections/            # Collection CRUD handlers
│   ├── profile/                # User profile handlers
│   ├── uploads/                # User-uploaded files directory
│   ├── index.php               # Main router (request dispatcher)
│   ├── db.php                  # PDO connection factory
│   ├── cors.php                # CORS header middleware
│   ├── config.php              # Database configuration
│   ├── utils.php               # Utility functions
│   └── .htaccess               # Apache URL rewrite rules
├── database_schema.sql          # MySQL table definitions
├── CLAUDE.md                    # Project instructions for Claude
└── .gitignore                  # Git ignore rules

```

## Directory Purposes

**frontend/src/components:**
- Purpose: Reusable UI component library
- Contains: ProtectedRoute (auth wrapper), Accordion (collapsible sections)
- Key files: `ProtectedRoute.jsx`, `Accordion.jsx`

**frontend/src/contexts:**
- Purpose: Global state providers
- Contains: Authentication state and actions (login, logout, isAuthenticated)
- Key files: `AuthContext.jsx`

**frontend/src/layouts:**
- Purpose: App-level layout templates
- Contains: MainLayout (sidebar, top bar, navigation for authenticated pages)
- Key files: `MainLayout.jsx`

**frontend/src/locales:**
- Purpose: Internationalization translation files
- Contains: JSON locale files for Lithuanian, English, Russian
- Key files: `en.json`, `lt.json`, `ru.json`
- Pattern: Flat structure with namespace organization (nav, collections, home, etc.)

**frontend/src/pages:**
- Purpose: Route-level page components
- Contains: Full-page components rendered by React Router
- Key files:
  - `HomePage.jsx` - Public landing page
  - `LoginPage.jsx` - Auth form
  - `CollectionsListPage.jsx` - Dashboard with collection grid
  - `CollectionDetailsPage.jsx` - Single collection view
  - `ProfilePage.jsx` - User profile editor
  - `PaymentsPage.jsx` - Subscription management

**frontend/src/assets:**
- Purpose: Static assets bundled with app
- Contains: Images, logos, icons used in components

**frontend/dist:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**backend/auth:**
- Purpose: Authentication endpoint handlers
- Key files:
  - `login.php` - POST /login; validates credentials, creates session
  - `logout.php` - POST /logout; destroys session
  - `me.php` - GET /auth/me; returns current user from session

**backend/collections:**
- Purpose: Collection and photo management handlers
- Key files:
  - `index.php` - GET /collections (list), POST /collections (create)
  - `id.php` - GET /collections/:id (fetch), PATCH /collections/:id (update), DELETE (delete)
  - `photos.php` - GET/POST /collections/:id/photos
  - `selections.php` - GET/POST /collections/:id/selections
  - `edited.php` - GET/POST /collections/:id/edited
  - `cover.php` - GET/POST /collections/:id/cover

**backend/profile:**
- Purpose: User profile handlers
- Key files:
  - `me.php` - PATCH /profile/me; updates name, bio

**backend/uploads:**
- Purpose: File storage directory
- Contains: User-uploaded photos
- Generated: Yes (by upload handlers)
- Committed: No

## Key File Locations

**Entry Points:**

- `frontend/src/main.jsx`: React app mount point; initializes BrowserRouter, AuthProvider, i18n
- `frontend/src/App.jsx`: Route definitions; conditional redirects based on auth state
- `backend/index.php`: HTTP request router; dispatcher to handler files

**Configuration:**

- `frontend/vite.config.js`: Vite bundler config (React plugin, build output)
- `backend/config.php`: Database credentials (host, port, name, charset)
- `backend/.htaccess`: Apache rewrite rules (redirect all requests to index.php)

**Core Logic:**

- `frontend/src/contexts/AuthContext.jsx`: Auth state management (login, logout, isAuthenticated)
- `frontend/src/layouts/MainLayout.jsx`: App shell with sidebar, navigation, language switcher
- `backend/db.php`: PDO connection factory with error handling
- `backend/cors.php`: Cross-origin request header setup

**Testing:**

- Not applicable - no test files present (see CONCERNS.md)

## Naming Conventions

**Files:**

- Components: PascalCase + `.jsx` (e.g., `LoginPage.jsx`, `ProtectedRoute.jsx`)
- Utilities: camelCase + `.js` (e.g., `i18n.js`, `utils.php`)
- Config: camelCase + `.php` (e.g., `config.php`, `db.php`)
- Directories: kebab-case or camelCase + plural (e.g., `components/`, `locales/`, `auth/`)

**Backend Routes (from index.php switch statement):**

- Single resource: `/route` (e.g., `/login`, `/logout`, `/test`)
- List/create: `/route` with GET/POST (e.g., `/collections`)
- Fetch/update: `/route/:id` (e.g., `/collections/{id}`)
- Sub-routes: `/route/:id/subRoute` (e.g., `/collections/{id}/photos`)

**Frontend Routes:**

- Public: `/`, `/login`, `/` (redirects authenticated users)
- Authenticated: `/profile`, `/collections`, `/collection/:id`, `/payments`
- Nested: Uses React Router outlet pattern; MainLayout wraps all authenticated routes

**Variables (JavaScript):**

- boolean: prefixed with `is`, `has`, `can` (e.g., `isAuthenticated`, `isMobile`)
- arrays: plural (e.g., `collections`, `photos`)
- callbacks: prefixed with `on` or `handle` (e.g., `onClick`, `handleSubmit`)

**Variables (PHP):**

- database objects: `$stmt` (statement), `$pdo` (connection)
- data: `$data`, `$user`, `$collection` (from JSON decode/query)
- IDs: `$userId`, `$collectionId` (explicit naming)

## Where to Add New Code

**New Feature (end-to-end):**

1. **Backend endpoint:**
   - Create handler file: `backend/[feature]/[action].php`
   - Add case to switch in `backend/index.php`
   - Check session, validate input, query database, return JSON

2. **Frontend page/component:**
   - Create component: `frontend/src/pages/[Feature]Page.jsx` (if page-level) or `frontend/src/components/[Feature].jsx` (if reusable)
   - Import and add route in `frontend/src/App.jsx`
   - Wrap with `<ProtectedRoute>` if auth-required
   - Use `useAuth()` for auth checks
   - Use `useTranslation()` for all user-visible strings

3. **i18n strings:**
   - Add keys to all 3 locale files: `frontend/src/locales/en.json`, `lt.json`, `ru.json`
   - Group under namespace (e.g., `"featureName": { "key": "value" }`)
   - Reference in component: `t('featureName.key')`

4. **Database updates:**
   - Update `database_schema.sql` with new tables/columns
   - Create migration script (manual SQL or use schema file)
   - Update handlers to query new tables

**New Component/Module:**

- **Reusable component:** `frontend/src/components/[ComponentName].jsx`
  - Export as default
  - Accept props for state and callbacks
  - Use Tailwind classes exclusively (no inline styles)
  - Add JSDoc comments for props

- **Context provider:** `frontend/src/contexts/[Feature]Context.jsx`
  - Create context with `createContext()`
  - Export provider component and custom hook
  - Initialize state in provider
  - Example: `frontend/src/contexts/AuthContext.jsx`

- **Backend handler:** `backend/[feature]/[action].php`
  - Start with session check if protected: `session_start(); if (!isset($_SESSION['user_id'])) { ... }`
  - Check HTTP method: `if ($_SERVER['REQUEST_METHOD'] !== 'GET') { ... }`
  - Get database connection: `$pdo = getDbConnection()`
  - Return JSON: `json_encode(['status' => 'OK', 'data' => $result])`

**Utilities:**

- **Frontend helpers:** `frontend/src/utils/` (create as needed, export functions)
  - Use camelCase file names
  - Import where needed
  - Example: `formatDate(timestamp)`, `apiUrl(endpoint)`

- **Backend helpers:** `backend/utils.php`
  - Add functions to this file
  - Include via `require_once __DIR__ . '/utils.php'`
  - Example: `generateCuid()`, `formatDateTime()`

## Special Directories

**frontend/dist:**
- Purpose: Production build output
- Generated: Yes (by Vite on `npm run build`)
- Committed: No (in .gitignore)

**frontend/node_modules:**
- Purpose: NPM dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**backend/uploads:**
- Purpose: User-uploaded photo storage
- Generated: Yes (by upload endpoints)
- Committed: No

**.claude:**
- Purpose: Agent memory and internal state
- Generated: Yes (by Claude Code)
- Committed: No (in .gitignore)

**.planning/codebase:**
- Purpose: Codebase analysis documents (this file, ARCHITECTURE.md, etc.)
- Generated: Yes (by gsd:map-codebase)
- Committed: Yes

---

*Structure analysis: 2026-02-11*
