# Project Research Summary

**Project:** Photo Hub v3.0 UI/UX Redesign
**Domain:** SaaS Photographer Platform (Functional → Premium Aesthetic)
**Researched:** 2026-02-14
**Confidence:** HIGH

## Executive Summary

Photo Hub is a professional photographer platform with a solid functional foundation (React 18 + Tailwind CSS v3 + vanilla PHP backend + MySQL) and clear collection workflow (DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED). The v3.0 redesign aims to elevate from functional to world-class SaaS aesthetic (Linear/Stripe/Notion level) while fixing identified workflow UX issues. Research across design systems, workflow patterns, architecture integration, and pitfalls reveals a clear path forward: **mobile-first client experience + desktop-optimized photographer workspace, built via gradual component refactoring with design token extraction**.

The recommended approach is **incremental migration, not big-bang rewrite**. Stay on Tailwind v3 (defer v4 migration post-redesign), extract design tokens via `theme.extend`, build primitive component library (Button, Card, Badge), then selectively refactor pages. CollectionDetailsPage requires partial rewrite (1040 lines, complex state-based UI) via workflow phase component extraction; other pages need style-only refactors. Critical risks include over-design masking usability loss (measure task completion times before/after), mobile-first destroying desktop experience (design 3 distinct layouts, not 1 stretched), and breaking existing workflow patterns (preserve muscle memory, add migration tooltips for necessary changes).

Key insight from competitor analysis: Photo Hub's explicit status lifecycle (color-coded badges for DRAFT/SELECTING/REVIEWING/DELIVERED) is a differentiator versus Pixieset/Pic-Time's implicit states. The redesign should enhance this strength while fixing gaps: upload zone should adapt to collection state (large dropzone when empty, compact button when populated), conditional button display (hide "Start Selection" until photos exist), auto-navigation after actions (create collection → navigate to details), and mobile bottom navigation to complement desktop sidebar. These changes bring Photo Hub to industry standard while maintaining its workflow clarity advantage.

## Key Findings

### Design System Foundations

**Summary from DESIGN-SYSTEM.md:** Premium SaaS design in 2026 follows Linear/Stripe patterns: 8pt spacing grid for rhythm, Major Third (1.250) typography scale, subtle shadows for depth (not heavy borders), neutral-first color palette (gray-50 page backgrounds, white cards) with strategic accent gradients (blue-500 → indigo-500), and glassmorphism for elevated UI elements. Photography-specific patterns require edge-to-edge imagery (minimal chrome, tight gaps), gradient overlays for text legibility, and Polaroid-style collection cards.

**Core design tokens (Tailwind v3 `theme.extend`):**
- **Spacing:** 8pt base unit (4px, 8px, 16px, 24px, 32px, 48px, 64px) — aligns with iOS 44px and Android 48px touch targets
- **Typography:** Inter font (industry standard), responsive scale (12px caption → 48px display), tight line-height for headings (1.1-1.3), comfortable for body (1.5-1.6)
- **Shadows:** Subtle elevation ramp (xs: 1px blur, md: 12px blur, xl: 48px blur) with low opacity (5-16%) — not heavy borders
- **Colors:** Warm grays (gray-50 to gray-900), blue/indigo gradient primary, status-coded badges (gray=DRAFT, blue=SELECTING, green=REVIEWING, purple=DELIVERED)
- **Mobile-first patterns:** 48x48px minimum touch targets, bottom tab navigation (3-5 actions), FAB for primary action, swipe gestures for photo navigation
- **Desktop patterns:** Persistent sidebar (256px wide), airy content layout (max-w-6xl centered), generous spacing (mb-8 between sections), responsive grid scaling (1-col → 2-col → 3-col)

**Anti-patterns to avoid:**
- Heavy borders (border-2, border-gray-800) — creates boxy admin-template feel
- Overuse of color — ONE primary button per view, rest secondary/ghost
- Tiny touch targets (<44px) — fails accessibility, frustrating on mobile
- Hamburger menu as primary navigation on desktop — hides navigation, reduces discoverability 50%

### Workflow Pattern Improvements

