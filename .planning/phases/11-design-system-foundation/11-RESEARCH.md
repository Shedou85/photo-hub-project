# Phase 11: Design System Foundation - Research

**Researched:** 2026-02-14
**Domain:** Tailwind CSS v3 design system configuration
**Confidence:** HIGH

## Summary

This phase establishes the foundational design tokens and responsive infrastructure for Photo Hub's v3.0 UI redesign. The project already uses Tailwind CSS v3.4.19 with a minimal config, and extensive UI/UX research has been completed (`.planning/research/DESIGN-SYSTEM.md`). The challenge is migrating from hardcoded arbitrary values (like `rounded-[10px]`, `bg-[#1a1a2e]`) scattered across 9+ component files to a centralized token system in `tailwind.config.js` using `theme.extend`.

The research confirms that Tailwind v3's `theme.extend` pattern is the industry-standard approach for design tokens, and the existing design research (8pt grid, Major Third typography, Linear-style shadows, neutral-first colors) aligns perfectly with Tailwind's built-in scales. The primary work is **configuration + refactoring**, not research—the design decisions are already made.

**Primary recommendation:** Configure `tailwind.config.js` with design tokens in `theme.extend`, create a shared `constants.js` for responsive breakpoints, then systematically refactor components to eliminate hardcoded values. Use linting/verification to prevent regression.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.19 | Utility-first CSS framework | Already installed; v3 is stable and widely-used in 2026 despite v4 release |
| PostCSS | 8.5.6 | CSS processor for Tailwind | Required by Tailwind v3; already configured |
| Autoprefixer | 10.4.24 | Vendor prefix automation | Standard PostCSS plugin; already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cssnano | Latest | Production CSS minification | Production builds (optional; Vite handles minification) |
| ESLint plugin | N/A | Prevent hardcoded values | Post-refactor enforcement (custom rule or manual review) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v3 | Tailwind v4 | v4 uses CSS-first `@theme` config (breaking change); project decision is to defer v4 migration to separate milestone post-v3.0 |
| `theme.extend` | Full `theme` override | Override removes Tailwind defaults; `extend` preserves defaults while adding custom tokens (safer) |
| Tailwind config | CSS custom properties | CSS vars are runtime-flexible but lose Tailwind IntelliSense and tree-shaking benefits |

**Installation:**
```bash
# Already installed - no new dependencies needed
cd frontend
npm list tailwindcss postcss autoprefixer
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── constants/
│   └── breakpoints.js      # Shared responsive breakpoints (MOBILE: 640px, TABLET: 768px, DESKTOP: 1024px)
├── tailwind.config.js      # Design tokens in theme.extend (spacing, colors, shadows, typography, borderRadius)
└── components/             # Refactored to use tokens (no hardcoded values)
```

### Pattern 1: Tailwind Config Design Tokens

**What:** Centralize all design values in `tailwind.config.js` using `theme.extend` to preserve Tailwind defaults while adding custom tokens.

**When to use:** For all repeatable design values (colors, spacing, shadows, border-radius, typography).

**Example:**
```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Spacing: 8pt grid (Tailwind default already follows 8pt, but explicit for clarity)
      spacing: {
        '0.5': '4px',   // gap-0.5, p-0.5
        '18': '72px',   // Custom value beyond default scale
        '22': '88px',
      },
      // Border radius: Softer corners for premium feel
      borderRadius: {
        'sm': '8px',
        'DEFAULT': '10px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      // Shadows: Linear-style elevation with subtle opacity
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'DEFAULT': '0 2px 4px rgba(0,0,0,0.06)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 8px 24px rgba(0,0,0,0.12)',
        'xl': '0 16px 48px rgba(0,0,0,0.16)',
      },
      // Colors: Neutral-first palette (Tailwind defaults are good, add custom accents if needed)
      colors: {
        'brand-blue': '#3B82F6',     // blue-500 equivalent
        'brand-indigo': '#6366F1',   // indigo-500 equivalent
        'surface': '#F5F5F5',        // gray-100 equivalent for elevated backgrounds
      },
      // Typography: Major Third scale (1.250 ratio) - Tailwind defaults align, but can customize
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '22px',
        '2xl': '28px',
        '3xl': '36px',
        '4xl': '48px',
      },
    },
  },
  plugins: [],
};
```

