# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.
**Current focus:** Phase 1 - Photo Upload

## Current Position

Phase: 1 of 4 (Photo Upload)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-12 — Completed 01-01 (backend thumbnails + auto-cover)

Progress: [█░░░░░░░░░] 8%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 15 min
- Total execution time: 0.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-photo-upload | 1/3 | 15 min | 15 min |

**Recent Trend:**
- Last 5 plans: 01-01 (15 min)
- Trend: —

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

### Pending Todos

- Verify GD WebP support on Hostinger: `curl https://api.pixelforge.pro/backend/gd-test.php`
- Delete `backend/gd-test.php` after WebP support confirmed on Hostinger

### Blockers/Concerns

- Phase 1: Verify GD WebP support on Hostinger with `gd_info()` before committing to WebP thumbnail output (gd-test.php is deployed — run the curl to confirm)
- Phase 1: Confirm `backend/uploads/` directory access control (.htaccess deny) before any photos reach production
- Phase 4 (post): ZIP delivery (DELIV-02 through DELIV-04) is v2 — verify Hostinger `max_execution_time` before planning that milestone

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 01-01-PLAN.md — backend thumbnail generation and auto-cover implemented
Resume file: None
