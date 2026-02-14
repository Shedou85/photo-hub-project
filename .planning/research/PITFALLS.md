# Pitfalls Research: Photographer Platform UI/UX Redesign

**Domain:** Photographer platform redesign (functional → premium UI/UX)
**Researched:** 2026-02-14
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Over-Design Masking Usability Loss

**What goes wrong:**
Premium aesthetic applied without functional verification. UI becomes beautiful but slower to use. Excessive animations transform the app into a sluggish spectacle. Minimalist design pushed to extremes where the interface becomes too austere and users become bewildered looking for actions that are not self-evident.

**Why it happens:**
Design teams prioritize visual polish over workflow validation. "Clean" is conflated with "good." No measurement of task completion time before/after redesign. Designers test with fresh eyes, not returning users who built muscle memory.

**How to avoid:**
- Measure baseline task completion times BEFORE redesign
- Track key user flows: upload → share → selection → delivery
- Set performance budgets for animations (page transitions < 300ms, micro-interactions < 150ms)
- Test with existing users, not just new ones
- Compare clicks-to-complete before/after for critical paths
- Reject any redesign that increases steps for core workflows

**Warning signs:**
- Users say "looks great but where did X go?"
- Support tickets increase asking "how do I...?"
- Task completion time increases even 10%
- Bounce rate increases on redesigned pages
- Users prefer old version when A/B tested

**Phase to address:**
Phase 1 (Design System Setup) — establish performance budgets and workflow benchmarks
Phase 3/4 (Component Redesign) — verify each component against baseline metrics
Phase 5 (Testing & Polish) — full workflow validation with existing users

---

### Pitfall 2: Mobile-First Destroying Desktop Experience

**What goes wrong:**
Content dispersion on desktop. Layouts designed for 375px mobile screens, when rendered on 1440px desktop monitors, feel hollow with content dispersed across long scrolling pages. Users scroll through three screens of whitespace to find information that once fit in a single viewport. Excessive whitespace wastes screen real estate for photographers managing hundreds of images.

**Why it happens:**
"Mobile-first" interpreted as "mobile-only." Responsive breakpoints use the same layout across all sizes, just stretched. No desktop-specific layout strategy. Team tests primarily on mobile, desktop becomes an afterthought.

**How to avoid:**
- Design THREE distinct layouts: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Desktop should use grid layouts (2-4 columns) not single-column stretched
- Implement density controls: photographer dashboard uses compact density, client galleries use comfortable density
- Test on actual desktop monitors (1920x1080, 2560x1440), not just browser resizing
- Use CSS Grid for desktop, Flexbox for mobile (different strategies)
- Set max-width constraints for content areas on desktop (e.g., max-w-7xl)

**Warning signs:**
- Desktop screenshots show large empty margins
- Single-column layouts on screens > 1280px wide
- Photo grids showing 2 images across when 6 would fit
- Vertical scrolling exceeds 3x viewport height for simple tasks
- Desktop users complaining about "wasted space"

**Phase to address:**
Phase 1 (Design System Setup) — define density scales and responsive layout strategies
Phase 2 (Mobile Views) vs Phase 3 (Desktop Views) — separate phases for distinct strategies
Phase 5 (Testing & Polish) — cross-device validation

---

### Pitfall 3: Hidden Navigation on Desktop

**What goes wrong:**
Hamburger menu applied to desktop layout, hiding primary navigation. Hidden navigation shows more than 20% drop in discoverability compared with visible navigation. Desktop users engage 50% less with content hidden behind hamburger icons. Photographers lose quick access to Collections, Upload, Clients while reviewing photos.

**Why it happens:**
Desire for "clean" aesthetic. Mobile pattern copied to desktop without adaptation. Misunderstanding of when hamburger menus are appropriate (mobile: acceptable, desktop: anti-pattern).

