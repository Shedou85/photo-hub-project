# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Distributed SPA with decoupled frontend and backend

**Key Characteristics:**
- Monolith frontend (React SPA) + thin PHP backend (stateless routing)
- Session-based authentication with cross-domain cookies
- Component-driven UI with context-based state
- Single routing layer in backend (switch-based dispatcher)
- RESTful API endpoints mapped to handler files

## Layers

**Frontend Presentation (Browser):**
- Purpose: Render UI, handle user interactions, manage client state
- Location: `frontend/src/`
- Contains: React components, pages, layouts, context providers
- Depends on: React Router DOM, React i18next, Tailwind CSS, Sonner (toast)
- Used by: Users via browser

**Frontend Routing Layer:**
- Purpose: URL-based navigation and protected route enforcement
- Location: `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx`
- Contains: Route definitions with React Router v7, auth checks
- Depends on: AuthContext for `isAuthenticated` state
- Used by: Main app initialization, protected page redirects

**Frontend State Management:**
- Purpose: Synchronize auth state across components
- Location: `frontend/src/contexts/AuthContext.jsx`
- Contains: User object, login/logout functions, isAuthenticated boolean
- Depends on: localStorage for persistence
- Used by: All authenticated pages, ProtectedRoute, MainLayout

**Frontend I18n (Internationalization):**
- Purpose: Support Lithuanian, English, Russian UI translations
- Location: `frontend/src/i18n.js`, `frontend/src/locales/*.json`
- Contains: i18next config, locale files for 3 languages
- Depends on: react-i18next, i18next-browser-languagedetector
- Used by: All pages and components via `useTranslation()` hook

**Frontend Layout:**
- Purpose: Persistent app shell for authenticated pages
- Location: `frontend/src/layouts/MainLayout.jsx`
- Contains: Sidebar navigation, top bar, language switcher, logout button
- Depends on: AuthContext, useTranslation, Router state
- Used by: Authenticated pages wrapped in ProtectedRoute

**Backend API Router:**
- Purpose: Dispatch HTTP requests to appropriate handlers
- Location: `backend/index.php` (lines 45-210)
- Contains: Switch statement mapping routes to handler files
- Depends on: CORS headers, session management, PDO connection
- Used by: Apache (via .htaccess rewrite to index.php)

**Backend Authentication:**
- Purpose: Validate credentials and manage sessions
- Location: `backend/auth/login.php`, `backend/auth/logout.php`, `backend/auth/me.php`
- Contains: Password verification, session creation, session cleanup
- Depends on: MySQL User table, PHP sessions
- Used by: Login endpoint, protected routes

**Backend Database Layer:**
- Purpose: PDO connection factory with error handling
- Location: `backend/db.php`
- Contains: `getDbConnection()` function
- Depends on: `config.php` (DB credentials)
- Used by: All handler files for query execution

**Backend Collection Handlers:**
- Purpose: CRUD operations on collections and photos
- Location: `backend/collections/index.php`, `backend/collections/id.php`, `backend/collections/photos.php`, etc.
- Contains: GET/POST/PATCH handlers for collections, photos, selections
- Depends on: DB layer, session auth
- Used by: Collection management endpoints

**Backend Profile Handlers:**
- Purpose: User profile update and retrieval
- Location: `backend/profile/me.php`
- Contains: PATCH handler for name/bio updates
- Depends on: Session auth, DB layer
- Used by: Profile endpoint

**Database (MySQL):**
- Purpose: Persistent data store
- Location: MySQL server, schema in `database_schema.sql`
- Contains: User, Collection, Photo, EditedPhoto, Selection, PromotionalPhoto tables
- Depends on: PDO connection
- Used by: All backend handlers

## Data Flow

**Authentication Flow:**

1. User submits email/password on LoginPage
2. Frontend sends POST to `/login` with credentials
3. Backend (login.php) verifies password, creates session, returns user object
4. Frontend stores user in localStorage via AuthContext.login()
5. React Router redirects to /collections
6. Subsequent API calls include session cookie automatically (`credentials: "include"`)
7. Backend checks `$_SESSION['user_id']` on protected endpoints

**Collection Listing Flow:**

1. User navigates to /collections
2. CollectionsListPage mounts and calls `fetch(/collections)`
3. Backend (collections/index.php) checks session, queries User's collections
4. Returns JSON array with collection metadata
5. Frontend renders collection cards (Polaroid style)
6. Each card shows name, status, cover photo, and action buttons

**Collection Details Flow:**

1. User clicks collection card, navigates to `/collection/:id`
2. CollectionDetailsPage fetches `/collections/:id`
3. Backend (collections/id.php) verifies ownership, returns collection data
4. Page renders collection details with sub-resources
5. Child routes (`/collections/:id/photos`, `/collections/:id/selections`) fetch additional data

**State Management:**

- **Auth state:** Lives in AuthContext, initialized from localStorage on app mount
- **Page state:** Lives in component useState (collections array, loading flag, etc.)
- **Transient state:** Toast notifications via Sonner (no persistence)
- **Form state:** Local component state (email, password, name fields)

## Key Abstractions

**ProtectedRoute Component:**
- Purpose: Enforce authentication before rendering child components
- Examples: `frontend/src/components/ProtectedRoute.jsx`
- Pattern: Higher-order component that wraps authenticated pages; checks `isAuthenticated` and redirects to `/login` if false

