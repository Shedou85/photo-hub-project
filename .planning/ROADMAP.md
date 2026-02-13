# Roadmap: Photo Hub (PixelForge)

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-02-13)
- 🚧 **v2.0 Delivery & Polish** - Phases 5-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED 2026-02-13</summary>

- [x] Phase 1: Photo Upload (3/3 plans) - completed 2026-02-12
- [x] Phase 2: Sharing and Status (2/2 plans) - completed 2026-02-13
- [x] Phase 3: Client Gallery and Selection (2/2 plans) - completed 2026-02-13
- [x] Phase 4: Review and Delivery (2/2 plans) - completed 2026-02-13

**Details:** See `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v2.0 Delivery & Polish (In Progress)

**Milestone Goal:** Enable client delivery of edited photos with flexible download options (ZIP + individual) and improve UI/UX across the photographer workflow.

#### Phase 5: Delivery Infrastructure
**Goal**: Establish separate delivery token system with download tracking database
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: DELIV-01, DELIV-02, DELIV-03, TRACK-01, TRACK-02, TRACK-03
**Success Criteria** (what must be TRUE):
  1. Photographer can generate a delivery link that is separate from the selection link
  2. Delivery token is automatically created when collection transitions to DELIVERED status
  3. System tracks download events (ZIP and individual) without double-counting from browser resume requests
  4. Download tracking table exists with session-based deduplication schema
**Plans**: TBD

Plans:
- [ ] TBD (pending plan-phase)

#### Phase 6: Server-Side ZIP Downloads
**Goal**: Enable bulk download of all edited photos as streaming ZIP file
**Depends on**: Phase 5
**Requirements**: DWNLD-01, DWNLD-02
**Success Criteria** (what must be TRUE):
  1. Client can download all edited photos as a single ZIP file from delivery page
  2. ZIP generation handles 50+ photos at 10MB each without server timeout or memory errors
  3. ZIP download completes successfully on collections with 100+ photos
**Plans**: TBD

Plans:
- [ ] TBD (pending plan-phase)

#### Phase 7: Individual Photo Downloads
**Goal**: Enable selective download of individual edited photos
**Depends on**: Phase 5
**Requirements**: DWNLD-03, DWNLD-04, DWNLD-05, TRACK-04
**Success Criteria** (what must be TRUE):
  1. Client can download individual photos from grid view with single click
  2. Client can download individual photos from lightbox view with download button
  3. Individual downloads work reliably across browsers (Chrome, Safari, Firefox)
  4. Collection transitions to DOWNLOADED status after first download (ZIP or individual)
**Plans**: TBD

Plans:
- [ ] TBD (pending plan-phase)

#### Phase 8: Client Delivery Interface
**Goal**: Build public delivery page for client photo downloads
**Depends on**: Phase 6 and Phase 7
**Requirements**: DELIV-05, DELIV-06
**Success Criteria** (what must be TRUE):
  1. Client can access delivery page using delivery token (no login required)
  2. Delivery page displays only edited/final photos in clean gallery layout
  3. Delivery page shows "Download All as ZIP" button and individual download buttons
  4. Delivery page validates token and shows error for invalid/expired tokens
**Plans**: TBD

Plans:
- [ ] TBD (pending plan-phase)

#### Phase 9: Photographer Dashboard Integration
**Goal**: Integrate delivery management into photographer workflow
**Depends on**: Phase 8
**Requirements**: DELIV-04, TRACK-05
**Success Criteria** (what must be TRUE):
  1. Selection link automatically redirects to delivery page after collection reaches DELIVERED status
  2. Photographer can see download confirmation (DOWNLOADED status) in collection details
  3. Photographer can copy delivery link to clipboard from collection details page
  4. Collection card shows DOWNLOADED status with appropriate color/badge
**Plans**: TBD

Plans:
- [ ] TBD (pending plan-phase)

#### Phase 10: UI Polish & Refinement
**Goal**: Improve photographer workflow UX with progressive disclosure and clearer action organization
**Depends on**: Phase 9
**Requirements**: UIPOL-01, UIPOL-02, UIPOL-03, UIPOL-04, UIPOL-05
**Success Criteria** (what must be TRUE):
  1. Upload dropzone hides after first photo is uploaded, replaced by "Add More Photos" button
  2. Collection details page has reorganized buttons grouped by workflow phase (Upload / Share / Review / Deliver)
  3. Share page has improved client action button layout with clearer CTAs
  4. Status badges and collection card colors reflect DOWNLOADED status in lifecycle
  5. All UI changes maintain i18n support across Lithuanian, English, and Russian
**Plans**: TBD

Plans:
- [ ] TBD (pending plan-phase)

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Photo Upload | v1.0 | 3/3 | Complete | 2026-02-12 |
| 2. Sharing | v1.0 | 2/2 | Complete | 2026-02-13 |
| 3. Client Gallery | v1.0 | 2/2 | Complete | 2026-02-13 |
| 4. Delivery | v1.0 | 2/2 | Complete | 2026-02-13 |
| 5. Delivery Infrastructure | v2.0 | 0/TBD | Not started | - |
| 6. Server-Side ZIP Downloads | v2.0 | 0/TBD | Not started | - |
| 7. Individual Photo Downloads | v2.0 | 0/TBD | Not started | - |
| 8. Client Delivery Interface | v2.0 | 0/TBD | Not started | - |
| 9. Photographer Dashboard Integration | v2.0 | 0/TBD | Not started | - |
| 10. UI Polish & Refinement | v2.0 | 0/TBD | Not started | - |

---
*Last updated: 2026-02-13 after v2.0 roadmap creation*