**How to avoid:**
- Keep main navigation VISIBLE on desktop (sidebar or top nav)
- Reserve hamburger menus ONLY for mobile (< 768px breakpoints)
- Desktop sidebar should show: Collections, Upload, Clients, Profile, Settings
- Use icons + labels on desktop, icons-only on mobile
- Test navigation discoverability: users should find all sections without instruction

**Warning signs:**
- Desktop mockups show hamburger icon as primary navigation
- Navigation hidden by default on screens > 1024px
- User testing shows "I didn't know that section existed"
- Analytics show low engagement with secondary pages
- Direct URL navigation increases (users bookmark instead of navigating)

**Phase to address:**
Phase 1 (Design System Setup) — define responsive navigation patterns
Phase 3 (Desktop Views) — implement persistent visible navigation
Phase 5 (Testing & Polish) — navigation discoverability testing

---

### Pitfall 4: Breaking Existing Workflow Patterns

**What goes wrong:**
Redesign changes established interaction patterns. Users built muscle memory: "click top-right to share collection." New design moves action to bottom modal. Support tickets explode with "how do I share?" even though feature still exists. Photographers waste time relearning instead of working.

**Why it happens:**
Designers unfamiliar with current app patterns. No user research on existing workflows. Changes made for aesthetic reasons without considering habit disruption. No migration guide or onboarding for redesign.

**How to avoid:**
- Document ALL existing interaction patterns before redesign
- User research: observe current users completing tasks, note every click
- Preserve primary action locations unless there's a compelling UX reason
- For necessary changes, provide in-app migration tooltips
- Gradual rollout with opt-in beta period (power users test first)
- Create "What's New" guide highlighting changed patterns

**Warning signs:**
- Support ticket volume increases 20%+ post-launch
- Common questions: "Where did X go?" or "How do I do Y now?"
- User testing shows confusion on familiar tasks
- Session time increases not from engagement but from searching
- Users request "classic mode" or "bring back old version"

**Phase to address:**
Phase 0 (Pre-Research) — document existing patterns and user flows
Phase 5 (Testing & Polish) — migration testing with beta users
Phase 6 (Launch) — in-app onboarding for changed patterns

---

### Pitfall 5: Touch Targets Too Small on Mobile

**What goes wrong:**
Desktop-sized buttons (32x32px) used on mobile. Photographers with cold fingers at outdoor shoots can't tap reliably. Selection checkboxes too small to tap while holding phone. Frustration leads to abandoning mobile workflow, defeating "mobile-first" goal.

**Why it happens:**
Design mocks created at desktop scale, then scaled down. No physical device testing. Designers with steady hands don't notice issue. Testing done seated at desk, not in real photographer conditions (outdoor, moving, one-handed).

**How to avoid:**
- Minimum touch target: 44x44px (Apple) or 48x48dp (Android)
- Critical actions (Select Photo, Share Collection): 56x56px minimum
- Spacing between interactive elements: minimum 8px, prefer 16px
- Test on actual devices held ONE-HANDED
- Test in realistic conditions: outdoors, wearing gloves, walking
- Use thumb-zone heatmaps: primary actions in lower third of screen

**Warning signs:**
- Touch targets smaller than 44px in mobile designs
- Interactive elements touching (0px gap)
- Primary actions in top corners (hardest to reach one-handed)
- User testing shows multiple taps to hit target
- Analytics show high "mis-tap" rate (click wrong element)

**Phase to address:**
Phase 1 (Design System Setup) — define touch target minimums in design tokens
Phase 2 (Mobile Views) — apply and verify touch target sizes
Phase 5 (Testing & Polish) — physical device testing in realistic conditions

---

### Pitfall 6: Unclear Workflow State Transitions

**What goes wrong:**
Collection status changes (DRAFT → SELECTING → REVIEWING → DELIVERED) but UI doesn't clearly guide next steps. Client lands on SELECTING page, sees photos, doesn't know they should click hearts to select. No progressive disclosure or contextual help. Users miss critical workflow steps.