**Summary from WORKFLOW-PATTERNS.md:** Top photographer platforms (Pixieset, Pic-Time, ShootProof) use state-based progressive disclosure where UI adapts to collection status and photo count. Photo Hub's current issues (upload zone doesn't adapt, "Start Selection" shows with 0 photos, no auto-navigation after create, workflow phases not visually clear) stem from missing these industry-standard patterns.

**Must have (table stakes):**
- **Upload zone adaptation:** Large dropzone when collection empty (0 photos), collapses to compact "Add More" button after upload — reduces visual clutter, makes content primary focus
- **Conditional button display:** Hide "Start Selection" until `photoCount > 0` — prevents confusion ("Why can't I click this?")
- **Auto-navigate after create:** `navigate(/collection/${id})` after creating collection — reduces clicks, suggests next step (upload photos)
- **Primary action hierarchy:** ONE primary button per state (DRAFT: "Share with Client", SELECTING: "Copy Link", REVIEWING: "Upload Finals", DELIVERED: "Copy Delivery Link") — clarifies next step
- **Empty state guidance:** State-specific messaging ("Upload photos to start" vs "Waiting for client selections") with icon + CTA — guides workflow

**Should have (competitive advantage):**
- **Next-step guidance text:** Explicit "Next step: Upload photos" below status badge — few competitors do this, reduces cognitive load
- **Progressive button disclosure:** Show only relevant actions per state (hide "Upload Finals" in DRAFT, show in REVIEWING) — reduces decision paralysis
- **Explicit status visualization:** Photo Hub's color-coded badges (already implemented) clearer than Pixieset/ShootProof's implicit states — enhance this differentiator with workflow guidance

**Defer (v2+):**
- Kanban board for collections (drag between workflow stages) — adds complexity for marginal value, filtering by status achieves same goal
- Real-time WebSocket notifications — photographer workflow is async (hours between checks), email digest sufficient
- Workflow templates/presets — premature optimization, start with sane defaults

**Implementation complexity:** All P1 patterns (upload zone adaptation, conditional buttons, auto-navigation, empty states) are LOW complexity, 8-12 hours total effort — high value, low cost.

### Architecture Integration Strategy

**Summary from ARCHITECTURE.md:** Photo Hub's React 18 + Tailwind v3 + PHP backend architecture is solid; redesign is frontend-only (no backend changes). Recommended approach: **gradual component refactoring** with design token extraction, not big-bang rewrite. Stay on Tailwind v3 (v4 migration adds risk, defer to separate milestone), extract design tokens via `theme.extend`, build primitive components (Button, Card, Badge), then refactor pages one-by-one.

**Component migration strategy:**
1. **Refactor (style-only):** CollectionsListPage, SharePage, DeliveryPage, MainLayout — sound logic, simple UI, just needs design token application
2. **Partial rewrite:** CollectionDetailsPage (1040 lines, complex workflow state) — extract 4 workflow phase components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase) to simplify conditional rendering
3. **Extract primitives:** Button (variants: primary/secondary/danger), Card (standard white card), Badge (status colors), PhotoCard (grid item with overlay actions), UploadZone (file upload UI)

**Mobile-first responsive strategy:**
- Extract breakpoints to shared constants: `BREAKPOINTS = { MOBILE: 640, TABLET: 768, DESKTOP: 1024 }`
- Mobile navigation: bottom tab bar (Collections, Profile, Payments) with 48x48px touch targets, glassmorphism elevation
- Desktop navigation: persistent sidebar (256px wide, white background, subtle borders)
- Responsive grids: mobile 1-col → tablet 2-col → desktop 3-col, test at in-between sizes (800px, 1100px, 1400px)

**What NOT to touch:**
- Backend API (PHP router, endpoint contracts, database schema, sessions, CORS) — out of scope
- React architecture (AuthContext, ProtectedRoute, App.jsx routes, i18n setup) — stable foundation
- Collection status lifecycle (DRAFT → SELECTING → REVIEWING → DELIVERED) — backend-driven, unchanged

