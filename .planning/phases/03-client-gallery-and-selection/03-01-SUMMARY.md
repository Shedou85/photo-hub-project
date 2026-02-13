---
phase: 03-client-gallery-and-selection
plan: 01
subsystem: backend-api
tags: [public-api, selections, status-gating, token-auth]
dependency-graph:
  requires: [02-02-status-transitions]
  provides: [public-selections-api, share-with-selections]
  affects: [frontend-share-page]
tech-stack:
  added: []
  patterns: [status-gating, idempotent-post, token-based-auth]
key-files:
  created:
    - backend/collections/share-selections.php
  modified:
    - backend/index.php
    - backend/collections/share.php
decisions:
  - "POST/DELETE selections gated by SELECTING status; GET has no gate for REVIEWING visibility"
  - "Idempotent POST: duplicate selection returns existing record via PDO duplicate key handling"
  - "shareId token is sole authorization (no session/auth) for public client access"
  - "Selections sub-route matched before base share route for correct routing precedence"
metrics:
  duration: 109
  completed: 2026-02-13T10:16:40Z
---

# Phase 3 Plan 1: Public Selections API Summary

Token-based public selections CRUD endpoint with status gating for client photo selection workflow.

## What Was Built

Created a public selections API (`/share/{shareId}/selections`) that allows clients to select photos via shareId token without authentication. The endpoint includes status gating to ensure selections can only be modified during the SELECTING status, while still allowing read access during REVIEWING for visibility.

Extended the existing share endpoint to include selections in the initial response, eliminating the need for a separate API call on page load.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create public selections endpoint and register route | bd24f22 | share-selections.php, index.php |
| 2 | Extend share.php to include selections in response | 49092ab | share.php |

## Implementation Details

### Public Selections API (share-selections.php)

Created `backend/collections/share-selections.php` as a public endpoint (no session_start, no auth check) that handles:

- **GET /share/{shareId}/selections** — Returns all selections for the collection
  - No status gate (selections visible in REVIEWING too)
  - Response: `{ "status": "OK", "selections": [...] }`

- **POST /share/{shareId}/selections** — Creates a selection
  - Status gate: returns 403 if collection status is not SELECTING
  - Validates photoId exists in collection (404 if not found)
  - Idempotent: duplicate selections return existing record via PDO duplicate key handling
  - Response: `{ "status": "OK", "selection": {...} }`

- **DELETE /share/{shareId}/selections/{photoId}** — Removes a selection
  - Status gate: returns 403 if collection status is not SELECTING
  - Returns 404 if selection not found
  - Response: `{ "status": "OK" }`

**Authorization:** shareId token in URL is the sole authorization mechanism (consistent with share.php pattern).

**Error handling:**
- 400: Missing shareId/photoId
- 403: Status gate violation (POST/DELETE when not SELECTING)
- 404: Collection/photo/selection not found
- 405: Method not allowed
- 500: Server error

### Route Registration (index.php)

Updated the `/share/` handler in `backend/index.php` to differentiate between:
1. `/share/{shareId}/selections[/{photoId}]` → share-selections.php (GET/POST/DELETE)
2. `/share/{shareId}` → share.php (GET only)

**Critical:** Selections sub-route check comes before base share route check for correct precedence (more specific match first).

### Share Endpoint Extension (share.php)

Added selections query to `backend/collections/share.php`:
- Queries Selection table by collectionId after photos query
- Attaches selections array to collection object
- No status gate — selections always included

**Response shape:**
```json
{
  "status": "OK",
  "collection": {
    "id": "...",
    "name": "...",
    "status": "...",
    "photos": [...],
    "selections": [
      { "id": "...", "photoId": "...", "createdAt": "..." }
    ]
  }
}
```

This allows the frontend to initialize selectedPhotoIds on mount without a separate API call.

## Deviations from Plan

None — plan executed exactly as written.

## Key Decisions

1. **Status Gate Asymmetry:** GET has no status gate (selections visible in REVIEWING), but POST/DELETE require SELECTING. This allows clients to see their selections after the photographer transitions to REVIEWING, without allowing modifications.

2. **Idempotent POST:** Used PDO duplicate key exception handling (error code 23000) instead of INSERT IGNORE. When a duplicate selection is attempted, the endpoint fetches and returns the existing selection record, making the operation idempotent.

3. **Route Precedence:** Selections sub-route regex must be checked before the base share route to prevent incorrect routing. Used `preg_match('#^/share/[^/]+/selections#', $requestUri)` to match both `/share/{id}/selections` and `/share/{id}/selections/{photoId}`.

4. **Token-Based Authorization:** Consistent with existing share.php pattern, shareId token in URL is the sole authorization. No session cookies, no auth headers — simplest path for client-facing public API.

## Testing Notes

**Manual verification needed:**
1. GET /share/{validShareId}/selections returns empty array for new collection
2. POST /share/{validShareId}/selections with valid photoId creates selection
3. POST again with same photoId returns existing selection (idempotent)
4. DELETE /share/{validShareId}/selections/{photoId} removes selection
5. POST/DELETE return 403 when collection status is not SELECTING
6. GET /share/{validShareId} includes selections array in response

**Edge cases handled:**
- Missing shareId/photoId → 400
- Invalid shareId → 404
- photoId not in collection → 404
- Duplicate selection → 200 with existing record (idempotent)
- Status gate violation → 403

## Files Modified

**Created:**
- `backend/collections/share-selections.php` (164 lines) — Public selections CRUD endpoint

**Modified:**
- `backend/index.php` (+17 lines) — Route registration with precedence handling
- `backend/collections/share.php` (+13 lines) — Selections query and attachment

## Dependencies

**Requires:**
- `backend/db.php` — getDbConnection()
- `backend/utils.php` — parseRouteParts()
- `backend/index.php` — generateCuid() (defined globally)
- Database: Selection table with UNIQUE photoId constraint

**Provides:**
- Public selections API for client-facing photo selection
- Share endpoint extended with selections data

**Affects:**
- Frontend SharePage will consume this API in next plan (03-02)

## Verification

All verification steps passed:

1. ✓ Route registered in index.php (line 183)
2. ✓ share-selections.php uses parseRouteParts() and getDbConnection()
3. ✓ No session_start() in share-selections.php (public endpoint)
4. ✓ Status gate returns 403 for POST/DELETE when status is not SELECTING
5. ✓ GET returns selections without status gate
6. ✓ share.php response includes selections array

## Self-Check: PASSED

**Created files exist:**
```
FOUND: backend/collections/share-selections.php
```

**Commits exist:**
```
FOUND: bd24f22 (Task 1: public selections endpoint)
FOUND: 49092ab (Task 2: selections in share endpoint)
```

**Modified files verified:**
```
FOUND: backend/index.php (route registration)
FOUND: backend/collections/share.php (selections query)
```

All artifacts created, all commits recorded, all verification checks passed.

## Next Steps

Phase 3, Plan 2 (03-02): Build the frontend SharePage client selection UI that consumes this API.
