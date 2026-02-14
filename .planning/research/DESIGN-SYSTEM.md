# UI/UX Design System Research — World-Class SaaS Redesign

**Domain:** Premium SaaS design patterns for photographer platform
**Researched:** 2026-02-14
**Confidence:** HIGH

---

## Context

Photo Hub redesign from functional to world-class, venture-backed SaaS aesthetic. Target: Linear/Stripe/Notion/Framer level of polish.

**Current Stack (KEEP):**
- React 18 + Tailwind CSS v3
- Token-based sharing (zero-friction for clients)
- Collection lifecycle: DRAFT → SELECTING → REVIEWING → DELIVERED → DOWNLOADED

**Redesign Goals:**
- Mobile-first for clients (thumb-friendly photo selection)
- Desktop-optimized for photographers (airy workspace)
- Premium aesthetics (confident, minimal, timeless)
- Edge-to-edge imagery (photography takes center stage)

**What This Research Covers:**
- Spacing scale and rhythm (8pt grid, typography scale)
- Shadow and elevation system (depth without clutter)
- Color palette (neutral grays, accent strategy, accessibility)
- Component patterns (cards, buttons, navigation)
- Mobile-first patterns (bottom nav, FAB, touch targets, gestures)
- Desktop patterns (sidebar, airy content, strong hierarchy)
- Photography-specific patterns (edge-to-edge imagery, minimal chrome)
- Anti-patterns (what NOT to use)

---

## Spacing System — 8pt Grid

### Core Principle

**Use 8pt base unit for layout, 4pt for fine-tuning.**

| Scale | Value | Tailwind Class | Use Case |
|-------|-------|----------------|----------|
| 0.5x | 4px | `gap-1`, `p-1` | Icon-text spacing, tight element gaps |
| 1x | 8px | `gap-2`, `p-2` | Small component padding (badges, tags) |
| 1.5x | 12px | `gap-3`, `p-3` | Button padding (vertical), compact spacing |
| 2x | 16px | `gap-4`, `p-4` | Default component padding, input fields |
| 3x | 24px | `gap-6`, `p-6` | Card padding, section spacing |
| 4x | 32px | `gap-8`, `p-8` | Large component padding, major sections |
| 6x | 48px | `gap-12`, `p-12` | Section dividers, page spacing |
| 8x | 64px | `gap-16`, `p-16` | Hero sections, major page divisions |
| 12x | 96px | `gap-24`, `p-24` | Landing page sections, dramatic spacing |

**Rationale:**
- 8px aligns with iOS (44px touch targets = 5.5 × 8) and Android (48px = 6 × 8)
- Visually distinct increments without overwhelming choices
- Tailwind default spacing scale already follows 8pt grid

**Platform Alignment:**
- iOS: 44×44px minimum touch targets (Apple HIG)
- Android: 48×48px recommended (Material Design)
- WCAG 2.1: 44×44px minimum for accessibility

