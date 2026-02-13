# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.
**Current focus:** Planning next milestone — use `/gsd:new-milestone` to define v1.1 or v2.0 scope

## Current Position

Milestone: v1.0 MVP — COMPLETED 2026-02-13
Phases: 4/4 complete (9/9 plans)
Status: Milestone archived, ready for next milestone planning
Last activity: 2026-02-13 — Completed v1.0 milestone archival

Progress: v1.0 [██████████] 100% ✓ SHIPPED

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 13.2 min
- Total execution time: 2.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-photo-upload | 3/3 | 32 min | 10.7 min |
| 02-sharing-and-status | 2/2 | 30 min | 15.0 min |
| 03-client-gallery-and-selection | 2/2 | 27 min | 13.5 min |
| 04-review-and-delivery | 2/2 | 55 min | 27.5 min |

**Recent Trend:**
- Last 5 plans: 03-01 (2 min), 03-02 (25 min), 04-01 (21 min), 04-02 (34 min)
- Trend: Phase 4 plans longer due to workflow gap discoveries during verification, but resulted in complete, production-ready features

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
- Upload zone theming: Blue for proofs (DRAFT), green for edited finals (REVIEWING) for clear visual separation
- Mark as Delivered button guard: Disabled until at least one edited photo uploaded to prevent premature transitions
- Edited upload zone visibility: Only shown in REVIEWING status, hidden after DELIVERED to reduce UI clutter
- Client Submit Selections workflow: Added during 04-02 verification to close SELECTING → REVIEWING transition gap (clients had no way to signal completion)
- Submit button visibility: Only shown in SELECTING status with selections > 0, sticky at bottom for easy access

### Pending Todos

- Verify GD WebP support on Hostinger: `curl https://api.pixelforge.pro/backend/gd-test.php`
- Delete `backend/gd-test.php` after WebP support confirmed on Hostinger

### Blockers/Concerns

- Phase 1: Verify GD WebP support on Hostinger with `gd_info()` before committing to WebP thumbnail output (gd-test.php is deployed — run the curl to confirm)
- Phase 1: Confirm `backend/uploads/` directory access control (.htaccess deny) before any photos reach production
- Phase 4 (post): ZIP delivery (DELIV-02 through DELIV-04) is v2 — verify Hostinger `max_execution_time` before planning that milestone

## Session Continuity

Last session: 2026-02-13
Stopped at: v1.0 milestone archived. Ready for next milestone planning with `/gsd:new-milestone`.
Resume file: None

## v1.0 Milestone Complete

**Shipped:** Complete photographer-to-client workflow
- 4 phases (9 plans)
- 15/15 requirements satisfied
- 100% cross-phase integration
- E2E flows verified

**Full collection lifecycle implemented:**
DRAFT → SELECTING → REVIEWING → DELIVERED

**Core workflows complete:**
- Photographer: Upload proofs → share link → review selections → upload finals → deliver
- Client: View gallery → select photos → submit selections

**Archives:** See `.planning/milestones/v1.0-*` for full details
**Next steps:** Run `/gsd:new-milestone` to define v1.1 or v2.0 scope
