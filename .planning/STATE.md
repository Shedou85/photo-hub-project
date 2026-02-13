# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.
**Current focus:** Phase 2 - Sharing and Status

## Current Position

Phase: 2 of 4 (Sharing and Status)
Plan: 1 of 2 in current phase
Status: Executing phase 2
Last activity: 2026-02-13 — Completed 02-01 (public share links); commits d177a17, 74c0a78

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 10.3 min
- Total execution time: 0.68 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-photo-upload | 3/3 | 32 min | 10.7 min |
| 02-sharing-and-status | 1/2 | 9 min | 9.0 min |

**Recent Trend:**
- Last 5 plans: 01-01 (15 min), 01-02 (2 min), 01-03 (15 min), 02-01 (9 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Local file storage (backend/uploads/) — simplest path to ship; cloud migration planned but not needed now
- Token-based client access (no accounts) — friction-free for clients; photographers share one link
- Server-side ZIP generation (PHP) — deferred to v2; not in current milestone scope
- Thumbnail width: 400px JPEG output for all source types (JPEG/PNG/WebP) — locked per user decision
- WebP fallback: thumbnailPath is null if GD WebP unavailable — upload always succeeds (graceful degradation)
- Auto-cover only on first upload (coverPhotoId IS NULL) — subsequent uploads do not override photographer's manual cover choice
- Large image skip: width x height > 25,000,000 px skips thumbnail to prevent PHP memory exhaustion
- Grid images: thumbnailPath ?? storagePath — null/undefined triggers fallback to original, never show broken images
- Cover badge update is optimistic: parse autoSetCover from POST /collections/{id}/photos, no extra GET needed
- ESLint config: react/prop-types off (project style), react-refresh rule off (AuthContext hook+provider in same file)
- Cover auto-promotion on deletion: promotes photo at same grid index as deleted; optimistic UI + PATCH to backend; fire-and-forget (non-blocking)
- Lightbox overlay click fix: hover overlay set pointer-events-none so clicks reach underlying image (found during human verification of 01-03)
- Public share endpoint explicitly excludes sensitive fields (userId, password, clientEmail) — security by design
- Share page does NOT send credentials - plain fetch without credentials option for public access
- Share link format is {origin}/share/{shareId} using window.location.origin for portability

### Pending Todos

- Verify GD WebP support on Hostinger: `curl https://api.pixelforge.pro/backend/gd-test.php`
- Delete `backend/gd-test.php` after WebP support confirmed on Hostinger

### Blockers/Concerns

- Phase 1: Verify GD WebP support on Hostinger with `gd_info()` before committing to WebP thumbnail output (gd-test.php is deployed — run the curl to confirm)
- Phase 1: Confirm `backend/uploads/` directory access control (.htaccess deny) before any photos reach production
- Phase 4 (post): ZIP delivery (DELIV-02 through DELIV-04) is v2 — verify Hostinger `max_execution_time` before planning that milestone

## Session Continuity

Last session: 2026-02-13
Stopped at: Completed 02-01-PLAN.md (public share links). Next: 02-02-PLAN.md (collection status transitions).
Resume file: None
