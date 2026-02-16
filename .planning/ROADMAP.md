# Roadmap: Photo Hub (PixelForge)

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-13)
- ✅ **v2.0 Delivery & Polish** — Phases 5-10 (shipped 2026-02-14)
- 🚧 **v3.0 Workflow & UX Redesign** — Phases 11-16 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-13</summary>

- [x] Phase 1: Photo Upload (3/3 plans) — completed 2026-02-12
- [x] Phase 2: Sharing and Status (2/2 plans) — completed 2026-02-13
- [x] Phase 3: Client Gallery and Selection (2/2 plans) — completed 2026-02-13
- [x] Phase 4: Review and Delivery (2/2 plans) — completed 2026-02-13

**Delivered:** Complete photographer-to-client photo selection and delivery workflow with token-based sharing, no client account required.

**Details:** See `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0 Delivery & Polish (Phases 5-10) — SHIPPED 2026-02-14</summary>

- [x] Phase 5: Delivery Infrastructure (2/2 plans) — completed 2026-02-13
- [x] Phase 6: Server-Side ZIP Downloads (1/1 plan) — completed 2026-02-13
- [x] Phase 7: Individual Photo Downloads (1/1 plan) — completed 2026-02-14
- [x] Phase 8: Client Delivery Interface (1/1 plan) — completed 2026-02-14
- [x] Phase 9: Photographer Dashboard Integration (1/1 plan) — completed 2026-02-14
- [x] Phase 10: UI Polish & Refinement (1/1 plan) — completed 2026-02-14

**Delivered:** Client delivery system with flexible download options (ZIP + individual), automatic token generation, and complete photographer-to-client workflow integration.

**Details:** See `.planning/milestones/v2.0-ROADMAP.md`

</details>

### 🚧 v3.0 Workflow & UX Redesign (In Progress)

**Milestone Goal:** Transform UI from functional to world-class SaaS experience with intuitive workflow guidance and mobile-first client interactions.

#### Phase 11: Design System Foundation
**Goal**: Establish design tokens and responsive infrastructure before component changes
**Depends on**: Phase 10
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06, DESIGN-07
**Success Criteria** (what must be TRUE):
  1. Tailwind config uses `theme.extend` for all design tokens (spacing, typography, colors, shadows, border-radius)
  2. Design system follows 8pt grid with Major Third typography scale (1.250 ratio)
  3. Responsive breakpoints defined in shared constants file (MOBILE: 640px, TABLET: 768px, DESKTOP: 1024px)
  4. No hardcoded values exist in components - all styling uses design tokens
  5. Performance budgets documented (Lighthouse >90, LCP <2.5s, CLS <0.1, bundle <50KB CSS gzipped)
**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — Configure design tokens in tailwind.config.js and create shared breakpoints constants
- [x] 11-02-PLAN.md — Refactor authenticated pages and shared components to use design tokens
- [x] 11-03-PLAN.md — Refactor public/client-facing pages to use design tokens and verify codebase

#### Phase 12: Primitive Component Library
**Goal**: Create reusable primitive components enforcing design tokens
**Depends on**: Phase 11
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07
**Success Criteria** (what must be TRUE):
  1. Button component exists with 4 variants (primary gradient, secondary outline, danger red, ghost minimal)
  2. Card component exists with standard white background, subtle shadow, rounded corners
  3. Badge component exists with status colors (gray=DRAFT, blue=SELECTING, green=REVIEWING, purple=DELIVERED)
  4. PhotoCard and UploadZone components are reusable with prop-based customization (no copy-paste variants)
  5. All primitive components documented with JSDoc and usage examples
**Plans**: 2 plans

Plans:
- [ ] 12-01-PLAN.md — Install clsx and create Button, Card, Badge atomic primitives
- [ ] 12-02-PLAN.md — Create PhotoCard and UploadZone complex components

#### Phase 13: Responsive Layout Refactor
**Goal**: Add mobile bottom navigation and refine desktop sidebar before page redesigns
**Depends on**: Phase 12
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, LAYOUT-06, LAYOUT-07
**Success Criteria** (what must be TRUE):
  1. Mobile (<768px) uses bottom tab navigation with 3-5 core actions and minimum 48x48px touch targets
  2. Desktop (>=768px) uses persistent left sidebar navigation (256px wide)
  3. Photo grids scale responsively (1-col mobile, 2-col tablet, 3-col desktop)
  4. Desktop max-width containers prevent ultra-wide sprawl (max-w-6xl or max-w-7xl)
  5. Layout tested at in-between sizes (800px, 1100px, 1400px) not just exact breakpoints
**Plans**: 2 plans

Plans:
- [ ] 13-01-PLAN.md — Create useMediaQuery hook, mobile bottom navigation, MobileLayout, ResponsiveLayout switcher, and refactor MainLayout for desktop-only
- [ ] 13-02-PLAN.md — Update photo grids to responsive 1/2/3 columns and add max-w-6xl containers to authenticated pages

#### Phase 14: Collection Cards & Simple Pages
**Goal**: Apply design tokens to collection list and client-facing pages
**Depends on**: Phase 13
**Requirements**: CARDS-01, CARDS-02, CARDS-03, CARDS-04, CARDS-05, QUALITY-05, QUALITY-07, QUALITY-08
**Success Criteria** (what must be TRUE):
  1. Collection cards use edge-to-edge cover images with gradient overlay for text legibility
  2. Collection cards display title, date, photo count, and status badge with rounded corners (16px) and hover elevation
  3. SharePage and DeliveryPage use primitive components with improved mobile touch targets
  4. Photo grids use lazy loading for images to improve performance
  5. All new UI strings added to en.json, lt.json, and ru.json (i18n maintained across all 3 locales)
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

#### Phase 15: Workflow Enhancement
**Goal**: Extract workflow phase components and implement state-based UI improvements
**Depends on**: Phase 14
**Requirements**: WORKFLOW-01, WORKFLOW-02, WORKFLOW-03, WORKFLOW-04, WORKFLOW-05, WORKFLOW-06, WORKFLOW-07, WORKFLOW-08, WORKFLOW-09, QUALITY-06
**Success Criteria** (what must be TRUE):
  1. Upload zone shows large dropzone when collection has 0 photos, collapses to compact button after first upload
  2. "Start client selection" button hidden when photoCount === 0
  3. Creating collection auto-navigates to collection details page
  4. Primary action changes per collection status (DRAFT: "Share with Client", SELECTING: "Copy Selection Link", REVIEWING: "Upload Finals", DELIVERED: "Copy Delivery Link")
  5. Next-step guidance text displays below status badge (e.g., "Next step: Upload photos")
  6. CollectionDetailsPage workflow phases extracted into separate components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase)
  7. Page transitions complete within 300ms animation budget
**Plans**: TBD

Plans:
- [ ] 15-01: TBD

#### Phase 16: Testing & QA
**Goal**: Comprehensive testing and performance validation before launch
**Depends on**: Phase 15
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, QUALITY-01, QUALITY-02, QUALITY-03, QUALITY-04
**Success Criteria** (what must be TRUE):
  1. Cross-browser testing complete (Chrome, Firefox, Safari on desktop + mobile)
  2. Physical device testing on mobile validates one-handed use and touch targets
  3. Task completion time measured before/after redesign (upload → share, create collection)
  4. Multi-locale visual regression testing complete (LT/EN/RU overflow checks with 30% width buffer)
  5. Lighthouse performance score >90, LCP <2.5s, CLS <0.1, bundle size <50KB CSS gzipped
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Photo Upload | v1.0 | 3/3 | Complete | 2026-02-12 |
| 2. Sharing | v1.0 | 2/2 | Complete | 2026-02-13 |
| 3. Client Gallery | v1.0 | 2/2 | Complete | 2026-02-13 |
| 4. Delivery | v1.0 | 2/2 | Complete | 2026-02-13 |
| 5. Delivery Infrastructure | v2.0 | 2/2 | Complete | 2026-02-13 |
| 6. Server-Side ZIP Downloads | v2.0 | 1/1 | Complete | 2026-02-13 |
| 7. Individual Photo Downloads | v2.0 | 1/1 | Complete | 2026-02-14 |
| 8. Client Delivery Interface | v2.0 | 1/1 | Complete | 2026-02-14 |
| 9. Photographer Dashboard Integration | v2.0 | 1/1 | Complete | 2026-02-14 |
| 10. UI Polish & Refinement | v2.0 | 1/1 | Complete | 2026-02-14 |
| 11. Design System Foundation | v3.0 | 3/3 | Complete | 2026-02-16 |
| 12. Primitive Component Library | v3.0 | 2/2 | Complete | 2026-02-16 |
| 13. Responsive Layout Refactor | v3.0 | 2/2 | Complete | 2026-02-16 |
| 14. Collection Cards & Simple Pages | v3.0 | 0/TBD | Not started | - |
| 15. Workflow Enhancement | v3.0 | 0/TBD | Not started | - |
| 16. Testing & QA | v3.0 | 0/TBD | Not started | - |

---
*Last updated: 2026-02-14 after v3.0 roadmap creation*