**Why it happens:**
Design focuses on individual screens, not state transitions. No consideration of first-time user mental model. Assumption that workflow is "obvious" (designer's curse of knowledge). Missing contextual help and empty states.

**How to avoid:**
- Design state-specific empty states and first-use tooltips
- DRAFT: "Upload photos to start" with upload CTA
- SELECTING (0 selected): "Click hearts to select your favorites" overlay
- REVIEWING (no feedback): "Add comments to selected photos" prompt
- Progressive disclosure: show advanced features after basics mastered
- Contextual help triggered by behavior (30s on page, no action → tooltip)
- Use micro-copy to guide: button labels as imperatives ("Select Your Favorites" not just "Next")

**Warning signs:**
- User testing shows confusion about "what do I do now?"
- Analytics show users landing but not taking expected action
- High exit rate at transition points
- Support tickets: "I don't know what to do" or "Is it working?"
- Low conversion through workflow funnel (upload → select → deliver)

**Phase to address:**
Phase 1 (Design System Setup) — define empty states and contextual help patterns
Phase 4 (Component Redesign) — implement state-specific guidance
Phase 5 (Testing & Polish) — workflow completion testing with new users

---

### Pitfall 7: Responsive Breakpoint Layout Shift Bugs

**What goes wrong:**
Layout shifts unexpectedly at breakpoints. Desktop sidebar jumps from left to top at 1200px (arbitrary threshold). Image grid switches from 4 columns to 1 column at 1024px with no intermediate steps. Content "pops" during resize. CLS (Cumulative Layout Shift) spikes.

**Why it happens:**
Tailwind's default breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px) don't match design needs. Developers test at exact breakpoints (768px, 1024px) but not in-between. Layout changes too drastically at single breakpoint instead of gradually. No CLS monitoring.

**How to avoid:**
- Define custom breakpoints matching actual design needs (not just defaults)
- Test at BETWEEN breakpoints: 800px, 1100px, 1400px (common browser sizes)
- Gradual changes: 1 column → 2 columns → 3 columns → 4 columns (not 1 → 4)
- Use CSS Grid auto-fit/auto-fill for fluid grids: `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))`
- Monitor CLS in production (Google PageSpeed Insights, Core Web Vitals)
- Reserve space for lazy-loaded images (explicit width/height)

**Warning signs:**
- CLS score > 0.1 in PageSpeed Insights
- Content visibly jumps during load or resize
- Grid layout changes drastically at single breakpoint
- Sidebar disappears/reappears during resize
- User complaints about "jumpy" or "glitchy" UI

**Phase to address:**
Phase 1 (Design System Setup) — define custom breakpoints and responsive grid system
Phase 2/3 (View Implementation) — implement and test responsive layouts
Phase 5 (Testing & Polish) — CLS monitoring and optimization

---

### Pitfall 8: Image-Heavy UI Performance Degradation

**What goes wrong:**
Premium redesign adds hero images, background gradients, large gallery thumbnails. Page load time increases from 1.2s to 4.5s. Mobile users on 3G abandon before photos load. Photographer with 500-image collection experiences browser lag. Lighthouse score drops from 95 to 62.

**Why it happens:**
Design prioritizes aesthetics without performance budget. No image optimization strategy. Loading all images upfront instead of lazy loading. Using uncompressed PNGs instead of optimized WebP. No performance testing on slow networks.

**How to avoid:**
- Set performance budget: Initial load < 2s, Largest Contentful Paint (LCP) < 2.5s
- Optimize images: WebP format, responsive images (srcset), compress to 80% quality
- Lazy load images below fold: use Intersection Observer or native `loading="lazy"`
- Virtual scrolling for large galleries (100+ images): only render visible images
- Test on throttled networks: Chrome DevTools → Fast 3G simulation
- Monitor bundle size: CSS should stay under 50KB gzipped
- Use Vite code splitting for route-based lazy loading

**Warning signs:**
- Lighthouse Performance score < 80
- Bundle size > 500KB (uncompressed)
- Initial page load > 3s on cable connection
- Mobile LCP > 4s
- Browser lag when scrolling large galleries
- High bounce rate on slow connections

**Phase to address:**
Phase 1 (Design System Setup) — establish performance budgets and image optimization standards
Phase 2/3 (View Implementation) — implement lazy loading and optimization
Phase 5 (Testing & Polish) — performance audit and optimization

---

### Pitfall 9: Tailwind Class Name Bloat

**What goes wrong:**
Premium design requires complex responsive styles. Components accumulate 20+ Tailwind classes. Developer changes `text-sm` to `text-base` but misses 3 other instances. Inconsistent spacing (some buttons use `px-4 py-2`, others `px-6 py-3`). Readability suffers. Maintenance becomes nightmare.

**Why it happens:**
No component abstraction strategy. Copy-pasting Tailwind classes between components. No design tokens for common patterns. Conditional classes built with string concatenation (`'bg-' + color + '-500'`) breaking purge optimization.

**How to avoid:**
- Extract reusable components for common patterns (Button, Card, Input)
- Use design tokens in Tailwind config for brand colors, spacing scales
- Create CVA (class-variance-authority) variants for complex components
- Use `cn()` helper (clsx + tailwind-merge) for conditional classes
- Lint rule: warn if className exceeds 10 classes (extract to component)
- Document component patterns in Storybook or design system docs

**Warning signs:**
- Components with 15+ Tailwind classes
- Duplicate class combinations across files
- String concatenation for dynamic classes
- Inconsistent spacing/sizing across similar elements
- Developer complaints: "hard to find where style is applied"

**Phase to address:**
Phase 1 (Design System Setup) — create reusable component library and design tokens
Phase 2/3 (View Implementation) — use components, not raw Tailwind classes
Phase 5 (Testing & Polish) — refactor class bloat into components

---

### Pitfall 10: i18n Broken by Redesign

**What goes wrong:**
New premium UI adds features but hardcodes English strings. Developer forgets to add translation keys to all three locale files (EN/LT/RU). Russian translations overflow buttons (Russian text 30% longer than English). RTL languages not considered. App crashes when switching to Lithuanian.

**Why it happens:**
i18n treated as afterthought, not design requirement. Testing only in English. No i18n checklist in PR reviews. No visual regression testing across locales. Designers create mockups with English text fitting perfectly, but other languages don't.

**How to avoid:**
- Require `t('namespace.key')` in all user-facing strings (ESLint rule: no string literals in JSX)
- PR checklist: "Added keys to all three locale files? (en.json, lt.json, ru.json)"
- Design with longest text (usually German/Russian): add 30% width buffer for buttons
- Test EVERY new screen in all three languages before merge
- Use placeholders in designs: `{{translations.action.submit}}` not "Submit"
- Set up visual regression testing (Percy, Chromatic) with locale matrix

**Warning signs:**
- English strings found in JSX (`<button>Submit</button>`)
- Translation files out of sync (keys in en.json missing from lt.json)
- Button text overflow in non-English locales
- Console errors: "Missing translation key"
- User complaints in specific language (LT/RU users report bugs EN users don't)

**Phase to address:**
Phase 1 (Design System Setup) — i18n requirements in component guidelines
Phase 2/3 (View Implementation) — i18n validation in every PR
Phase 5 (Testing & Polish) — multi-locale visual regression testing

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy-paste Tailwind classes instead of extracting components | Faster initial development (no abstraction overhead) | Inconsistent styles, hard to update globally, class bloat, poor maintainability | Never — always extract after 3rd duplicate |
| Inline styles for complex responsive behavior | Easier than learning Tailwind responsive syntax | Breaks Tailwind purge optimization, inconsistent with design system, hard to maintain | Only for dynamic JS values (sidebar position, drag-and-drop) |
| Skip performance budget on "small" redesign | Ship faster, avoid optimization work | Compound performance degradation, user experience suffers, hard to fix retroactively | Never — set budget upfront |
| Use default Tailwind breakpoints | No config needed, start faster | Layout shifts at wrong screen sizes, awkward in-between states | Acceptable for MVPs, must customize for production |
| Hardcode English strings "temporarily" | Faster prototyping, no i18n complexity | Breaks multi-language support, hard to find all instances later | Acceptable for throwaway prototypes, never in main branch |
| Skip accessibility testing on redesign | Ship faster, focus on visual polish | Fails WCAG compliance, lawsuits, excludes users, poor SEO | Never — accessibility is not optional |

## Integration Gotchas

Common mistakes when connecting to existing architecture.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React Router v7 | Using old v6 navigation patterns (`useNavigate()` without error boundaries) | Use v7 loader/action patterns, implement error boundaries for all routes |
| Tailwind v3 arbitrary values | Using arbitrary values everywhere (`text-[13px]`) instead of design tokens | Define custom values in tailwind.config.js, use tokens for consistency |
| react-i18next | Calling `t()` outside components or not wrapping with `<Suspense>` | Always use within components, wrap app in Suspense, use `useTranslation()` hook |
| AuthContext | Checking `isAuthenticated()` as function instead of boolean | Use `isAuthenticated` as boolean (not a function) per CLAUDE.md |
| Vite 5 | Importing CSS files in wrong order, causing Tailwind to not apply | Import CSS in main.jsx before any components, ensure PostCSS config correct |
| PHP backend CORS | Forgetting `credentials: "include"` in fetch calls | Always include credentials for cross-domain session cookies |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all collection photos upfront | 10-photo collections load fine (200ms), 500-photo collections freeze browser (15s+) | Implement virtual scrolling (react-window), lazy load images, pagination | > 100 photos per collection |
| No image optimization | Works fine on fast WiFi, mobile users on 3G abandon before images load | Optimize to WebP, use srcset for responsive images, lazy load below fold | > 50KB per image, slow networks |
| CSS bundle includes all Tailwind classes | Development bundle works (300KB), production builds slowly, users download unused CSS | Configure Tailwind purge correctly, split CSS by route, tree-shake unused classes | Production builds > 100KB CSS |
| Re-rendering entire photo grid on selection state change | Works fine for 20 photos, lags with 200 photos | Use React.memo on PhotoCard, optimize context to prevent unnecessary re-renders | > 100 photos in grid |
| No debouncing on search/filter | Works fine with fast typers, some users trigger 10 requests per second | Debounce search input (300ms), cancel previous requests | Any user typing quickly |
| Loading all user collections in sidebar | Works for users with 5 collections, freezes for users with 100+ | Paginate collections, infinite scroll, or show "Recent 10" with "View All" link | > 50 collections per user |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Client-side collection visibility check only | Malicious user views other photographers' private collections by changing URL | Always verify ownership in backend PHP (check `$_SESSION['user_id']` matches collection owner) |
| Exposing photographer client email addresses in API responses | Privacy violation, GDPR non-compliance, photographer loses client trust | Filter sensitive fields in API responses, only return necessary data |
| No rate limiting on photo upload endpoint | Malicious user uploads 10,000 photos, fills disk space, crashes server | Implement rate limiting (PHP: 10 uploads per minute per user), file size validation |
| Session cookies not SameSite=None for cross-domain | CSRF vulnerability, session hijacking | Maintain SameSite=None, Secure, HttpOnly flags on session cookies (already correct per CLAUDE.md) |
| Storing AWS/storage credentials in frontend env files | Credentials leak in git history, anyone can access photo storage | Use backend proxy for storage operations, never expose credentials to frontend |
| No CSRF protection on state-changing operations | Attacker tricks photographer into deleting collections | Verify session token, use POST/PUT/DELETE appropriately, validate origin |

## UX Pitfalls

Common user experience mistakes in photographer platforms.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading states during photo upload | Photographer clicks "Upload," sees nothing, clicks again, duplicate upload | Show progress bar, upload count, disable button during upload, success confirmation |
| Ambiguous collection status labels | "Selecting" vs "Reviewing" — client doesn't know what to do | Use explicit micro-copy: "Select Your Favorites" (active call-to-action) not just status labels |
| No empty states in collections | Client sees blank screen, thinks it's broken | Design state-specific empty states: "No photos yet" vs "No selections yet" vs "All delivered" |
| Forcing photographer to click through wizard every time | Every upload requires 5 steps, frustrating for repeat workflows | Progressive disclosure: wizard for first time, one-click upload for subsequent |
| Selection UI not obvious on mobile | Heart icon too small, client doesn't know it's interactive | Larger touch targets (56x56px), show interaction hint on first visit, visual feedback on tap |
| No confirmation before destructive actions | Photographer accidentally deletes collection with 500 photos | Modal confirmation for delete/archive, option to undo, trash/archive instead of hard delete |
| Unclear photo delivery status | Client asks "did you send the photos?" — photographer unsure | Explicit status: "Delivered on Feb 14, 2026 at 3:42 PM" + delivery notification emails |
| Auto-playing video/animations on every page load | Annoying, slows down workflow, drains battery on mobile | Animations only on first visit, user-controlled, respect prefers-reduced-motion |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Responsive layouts:** Tested at in-between breakpoints (800px, 1100px, 1400px), not just standard breakpoints
- [ ] **Touch targets:** Verified on actual mobile devices held one-handed, not just desktop browser resize
- [ ] **i18n:** All three locale files updated (en.json, lt.json, ru.json), tested visual overflow in Russian
- [ ] **Loading states:** Every async operation shows loading UI (uploads, API calls, navigation)
- [ ] **Empty states:** Every list/grid has designed empty state (collections, photos, selections)
- [ ] **Error states:** Every API call has error handling UI (network failure, validation errors, 500 errors)
- [ ] **Accessibility:** Keyboard navigation works, screen reader tested, sufficient color contrast (WCAG AA)
- [ ] **Performance budget:** Lighthouse score > 90, LCP < 2.5s, CLS < 0.1, bundle size within limits
- [ ] **Cross-browser:** Tested in Chrome, Firefox, Safari, mobile Safari, mobile Chrome
- [ ] **Workflow completion:** Full user journey tested end-to-end (upload → share → select → deliver) in all three languages

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Over-designed UI causing user confusion | HIGH (requires redesign iteration) | 1. Measure task completion times to quantify problem 2. User interviews to identify specific confusion points 3. Simplify progressively (remove animations, restore familiar patterns) 4. A/B test simplified version vs current 5. Gradual rollout of fixes |
| Mobile-first destroying desktop experience | MEDIUM (layout refactor) | 1. Add desktop-specific layout variants 2. Implement CSS Grid for desktop (keep Flexbox for mobile) 3. Add density controls 4. Test on actual desktop monitors 5. Gradual rollout (power users first) |
| Hidden navigation reducing discoverability | LOW (show navigation) | 1. Change desktop nav from hamburger to persistent sidebar 2. Update responsive breakpoint logic (hide < 768px, show >= 768px) 3. Add transition announcement in app 4. Monitor analytics for discoverability improvement |
| Breaking existing workflow patterns | HIGH (requires migration plan) | 1. Provide "Classic Mode" toggle during transition 2. In-app tooltips highlighting changed patterns 3. Email announcement with video guide 4. Extended beta period for power users 5. Revert if adoption doesn't improve within 30 days |
| Touch targets too small | LOW (CSS update) | 1. Audit all interactive elements for size 2. Update design tokens (minimum 44x44px) 3. Test on physical devices 4. Deploy fix immediately (no migration needed) |
| Unclear workflow states | MEDIUM (add guidance) | 1. Design contextual help tooltips 2. Add empty states for each status 3. Improve micro-copy on CTAs 4. Add optional onboarding tour 5. Monitor support tickets for improvement |
| Responsive breakpoint bugs | LOW (CSS fix) | 1. Identify problematic breakpoints via user reports 2. Test at in-between sizes 3. Adjust custom breakpoints or add intermediate steps 4. Use fluid grids instead of fixed breakpoints 5. Monitor CLS in production |
| Image performance degradation | MEDIUM (optimization pipeline) | 1. Audit images for size/format 2. Set up WebP conversion pipeline 3. Implement lazy loading 4. Add virtual scrolling for large galleries 5. Monitor Lighthouse score for improvement |
| Tailwind class bloat | MEDIUM (refactor to components) | 1. Identify most duplicated class combinations 2. Extract to reusable components 3. Create component library (Button, Card, Input) 4. Update existing code to use components 5. Lint rule to prevent future bloat |
| i18n broken by redesign | MEDIUM (translation backfill) | 1. Audit codebase for hardcoded strings 2. Extract to translation keys 3. Add to all three locale files 4. Visual regression test in all languages 5. Add ESLint rule to prevent future hardcoding |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Over-design masking usability | Phase 1 (Design System Setup), Phase 5 (Testing) | Measure task completion times before/after, user testing sessions |
| Mobile-first destroying desktop | Phase 1 (Design System), Phase 3 (Desktop Views) | Test on actual desktop monitors (1920x1080, 2560x1440) |
| Hidden navigation on desktop | Phase 1 (Design System), Phase 3 (Desktop Views) | Navigation discoverability testing (can users find all sections?) |
| Breaking workflow patterns | Phase 0 (Pre-Research), Phase 5 (Testing) | Beta testing with existing power users, support ticket monitoring |
| Touch targets too small | Phase 1 (Design System), Phase 2 (Mobile Views) | Physical device testing (one-handed, with gloves if outdoor photography) |
| Unclear workflow states | Phase 1 (Design System), Phase 4 (Components) | New user testing (can they complete workflow without help?) |
| Responsive breakpoint bugs | Phase 1 (Design System), Phase 5 (Testing) | Test at in-between sizes, monitor CLS in production |
| Image performance degradation | Phase 1 (Design System), Phase 5 (Testing) | Lighthouse Performance score > 90, LCP < 2.5s, bundle size check |
| Tailwind class bloat | Phase 1 (Design System), Phase 2/3 (Implementation) | Code review: warn if className > 10 classes, extract to component |
| i18n broken by redesign | Phase 1 (Design System), Phase 2/3 (Implementation) | PR checklist: keys added to all locale files, visual test in all languages |

## Sources

**General UX Design Pitfalls:**
- [13 UX Design Mistakes You Should Avoid in 2026](https://www.wearetenet.com/blog/ux-design-mistakes)
- [11 Common UI/UX Design Mistakes (and How to Fix Them)](https://www.ideapeel.com/blogs/ui-ux-design-mistakes-how-to-fix-them)

**SaaS Redesign & User Disruption:**
- [UI Redesign in SaaS: Business Value, Costs, and Execution Plan [2026]](https://www.thefrontendcompany.com/posts/ui-redesign)
- [SaaS Product Redesign: How to Avoid User Disruptions](https://whatfix.com/blog/saas-product-redesign/)
- [11 Best Practices for SaaS Product Redesign Projects](https://userguiding.com/blog/best-practices-saas-product-redesign)

**Mobile-First & Responsive Design:**
- [The Negative Impact of Mobile-First Web Design on Desktop](https://www.nngroup.com/articles/content-dispersion/)
- [Mobile First Design: How to Create the Best UX Strategy in 2026](https://wpbrigade.com/mobile-first-design-strategy/)
- [Responsive Web Design in 2026: Why Mobile-First UX Drives SEO & Conversions](https://www.alfdesigngroup.com/post/responsive-web-design-why-mobile-first-ux)

**Photographer Platform Workflows:**
- [Finding the Best Client Gallery for Photographers in 2026](https://imagen-ai.com/valuable-tips/best-client-gallery-for-photographers/)
- [Best Client Gallery Platforms for Photographers (2026)](https://turtlepic.com/blog/best-client-gallery-platforms-for-photographers/)
- [How Technology Saves Time and Reduces Errors - Perfect Selection Workflow](https://www.moodcase.io/blog/perfect-selection-workflow-photographers)

**React & Tailwind CSS:**
- [Top Tailwind CSS Common Mistakes and How to Fix Them](https://heliuswork.com/blogs/tailwind-css-common-mistakes/)
- [Frontend Handbook | React / Tailwind / Best practices](https://infinum.com/handbook/frontend/react/tailwind/best-practices)
- [Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide)

**Over-Design & Minimalism:**
- [The Dark Side of Minimalism: When 'Clean' UI Becomes Confusing](https://medium.com/@shrutitddinesh/the-dark-side-of-minimalism-when-clean-ui-becomes-confusing-d27ce1b0894d)
- [7 UI Pitfalls Mobile App Developers Should Avoid in 2026](https://www.webpronews.com/7-ui-pitfalls-mobile-app-developers-should-avoid-in-2026/)
- [Why Minimalist UI Design in 2026 Is Built for Speed, Clarity & Conversions](https://www.anctech.in/blog/explore-how-minimalist-ui-design-in-2026-focuses-on-performance-accessibility-and-content-clarity-learn-how-clean-interfaces-subtle-interactions-and-data-driven-layouts-create-better-user-experie/)

**Workflow Guidance & State Management:**
- [Product UI/UX for Complex SaaS Platforms](https://uitop.design/blog/product-design-for-complex-saas-platforms/)
- [10 AI-Driven UX Patterns Transforming SaaS in 2026](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026)
- [SaaS UX Design: The Ultimate Guide](https://www.userflow.com/blog/saas-ux-design-the-ultimate-guide-to-creating-exceptional-user-experiences)

**Touch Targets & Mobile Interaction:**
- [Touch Targets on Touchscreens - Nielsen Norman Group](https://www.nngroup.com/articles/touch-target-size/)
- [Mobile Accessibility Target Sizes Cheatsheet](https://smart-interface-design-patterns.com/articles/accessible-tap-target-sizes/)
- [How to Design for Touch Interactions in Mobile-First Design](https://blog.pixelfreestudio.com/how-to-design-for-touch-interactions-in-mobile-first-design/)

**Desktop Whitespace & Screen Real Estate:**
- [Designing Better Applications with White Space](https://www.truematter.com/ideas/post/designing-better-applications-with-white-space)
- [Utilize Available Screen Real Estate - Nielsen Norman Group](https://www.nngroup.com/articles/utilize-available-screen-space/)
- [It's whitespace. There's wayyyy too much god damn whitespace in modern UIs - Hacker News](https://news.ycombinator.com/item?id=36683253)

**Responsive Breakpoints:**
- [Responsive design - Core concepts - Tailwind CSS](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS Grid Template Columns: Practical Patterns for 2026 Layouts](https://thelinuxcode.com/tailwind-css-grid-template-columns-practical-patterns-for-2026-layouts/)

**Navigation Patterns:**
- [Hamburger Menus and Hidden Navigation Hurt UX Metrics - Nielsen Norman Group](https://www.nngroup.com/articles/hamburger-menus/)
- [Avoid the Hamburger Menu for Desktop Layouts - Adrian Roselli](https://adrianroselli.com/2016/01/avoid-the-hamburger-menu-for-desktop-layouts.html)
- [Should You Avoid Hamburger Menus on Desktop Websites?](https://www.flowmatters.com/blog/should-you-avoid-hamburger-menus-on-desktop-websites/)

---
*Pitfalls research for: Photo Hub photographer platform UI/UX redesign*
*Researched: 2026-02-14*
*Confidence: HIGH (verified with official sources, Nielsen Norman Group research, 2026 industry best practices)*