**Source:** [Spacing, grids, and layouts](https://www.designsystems.com/space-grids-and-layouts/), [The 8pt Grid System](https://www.rejuvenate.digital/news/designing-rhythm-power-8pt-grid-ui-design)

### Implementation in Tailwind

```jsx
// Card with 8pt-aligned spacing
<div className="bg-white rounded-[16px] p-6 gap-4">
  {/* p-6 = 24px padding, gap-4 = 16px between elements */}
  <h2 className="text-lg mb-3">{/* mb-3 = 12px margin-bottom */}</h2>
  <p className="text-sm text-gray-600">{/* ... */}</p>
</div>

// Button with precise 8pt spacing
<button className="px-4 py-3 rounded-[8px]">
  {/* px-4 = 16px horizontal, py-3 = 12px vertical */}
  Select Photos
</button>
```

**When to Break the Grid:**
- Image dimensions (preserve aspect ratios)
- Optical alignment (icons may need 1-2px adjustment)
- Dynamic JS values (sidebar slide animations)

---

## Typography Scale — Responsive Type System

### Scale Ratios

**Use Major Third (1.250) for balanced hierarchy.**

| Level | Size | Line Height | Tailwind | Use Case |
|-------|------|-------------|----------|----------|
| **Display** | 48px | 1.1 (52.8px) | `text-5xl` | Landing page hero, dramatic headings |
| **H1** | 36px | 1.2 (43.2px) | `text-4xl` | Page title (Collections, Profile) |
| **H2** | 28px | 1.3 (36.4px) | `text-3xl` | Section heading (Upload Photos, Selected) |
| **H3** | 22px | 1.4 (30.8px) | `text-2xl` | Card title, sub-section |
| **H4** | 18px | 1.4 (25.2px) | `text-lg` | Button labels, strong emphasis |
| **Body** | 16px | 1.5 (24px) | `text-base` | Main content, descriptions |
| **Small** | 14px | 1.5 (21px) | `text-sm` | Secondary text, metadata |
| **Tiny** | 12px | 1.5 (18px) | `text-xs` | Captions, labels, timestamps |

**Line Height Rules:**
- **Headings:** 1.1–1.3 (tight for impact)
- **Body text:** 1.5–1.6 (readable, comfortable)
- **All line heights divisible by 4px** (maintains baseline grid)

**Responsive Scaling with clamp():**

```css
/* In Tailwind config or arbitrary value */
font-size: clamp(28px, 4vw, 48px); /* H1 scales 28px → 48px */
```

**Tailwind Implementation:**

```jsx
// Page title (H1)
<h1 className="text-4xl font-bold leading-tight mb-6">
  {/* text-4xl = 36px, leading-tight = 1.25, mb-6 = 24px */}
  Your Collections
</h1>

// Section heading (H2)
<h2 className="text-2xl font-semibold leading-snug mb-4">
  {/* text-2xl = 24px, leading-snug = 1.375 */}
  Uploaded Photos
</h2>

// Body text
<p className="text-base leading-relaxed text-gray-700">
  {/* text-base = 16px, leading-relaxed = 1.625 */}
  Share this link with your client to begin photo selection.
</p>

// Small metadata
<span className="text-xs text-gray-500">
  {/* text-xs = 12px */}
  Last updated 2 hours ago
</span>
```

**Font Choice:**
- **Linear uses Inter** (current industry standard for SaaS)
- **Tailwind default:** Inter (via `font-sans`)
- **Already configured** in Photo Hub — no changes needed

**Accessibility:**
- Minimum body text: 16px (WCAG AA)
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text (18px+)

**Source:** [Typography Scale Calculator](https://elementor.com/tools/typography-scale-calculator/), [Typography in UX Best Practices](https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/)

---

## Shadow & Elevation System

### Linear-Style Shadow Ramp

**Use subtle shadows for depth, NOT heavy borders.**

| Level | Shadow | Tailwind | Use Case |
|-------|--------|----------|----------|
| **None** | `none` | `shadow-none` | Flat elements, inline content |
| **XS** | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Subtle cards, hover states |
| **SM** | `0 2px 4px rgba(0,0,0,0.06)` | `shadow` | Default card elevation |
| **MD** | `0 4px 12px rgba(0,0,0,0.08)` | `shadow-md` | Floating cards, popovers |
| **LG** | `0 8px 24px rgba(0,0,0,0.12)` | `shadow-lg` | Modals, overlays |
| **XL** | `0 16px 48px rgba(0,0,0,0.16)` | `shadow-xl` | Dramatic emphasis, hero cards |

**Glassmorphism (Frosted Glass Effect):**

Use for overlays, navigation bars, and premium accents.

```jsx
// Frosted glass card
<div className="
  bg-white/80
  backdrop-blur-md
  border border-white/20
  rounded-[16px]
  shadow-lg
">
  {/* bg-white/80 = 80% opacity white */}
  {/* backdrop-blur-md = 12px blur on background */}
  {/* border-white/20 = subtle white border */}
</div>

// Mobile bottom nav with glassmorphism
<nav className="
  fixed bottom-0 left-0 right-0
  bg-white/90
  backdrop-blur-lg
  border-t border-gray-200/50
  shadow-xl
">
  {/* Sits above content with frosted effect */}
</nav>
```

**Elevation Opacity:**
- Base: `rgba(0,0,0,0.05)` — subtle presence
- Low: `rgba(0,0,0,0.08)` — standard cards
- Medium: `rgba(0,0,0,0.12)` — floating elements
- High: `rgba(0,0,0,0.16)` — modals, overlays

**Blur Radius:**
- Typical: 10–20px for frosted glass
- Tailwind: `backdrop-blur-sm` (4px), `backdrop-blur` (8px), `backdrop-blur-md` (12px), `backdrop-blur-lg` (16px)

**Anti-Pattern:**
- Heavy borders (`border-2`, `border-gray-800`) — creates boxy, admin-template feel
- Use shadows for depth, thin borders for definition only

**Source:** [How To Use Shadows And Blur Effects In Modern UI Design](https://www.smashingmagazine.com/2017/02/shadows-blur-effects-user-interface-design/), [Glassmorphism With Tailwind CSS](https://flyonui.com/blog/glassmorphism-with-tailwind-css/)

---

## Color System — Neutral-First with Strategic Accents

### Neutral Gray Scale

**Use elevated neutrals (warm grays) for breathing room.**

| Token | Hex | Tailwind | Use Case |
|-------|-----|----------|----------|
| **White** | `#FFFFFF` | `bg-white`, `text-white` | Card backgrounds, light text |
| **Gray 50** | `#FAFAFA` | `bg-gray-50` | Page background (softer than white) |
| **Gray 100** | `#F5F5F5` | `bg-gray-100` | Subtle dividers, disabled states |
| **Gray 200** | `#E5E5E5` | `bg-gray-200`, `border-gray-200` | Borders, subtle separators |
| **Gray 300** | `#D4D4D4` | `bg-gray-300` | Inactive elements, placeholders |
| **Gray 400** | `#A3A3A3` | `text-gray-400` | Muted text, secondary info |
| **Gray 500** | `#737373` | `text-gray-500` | Metadata, captions |
| **Gray 600** | `#525252` | `text-gray-600` | Secondary body text |
| **Gray 700** | `#404040` | `text-gray-700` | Primary body text |
| **Gray 800** | `#262626` | `text-gray-800` | Headings, strong emphasis |
| **Gray 900** | `#171717` | `text-gray-900` | Darkest text (avoid pure black) |

**Why NOT Pure Black (#000):**
- Harsh contrast strains eyes
- Deep gray (#171717, #262626) softer while maintaining legibility

**Page Structure:**
```jsx
// Elevated neutral background
<body className="bg-gray-50 text-gray-800">
  {/* White cards on light gray background = subtle depth */}
  <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm p-6">
    <h2 className="text-gray-900 font-semibold">Collection Title</h2>
    <p className="text-gray-600 text-sm">Collection description...</p>
    <span className="text-gray-500 text-xs">Created 2 days ago</span>
  </div>
</body>
```

### Accent Colors

**Use blue/indigo gradient for primary actions.**

| Token | Hex | Tailwind | Use Case |
|-------|-----|----------|----------|
| **Primary** | `#3B82F6` (blue-500) | `bg-blue-500`, `text-blue-500` | Primary buttons, links |
| **Primary Hover** | `#2563EB` (blue-600) | `hover:bg-blue-600` | Button hover state |
| **Accent** | `#6366F1` (indigo-500) | `bg-indigo-500` | Gradient end, secondary accent |
| **Success** | `#10B981` (green-500) | `bg-green-500` | Success states, confirmations |
| **Warning** | `#F59E0B` (amber-500) | `bg-amber-500` | Warnings, cautions |
| **Error** | `#EF4444` (red-500) | `bg-red-500` | Errors, destructive actions |

**Gradient Pattern (Linear Style):**

```jsx
// Primary button with gradient
<button className="
  bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)]
  hover:bg-[linear-gradient(135deg,#2563EB_0%,#4F46E5_100%)]
  text-white
  px-6 py-3
  rounded-[10px]
  shadow-md
  transition-all duration-200
">
  Share Collection
</button>

// Gradient accent on card header
<div className="
  bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)]
  text-white
  rounded-t-[16px]
  p-6
">
  <h2 className="text-xl font-semibold">Collection Details</h2>
</div>
```

**Neon Glow Accents (2026 Trend):**

Micro-accents for focus states, CTAs, status indicators.

```jsx
// Focus glow on input
<input className="
  border border-gray-200
  focus:border-blue-500
  focus:ring-2 focus:ring-blue-500/20
  focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]
  rounded-[8px]
  px-4 py-3
" />

// Glow accent on active status
<span className="
  bg-green-500
  text-white
  px-3 py-1
  rounded-full
  text-xs font-medium
  shadow-[0_0_12px_rgba(16,185,129,0.3)]
">
  Active
</span>
```

**Accessibility:**
- Primary blue (3B82F6) on white: 4.54:1 contrast (WCAG AA)
- Gray-700 (404040) on white: 10.37:1 contrast (WCAG AAA)
- Always test with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Source:** [Why Your SaaS Color Palette Matters](https://ester.co/blog/saas-color-palette), [UI Color Trends to Watch in 2026](https://updivision.com/blog/post/ui-color-trends-to-watch-in-2026)

---

## Component Patterns

### 1. Card Design

**Premium card pattern:** White background, subtle shadow, generous padding, no heavy borders.

```jsx
// Standard collection card
<div className="
  bg-white
  border border-gray-200
  rounded-[16px]
  shadow-sm
  hover:shadow-md
  transition-shadow duration-200
  p-6
  gap-4
">
  {/* Card content */}
  <h3 className="text-xl font-semibold text-gray-900">Collection Name</h3>
  <p className="text-sm text-gray-600">32 photos • 12 selected</p>
  <div className="flex gap-2 mt-4">
    <button className="...">View</button>
  </div>
</div>

// Polaroid-style card (photography-specific)
<div className="
  bg-white
  rounded-[12px]
  shadow-lg
  overflow-hidden
  transform hover:scale-105
  transition-transform duration-200
">
  {/* Edge-to-edge cover image */}
  <img src="..." className="w-full aspect-[4/3] object-cover" />

  {/* Bottom padding for "Polaroid" effect */}
  <div className="p-4">
    <h3 className="text-lg font-semibold">Collection Name</h3>
    <p className="text-sm text-gray-500">24 photos</p>
  </div>
</div>
```

**Key Characteristics:**
- `rounded-[12px]` to `rounded-[16px]` (softer than sharp corners)
- `shadow-sm` base, `hover:shadow-md` for interactivity
- `p-6` (24px) standard card padding
- Thin borders (`border-gray-200`) for definition, NOT separation
- Subtle hover effects (`hover:scale-105`, `hover:shadow-md`)

### 2. Button Hierarchy

**Three-tier system:** Primary (gradient), Secondary (outline), Ghost (minimal).

```jsx
// Primary button (high-emphasis)
<button className="
  bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)]
  hover:bg-[linear-gradient(135deg,#2563EB_0%,#4F46E5_100%)]
  text-white
  font-medium
  px-6 py-3
  rounded-[10px]
  shadow-md
  hover:shadow-lg
  transition-all duration-200
">
  Upload Photos
</button>

// Secondary button (medium-emphasis)
<button className="
  bg-white
  border border-gray-300
  hover:border-gray-400
  text-gray-700
  hover:text-gray-900
  font-medium
  px-6 py-3
  rounded-[10px]
  shadow-sm
  hover:shadow
  transition-all duration-200
">
  Cancel
</button>

// Ghost button (low-emphasis)
<button className="
  text-gray-600
  hover:text-gray-900
  hover:bg-gray-100
  font-medium
  px-4 py-2
  rounded-[8px]
  transition-colors duration-150
">
  Add More Photos
</button>

// Icon-only button (minimal chrome)
<button className="
  text-gray-500
  hover:text-gray-900
  hover:bg-gray-100
  p-2
  rounded-[8px]
  transition-colors duration-150
">
  <DownloadIcon className="w-5 h-5" />
</button>
```

**Size Scale:**
- Small: `px-3 py-1.5` (12px/6px) — compact actions
- Medium: `px-4 py-2` (16px/8px) — default
- Large: `px-6 py-3` (24px/12px) — primary CTAs

**Anti-Pattern:**
- Multiple primary buttons in same view (creates hierarchy confusion)
- Colored buttons for destructive actions (use red outline, NOT filled)

**Source:** [The Ultimate Button UI Design Guide](https://www.designmonks.co/blog/button-ui), [Using Ghost Buttons for Effective CTAs](https://blog.logrocket.com/ux-design/using-ghost-buttons-effective-ctas/)

### 3. Empty States

**Use illustration + clear CTA, NOT just text.**

```jsx
// Empty collection state
<div className="
  flex flex-col items-center justify-center
  text-center
  py-16 px-6
  gap-6
">
  {/* Illustration or icon */}
  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
    <CameraIcon className="w-12 h-12 text-gray-400" />
  </div>

  {/* Heading + description */}
  <div className="max-w-sm">
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      No photos yet
    </h3>
    <p className="text-sm text-gray-600">
      Upload your first batch of photos to get started with this collection.
    </p>
  </div>

  {/* Primary action */}
  <button className="bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)] text-white px-6 py-3 rounded-[10px] font-medium shadow-md">
    Upload Photos
  </button>
</div>
```

**Pattern Formula:**
1. Icon/illustration (contextual to missing content)
2. Clear heading ("No [entity] yet", NOT "Empty")
3. Brief explanation (what this area is for)
4. Primary action button (what to do next)

**Context-Specific:**
- Photo gallery: Camera icon, "Upload Photos" CTA
- Selections: Checkmark icon, "Share link with client" explanation
- Search results: Magnifying glass, "Try different keywords" suggestion

**Source:** [Empty State UI Design Examples](https://www.saasframe.io/categories/empty-state), [Empty State UX That Actually Works](https://www.eleken.co/blog-posts/empty-state-ux)

### 4. Progressive Disclosure (Accordions)

**Use chevron icons, smooth animations, generous spacing.**

```jsx
// Accordion section
<div className="border-b border-gray-200">
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="
      flex items-center justify-between
      w-full
      py-4 px-6
      text-left
      hover:bg-gray-50
      transition-colors
    "
  >
    <span className="text-lg font-semibold text-gray-900">
      Upload Settings
    </span>
    <ChevronDownIcon className={`
      w-5 h-5 text-gray-500
      transition-transform duration-200
      ${isOpen ? 'rotate-180' : ''}
    `} />
  </button>

  {isOpen && (
    <div className="px-6 pb-4 pt-2 text-sm text-gray-700">
      {/* Content appears smoothly */}
      <p>Configure upload preferences...</p>
    </div>
  )}
</div>
```

**Best Practices:**
- Chevron icon indicates expandable (NOT plus/minus)
- Rotate chevron 180° when open (visual feedback)
- Allow multiple sections open simultaneously (unless mutually exclusive)
- Generous click target (full-width header, min 48px height)

**When to Use:**
- Settings panels with grouped options
- FAQ sections
- Workflow phases (upload, share, deliver)

**Source:** [Accordion UI Design Best Practices](https://mobbin.com/glossary/accordion), [Progressive Disclosure Patterns](https://orbit.kiwi/design-patterns/progressive-disclosure/)

---

## Mobile-First Patterns (Client Experience)

### Touch Target Sizes

**Minimum 44×44px for all interactive elements.**

| Element | Minimum Size | Tailwind | Rationale |
|---------|--------------|----------|-----------|
| Button | 44×44px | `h-11 px-4` | Apple HIG minimum |
| Icon button | 48×48px | `w-12 h-12` | Android Material Design |
| Checkbox | 24×24px (with 44×44px tap area) | `w-6 h-6` in `p-2.5` container | Smaller visual, larger hit target |
| Photo thumbnail | 80×80px minimum | `w-20 h-20` | Comfortable tap, prevents misclicks |

**Implementation:**

```jsx
// Icon button with generous tap target
<button className="
  w-12 h-12
  flex items-center justify-center
  rounded-[8px]
  hover:bg-gray-100
  active:bg-gray-200
  transition-colors
">
  <HeartIcon className="w-6 h-6 text-gray-600" />
</button>

// Photo grid with touch-friendly spacing
<div className="grid grid-cols-3 gap-2 p-4">
  {photos.map(photo => (
    <button
      key={photo.id}
      onClick={() => toggleSelection(photo.id)}
      className="
        aspect-square
        min-h-[80px]
        rounded-[8px]
        overflow-hidden
        border-2
        ${selected ? 'border-blue-500' : 'border-transparent'}
        active:scale-95
        transition-transform
      "
    >
      <img src={photo.thumbnail} className="w-full h-full object-cover" />
    </button>
  ))}
</div>
```

**Anti-Pattern:**
- Tiny icon buttons (<40px) — frustrating on mobile
- Links with small text and no padding — hard to tap accurately

**Source:** [Mobile First Design Best Practices](https://wpbrigade.com/mobile-first-design-strategy/), [Mobile Navigation UX Best Practices](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)

### Bottom Navigation (Tab Bar)

**3-5 core actions in thumb-friendly zone.**

```jsx
// Mobile bottom tab bar
<nav className="
  fixed bottom-0 left-0 right-0
  bg-white/90
  backdrop-blur-lg
  border-t border-gray-200/50
  shadow-xl
  safe-area-inset-bottom
">
  <div className="flex items-center justify-around h-16">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => navigate(tab.path)}
        className="
          flex flex-col items-center justify-center
          gap-1
          px-4 py-2
          flex-1
          ${isActive ? 'text-blue-500' : 'text-gray-500'}
          transition-colors
        "
      >
        <tab.icon className="w-6 h-6" />
        <span className="text-xs font-medium">{tab.label}</span>
      </button>
    ))}
  </div>
</nav>
```

**Best Practices:**
- Limit to 3-5 items (cognitive load)
- Use icons + short labels (clarity)
- Active state via color, NOT underline (mobile-friendly)
- Glassmorphism for elevation (sits above content)
- Account for safe area on iOS (bottom inset)

**For Photo Hub Client View:**
1. Browse (photos grid)
2. Selected (checkmark icon, selected count badge)
3. Submit (when done selecting)

**Source:** [Mobile Navigation Patterns That Work](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026)

### Floating Action Button (FAB)

**Use for primary action on mobile (e.g., "Submit Selections").**

```jsx
// FAB for primary action
<button className="
  fixed bottom-20 right-4
  w-14 h-14
  bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)]
  text-white
  rounded-full
  shadow-xl
  hover:shadow-2xl
  flex items-center justify-center
  transition-all duration-200
  active:scale-95
  z-50
">
  <CheckIcon className="w-6 h-6" />
</button>

// Extended FAB with label (for key actions)
<button className="
  fixed bottom-20 right-4
  bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)]
  text-white
  px-6 py-3
  rounded-full
  shadow-xl
  flex items-center gap-2
  font-medium
  active:scale-95
  transition-all duration-200
">
  <CheckIcon className="w-5 h-5" />
  <span>Submit Selections</span>
</button>
```

**When to Use:**
- Single most important action on screen
- Action applies to entire view (NOT per-item)
- Mobile-only (desktop uses primary button in content)

**Positioning:**
- Bottom-right: 16px from right, 80px from bottom (above bottom nav)
- Avoid obscuring content (floats above scroll area)

**For Photo Hub:**
- Client selection view: "Submit Selections" FAB
- Photographer upload: "Upload Photos" FAB (mobile only)

**Source:** [Floating Action Button UI Design](https://mobbin.com/glossary/floating-action-button), [5 Ways FAB Boosts UX](https://fireart.studio/blog/5-ways-the-floating-action-button-boosts-ux/)

### Swipe Gestures (Photo Gallery)

**Horizontal swipe for navigation, pinch-to-zoom for detail.**

```jsx
// Swipeable photo gallery (use library: react-swipeable)
import { useSwipeable } from 'react-swipeable';

const PhotoGallery = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex(i => Math.min(i + 1, photos.length - 1)),
    onSwipedRight: () => setCurrentIndex(i => Math.max(i - 1, 0)),
    preventScrollOnSwipe: true,
    trackMouse: true, // Desktop support
  });

  return (
    <div {...handlers} className="relative overflow-hidden">
      {/* Photo display */}
      <img
        src={photos[currentIndex].url}
        className="w-full h-full object-contain transition-transform duration-300"
      />

      {/* Swipe indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <div key={i} className={`
            w-2 h-2 rounded-full
            ${i === currentIndex ? 'bg-white' : 'bg-white/40'}
            transition-colors
          `} />
        ))}
      </div>
    </div>
  );
};
```

**Gesture Patterns:**
- Horizontal swipe: Navigate between photos
- Pinch-to-zoom: Inspect photo details (native browser behavior)
- Double-tap: Quick zoom toggle (optional enhancement)
- Long-press: Open context menu (download, share)

**Provide Visible Fallbacks:**
- Arrow buttons for users who don't discover swipe
- Thumbnail strip for direct navigation
- Page indicators (dots) for current position

**Source:** [Photo Gallery Touch Gestures](https://www.metaslider.com/touch-swipe/), [Mobile Navigation Patterns 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026)

---

## Desktop Patterns (Photographer Experience)

### Sidebar Navigation

**Inverted L-shaped chrome (Linear pattern).**

```jsx
// Persistent sidebar (desktop only)
<div className="flex h-screen">
  {/* Sidebar */}
  <aside className="
    w-64
    bg-white
    border-r border-gray-200
    flex flex-col
    overflow-y-auto
  ">
    {/* Logo */}
    <div className="p-6 border-b border-gray-200">
      <h1 className="text-xl font-bold text-gray-900">Photo Hub</h1>
    </div>

    {/* Nav items */}
    <nav className="flex-1 p-4 gap-1">
      {navItems.map(item => (
        <a
          key={item.id}
          href={item.path}
          className={`
            flex items-center gap-3
            px-4 py-3
            rounded-[8px]
            text-sm font-medium
            transition-colors
            ${isActive
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>

    {/* User menu */}
    <div className="p-4 border-t border-gray-200">
      <button className="flex items-center gap-3 w-full px-4 py-3 rounded-[8px] hover:bg-gray-50">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <span className="text-sm font-medium text-gray-900">John Doe</span>
      </button>
    </div>
  </aside>

  {/* Main content */}
  <main className="flex-1 overflow-y-auto bg-gray-50">
    {children}
  </main>
</div>
```

**Key Characteristics:**
- Fixed width (256px / w-64)
- White background (contrasts with gray-50 main area)
- Minimal borders (1px right border)
- Generous padding (p-4 for nav, p-6 for header)
- Subtle hover states (NOT heavy highlights)

**Mobile Adaptation:**
- Hide sidebar on mobile
- Replace with hamburger menu or bottom nav
- Use `lg:block hidden` for responsive visibility

### Airy Content Layout

**Generous spacing, single-column focus, clear sections.**

```jsx
// Desktop content area (photographer dashboard)
<main className="flex-1 overflow-y-auto bg-gray-50 p-8">
  {/* Page header */}
  <div className="max-w-6xl mx-auto mb-8">
    <h1 className="text-4xl font-bold text-gray-900 mb-2">Collections</h1>
    <p className="text-gray-600">Manage your photo collections and client selections</p>
  </div>

  {/* Action bar */}
  <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
    <div className="flex gap-2">
      <button className="bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)] text-white px-6 py-3 rounded-[10px] font-medium shadow-md">
        New Collection
      </button>
      <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-[10px] hover:bg-gray-50">
        Import
      </button>
    </div>

    <input
      placeholder="Search collections..."
      className="w-64 px-4 py-2 border border-gray-300 rounded-[8px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  </div>

  {/* Content grid */}
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {collections.map(collection => (
      <CollectionCard key={collection.id} {...collection} />
    ))}
  </div>
</main>
```

**Layout Principles:**
- Max-width container (`max-w-6xl`) — prevents ultra-wide sprawl
- Centered content (`mx-auto`) — balanced composition
- Generous section spacing (`mb-8`, `mb-6`) — breathing room
- Grid scales responsively (1 col → 2 col → 3 col)

**Anti-Pattern:**
- Full-width content on ultra-wide screens (hard to scan)
- Cramped spacing (feels cluttered, admin-template vibe)

---

## Photography-Specific Patterns

### Edge-to-Edge Imagery

**Let photos breathe — minimal chrome, maximum canvas.**

```jsx
// Full-bleed photo viewer
<div className="fixed inset-0 bg-black z-50">
  {/* Photo fills viewport */}
  <img
    src={photo.url}
    className="w-full h-full object-contain"
    alt={photo.filename}
  />

  {/* Minimal overlay controls */}
  <div className="absolute top-4 right-4 flex gap-2">
    <button className="
      w-10 h-10
      bg-black/40
      backdrop-blur-md
      text-white
      rounded-full
      hover:bg-black/60
      transition-colors
    ">
      <DownloadIcon className="w-5 h-5" />
    </button>
    <button className="w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full">
      <XIcon className="w-5 h-5" />
    </button>
  </div>

  {/* Metadata overlay (bottom) */}
  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
    <p className="text-white text-sm">{photo.filename}</p>
    <p className="text-white/70 text-xs">{photo.dimensions} • {photo.size}</p>
  </div>
</div>

// Gallery grid with minimal gaps
<div className="grid grid-cols-3 gap-1 p-1">
  {photos.map(photo => (
    <img
      key={photo.id}
      src={photo.thumbnail}
      className="aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => openViewer(photo)}
    />
  ))}
</div>
```

**Principles:**
- Tight gaps (`gap-1` = 4px) — imagery flows together
- Minimal padding on container — edge-to-edge feel
- Overlays use glassmorphism — don't obscure photos
- Gradient overlays for text legibility (NOT solid backgrounds)

**Aspect Ratios:**
- Square grid: `aspect-square` (uniform, clean)
- Preserve original: `aspect-[${width}/${height}]` (authentic)
- Masonry layout: Use library (react-masonry-css) for varied heights

**Source:** [Photography Portfolio Design Examples](https://www.framer.com/blog/photography-portfolio-websites/), [Photographer Portfolio Minimal UI](https://www.sitebuilderreport.com/inspiration/photography-portfolios)

### Status Indicators (Collection Lifecycle)

**Use color-coded badges, NOT text-only.**

```jsx
// Status badge component
const StatusBadge = ({ status }) => {
  const styles = {
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    SELECTING: 'bg-blue-100 text-blue-700 border-blue-200',
    REVIEWING: 'bg-amber-100 text-amber-700 border-amber-200',
    DELIVERED: 'bg-green-100 text-green-700 border-green-200',
    DOWNLOADED: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <span className={`
      inline-flex items-center gap-1
      px-3 py-1
      rounded-full
      text-xs font-medium
      border
      ${styles[status]}
    `}>
      <div className="w-2 h-2 rounded-full bg-current" />
      {status}
    </span>
  );
};

// In collection card
<div className="flex items-center justify-between mb-4">
  <h3 className="text-xl font-semibold">Wedding – Sarah & Tom</h3>
  <StatusBadge status="SELECTING" />
</div>
```

**Color Mapping:**
- DRAFT: Gray (neutral, inactive)
- SELECTING: Blue (in progress, active)
- REVIEWING: Amber (pending photographer action)
- DELIVERED: Green (completed successfully)
- DOWNLOADED: Purple (final state, archived)

**Visual Enhancements:**
- Dot indicator inside badge (status at a glance)
- Soft background colors (100 shade, NOT 500)
- Border for definition (200 shade)
- Rounded-full for tag aesthetic

### Gradient Overlays on Cover Images

**Ensure text legibility without obscuring photos.**

```jsx
// Collection card with gradient overlay
<div className="relative rounded-[16px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
  {/* Cover image (full bleed) */}
  <img
    src={collection.coverPhoto}
    className="w-full aspect-[4/3] object-cover"
  />

  {/* Gradient overlay for text */}
  <div className="
    absolute inset-0
    bg-gradient-to-t from-black/70 via-black/20 to-transparent
  ">
    {/* Content sits on gradient */}
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <h3 className="text-white text-2xl font-bold mb-1">
        {collection.name}
      </h3>
      <p className="text-white/90 text-sm">
        {collection.photoCount} photos • {collection.selectedCount} selected
      </p>
      <div className="flex gap-2 mt-4">
        <StatusBadge status={collection.status} />
      </div>
    </div>
  </div>
</div>
```

**Gradient Formula:**
- `from-black/70` (bottom, 70% opacity) — strong text support
- `via-black/20` (middle, 20% opacity) — subtle transition
- `to-transparent` (top) — photo visible

**Alternative (Blur Overlay):**
```jsx
<div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-6">
  {/* Frosted glass effect */}
</div>
```

---

## Anti-Patterns — What NOT to Use

### Heavy Borders & Boxy Layouts

**Problem:** Admin-template aesthetic, feels cheap and cluttered.

```jsx
// BAD: Heavy borders, tight spacing
<div className="border-2 border-gray-800 rounded-sm p-2 m-1">
  <h3 className="text-sm">Collection Name</h3>
  <button className="border-2 border-blue-600 bg-blue-500 text-white px-2 py-1">
    View
  </button>
</div>

// GOOD: Subtle shadows, generous spacing
<div className="bg-white border border-gray-200 rounded-[16px] shadow-sm p-6 mb-4">
  <h3 className="text-xl font-semibold mb-4">Collection Name</h3>
  <button className="bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)] text-white px-6 py-3 rounded-[10px] shadow-md">
    View Collection
  </button>
</div>
```

**Why It's Bad:**
- Heavy borders create visual clutter
- Tight spacing feels cramped, low-quality
- Sharp corners (`rounded-sm`) feel harsh

**Fix:**
- Use `border border-gray-200` (1px, light gray)
- Use shadows for depth (`shadow-sm`, `shadow-md`)
- Generous padding (`p-6` for cards, `px-6 py-3` for buttons)
- Softer corners (`rounded-[10px]`, `rounded-[16px]`)

### Overuse of Color

**Problem:** Too many colored buttons/badges creates visual chaos.

```jsx
// BAD: Color everywhere
<div className="flex gap-2">
  <button className="bg-blue-500 text-white px-4 py-2">Edit</button>
  <button className="bg-green-500 text-white px-4 py-2">Share</button>
  <button className="bg-purple-500 text-white px-4 py-2">Download</button>
  <button className="bg-red-500 text-white px-4 py-2">Delete</button>
</div>

// GOOD: One primary, rest secondary/ghost
<div className="flex gap-2">
  <button className="bg-[linear-gradient(135deg,#3B82F6_0%,#6366F1_100%)] text-white px-6 py-3 rounded-[10px] shadow-md">
    Share Collection
  </button>
  <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-[10px] hover:bg-gray-50">
    Edit
  </button>
  <button className="text-gray-600 hover:text-gray-900 px-4 py-2">
    Download
  </button>
  <button className="text-red-600 hover:text-red-700 px-4 py-2">
    Delete
  </button>
</div>
```

**Why It's Bad:**
- Equal emphasis confuses hierarchy
- Looks like admin dashboard, NOT premium SaaS

**Fix:**
- ONE primary button per view (gradient, high emphasis)
- Secondary actions use outline or ghost style
- Destructive actions use red TEXT, NOT red background

### Tiny Touch Targets on Mobile

**Problem:** Frustrating tap accuracy, accessibility failure.

```jsx
// BAD: Tiny icon button
<button className="p-1">
  <HeartIcon className="w-4 h-4" />
</button>

// GOOD: Generous tap target
<button className="w-12 h-12 flex items-center justify-center rounded-[8px] hover:bg-gray-100">
  <HeartIcon className="w-6 h-6" />
</button>
```

**Why It's Bad:**
- <44px hit targets fail Apple HIG
- Users miss taps, get frustrated

**Fix:**
- Minimum 44×44px for all interactive elements
- Prefer 48×48px for icon-only buttons

### Hamburger Menu as Primary Navigation (Mobile)

**Problem:** Hides navigation, increases cognitive load.

```jsx
// BAD: Everything hidden in hamburger
<nav className="fixed top-0 left-0 right-0 bg-white p-4">
  <button onClick={openMenu}>
    <MenuIcon className="w-6 h-6" />
  </button>
</nav>

// GOOD: Bottom tab bar with visible options
<nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-xl">
  <div className="flex items-center justify-around h-16">
    <TabButton icon={HomeIcon} label="Browse" />
    <TabButton icon={CheckIcon} label="Selected" />
    <TabButton icon={ShareIcon} label="Submit" />
  </div>
</nav>
```

**Why It's Bad:**
- Extra tap to access navigation
- Users forget what's available

**Fix:**
- Bottom tab bar for 3-5 primary actions
- Hamburger only for secondary settings/account

**Source:** [Mobile Navigation Patterns](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026), [Mobile-First UX Best Practices](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026)

---

## Implementation Checklist

### Design Tokens in Tailwind Config

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      spacing: {
        // 8pt grid (already default, but explicit)
        '0.5': '4px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '6': '48px',
        '8': '64px',
      },
      borderRadius: {
        // Softer corners
        'sm': '8px',
        'DEFAULT': '10px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      boxShadow: {
        // Linear-style shadows
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'DEFAULT': '0 2px 4px rgba(0,0,0,0.06)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 8px 24px rgba(0,0,0,0.12)',
        'xl': '0 16px 48px rgba(0,0,0,0.16)',
      },
      fontFamily: {
        // Inter already default in Tailwind
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Component Library Structure

```
frontend/src/components/
├── ui/
│   ├── Button.jsx          // Primary, Secondary, Ghost variants
│   ├── Card.jsx            // Standard card with shadow
│   ├── StatusBadge.jsx     // Collection status indicator
│   ├── EmptyState.jsx      // Empty state pattern
│   └── Accordion.jsx       // Progressive disclosure
├── layout/
│   ├── Sidebar.jsx         // Desktop nav
│   ├── BottomNav.jsx       // Mobile tab bar
│   └── PageHeader.jsx      // Consistent page titles
└── photography/
    ├── PhotoGrid.jsx       // Edge-to-edge gallery
    ├── PhotoViewer.jsx     // Full-screen lightbox
    └── CoverCard.jsx       // Polaroid-style collection card
```

### Responsive Breakpoints

```jsx
// Mobile-first approach
<div className="
  // Mobile (default)
  flex flex-col gap-4 p-4

  // Tablet (md: 768px+)
  md:grid md:grid-cols-2 md:gap-6 md:p-6

  // Desktop (lg: 1024px+)
  lg:grid-cols-3 lg:gap-8 lg:p-8
">
  {/* Content */}
</div>
```

**Breakpoints:**
- Mobile: `< 768px` (default, no prefix)
- Tablet: `md: 768px+`
- Desktop: `lg: 1024px+`
- Wide: `xl: 1280px+`

---

## Sources

### Design Systems & Patterns
- [Linear design: The SaaS design trend](https://blog.logrocket.com/ux-design/linear-design/) — HIGH confidence
- [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) — HIGH confidence
- [Stripe Apps UI toolkit](https://www.figma.com/community/file/1105918844720321397/stripe-apps-ui-toolkit) — HIGH confidence
- [Framer UX-focused website design principles](https://www.framer.com/blog/ux-website-design-principles/) — HIGH confidence

### Spacing & Typography
- [Spacing, grids, and layouts](https://www.designsystems.com/space-grids-and-layouts/) — HIGH confidence
- [The 8pt Grid System Guide](https://www.rejuvenate.digital/news/designing-rhythm-power-8pt-grid-ui-design) — MEDIUM confidence
- [Typography in UX Best Practices](https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/) — MEDIUM confidence
- [The ideal line length & line height](https://pimpmytype.com/line-length-line-height/) — HIGH confidence

### Shadows & Elevation
- [How To Use Shadows And Blur Effects In Modern UI Design](https://www.smashingmagazine.com/2017/02/shadows-blur-effects-user-interface-design/) — HIGH confidence
- [Glassmorphism With Tailwind CSS](https://flyonui.com/blog/glassmorphism-with-tailwind-css/) — MEDIUM confidence
- [Creating Glassmorphism Effects with Tailwind](https://www.epicweb.dev/tips/creating-glassmorphism-effects-with-tailwind-css) — MEDIUM confidence

### Color Systems
- [Why Your SaaS Color Palette Matters](https://ester.co/blog/saas-color-palette) — MEDIUM confidence
- [UI Color Trends to Watch in 2026](https://updivision.com/blog/post/ui-color-trends-to-watch-in-2026) — MEDIUM confidence
- [Best 20+ Color Combinations For Landing Pages](https://www.landingpageflow.com/post/best-color-combinations-for-better-landing-pages) — MEDIUM confidence

### Component Patterns
- [The Ultimate Button UI Design Guide](https://www.designmonks.co/blog/button-ui) — MEDIUM confidence
- [Using Ghost Buttons for Effective CTAs](https://blog.logrocket.com/ux-design/using-ghost-buttons-effective-ctas/) — HIGH confidence
- [Empty State UI Design Examples](https://www.saasframe.io/categories/empty-state) — MEDIUM confidence
- [Accordion UI Design Best Practices](https://mobbin.com/glossary/accordion) — HIGH confidence

### Mobile Patterns
- [Mobile Navigation Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026) — MEDIUM confidence
- [Mobile-First UX Design Best Practices 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026) — MEDIUM confidence
- [Floating Action Button UI Design](https://mobbin.com/glossary/floating-action-button) — HIGH confidence
- [Photo Gallery Touch Gestures](https://www.metaslider.com/touch-swipe/) — MEDIUM confidence

### Photography-Specific
- [Photography Portfolio Websites with Artful Design](https://www.framer.com/blog/photography-portfolio-websites/) — MEDIUM confidence
- [Photography Portfolios: Well-Designed Examples](https://www.sitebuilderreport.com/inspiration/photography-portfolios) — MEDIUM confidence

### SaaS Design Trends
- [7 Emerging Web Design Trends for SaaS in 2026](https://enviznlabs.com/blogs/7-emerging-web-design-trends-for-saas-in-2026-ai-layouts-glow-effects-and-beyond) — MEDIUM confidence
- [17 Best SaaS Website Design Examples](https://www.pixeto.co/blog/15-best-designed-saas-websites) — MEDIUM confidence

---

*Design system research for: Photo Hub world-class SaaS redesign*
*Researched: 2026-02-14*
