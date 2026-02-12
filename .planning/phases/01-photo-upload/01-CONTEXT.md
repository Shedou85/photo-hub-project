# Phase 1: Photo Upload - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Photographer uploads photos to a collection and views them in a responsive grid with fullscreen viewing. Photographer can set and override the collection cover photo. First photo upload prompts the photographer to set it as cover or skip. Photos appear as thumbnails in the grid and full-resolution in fullscreen.

</domain>

<decisions>
## Implementation Decisions

### Thumbnail Generation & Display
- **Size:** 400px wide (balanced load time and visual quality)
- **Format:** Claude's discretion — test GD support on Hostinger; use most compatible approach (likely JPEG for all sources)
- **WebP handling:** Claude's discretion — if GD doesn't support WebP, decide between converting to JPEG or rejecting WebP uploads
- **Failure handling:** If thumbnail generation fails, show a placeholder icon and let user continue (don't reject the upload)

### Auto-Cover Behavior
- **First photo:** Photographer chooses on first upload (UI prompt: "Set as cover?" or similar)
- **Deletion:** If the cover photo is deleted, automatically promote the next photo as new cover
- **Badge update:** Claude's discretion — update immediately (optimistic) or after server confirms
- **Visual style:** Claude's discretion — use a clear visual indicator (badge, border, or highlight) to show which photo is cover

</decisions>

<specifics>
## Specific Ideas

No specific product references or interaction patterns — open to standard approaches that match the existing design.

</specifics>

<deferred>
## Deferred Ideas

- Upload progress & error feedback — covered in Phase 1 but not discussed in detail; researcher/planner will apply standard patterns
- Grid density & fullscreen behavior (slideshow, zoom, etc.) — may be addressed in Phase 1 but not discussed; open to standard responsive gallery patterns

</deferred>

---

*Phase: 01-photo-upload*
*Context gathered: 2026-02-12*