**Build order (dependency-aware, 8 weeks):**
1. **Phase 1 (Week 1):** Design System Foundation — `theme.extend` tokens, shared breakpoint constants, validate no regressions
2. **Phase 2 (Week 2):** Primitive Components — Button/Card/Badge extraction, migrate PaymentsPage to validate
3. **Phase 3 (Week 3):** Layout Refactor — add mobile bottom navigation, keep desktop sidebar
4. **Phase 4-5 (Weeks 4-5):** Page Refactors — CollectionsListPage, SharePage, DeliveryPage (apply design tokens, migrate to primitives)
5. **Phase 5-6 (Weeks 6-7):** CollectionDetailsPage Rewrite — extract workflow phase components, composite components (PhotoCard, UploadZone)
6. **Phase 7 (Week 8):** Visual QA & Polish — cross-browser testing, mobile device testing, performance audit

### Critical Pitfalls to Avoid

**Top 5 from PITFALLS.md:**

1. **Over-design masking usability loss** — Premium aesthetic without functional verification. Measure task completion times BEFORE redesign, track upload → share → selection → delivery flow, set animation budgets (<300ms page transitions), test with existing users (not just fresh eyes). Warning signs: "looks great but where did X go?", support tickets asking "how do I...?", task time increases 10%+.

2. **Mobile-first destroying desktop experience** — Single-column layouts stretched to 1440px monitors, excessive whitespace, content dispersed across 3 screens. Design THREE distinct layouts (mobile <768px, tablet 768-1024px, desktop >1024px), use CSS Grid for desktop (not stretched Flexbox), test on actual monitors (1920x1080, 2560x1440), set max-width constraints (max-w-7xl).

3. **Touch targets too small on mobile** — Desktop-sized buttons (32x32px) frustrating on mobile, especially for photographers outdoors with cold fingers. Minimum 44x44px (Apple HIG), prefer 48x48px for icon buttons, critical actions 56x56px, test on actual devices held ONE-HANDED in realistic conditions (outdoors, wearing gloves).

4. **Breaking existing workflow patterns** — Redesign changes action locations, users lose muscle memory, support tickets explode. Document ALL existing patterns before redesign, observe current users completing tasks, preserve primary action locations unless compelling UX reason, provide migration tooltips for necessary changes, gradual rollout with beta period.

5. **Unclear workflow state transitions** — Collection status changes (DRAFT → SELECTING → REVIEWING) but UI doesn't guide next steps. Design state-specific empty states ("Upload photos to start" vs "Waiting for client selections"), add first-use tooltips (SELECTING: "Click hearts to select favorites"), use micro-copy as imperatives ("Select Your Favorites" not "Next").

**Security reminders:**
- Always verify collection ownership in backend (check `$_SESSION['user_id']` matches owner) — client-side checks insufficient
- Never expose photographer client emails in API responses — privacy violation, GDPR non-compliance
- Rate limiting on photo upload (10 uploads/minute per user) — prevent disk space abuse
- Maintain SameSite=None, Secure, HttpOnly flags on session cookies — already correct per CLAUDE.md

## Implications for Roadmap

Based on research, suggested phase structure mirrors architecture build order with integration of workflow improvements and pitfall mitigation:

### Phase 1: Design System Foundation (Week 1)
**Rationale:** Establish design tokens and shared constants before any component changes — prevents inconsistencies, enables parallel work.
**Delivers:** Tailwind `theme.extend` config with spacing/typography/color/shadow tokens, shared `BREAKPOINTS` constants file, performance budgets documented (Lighthouse >90, LCP <2.5s, CLS <0.1).
**Addresses:** Design token system (DESIGN-SYSTEM.md), responsive breakpoint architecture (ARCHITECTURE.md)
**Avoids:** Tailwind class bloat (Pitfall 9), responsive breakpoint bugs (Pitfall 7)
**Research flag:** No deeper research needed — well-documented Tailwind v3 patterns, template provided in ARCHITECTURE.md

### Phase 2: Primitive Component Library (Week 2)
**Rationale:** Extract reusable Button/Card/Badge components enforcing design tokens before refactoring pages — single source of truth.
**Delivers:** `Button.jsx` (primary/secondary/danger variants), `Card.jsx` (standard white card), `Badge.jsx` (status colors), PaymentsPage migrated to validate primitives.
**Addresses:** Component extraction priorities (ARCHITECTURE.md), button hierarchy (WORKFLOW-PATTERNS.md)
**Avoids:** Tailwind class bloat (Pitfall 9), inconsistent styling
**Research flag:** No deeper research needed — React component patterns well-established

