# Roadmap: Photo Hub (PixelForge)

## Overview

This milestone delivers the complete photographer-to-client workflow: a photographer uploads photos to a collection, shares a token link with a client who browses and selects favorites, the photographer reviews selections and uploads edited finals, and the collection is marked delivered. Four phases follow the natural dependency chain — nothing downstream can be built or tested without the upstream pieces in place.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Photo Upload** - Photographer can upload photos; thumbnails generated; photos display in grid with lightbox — *Completed 2026-02-12*
- [x] **Phase 2: Sharing and Status** - Photographer can generate a share link; collection cards reflect status with color coding — *Completed 2026-02-13*
- [ ] **Phase 3: Client Gallery and Selection** - Client can browse and select photos via share link without an account
- [ ] **Phase 4: Review and Delivery** - Photographer reviews selections and uploads edited finals; collection is delivered

## Phase Details

### Phase 1: Photo Upload
**Goal**: Photographer can upload photos to a collection and view them in a responsive grid with fullscreen viewing
**Depends on**: Nothing (first phase)
**Requirements**: UPLOAD-01, UPLOAD-02, UPLOAD-03
**Success Criteria** (what must be TRUE):
  1. Photographer can drag-and-drop or select multiple photos for upload on the collection detail page
  2. After upload, photos appear in a responsive grid on the collection detail page
  3. Photographer can open any photo fullscreen with prev/next navigation
  4. The collection cover is automatically set to the first uploaded photo
  5. Photographer can override the collection cover by selecting a different photo
**Plans**: 3 plans in 3 waves

Plans:
- [x] 01-01: Backend thumbnail generation + auto-cover + schema migration (Wave 1)
- [x] 01-02: Frontend grid + state updates for thumbnails and auto-cover (Wave 2, depends on 01-01)
- [x] 01-03: Lightbox verification + cover management polish (Wave 3, depends on 01-02)

### Phase 2: Sharing and Status
**Goal**: Photographer can generate a share link and collection cards visually communicate workflow status
**Depends on**: Phase 1
**Requirements**: SHARE-01, SHARE-02, SHARE-03
**Success Criteria** (what must be TRUE):
  1. Photographer can generate a shareable link on the collection detail page with one click
  2. The share link is a token-based URL that works without the client creating an account
  3. Collection cards on the collections list display a blue border/accent when status is SELECTING
  4. Collection cards display a green border/accent when status is REVIEWING
**Plans**: 2 plans in 2 waves

Plans:
- [x] 02-01: Public share endpoint + SharePage + share button on detail page + i18n (Wave 1)
- [x] 02-02: Status color coding on collection cards + status transition + human verification (Wave 2, depends on 02-01)

### Phase 3: Client Gallery and Selection
**Goal**: Client can browse collection photos and mark favorites via share link, with no account required
**Depends on**: Phase 2
**Requirements**: GALLERY-01, GALLERY-02, GALLERY-03, SELEC-01, SELEC-02
**Success Criteria** (what must be TRUE):
  1. Client opens the share URL and sees a responsive photo grid without logging in
  2. Client can open any photo fullscreen with prev/next navigation
  3. Client can toggle individual photos as selected or not selected
  4. Client sees a running count of their selected photos
  5. Client cannot download any photos while the collection is in the SELECTING stage
**Plans**: TBD

Plans:
- [ ] 03-01: Backend public gallery endpoint and selections API (token auth, status gating, selection persistence)
- [ ] 03-02: Frontend GalleryPage (public route, photo grid, lightbox, selection overlay, running count, download block)

### Phase 4: Review and Delivery
**Goal**: Photographer can see which photos the client selected and upload edited finals to deliver the collection
**Depends on**: Phase 3
**Requirements**: REVIEW-01, REVIEW-02, REVIEW-03, DELIV-01
**Success Criteria** (what must be TRUE):
  1. Photographer opens the collection and sees which photos the client selected, with All / Selected / Not Selected filter tabs
  2. The collection card turns green when the client has completed selections (status transitions to REVIEWING)
  3. Photographer can upload edited final versions of photos to the collection
  4. After uploading finals, photographer can transition the collection to DELIVERED status
**Plans**: TBD

Plans:
- [ ] 04-01: Photographer selection review UI (filter tabs, selected/not-selected indicators on photo grid)
- [ ] 04-02: Edited finals upload and DELIVERED transition (extend upload handler for EditedPhoto, status gate wiring)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Photo Upload | 3/3 | ✓ Complete | 2026-02-12 |
| 2. Sharing and Status | 2/2 | ✓ Complete | 2026-02-13 |
| 3. Client Gallery and Selection | 0/2 | Not started | - |
| 4. Review and Delivery | 0/2 | Not started | - |
