---
phase: 07-individual-photo-downloads
plan: 01
subsystem: delivery-infrastructure
tags: [downloads, individual-photos, status-lifecycle, frontend-utilities]
dependency_graph:
  requires:
    - "06-01 (ZIP download infrastructure and Download table schema)"
    - "05-01 (deliveryToken generation and download tracking helper)"
  provides:
    - "Individual photo download endpoint with delivery token auth"
    - "DOWNLOADED status lifecycle for collections"
    - "Frontend download utility with anchor-click pattern"
  affects:
    - "Phase 08 (delivery page will consume downloadPhoto() utility)"
    - "Collection status transitions (DELIVERED -> DOWNLOADED on first download)"
tech_stack:
  added:
    - "DOWNLOADED status in Collection ENUM"
    - "Individual photo download tracking (downloadType=INDIVIDUAL, photoId populated)"
  patterns:
    - "Track-then-stream download pattern (consistent with ZIP downloads)"
    - "Anchor-click download pattern (no fetch/blob, server Content-Disposition headers)"
    - "Conditional UPDATE WHERE status='DELIVERED' for race-safe transitions"
key_files:
  created:
    - "backend/collections/photo-download.php (131 lines)"
    - "frontend/src/utils/download.js (54 lines)"
  modified:
    - "database_schema.sql (added DOWNLOADED to Collection status ENUM)"
    - "backend/collections/zip-download.php (status gate + transition logic)"
    - "backend/index.php (wired /deliver/{token}/photo/{photoId} route)"
decisions:
  - summary: "Allow downloads from both DELIVERED and DOWNLOADED statuses"
    rationale: "After first download, collection transitions to DOWNLOADED but re-downloads must still work. Both ZIP and individual downloads check both statuses."
    impact: "Consistent behavior across download types, supports repeated downloads"
  - summary: "Transition DELIVERED to DOWNLOADED on first download (ZIP or individual)"
    rationale: "Track when collection enters 'downloaded' lifecycle stage, regardless of download type"
    impact: "Collection status reflects download activity. Idempotent with conditional UPDATE WHERE status='DELIVERED'."
  - summary: "Use anchor-click pattern for frontend downloads (not fetch/blob)"
    rationale: "Server sends Content-Disposition: attachment headers, triggering browser download. No client-side blob handling needed. Works cross-browser (Chrome 65+, Firefox 20+, Safari 10.1+)."
    impact: "Zero external dependencies, simpler code, server controls download behavior"
metrics:
  duration: "2.6 min"
  tasks_completed: 3
  files_created: 2
  files_modified: 3
  commits: 3
  completed_at: "2026-02-14T07:12:48Z"
---

# Phase 07 Plan 01: Individual Photo Downloads Summary

**One-liner:** Individual photo download endpoint with delivery token auth, DOWNLOADED status transitions, and anchor-click frontend utility

## What Was Built

Implemented complete individual photo download capability for delivery tokens:

1. **DOWNLOADED status lifecycle:**
   - Added DOWNLOADED to Collection status ENUM (between DELIVERED and ARCHIVED)
   - Updated ZIP download endpoint to allow both DELIVERED and DOWNLOADED statuses
   - Added status transition from DELIVERED to DOWNLOADED on first download (ZIP or individual)
   - Used conditional UPDATE WHERE status='DELIVERED' for race-safe transitions

2. **Individual photo download endpoint:**
   - Created `backend/collections/photo-download.php` serving GET /deliver/{token}/photo/{photoId}
   - Follows track-then-stream pattern (consistent with ZIP downloads)
   - Delivery token authentication (no user session required)
   - Validates collection status (DELIVERED or DOWNLOADED)
   - Fetches specific EditedPhoto by ID and collectionId
   - Tracks download with trackDownload($pdo, $collectionId, 'INDIVIDUAL', $photoId)
   - Transitions DELIVERED to DOWNLOADED on first download (idempotent)
   - Clears output buffering before streaming
   - Uses finfo_file() for MIME type detection (not extension-based)
   - Sends Content-Disposition: attachment header to trigger browser download
   - Streams file with readfile() (memory-efficient, 8KB chunks)

3. **Frontend download utility:**
   - Created `frontend/src/utils/download.js` with two exports:
     - `downloadPhoto(deliveryToken, photoId, filename)` — individual photo download
     - `downloadAllAsZip(deliveryToken)` — ZIP download wrapper
   - Uses anchor-click pattern (createElement('a'), appendChild, click(), removeChild)
   - No fetch/blob workaround needed (server Content-Disposition headers trigger download)
   - Uses VITE_API_BASE_URL environment variable
   - Zero external dependencies
   - ESLint passes with no errors