### Phase 3: Responsive Layout Refactor (Week 3)
**Rationale:** Add mobile bottom navigation and refine desktop sidebar before page redesigns — layout foundation for all views.
**Delivers:** `BottomNav.jsx` component (mobile <768px), persistent sidebar (desktop >=768px), responsive breakpoint logic using shared constants, touch-friendly 48x48px targets.
**Addresses:** Mobile navigation pattern (DESIGN-SYSTEM.md), responsive strategy (ARCHITECTURE.md)
**Avoids:** Hidden navigation on desktop (Pitfall 3), touch targets too small (Pitfall 5)
**Research flag:** No deeper research needed — mobile navigation patterns documented in DESIGN-SYSTEM.md

### Phase 4: Collection List & Simple Page Refactors (Weeks 4-5)
**Rationale:** Apply design tokens to simpler pages (CollectionsListPage, SharePage, DeliveryPage) before tackling complex CollectionDetailsPage — build confidence, validate primitive components.
**Delivers:** CollectionsListPage with Polaroid cards + design tokens, SharePage with improved mobile touch targets, DeliveryPage with updated button styles, all using primitive components.
**Addresses:** Card design patterns (DESIGN-SYSTEM.md), workflow patterns for client views (WORKFLOW-PATTERNS.md)
**Avoids:** Over-design masking usability (Pitfall 1) — verify task completion times before/after
**Research flag:** No deeper research needed — refactor execution (style changes only)

### Phase 5: Collection Workflow Enhancement (Weeks 6-7)
**Rationale:** Extract CollectionDetailsPage workflow phase components and implement state-based UI improvements — core photographer experience, highest complexity.
**Delivers:** Workflow phase components (DraftPhase, SelectingPhase, ReviewingPhase, DeliveredPhase), composite components (PhotoCard, UploadZone), upload zone adaptation (large when empty, compact button when populated), conditional button display (hide "Start Selection" until photos exist), auto-navigation after create, next-step guidance text per status.
**Addresses:** All P1 workflow patterns (WORKFLOW-PATTERNS.md), state-based conditional rendering (ARCHITECTURE.md), workflow phase visualization
**Avoids:** Unclear workflow states (Pitfall 6), breaking workflow patterns (Pitfall 4), over-design masking usability (Pitfall 1)
**Research flag:** **Consider phase-specific research** if workflow testing reveals edge cases — photographer feedback critical here

### Phase 6: Visual QA, Performance & i18n Validation (Week 8)
**Rationale:** Cross-browser/device testing, performance audit, multi-locale validation before launch — catch regressions, ensure quality bar.
**Delivers:** Cross-browser QA (Chrome/Firefox/Safari desktop + mobile), physical device testing (one-handed, touch targets), Lighthouse performance audit (>90 score), i18n visual regression testing (LT/EN/RU overflow checks), CLS monitoring, bundle size verification (<50KB CSS gzipped).
**Addresses:** Performance budgets, accessibility validation, i18n integrity
**Avoids:** Image performance degradation (Pitfall 8), i18n broken by redesign (Pitfall 10), mobile-first destroying desktop (Pitfall 2) — test on actual monitors
**Research flag:** No deeper research needed — QA execution phase

### Phase Ordering Rationale

- **Foundation-first (Phases 1-3):** Design tokens → primitives → layout BEFORE page redesigns prevents rework, ensures consistency
- **Simple-to-complex (Phases 4-5):** Refactor simple pages first (CollectionsList, Share, Delivery) validates primitives, builds confidence before tackling CollectionDetailsPage complexity
- **Workflow-critical last (Phase 5):** CollectionDetailsPage is core photographer experience with highest risk; delay until design system proven on simpler pages
- **QA always final (Phase 6):** Comprehensive testing after all implementations complete catches integration issues, prevents premature optimization