**AuthContext (State Container):**
- Purpose: Centralize auth state and provide actions across the app
- Examples: `frontend/src/contexts/AuthContext.jsx`
- Pattern: React Context with custom hook (`useAuth()`) for consuming state; localStorage syncs auth across tabs/refreshes

**MainLayout (App Shell):**
- Purpose: Provide consistent navigation and layout for authenticated pages
- Examples: `frontend/src/layouts/MainLayout.jsx`
- Pattern: Wrapper component using React Router Outlet; renders sidebar, top bar, language switcher

**Accordion Component:**
- Purpose: Reusable collapsible section for grouping content
- Examples: `frontend/src/components/Accordion.jsx`
- Pattern: Controlled component accepting title, content, open state

**Handler Files (Backend):**
- Purpose: Isolate route-specific logic into separate files
- Examples: `backend/auth/login.php`, `backend/collections/index.php`
- Pattern: Each file is a self-contained HTTP handler; included by index.php router

**Locale Files (i18n):**
- Purpose: Centralize translatable strings by namespace
- Examples: `frontend/src/locales/en.json`, `frontend/src/locales/lt.json`, `frontend/src/locales/ru.json`
- Pattern: Flat JSON with nested objects for namespaces (nav, collections, home, etc.); all 3 locales kept in sync

## Entry Points

**Frontend Entry Point:**
- Location: `frontend/src/main.jsx`
- Triggers: Browser loads index.html (Vite-served)
- Responsibilities: Mount React app to DOM; initialize BrowserRouter, AuthProvider, and i18n

**Frontend App Router:**
- Location: `frontend/src/App.jsx`
- Triggers: Mounted via main.jsx
- Responsibilities: Define all route paths; conditional auth checks; initialize Sonner toast container

**Frontend Layout Entry:**
- Location: `frontend/src/layouts/MainLayout.jsx`
- Triggers: Matched when user accesses /profile, /collections, /collection/:id, /payments
- Responsibilities: Render sidebar, top bar, language switcher; manage responsive sidebar on mobile

**Backend API Entry Point:**
- Location: `backend/index.php`
- Triggers: Apache rewrite from any /backend/* request
- Responsibilities: Parse request URI; dispatch to appropriate handler file; set CORS headers and session config

**Backend Auth Entry:**
- Location: `backend/auth/login.php`
- Triggers: POST /login
- Responsibilities: Validate email/password; create PHP session; return user object

**Backend Collection Entry:**
- Location: `backend/collections/index.php`
- Triggers: GET/POST /collections
- Responsibilities: List user's collections (GET); create new collection (POST)

## Error Handling

**Strategy:** Defensive HTTP status codes + JSON error responses

**Patterns:**

- **400 Bad Request:** Missing or invalid input (e.g., empty collection name, invalid email)
  - Example: `backend/index.php` line 91 (register validation)
  - Example: `backend/collections/id.php` line 26 (missing collection ID)

- **401 Unauthorized:** Not authenticated or session expired
  - Example: `backend/auth/me.php` line 6 (no user_id in session)
  - Example: All protected endpoints check `isset($_SESSION['user_id'])`

- **403 Forbidden:** Authenticated but not authorized (e.g., account suspended)
  - Example: `backend/auth/login.php` line 44 (account not active)

- **404 Not Found:** Resource doesn't exist or user doesn't own it
  - Example: `backend/collections/id.php` line 48 (collection not found or not owned by user)

- **405 Method Not Allowed:** Wrong HTTP method for endpoint
  - Example: `backend/index.php` line 56 (GET to /test when only GET allowed)

- **409 Conflict:** Resource already exists
  - Example: `backend/index.php` line 107 (user email already registered)

- **500 Internal Server Error:** Unexpected server error
  - Example: `backend/auth/login.php` line 73 (PDOException during query)

**Frontend Error Handling:**

- Network errors: Caught in try-catch; display toast or error state
- Auth errors: 401 response triggers logout and redirect to /login
- Data fetch errors: Set error state; display in UI or toast

## Cross-Cutting Concerns

**Logging:**
- Frontend: console.log for debugging (visible in browser DevTools)
- Backend: Comments only; no persistent logging implemented (see CONCERNS.md)

**Validation:**
- Frontend: Form field checks before submission (e.g., email format, required fields)
- Backend: Input validation on every handler; prepared statements for SQL injection prevention

**Authentication:**
- Frontend: localStorage-backed context; boolean `isAuthenticated` flag
- Backend: PHP sessions with secure cookies scoped to `.pixelforge.pro` domain; SameSite=None for cross-domain

**Authorization:**
- Backend: Session check on protected routes; ownership verification (userId match) on collection operations
- Frontend: ProtectedRoute component gates authenticated pages

**CORS:**
- Backend: `backend/cors.php` whitelists origins and sets headers before routing
- Allowed: `https://pixelforge.pro`, `http://localhost:5173`, `http://localhost:4173`
- Credentials: `include` on all frontend fetch calls to send session cookies

**I18n:**
- Language detection: localStorage first, then browser language
- Language switching: MainLayout language dropdown calls `i18n.changeLanguage(code)`
- All user-visible strings via `t('namespace.key')` helper

---

*Architecture analysis: 2026-02-11*
