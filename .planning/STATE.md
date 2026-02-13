# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.
**Current focus:** Phase 4 - Review and Delivery

## Current Position

Phase: 4 of 4 (Review and Delivery)
Plan: 1 of 2 in current phase
Status: Phase 4 in progress — 04-01 complete, 04-02 ready for execution
Last activity: 2026-02-13 — Completed 04-01-PLAN.md (photographer selection review UI)

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 11.4 min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-photo-upload | 3/3 | 32 min | 10.7 min |
| 02-sharing-and-status | 2/2 | 30 min | 15.0 min |
| 03-client-gallery-and-selection | 2/2 | 27 min | 13.5 min |
| 04-review-and-delivery | 1/2 | 21 min | 21.0 min |

**Recent Trend:**
- Last 5 plans: 02-02 (21 min), 03-01 (2 min), 03-02 (25 min), 04-01 (21 min)
- Trend: Consistent UI refinement pattern with verification checkpoints catching usability issues

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
- Status border mapping: SELECTING=blue, REVIEWING=green, no border for DRAFT/DELIVERED/ARCHIVED to reduce visual clutter
- Status badges only show for non-DRAFT collections (avoids redundant "Draft" badge on majority of new collections)
- SharePage lightbox navigation: 32px/40px arrow chevrons with drop-shadow for subtle, non-intrusive navigation
- Selection status gate asymmetry: GET has no status gate (visible in REVIEWING), POST/DELETE require SELECTING for client workflow
- Idempotent selection POST: duplicate selections return existing record via PDO duplicate key handling (error code 23000)
- Public selections route precedence: /share/{id}/selections matched before /share/{id} for correct routing
- Client selection interaction model: Photo click opens lightbox, checkbox click toggles selection (user feedback refinement)
- Client selection checkbox sizing: 24px outlined square with 16px checkmark - optimal balance of visibility and subtlety
- Download prevention on share pages: Always active regardless of collection status (right-click, drag, select-all blocked)
- Optimistic selection updates: UI changes before API response with error rollback pattern for instant feedback
- Filter tabs visibility: Only show when selections.length > 0 to avoid empty UI on DRAFT collections
- Lightbox navigation scope: prev/next uses full photos array regardless of active filter for seamless browsing
- Filter reset on collection change: useEffect pattern resets filter to 'all' when navigating between collections
- Selection badge positioning: Blue checkmark at top-right (8px margin) for visibility without overlapping cover badge
- UI focus outlines: Completely removed from filter buttons and lightbox controls per user preference for cleaner look
- Lightbox arrow visibility: Black backgrounds (bg-black/60) instead of white for better contrast on light photos

### Pending Todos

- Verify GD WebP support on Hostinger: `curl https://api.pixelforge.pro/backend/gd-test.php`
- Delete `backend/gd-test.php` after WebP support confirmed on Hostinger

### Blockers/Concerns

- Phase 1: Verify GD WebP support on Hostinger with `gd_info()` before committing to WebP thumbnail output (gd-test.php is deployed — run the curl to confirm)
- Phase 1: Confirm `backend/uploads/` directory access control (.htaccess deny) before any photos reach production
- Phase 4 (post): ZIP delivery (DELIV-02 through DELIV-04) is v2 — verify Hostinger `max_execution_time` before planning that milestone

## Session Continuity

Last session: 2026-02-13
Stopped at: Completed 04-01-PLAN.md (photographer selection review UI). Ready for 04-02 execution.
Resume file: None