**Dependency chain:**
```
[Design Tokens] → [Primitives] → [Layout] → [Simple Pages] → [Workflow Pages] → [QA]
     Week 1          Week 2        Week 3      Weeks 4-5       Weeks 6-7      Week 8
```

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Design System):** Tailwind v3 `theme.extend` well-documented, template provided in ARCHITECTURE.md
- **Phase 2 (Primitives):** React component patterns established, Button/Card/Badge are common patterns
- **Phase 3 (Layout):** Mobile bottom navigation + desktop sidebar patterns documented in DESIGN-SYSTEM.md
- **Phase 4 (Simple Refactors):** Style-only changes, no new patterns

**Phase likely needing validation:**
- **Phase 5 (Workflow Enhancement):** Consider targeted user testing mid-phase if workflow changes (upload zone adaptation, conditional buttons, auto-navigation) show unexpected usage patterns. Photographer feedback critical for workflow UX — they've built muscle memory around current patterns (see Pitfall 4).

**Phase requiring monitoring:**
- **Phase 6 (QA):** Performance monitoring (Lighthouse, CLS) may reveal optimization needs; i18n testing may surface translation overflow issues requiring design adjustments (see Pitfall 10).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Design System** | **HIGH** | Based on official Tailwind docs, Linear/Stripe design analysis, Nielsen Norman Group research. Clear consensus on 8pt grid, touch target minimums (44px), responsive breakpoints. |
| **Workflow Patterns** | **MEDIUM** | Based on Pixieset/Pic-Time/ShootProof feature analysis (public docs, help articles), SaaS UX best practices. No direct user research with Photo Hub photographers yet — validate workflow changes (upload zone adaptation, auto-navigation) during Phase 5. |
| **Architecture** | **HIGH** | Based on current codebase analysis (verified CLAUDE.md, MainLayout.jsx, CollectionDetailsPage.jsx), official React 18 + Tailwind v3 docs, established refactor vs rewrite strategies. Build order tested with similar projects. |
| **Pitfalls** | **HIGH** | Based on Nielsen Norman Group research (mobile-first drawbacks, hidden navigation studies), SaaS redesign case studies, official accessibility guidelines (WCAG 2.1, Apple HIG, Material Design). Common pitfalls well-documented across industry sources. |

**Overall confidence:** **HIGH**

Research is well-grounded in official sources (Tailwind docs, React patterns, accessibility standards), industry-standard design systems (Linear, Stripe, Notion), and established photographer platform patterns (Pixieset, Pic-Time, ShootProof). Architecture recommendations verified against current codebase (CLAUDE.md, existing components). Pitfall warnings based on Nielsen Norman Group research and documented SaaS redesign failures.

### Gaps to Address During Planning/Execution

1. **Photographer workflow muscle memory:** Research identifies risk of breaking existing patterns (Pitfall 4) but doesn't have baseline task completion time measurements. **Action:** Measure current task times (upload → share, create collection, start selection) in Phase 1 before any changes, compare in Phase 6 QA.

2. **Russian translation overflow:** Research warns of i18n issues (Pitfall 10) with Russian text being 30% longer than English. **Action:** Design with 30% width buffer for buttons, test in all three locales (LT/EN/RU) during Phase 4-5 page refactors, visual regression testing in Phase 6.

3. **Desktop density preferences:** Research notes risk of mobile-first destroying desktop experience (Pitfall 2) but doesn't have user preference data for compact vs comfortable density. **Action:** Implement comfortable density as default, monitor analytics in Phase 6 for scroll depth, consider density controls as Phase 7 enhancement if needed.

4. **Workflow guidance effectiveness:** Research recommends next-step guidance text ("Next step: Upload photos") but effectiveness untested. **Action:** Implement in Phase 5, gather feedback during beta period, track support ticket volume before/after for "how do I..." questions.

5. **Performance on large collections:** Research warns of image performance degradation (Pitfall 8) and suggests virtual scrolling for 100+ photos, but Photo Hub's typical collection size unknown. **Action:** Audit production data in Phase 1 for P50/P90/P99 collection sizes, implement lazy loading in Phase 4-5, add virtual scrolling in Phase 6 if >10% of collections exceed 100 photos.

## Sources