4. **Router integration:**
   - Wired case 'photo' in backend/index.php /deliver/ route handler
   - Dispatches GET requests to collections/photo-download.php
   - Follows same pattern as existing 'zip' case

## Deviations from Plan

None — plan executed exactly as written.

## Key Files

**Created:**
- `backend/collections/photo-download.php` (131 lines) — Individual photo download endpoint
- `frontend/src/utils/download.js` (54 lines) — Download utilities for delivery page

**Modified:**
- `database_schema.sql` — Added DOWNLOADED to Collection status ENUM, migration comment
- `backend/collections/zip-download.php` — Updated status gate and added transition logic
- `backend/index.php` — Added photo case to /deliver/ route handler

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| e40cb3e | feat | Add DOWNLOADED status and enable collection status transitions |
| eab68c0 | feat | Create individual photo download endpoint |
| 3d48f41 | feat | Create frontend download utility |

## Integration Points

**Dependencies:**
- Requires Download table and trackDownload() helper from Phase 05-01
- Requires deliveryToken generation and ZIP download infrastructure from Phase 06-01

**Provides:**
- Individual photo download endpoint for Phase 08 delivery page
- Frontend download utility (downloadPhoto, downloadAllAsZip) for Phase 08
- DOWNLOADED status lifecycle for collection management

**Affects:**
- Phase 08 will import and call downloadPhoto() from utils/download.js
- Collection status transitions now include DELIVERED -> DOWNLOADED on first download

## Testing Notes

**Verification performed:**
- [x] database_schema.sql Collection ENUM includes DOWNLOADED
- [x] backend/collections/photo-download.php exists (131 lines, min 60 required)
- [x] frontend/src/utils/download.js exists with downloadPhoto and downloadAllAsZip exports
- [x] backend/index.php routes /deliver/{token}/photo/{photoId} to photo-download.php
- [x] photo-download.php calls trackDownload($pdo, $collectionId, 'INDIVIDUAL', $photoId)
- [x] photo-download.php sends Content-Disposition: attachment header
- [x] photo-download.php clears output buffering before readfile()
- [x] photo-download.php uses finfo_file() for MIME type detection
- [x] zip-download.php allows DOWNLOADED status (not just DELIVERED)
- [x] zip-download.php transitions DELIVERED to DOWNLOADED on first download
- [x] Both download endpoints use conditional UPDATE with WHERE status='DELIVERED' for race safety
- [x] download.js uses VITE_API_BASE_URL environment variable
- [x] download.js uses anchor-click pattern (no fetch/blob)
- [x] ESLint passes on download.js

**Runtime testing needed (Phase 08):**
- GET /deliver/{validToken}/photo/{validPhotoId} returns photo file with Content-Disposition: attachment
- Invalid token returns 404, non-DELIVERED/DOWNLOADED collection returns 403, missing photo returns 404
- Download table gets new INDIVIDUAL record with photoId populated
- Collection transitions DELIVERED to DOWNLOADED on first download (ZIP or individual)
- Subsequent downloads from DOWNLOADED status still work (both ZIP and individual)

## Next Steps

Phase 08 (Delivery Page) will:
1. Import downloadPhoto() and downloadAllAsZip() from utils/download.js
2. Build delivery page UI consuming GET /deliver/{token} endpoint from Phase 05-02
3. Render EditedPhoto list with download buttons calling downloadPhoto()
4. Add "Download All" button calling downloadAllAsZip()
5. Runtime-test individual and ZIP downloads, verify DOWNLOADED status transitions

## Self-Check: PASSED

**Created files verification:**
```
FOUND: backend/collections/photo-download.php (131 lines)
FOUND: frontend/src/utils/download.js (54 lines)
```

**Modified files verification:**
```
FOUND: database_schema.sql (DOWNLOADED in line 80, migration comment in line 264-266)
FOUND: backend/collections/zip-download.php (status gate line 52, transition logic lines 81-91)
FOUND: backend/index.php (photo case line 215)
```

**Commits verification:**
```
FOUND: e40cb3e (feat(07-01): add DOWNLOADED status and enable collection status transitions)
FOUND: eab68c0 (feat(07-01): create individual photo download endpoint)
FOUND: 3d48f41 (feat(07-01): create frontend download utility)
```

All claims verified. All files exist. All commits exist.