**Source:** [Tailwind v3 Adding Custom Styles](https://v3.tailwindcss.com/docs/adding-custom-styles), [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

### Pattern 2: Shared Breakpoint Constants

**What:** Export responsive breakpoints as JavaScript constants for use in JS logic (window resize handlers, media query matching) and import into Tailwind config.

**When to use:** When JavaScript needs to react to same breakpoints as CSS (e.g., sidebar toggle logic in `MainLayout.jsx`).

**Example:**
```javascript
// src/constants/breakpoints.js
export const BREAKPOINTS = {
  MOBILE: 640,   // px - Tailwind 'sm' breakpoint
  TABLET: 768,   // px - Tailwind 'md' breakpoint
  DESKTOP: 1024, // px - Tailwind 'lg' breakpoint
};

// tailwind.config.js
import { BREAKPOINTS } from './src/constants/breakpoints.js';

export default {
  theme: {
    extend: {
      screens: {
        'sm': `${BREAKPOINTS.MOBILE}px`,
        'md': `${BREAKPOINTS.TABLET}px`,
        'lg': `${BREAKPOINTS.DESKTOP}px`,
      },
    },
  },
};

// MainLayout.jsx
import { BREAKPOINTS } from '../constants/breakpoints';

const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINTS.TABLET);
```

**Source:** [How to Share Constants in TypeScript Project](https://medium.com/codex/how-to-share-constants-in-typescript-project-8f76a2e40352), [How To Organize Constants in JavaScript](https://semaphore.io/blog/constants-layer-javascript)

### Pattern 3: Refactoring Hardcoded Values to Tokens

**What:** Systematically replace arbitrary values with token references or standard Tailwind classes.

**When to use:** After configuring tokens in `tailwind.config.js`, refactor all components.

**Refactoring decision tree:**
1. **Is the value used 3+ times across files?** → Add to `theme.extend` as named token
2. **Is it a standard Tailwind value?** → Use built-in class (e.g., `rounded-lg` instead of `rounded-[16px]`)
3. **Is it a one-off pixel-perfect adjustment?** → Keep arbitrary value with comment explaining context

**Example refactoring:**
```jsx
// BEFORE (hardcoded arbitrary values)
<div className="rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.06)] bg-white p-6">
  {/* ... */}
</div>

// AFTER (using tokens)
<div className="rounded-DEFAULT shadow bg-white p-6">
  {/* rounded-DEFAULT uses theme.extend.borderRadius.DEFAULT: '10px' */}
  {/* shadow uses theme.extend.boxShadow.DEFAULT: '0 2px 4px rgba(0,0,0,0.06)' */}
</div>
```

**Source:** [Migrating to Design Tokens](https://feature-sliced.design/blog/design-tokens-architecture), [Breaking Free from Hardcoded Values](https://www.in-com.com/blog/breaking-free-from-hardcoded-values-smarter-strategies-for-modern-software/)

### Anti-Patterns to Avoid

- **Overriding entire `theme` object**: Use `theme.extend` to preserve Tailwind defaults; full override removes useful built-in values
- **Duplicating Tailwind defaults in config**: Don't redefine values that already exist (e.g., spacing scale already follows 8pt grid)
- **Using `@apply` heavily**: Tailwind team discourages `@apply`; prefer component composition over CSS extraction
- **Arbitrary values for repeated patterns**: If `text-[#3B82F6]` appears 5+ times, add `text-brand-blue` to `theme.extend.colors`
- **Mixing inline styles with Tailwind**: Avoid `style={{ borderRadius: '10px' }}`; use Tailwind classes exclusively

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive breakpoint logic | Custom media query listeners with magic numbers | Shared `BREAKPOINTS` constant imported in JS and Tailwind config | Single source of truth; avoids drift between CSS and JS breakpoints |
| CSS minification | Custom build script | cssnano via PostCSS or Vite's built-in minification | Tailwind v3 + Vite already optimized; most projects ship <10kB CSS |
| Design token validation | Manual code review | ESLint rule or grep-based verification script | Automated enforcement prevents regression after refactor |
| Typography scale calculation | Manual math for 1.250 ratio | [Type Scale Generator](https://www.forgedock.dev/tools/typescale) → export Tailwind config | Handles line-height, responsive scaling, and decimal precision |

**Key insight:** Tailwind v3's built-in tree-shaking and Vite's optimization mean you rarely need custom build tools. The real work is configuration and refactoring, not tooling.

## Common Pitfalls

### Pitfall 1: Overriding Default Spacing Scale

**What goes wrong:** Defining `theme.spacing` (without `extend`) removes Tailwind's 8pt grid defaults, breaking existing classes like `p-4`, `gap-6`.

**Why it happens:** Confusion between `theme` and `theme.extend` in documentation.

**How to avoid:** Always use `theme.extend.spacing` unless you explicitly want a completely custom scale. Verify with `npm run dev` that existing classes still work.

**Warning signs:** Components break after config change; `p-4` no longer compiles; error messages about missing utilities.

**Source:** [Tailwind v3 Customizing Spacing](https://v2.tailwindcss.com/docs/customizing-spacing)

### Pitfall 2: Hardcoded HEX Colors Instead of Tailwind Classes

**What goes wrong:** Using `bg-[#3B82F6]` instead of `bg-blue-500` or custom token loses semantic meaning and breaks theming.

**Why it happens:** Designers provide HEX codes; developers paste directly without checking Tailwind palette.

**How to avoid:** Create named color tokens in `theme.extend.colors` (e.g., `brand-primary: '#3B82F6'`) or use Tailwind's built-in palette (`blue-500`, `indigo-600`).

**Warning signs:** Grep shows 20+ instances of `bg-[#`, `text-[#`; color changes require find-and-replace instead of config update.

**Source:** [Tailwind CSS Best Practices](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

### Pitfall 3: Arbitrary Values Proliferation

**What goes wrong:** Over-reliance on arbitrary values (`rounded-[13px]`, `p-[23px]`) defeats design system consistency.

**Why it happens:** Pixel-perfect matching of designs without questioning if value should be standardized.

**How to avoid:** Use the "3+ occurrences" rule—if an arbitrary value appears 3+ times, promote it to a token. For unique values, leave comment explaining context.

**Warning signs:** Arbitrary values outnumber standard classes; design review questions inconsistent spacing/sizing.

**Source:** [Guidance on using arbitrary values vs design system tokens](https://github.com/tailwindlabs/tailwindcss/discussions/18748), [On Tailwind CSS arbitrary values](https://www.leohuynh.dev/blog/on-tailwind-css-arbitrary-values)

### Pitfall 4: Breakpoint Drift Between JS and CSS

**What goes wrong:** `MainLayout.jsx` uses `BREAKPOINT = 768` while Tailwind config uses `md: '800px'`—sidebar toggle triggers at wrong viewport width.

**Why it happens:** Constants defined separately in JS and CSS without shared source.

**How to avoid:** Export breakpoints from `constants/breakpoints.js`, import into both Tailwind config and JS logic.

**Warning signs:** Sidebar behavior inconsistent with responsive styles; manual testing reveals mismatch at tablet sizes.

**Source:** [How to Share Constants in TypeScript Project](https://medium.com/codex/how-to-share-constants-in-typescript-project-8f76a2e40352)

### Pitfall 5: Ignoring Performance Budget After Refactor

**What goes wrong:** Adding many custom tokens bloats CSS bundle; Lighthouse score drops below 90.

**Why it happens:** Assumption that design tokens are "free"; forgetting to verify bundle size.

**How to avoid:** After refactor, run `npm run build` and check `dist/assets/*.css` size (target: <50KB gzipped). Use `tailwindcss-debug-screens` in dev to monitor config impact.

**Warning signs:** Build output shows CSS >100KB; Lighthouse performance drops; LCP increases.

**Source:** [Tailwind v3 Optimizing for Production](https://v3.tailwindcss.com/docs/optimizing-for-production), [Web Performance Budget Guide](https://uxify.com/blog/post/web-performance-budget-guide)

## Code Examples

Verified patterns from official sources:

### 8pt Grid Spacing Configuration

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      spacing: {
        // Only define custom values beyond Tailwind defaults
        // Tailwind's default scale already follows 8pt grid:
        // 1 = 0.25rem = 4px, 2 = 0.5rem = 8px, 4 = 1rem = 16px, etc.
        '18': '4.5rem',  // 72px (18 × 4px)
        '22': '5.5rem',  // 88px (22 × 4px)
        '26': '6.5rem',  // 104px (26 × 4px)
      },
    },
  },
};
```

**Source:** [Tailwind v2 Customizing Spacing](https://v2.tailwindcss.com/docs/customizing-spacing)

### Major Third Typography Scale (1.250 ratio)

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      fontSize: {
        // Major Third (1.250) scale with 16px base
        'xs': ['12px', { lineHeight: '18px' }],     // 16 ÷ 1.25
        'sm': ['14px', { lineHeight: '21px' }],     // rounded
        'base': ['16px', { lineHeight: '24px' }],   // base
        'lg': ['18px', { lineHeight: '25.2px' }],   // 16 × 1.125 (intermediate)
        'xl': ['22px', { lineHeight: '30.8px' }],   // 16 × 1.375
        '2xl': ['28px', { lineHeight: '36.4px' }],  // 16 × 1.75
        '3xl': ['36px', { lineHeight: '43.2px' }],  // 16 × 2.25
        '4xl': ['48px', { lineHeight: '52.8px' }],  // 16 × 3
      },
    },
  },
};
```

**Source:** [Type Scale Generator](https://www.forgedock.dev/tools/typescale), [Typography in UX Best Practices](https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/)

### Linear-Style Shadow System

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      boxShadow: {
        // Subtle elevation with 5-16% opacity (Linear design pattern)
        'xs': '0 1px 2px rgba(0,0,0,0.05)',
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'DEFAULT': '0 2px 4px rgba(0,0,0,0.06)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 8px 24px rgba(0,0,0,0.12)',
        'xl': '0 16px 48px rgba(0,0,0,0.16)',
        '2xl': '0 24px 48px rgba(0,0,0,0.20)',
      },
    },
  },
};
```

**Usage:**
```jsx
// Standard card elevation
<div className="bg-white rounded-lg shadow p-6">
  {/* Uses boxShadow.DEFAULT: 0 2px 4px rgba(0,0,0,0.06) */}
</div>

// Hover elevation
<button className="shadow-md hover:shadow-lg transition-shadow">
  Share Collection
</button>
```

**Source:** [Linear design: The SaaS design trend](https://blog.logrocket.com/ux-design/linear-design/), `.planning/research/DESIGN-SYSTEM.md`

### Shared Responsive Breakpoints

```javascript
// src/constants/breakpoints.js
export const BREAKPOINTS = {
  MOBILE: 640,   // Tailwind 'sm'
  TABLET: 768,   // Tailwind 'md'
  DESKTOP: 1024, // Tailwind 'lg'
};

// tailwind.config.js
import { BREAKPOINTS } from './src/constants/breakpoints.js';

export default {
  theme: {
    extend: {
      screens: {
        'sm': `${BREAKPOINTS.MOBILE}px`,
        'md': `${BREAKPOINTS.TABLET}px`,
        'lg': `${BREAKPOINTS.DESKTOP}px`,
      },
    },
  },
};

// MainLayout.jsx
import { BREAKPOINTS } from '../constants/breakpoints';

const [isMobile, setIsMobile] = useState(
  window.innerWidth < BREAKPOINTS.TABLET
);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < BREAKPOINTS.TABLET);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Source:** [How to Share Constants in TypeScript Project](https://medium.com/codex/how-to-share-constants-in-typescript-project-8f76a2e40352)

### Refactoring Hardcoded Colors

```jsx
// BEFORE (hardcoded HEX in MainLayout.jsx)
<div className="bg-[#1a1a2e] text-white">
  {/* ... */}
</div>

// OPTION 1: Use Tailwind built-in color
<div className="bg-gray-900 text-white">
  {/* bg-gray-900 = #171717, close enough to #1a1a2e */}
</div>

// OPTION 2: Define custom token in tailwind.config.js
// theme.extend.colors: { 'surface-dark': '#1a1a2e' }
<div className="bg-surface-dark text-white">
  {/* Semantic naming; easy to update globally */}
</div>
```

**Decision criteria:**
- If color matches Tailwind palette (±10% lightness), use built-in class
- If color is brand-specific or repeated 3+ times, add custom token
- If color is one-off (e.g., gradient stop), keep arbitrary value with comment

**Source:** [Tailwind CSS Best Practices](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v4 adoption | Stay on Tailwind v3 for v3.0 redesign | Project decision 2026-02-14 | Reduces migration risk; defer v4 to separate milestone |
| CSS-in-JS (styled-components) | Tailwind utility classes | Industry shift 2023-2025 | Photo Hub already uses Tailwind; no change needed |
| JavaScript config (v3) | CSS-first `@theme` (v4) | Tailwind v4 released Jan 2025 | Not applicable; project on v3 |
| PostCSS tree-shaking | Native CSS engine (v4) | Tailwind v4 | Not applicable; v3 tree-shaking sufficient |
| `@apply` for component styles | Component composition with utility classes | Tailwind team guidance 2024+ | Avoid `@apply` in refactor; use React components instead |

**Deprecated/outdated:**
- **`@layer` in SFC `<style>` blocks**: Tailwind v3 docs warn against this pattern in Vue/Svelte; doesn't apply to React but indicates preference for utility-first in JSX
- **PurgeCSS separate config**: Tailwind v3 has built-in tree-shaking via `content` paths; no need for separate PurgeCSS setup
- **Major version upgrades mid-redesign**: Industry best practice is to stabilize dependencies during major refactors; defer Tailwind v4 migration

## Open Questions

1. **Should we use CSS custom properties for runtime theming?**
   - What we know: Tailwind v3 supports CSS vars via arbitrary values `bg-[var(--color-primary)]`; v4 uses native CSS vars in `@theme`
   - What's unclear: Is runtime theme switching (light/dark mode) in v3.0 scope?
   - Recommendation: NOT in Phase 11 scope; stick to static tokens in `tailwind.config.js`. If dark mode needed later, add CSS vars in separate phase.

2. **How strict should arbitrary value prevention be?**
   - What we know: Some arbitrary values are legitimate (one-off pixel adjustments); Tailwind docs endorse them for "pixel-perfect" needs
   - What's unclear: Should we enforce zero arbitrary values or allow with justification?
   - Recommendation: Allow arbitrary values for **unique, context-specific adjustments** (e.g., `top-[117px]` for background image positioning) but require inline comment explaining why. Promote to token if used 3+ times.

3. **Should breakpoints be TypeScript or JavaScript?**
   - What we know: Project uses `.jsx` files, not `.tsx`; no TypeScript setup currently
   - What's unclear: Future TypeScript migration plans?
   - Recommendation: Use `.js` for `constants/breakpoints.js` to match current project; can convert to `.ts` if TypeScript added later (low-risk change).

4. **What is the precise bundle size target?**
   - What we know: Requirements specify `<50KB CSS gzipped`; Tailwind v3 docs say "most projects ship <10kB"
   - What's unclear: Is 50KB a hard limit or aspirational?
   - Recommendation: Treat <50KB as hard limit for Phase 16 verification; aim for <20KB as stretch goal. Current minimal config likely produces <15KB.

5. **Should we version the design tokens?**
   - What we know: Design systems often version tokens for breaking changes; Photo Hub is single-app, not multi-consumer
   - What's unclear: Is token versioning overkill for single-app context?
   - Recommendation: No versioning needed for Phase 11; tokens live in `tailwind.config.js` and evolve with app. If design system extracted to package later, add versioning then.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v3 Official Docs - Adding Custom Styles](https://v3.tailwindcss.com/docs/adding-custom-styles)
- [Tailwind CSS v3 Official Docs - Optimizing for Production](https://v3.tailwindcss.com/docs/optimizing-for-production)
- [Tailwind CSS v3 Official Docs - Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v2 Official Docs - Customizing Spacing](https://v2.tailwindcss.com/docs/customizing-spacing)
- Photo Hub Design System Research - `.planning/research/DESIGN-SYSTEM.md` (2026-02-14)

### Secondary (MEDIUM confidence)
- [Tailwind CSS Best Practices 2025-2026: Design Tokens](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) - Verified with official docs
- [Linear design: The SaaS design trend](https://blog.logrocket.com/ux-design/linear-design/) - Matches project's design research
- [Design Tokens: The Foundation of Your UI Arch](https://feature-sliced.design/blog/design-tokens-architecture) - Architecture patterns
- [Breakpoint: Responsive Design Breakpoints in 2025](https://www.browserstack.com/guide/responsive-design-breakpoints) - Industry standards
- [Core Web Vitals Lighthouse: Complete 2025 Guide](https://void.ma/en/guides/core-web-vitals-lighthouse/) - Performance targets
- [How to Share Constants in TypeScript Project](https://medium.com/codex/how-to-share-constants-in-typescript-project-8f76a2e40352) - Shared constants pattern
- [Breaking Free from Hardcoded Values](https://www.in-com.com/blog/breaking-free-from-hardcoded-values-smarter-strategies-for-modern-software/) - Refactoring strategy

### Tertiary (LOW confidence)
- [Tailwind CSS 4.1 Brings Text Shadows and CSS-First Setup](https://medium.com/@roman_fedyskyi/tailwind-css-4-1-brings-text-shadows-and-css-first-setup-5d696aaf2a79) - v4 info (not applicable to project but contextual)
- [GitHub Discussion: Arbitrary values vs design system tokens](https://github.com/tailwindlabs/tailwindcss/discussions/18748) - Community guidance (unofficial)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tailwind v3 well-documented; project already uses it
- Architecture: HIGH - Patterns verified in official Tailwind v3 docs and industry best practices
- Pitfalls: MEDIUM-HIGH - Common issues documented in community resources; verified against official guidance

**Research date:** 2026-02-14
**Valid until:** 60 days (2026-04-15) - Tailwind v3 is stable; v4 adoption timeline doesn't affect v3 patterns

**Codebase analysis:**
- Current Tailwind config: Minimal (uses all defaults)
- Hardcoded values found in: 9 component files (rounded-\[, bg-\[# patterns)
- Existing constants: `SIDEBAR_WIDTH = 240`, `BREAKPOINT = 768` in MainLayout.jsx (needs consolidation)
- Prior design research: Extensive (DESIGN-SYSTEM.md covers spacing, typography, shadows, colors)

**Next steps for planner:**
1. Configure `tailwind.config.js` with design tokens from DESIGN-SYSTEM.md research
2. Create `constants/breakpoints.js` for shared responsive values
3. Refactor components file-by-file to eliminate hardcoded values
4. Verify bundle size and performance budget compliance