### Design System (HIGH confidence)
- [Linear design: The SaaS design trend](https://blog.logrocket.com/ux-design/linear-design/) — Premium SaaS aesthetic patterns
- [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) — Design system evolution
- [Spacing, grids, and layouts](https://www.designsystems.com/space-grids-and-layouts/) — 8pt grid system
- [The 8pt Grid System Guide](https://www.rejuvenate.digital/news/designing-rhythm-power-8pt-grid-ui-design) — Spacing rationale
- [How To Use Shadows And Blur Effects In Modern UI Design](https://www.smashingmagazine.com/2017/02/shadows-blur-effects-user-interface-design/) — Elevation system
- [Glassmorphism With Tailwind CSS](https://flyonui.com/blog/glassmorphism-with-tailwind-css/) — Frosted glass patterns
- [Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/) — Nielsen Norman Group, 48x48px minimum

### Workflow Patterns (MEDIUM confidence)
- [Pixieset and Proofing](https://help.pixieset.com/hc/en-us/articles/115003797011-Pixieset-and-Proofing) — Industry workflow patterns
- [Pic-Time Client Selection](https://help.pic-time.com/en/articles/7831155-how-does-a-client-select-photos-via-the-selection-request-tool-desktop) — Selection workflow
- [ShootProof Client Proofing](https://www.shootproof.com/features/proofing/) — Proofing workflow
- [Progressive Disclosure Examples for SaaS](https://userpilot.com/blog/progressive-disclosure-examples/) — State-based UI patterns
- [Empty State UX Examples](https://www.eleken.co/blog-posts/empty-state-ux) — Empty state design patterns
- [Primary vs Secondary CTA Buttons](https://designcourse.com/blog/post/primary-vs-secondary-cta-buttons-in-ui-design) — Button hierarchy

### Architecture (HIGH confidence)
- [Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) — Why stay on v3 for now
- [Refactor vs Rewrite: Best Strategy to Modernize Software](https://imaginovation.net/blog/refactor-vs-rewrite-modernization-strategy-guide/) — When to refactor vs rewrite
- [React Conditional Rendering: Patterns for Beginners UI](https://blog.newtum.com/conditional-rendering-in-react-patterns/) — Object lookup pattern
- [Tailwind CSS Best Practices 2025-2026: Design Tokens](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) — theme.extend patterns
- [Mobile Navigation Design: 6 Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026) — Bottom tab bar vs hamburger

### Pitfalls (HIGH confidence)
- [The Negative Impact of Mobile-First Web Design on Desktop](https://www.nngroup.com/articles/content-dispersion/) — Nielsen Norman Group, content dispersion warning
- [Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/) — Nielsen Norman Group, 20% discoverability drop
- [SaaS Product Redesign: How to Avoid User Disruptions](https://whatfix.com/blog/saas-product-redesign/) — Breaking workflow patterns
- [The Dark Side of Minimalism: When 'Clean' UI Becomes Confusing](https://medium.com/@shrutitddinesh/the-dark-side-of-minimalism-when-clean-ui-becomes-confusing-d27ce1b0894d) — Over-design warning
- [13 UX Design Mistakes You Should Avoid in 2026](https://www.wearetenet.com/blog/ux-design-mistakes) — Common pitfalls
- [Top Tailwind CSS Common Mistakes and How to Fix Them](https://heliuswork.com/blogs/tailwind-css-common-mistakes/) — Class bloat, purge issues

### Secondary Sources (aggregated in research files)
- 100+ additional sources across DESIGN-SYSTEM.md (spacing, typography, shadows, color systems, component patterns, mobile patterns, desktop patterns, photography-specific patterns)
- 70+ additional sources across WORKFLOW-PATTERNS.md (photographer platform workflows, UI/UX design patterns, empty states, button hierarchy, gallery UI, contextual help)
- 15+ additional sources across ARCHITECTURE.md (Tailwind config, component strategy, responsive design, conditional rendering)
- 30+ additional sources across PITFALLS.md (UX design pitfalls, SaaS redesign, mobile-first, responsive design, React/Tailwind, over-design, navigation patterns)

---
*Research completed: 2026-02-14*
*Ready for roadmap: YES*
