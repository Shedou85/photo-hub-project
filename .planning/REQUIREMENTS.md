# Requirements: Photo Hub

**Defined:** 2026-02-14
**Core Value:** The photographer can hand a client a link — the client selects photos for editing, the photographer delivers finals — without the client ever needing an account.

## v3.0 Requirements

Requirements for v3.0 Workflow & UX Redesign milestone. Transform UI from functional to world-class SaaS experience with intuitive workflow guidance.

### Design System Foundation

- [ ] **DESIGN-01**: Tailwind config uses `theme.extend` for all design tokens (spacing, typography, colors, shadows, border-radius)
- [ ] **DESIGN-02**: Spacing follows 8pt grid system (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- [ ] **DESIGN-03**: Typography uses Major Third scale (1.250 ratio) with Inter font family
- [ ] **DESIGN-04**: Shadow system uses subtle elevation (xs: 2px blur, md: 12px blur, xl: 48px blur) with 5-16% opacity
- [ ] **DESIGN-05**: Color system uses neutral-first palette (gray-50 background, white cards) with blue/indigo gradient accents
- [ ] **DESIGN-06**: Responsive breakpoints defined in shared constants file (MOBILE: 640px, TABLET: 768px, DESKTOP: 1024px)
- [ ] **DESIGN-07**: NO hardcoded values in components — all styling uses design tokens

### Primitive Components

- [ ] **COMP-01**: Button component with variants (primary: gradient, secondary: outline, danger: red, ghost: minimal)
- [ ] **COMP-02**: Card component with standard white background, subtle shadow, rounded corners
- [ ] **COMP-03**: Badge component with status colors (gray=DRAFT, blue=SELECTING, green=REVIEWING, purple=DELIVERED)
- [ ] **COMP-04**: PhotoCard component for photo grid with hover actions and selection state
- [ ] **COMP-05**: UploadZone component with drag-and-drop and file browser support
- [ ] **COMP-06**: All primitive components are reusable with prop-based customization (no copy-paste variants)
- [ ] **COMP-07**: Components documented with JSDoc and usage examples

### Responsive Layout

- [ ] **LAYOUT-01**: Mobile (<768px) uses bottom tab navigation with 3-5 core actions
- [ ] **LAYOUT-02**: Desktop (>=768px) uses persistent left sidebar navigation (256px wide)
- [ ] **LAYOUT-03**: Touch targets minimum 48x48px on mobile (56x56px for critical actions)
- [ ] **LAYOUT-04**: Photo grids scale responsively (1-col mobile → 2-col tablet → 3-col desktop)
- [ ] **LAYOUT-05**: Desktop max-width containers prevent ultra-wide sprawl (max-w-6xl or max-w-7xl)
- [ ] **LAYOUT-06**: Layout tested at in-between sizes (800px, 1100px, 1400px) not just exact breakpoints
- [ ] **LAYOUT-07**: Mobile layout does NOT compromise desktop experience (3 distinct layouts, not 1 stretched)

### Workflow UX Improvements

- [ ] **WORKFLOW-01**: Upload zone shows large dropzone when collection has 0 photos
- [ ] **WORKFLOW-02**: Upload zone collapses to compact "Add More Photos" button after first photo uploaded
- [ ] **WORKFLOW-03**: "Start client selection" button hidden when photoCount === 0
- [ ] **WORKFLOW-04**: Creating collection auto-navigates to collection details page
- [ ] **WORKFLOW-05**: Primary action changes per collection status (DRAFT: "Share with Client", SELECTING: "Copy Selection Link", REVIEWING: "Upload Finals", DELIVERED: "Copy Delivery Link")
- [ ] **WORKFLOW-06**: Next-step guidance text displays below status badge (e.g., "Next step: Upload photos")
- [ ] **WORKFLOW-07**: Empty state messaging shows state-specific guidance ("Upload photos to start" vs "Waiting for client selections")
- [ ] **WORKFLOW-08**: CollectionDetailsPage workflow phases extracted into separate components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase)
- [ ] **WORKFLOW-09**: Conditional UI uses object lookup pattern instead of nested ternaries for clarity

### Collection Cards Enhancement

- [ ] **CARDS-01**: Collection cards use edge-to-edge cover images (no padding around image)
- [ ] **CARDS-02**: Collection cards have gradient overlay for text legibility (from-black/70 via-black/20 to-transparent)
- [ ] **CARDS-03**: Collection cards display title, date, photo count, and status badge
- [ ] **CARDS-04**: Collection cards have rounded corners (16px) and subtle shadow with hover elevation
- [ ] **CARDS-05**: Status badges use color-coded dots (DRAFT: gray, SELECTING: blue, REVIEWING: green, DELIVERED: purple)

### Code Quality & Optimization

- [ ] **QUALITY-01**: Bundle size monitored (<50KB CSS gzipped)
- [ ] **QUALITY-02**: Lighthouse performance score >90
- [ ] **QUALITY-03**: Largest Contentful Paint (LCP) <2.5s
- [ ] **QUALITY-04**: Cumulative Layout Shift (CLS) <0.1
- [ ] **QUALITY-05**: Photo grids use lazy loading for images
- [ ] **QUALITY-06**: Animations budget <300ms for page transitions
- [ ] **QUALITY-07**: NO Tailwind class duplication — extract to component after 3rd usage
- [ ] **QUALITY-08**: All new UI strings added to en.json, lt.json, and ru.json (i18n maintained)

### Testing & Validation

- [ ] **TEST-01**: Cross-browser testing (Chrome, Firefox, Safari on desktop + mobile)
- [ ] **TEST-02**: Physical device testing on mobile (one-handed use, touch targets validated)
- [ ] **TEST-03**: Task completion time measured before/after redesign (upload → share, create collection)
- [ ] **TEST-04**: Multi-locale visual regression testing (LT/EN/RU overflow checks with 30% width buffer)
- [ ] **TEST-05**: Desktop tested on actual monitors (1920x1080, 2560x1440) for content dispersion

## Future Requirements

Deferred to future milestones.

### Advanced Features
- **Collections dashboard filters** (status, date range)
- **Drag-and-drop photo reordering** within collection
- **Keyboard navigation** for photo grid (accessibility beyond touch targets)
- **Dark mode** support with LCH color space approach
- **Virtual scrolling** for collections with 100+ photos (if analytics show >10% collections exceed 100 photos)

## Out of Scope

Explicitly excluded from v3.0. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Tailwind v4 migration | Adds risk during redesign; defer to separate milestone post-v3.0 |
| Backend API changes | Frontend-only redesign; no backend modifications needed |
| Collection status lifecycle changes | Backend-driven, stable, no changes needed |
| Real-time WebSocket updates | Photographer workflow is async; not needed for UX improvements |
| Email notifications | Separate feature; not part of UI/UX redesign scope |
| Cloud storage migration (S3/R2) | Infrastructure change; separate milestone |
| Collection archiving workflow | Feature addition; not part of redesign scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(Will be populated by roadmapper)* | | |

**Coverage:**
- v3.0 requirements: TBD total
- Mapped to phases: TBD
- Unmapped: TBD

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after research phase*
