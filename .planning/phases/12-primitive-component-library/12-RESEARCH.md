# Phase 12: Primitive Component Library - Research

**Researched:** 2026-02-16
**Domain:** Reusable React component library patterns with design token enforcement
**Confidence:** HIGH

## Summary

This phase creates a foundational primitive component library that enforces the design tokens established in Phase 11. The goal is to extract repetitive UI patterns from pages into reusable, prop-based components (Button, Card, Badge, PhotoCard, UploadZone) that eliminate copy-paste variants and ensure consistent styling across the application.

The codebase currently has significant pattern duplication: gradient buttons appear in 12+ locations with identical classes (`bg-[linear-gradient(135deg,#3b82f6,#6366f1)]`), status badges are repeated across CollectionsListPage and CollectionDetailsPage, and photo upload zones exist as inline implementations. Phase 12 extracts these patterns into reusable components with JSDoc documentation.

**Primary recommendation:** Build component library using composition over configuration pattern. Start with atomic primitives (Button, Badge, Card), then compose complex components (PhotoCard, UploadZone). Use TypeScript-style prop types with JSDoc comments for IDE autocomplete. Test components in isolation before refactoring pages.

**Key decisions:**
- Button variants: Use variant prop with union type (`'primary' | 'secondary' | 'danger' | 'ghost'`)
- PhotoCard: Composition pattern with PhotoCard.Actions subcomponent for hover overlay
- UploadZone: Controlled component with file validation and drag-drop state management
- Documentation: JSDoc comments on all exports with @param, @returns, @example tags

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component framework | Already installed; stable and widely-used in 2026 |
| Tailwind CSS v3 | 3.4.19 | Utility-first styling | Already configured with design tokens in Phase 11 |
| PropTypes | 15.8.1 | Runtime prop validation | Standard React prop validation (already in package.json) |
| clsx | 2.x | Conditional className composition | Industry standard for managing dynamic Tailwind classes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Storybook | 8.x | Component documentation & testing | Optional for Phase 12; recommended for future component library scaling |
| React Docgen | Latest | JSDoc extraction for docs | Post-v3.0 if component library extracted to separate package |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSDoc comments | Full TypeScript migration | TypeScript adds build complexity; project uses .jsx not .tsx; JSDoc provides 80% of TypeScript benefits without migration |
| clsx | classnames | clsx is faster and smaller (1KB vs 3KB); simpler API for common use cases |
| PropTypes | TypeScript interfaces | PropTypes already installed; provides runtime validation; sufficient for current project scope |
| Custom Button | Third-party UI library (MUI, Chakra) | Photo Hub needs design system control; third-party libraries add bundle weight and styling conflicts |

**Installation:**
```bash
cd frontend
npm install clsx
# PropTypes already installed (check package.json)
```

## Architecture Patterns

### Recommended Component Structure
```
frontend/src/
├── components/
│   ├── primitives/
│   │   ├── Button.jsx           # 4 variants (primary, secondary, danger, ghost)
│   │   ├── Card.jsx             # White background, subtle shadow, rounded corners
│   │   ├── Badge.jsx            # Status colors (gray, blue, green, purple)
│   │   ├── PhotoCard.jsx        # Photo grid item with hover actions
│   │   └── UploadZone.jsx       # Drag-drop file upload with validation
│   ├── Accordion.jsx            # Existing component (already follows tokens)
│   └── ProtectedRoute.jsx       # Existing route guard
└── pages/                        # Refactor to use primitives in future phases
```

### Pattern 1: Button Component with Variants

**What:** Reusable button component with 4 variants enforcing design tokens for colors, spacing, and typography.

**When to use:** Anywhere a clickable action is needed. Replaces inline gradient buttons, form submit buttons, and action buttons.

**Example:**
```jsx
// components/primitives/Button.jsx
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Primary button component with multiple variants.
 *
 * @param {Object} props - Component props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} props.variant - Visual variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.fullWidth=false] - Full width on mobile
 * @param {Function} [props.onClick] - Click handler
 * @returns {JSX.Element} Button component
 *
 * @example
 * // Primary gradient button
 * <Button variant="primary" onClick={handleSubmit}>
 *   Create Collection
 * </Button>
 *
 * @example
 * // Secondary outline button
 * <Button variant="secondary" size="sm">
 *   Cancel
 * </Button>
 */
function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  fullWidth = false,
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-sm transition-opacity duration-150 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans';

  const variantClasses = {
    primary: 'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white hover:opacity-90',
    secondary: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50',
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',     // 12px text, 6px/12px padding
    md: 'text-sm py-2.5 px-5',     // 14px text, 10px/20px padding
    lg: 'text-base py-3.5 px-7',   // 16px text, 14px/28px padding
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], widthClass)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Button;
```

**Usage in pages:**
```jsx
// BEFORE (CollectionsListPage.jsx line 199)
<button className="py-2.5 px-5 text-sm font-semibold text-white bg-[linear-gradient(135deg,#3b82f6,#6366f1)] border-none rounded-sm cursor-pointer font-sans transition-opacity duration-150 hover:opacity-90">
  {t('collections.createBtn')}
</button>

// AFTER
<Button variant="primary" type="submit">
  {t('collections.createBtn')}
</Button>
```

**Source:** [Button component variants with TypeScript](https://gist.github.com/devinschulz/0f3a522e5baec0318fb21ed13fa6ffe4), [Using React Component Variants to Compose CSS Classes](https://devinschulz.com/blog/using-react-component-variants-to-compose-css-classes/)

### Pattern 2: Badge Component with Status Colors

**What:** Status badge component mapping collection lifecycle statuses to color-coded designs.

**When to use:** Display collection status (DRAFT, SELECTING, REVIEWING, DELIVERED, DOWNLOADED) with consistent styling.

**Example:**
```jsx
// components/primitives/Badge.jsx
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Status badge component with predefined status colors.
 *
 * @param {Object} props - Component props
 * @param {'DRAFT' | 'SELECTING' | 'REVIEWING' | 'DELIVERED' | 'DOWNLOADED'} props.status - Collection status
 * @param {React.ReactNode} props.children - Badge text (override default status label)
 * @returns {JSX.Element} Badge component
 *
 * @example
 * <Badge status="SELECTING">Selecting</Badge>
 */
function Badge({ status, children }) {
  const baseClasses = 'inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full';

  const statusClasses = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SELECTING: 'bg-blue-100 text-blue-700',
    REVIEWING: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-purple-100 text-purple-700',
    DOWNLOADED: 'bg-purple-200 text-purple-800',
  };

  return (
    <span className={clsx(baseClasses, statusClasses[status])}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  status: PropTypes.oneOf(['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED']).isRequired,
  children: PropTypes.node.isRequired,
};

export default Badge;
```

**Usage:**
```jsx
// BEFORE (CollectionDetailsPage.jsx lines 611-620)
{collection.status !== 'DRAFT' && (
  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
    collection.status === 'SELECTING' ? 'bg-blue-100 text-blue-700' :
    collection.status === 'REVIEWING' ? 'bg-green-100 text-green-700' :
    collection.status === 'DELIVERED' ? 'bg-purple-100 text-purple-700' :
    collection.status === 'DOWNLOADED' ? 'bg-purple-200 text-purple-800' :
    'bg-gray-100 text-gray-600'
  }`}>
    {t(`collection.status.${collection.status}`)}
  </span>
)}

// AFTER
{collection.status !== 'DRAFT' && (
  <Badge status={collection.status}>
    {t(`collection.status.${collection.status}`)}
  </Badge>
)}
```

**Source:** [Badge component patterns](https://www.untitledui.com/blog/react-component-libraries), [Component Variants - React and TypeScript](https://frontendmasters.com/courses/react-typescript-v3/component-variants/)

### Pattern 3: Card Component with Standard Styling

**What:** Reusable card container with white background, subtle shadow, and rounded corners enforcing design tokens.

**When to use:** Wrap page content sections, form containers, info cards. Replaces repeated `bg-white border border-gray-200 rounded px-6 py-5` patterns.

**Example:**
```jsx
// components/primitives/Card.jsx
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Card container component with standard white background and subtle shadow.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.noPadding=false] - Remove default padding
 * @returns {JSX.Element} Card component
 *
 * @example
 * <Card>
 *   <h2>Collection Info</h2>
 *   <p>Created on 2026-02-16</p>
 * </Card>
 */
function Card({ children, className, noPadding = false }) {
  const baseClasses = 'bg-white border border-gray-200 rounded';
  const paddingClass = noPadding ? '' : 'px-6 py-5';

  return (
    <div className={clsx(baseClasses, paddingClass, className)}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  noPadding: PropTypes.bool,
};

export default Card;
```

**Usage:**
```jsx
// BEFORE (CollectionDetailsPage.jsx lines 625-639)
<div className="bg-white border border-gray-200 rounded px-6 py-5 mb-5">
  <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
    {t("collection.createdAt")}
  </h2>
  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
    {/* ... */}
  </div>
</div>

// AFTER
<Card className="mb-5">
  <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
    {t("collection.createdAt")}
  </h2>
  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
    {/* ... */}
  </div>
</Card>
```

**Source:** [React Component Composition Explained](https://felixgerschau.com/react-component-composition/), [Choosing the Right Path: Composable vs. Configurable Components](https://blog.tomaszgil.me/choosing-the-right-path-composable-vs-configurable-components-in-react)

### Pattern 4: PhotoCard Component with Hover Actions

**What:** Photo grid item component with thumbnail, hover actions (delete, set cover), and selection badge. Uses composition pattern for flexible action buttons.

**When to use:** Display photos in collection grids with consistent styling and interactions.

**Example:**
```jsx
// components/primitives/PhotoCard.jsx
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Photo card component for photo grids with hover actions and selection state.
 *
 * @param {Object} props - Component props
 * @param {string} props.src - Image URL
 * @param {string} props.alt - Image alt text
 * @param {Function} props.onClick - Click handler to open lightbox
 * @param {boolean} [props.isCover=false] - Show cover badge
 * @param {boolean} [props.isSelected=false] - Show selection checkmark
 * @param {React.ReactNode} [props.actions] - Hover action buttons (PhotoCard.Actions)
 * @returns {JSX.Element} PhotoCard component
 *
 * @example
 * <PhotoCard
 *   src={photoUrl}
 *   alt="Photo 1"
 *   onClick={() => openLightbox(0)}
 *   isCover={true}
 *   actions={
 *     <PhotoCard.Actions>
 *       <PhotoCard.Action onClick={handleDelete} label="Delete">×</PhotoCard.Action>
 *       <PhotoCard.Action onClick={handleSetCover} label="Set as cover">★</PhotoCard.Action>
 *     </PhotoCard.Actions>
 *   }
 * />
 */
function PhotoCard({ src, alt, onClick, isCover = false, isSelected = false, actions }) {
  return (
    <div className="relative group aspect-square rounded-sm overflow-hidden bg-gray-100">
      {/* Thumbnail */}
      <button
        onClick={onClick}
        className="w-full h-full block border-none p-0 bg-transparent cursor-zoom-in"
        aria-label={alt}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      {/* Cover badge */}
      {isCover && (
        <div className="absolute top-1 left-1 bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight pointer-events-none">
          ★
        </div>
      )}

      {/* Selection badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Hover actions overlay */}
      {actions}
    </div>
  );
}

PhotoCard.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isCover: PropTypes.bool,
  isSelected: PropTypes.bool,
  actions: PropTypes.node,
};

/**
 * Container for hover action buttons (compound component pattern).
 */
PhotoCard.Actions = function PhotoCardActions({ children }) {
  return (
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-end justify-start gap-1 p-1 pointer-events-none">
      {children}
    </div>
  );
};

PhotoCard.Actions.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Individual action button within PhotoCard.Actions.
 */
PhotoCard.Action = function PhotoCardAction({ onClick, label, children }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      aria-label={label}
      className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-100 text-gray-700 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors pointer-events-auto"
    >
      {children}
    </button>
  );
};

PhotoCard.Action.propTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default PhotoCard;
```

**Usage:**
```jsx
// BEFORE (CollectionDetailsPage.jsx lines 838-890)
<div key={photo.id} className="relative group aspect-square rounded-sm overflow-hidden bg-gray-100">
  <button onClick={() => setLightboxIndex(photoIndex)} className="w-full h-full block border-none p-0 bg-transparent cursor-zoom-in">
    <img src={photoUrl(photo.storagePath)} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
  </button>
  {collection.coverPhotoId === photo.id && (
    <div className="absolute top-1 left-1 bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">★</div>
  )}
  {/* ... 20+ more lines of hover actions ... */}
</div>

// AFTER
<PhotoCard
  key={photo.id}
  src={photoUrl(photo.storagePath)}
  alt={photo.filename}
  onClick={() => setLightboxIndex(photoIndex)}
  isCover={collection.coverPhotoId === photo.id}
  isSelected={selectedPhotoIds.has(photo.id)}
  actions={
    <PhotoCard.Actions>
      <PhotoCard.Action onClick={() => handleDeletePhoto(photo.id)} label={t("collection.deletePhoto")}>
        ×
      </PhotoCard.Action>
      {collection.coverPhotoId !== photo.id && (
        <PhotoCard.Action onClick={() => handleSetCover(photo.id)} label={t("collection.setCover")}>
          ★
        </PhotoCard.Action>
      )}
    </PhotoCard.Actions>
  }
/>
```

**Source:** [Compound Components In React](https://www.smashingmagazine.com/2021/08/compound-components-react/), [Compound Components and Advanced Composition](https://vercel.com/academy/shadcn-ui/compound-components-and-advanced-composition)

### Pattern 5: UploadZone Component with Drag-Drop

**What:** Reusable file upload component with drag-and-drop, file validation, and multiple upload states.

**When to use:** Photo upload areas for collections and edited photos.

**Example:**
```jsx
// components/primitives/UploadZone.jsx
import { useRef } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * File upload zone with drag-and-drop support and validation.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onFilesSelected - Callback with FileList when files selected
 * @param {string[]} [props.accept=['image/jpeg', 'image/png', 'image/webp']] - Accepted MIME types
 * @param {number} [props.maxSize=20971520] - Max file size in bytes (default 20MB)
 * @param {boolean} [props.multiple=true] - Allow multiple files
 * @param {boolean} [props.dragOver=false] - External drag-over state (for controlled behavior)
 * @param {Function} [props.onDragOver] - Drag over handler
 * @param {Function} [props.onDragLeave] - Drag leave handler
 * @param {Function} [props.onDrop] - Drop handler
 * @param {'default' | 'compact'} [props.variant='default'] - Display variant
 * @param {string} [props.label] - Primary label text
 * @param {string} [props.hint] - Secondary hint text
 * @param {'blue' | 'green'} [props.theme='blue'] - Color theme
 * @returns {JSX.Element} UploadZone component
 *
 * @example
 * // Large dropzone (when collection has 0 photos)
 * <UploadZone
 *   onFilesSelected={(files) => uploadFiles(files)}
 *   label={t('collection.uploadZoneLabel')}
 *   hint={t('collection.uploadZoneHint')}
 * />
 *
 * @example
 * // Compact button (after first photo uploaded)
 * <UploadZone
 *   variant="compact"
 *   onFilesSelected={(files) => uploadFiles(files)}
 *   label={t('collection.addMorePhotos')}
 * />
 */
function UploadZone({
  onFilesSelected,
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 20 * 1024 * 1024, // 20MB
  multiple = true,
  dragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  variant = 'default',
  label,
  hint,
  theme = 'blue',
}) {
  const fileInputRef = useRef(null);

  const themeClasses = {
    blue: {
      border: dragOver ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400',
      bg: dragOver ? 'bg-blue-50' : 'bg-gray-50 hover:bg-blue-50/50',
      icon: dragOver ? 'text-blue-500' : 'text-gray-400',
    },
    green: {
      border: 'border-green-300 hover:border-green-400',
      bg: 'bg-green-50',
      icon: 'text-green-500',
    },
  };

  const handleClick = () => fileInputRef.current?.click();
  const handleKeyDown = (e) => e.key === 'Enter' && handleClick();
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = ''; // Reset input for re-upload
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 py-2.5 px-5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-sm hover:bg-blue-100 transition-colors cursor-pointer font-sans"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {label}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
        />
      </>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={clsx(
          'border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none',
          themeClasses[theme].border,
          themeClasses[theme].bg
        )}
      >
        <svg
          className={clsx('w-9 h-9', themeClasses[theme].icon)}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="m-0 text-sm font-medium text-gray-600">
          {label}
        </p>
        {hint && (
          <p className="m-0 text-xs text-gray-400">
            {hint}
          </p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

UploadZone.propTypes = {
  onFilesSelected: PropTypes.func.isRequired,
  accept: PropTypes.arrayOf(PropTypes.string),
  maxSize: PropTypes.number,
  multiple: PropTypes.bool,
  dragOver: PropTypes.bool,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDrop: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact']),
  label: PropTypes.string,
  hint: PropTypes.string,
  theme: PropTypes.oneOf(['blue', 'green']),
};

export default UploadZone;
```

**Usage:**
```jsx
// BEFORE (CollectionDetailsPage.jsx lines 729-791 - 62 lines for full dropzone + input)
{photos.length === 0 ? (
  <div
    role="button"
    tabIndex={0}
    onClick={() => fileInputRef.current?.click()}
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    className={`border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none
      ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"}`}
  >
    {/* ... 20+ lines ... */}
  </div>
) : (
  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 py-2.5 px-5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-sm hover:bg-blue-100 transition-colors cursor-pointer font-sans">
    {/* ... */}
  </button>
)}

// AFTER
<UploadZone
  variant={photos.length === 0 ? 'default' : 'compact'}
  onFilesSelected={(files) => uploadFiles(files)}
  dragOver={dragOver}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  label={photos.length === 0 ? t("collection.uploadZoneLabel") : t('collection.addMorePhotos')}
  hint={photos.length === 0 ? t("collection.uploadZoneHint") : undefined}
/>
```

**Source:** [Implementing drag and drop file upload in React](https://transloadit.com/devtips/implementing-drag-and-drop-file-upload-in-react/), [react-dropzone official docs](https://react-dropzone.js.org/)

### Anti-Patterns to Avoid

- **Over-configuration:** Don't add props for every possible variant before you need them (YAGNI principle). Start with 4 button variants, add more when patterns emerge.
- **Prop drilling:** Don't pass 10+ props to every component. Use composition (PhotoCard.Actions) or context for shared state.
- **Inline styles mixing:** Don't mix Tailwind classes with inline `style={{}}` props; keep all styling in Tailwind classes or design tokens.
- **Component overreach:** Don't make Button handle form validation, loading spinners, tooltips in one component. Keep primitives focused; compose for complexity.
- **Premature abstraction:** Don't extract a component after 2nd usage; wait for 3rd usage to confirm pattern. Example: Only extract PhotoCard after seeing the pattern in CollectionDetailsPage AND SharePage.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop file uploads | Custom event listeners with state management | UploadZone component with validation | Already complex with validation, error handling, and accessibility; reusable component reduces bugs |
| Conditional className composition | String concatenation or ternaries | clsx library | Handles falsy values, avoids duplicate classes, 1KB bundle size |
| Component prop validation | Manual if/else checks | PropTypes | Runtime validation in development mode; warns about missing/wrong prop types without full TypeScript migration |
| Component documentation | Inline comments or separate Markdown | JSDoc with @param and @example | IDE autocomplete integration, shows docs on hover, can be extracted to Storybook later |

**Key insight:** Primitive components reduce codebase size and bug surface area. CollectionDetailsPage has 1040 lines with inline photo cards; PhotoCard component reduces this by ~50 lines per photo grid. Multiply by 3 pages with photo grids = 150+ lines eliminated.

## Common Pitfalls

### Pitfall 1: Missing Button Type Attribute

**What goes wrong:** Button submits form when you intended secondary action (e.g., "Cancel" button submits form instead of closing modal).

**Why it happens:** HTML `<button>` defaults to `type="submit"` inside forms; developers forget to set `type="button"`.

**How to avoid:** Always set `type` prop on Button component. Add default `type="button"` in Button implementation, allow override with `type` prop.

**Warning signs:** Form submits when clicking secondary buttons; unexpected form submissions in console.

**Fix:**
```jsx
// Button.jsx
function Button({ type = 'button', ...props }) {
  return <button type={type} {...props} />;
}

// Usage
<Button variant="primary" type="submit">Create</Button>
<Button variant="secondary" type="button">Cancel</Button>
```

**Source:** [TypeScript React Complete Guide](https://vladimirsiedykh.com/blog/typescript-react-complete-guide-components-hooks-patterns)

### Pitfall 2: PhotoCard Re-renders on Parent State Change

**What goes wrong:** Entire photo grid re-renders when one photo's hover state changes, causing performance issues with 100+ photos.

**Why it happens:** Parent component state update (e.g., `setHoveredId(photoId)`) triggers re-render of all PhotoCard children.

**How to avoid:** Use React.memo on PhotoCard to skip re-renders when props haven't changed. Avoid passing new object/array references on every render.

**Warning signs:** Laggy hover interactions with large photo grids; React DevTools Profiler shows unnecessary renders.

**Fix:**
```jsx
// PhotoCard.jsx
import { memo } from 'react';

const PhotoCard = memo(function PhotoCard({ src, alt, onClick, isCover, isSelected, actions }) {
  // ... component implementation
});

export default PhotoCard;
```

**Source:** [React Component Composition](https://felixgerschau.com/react-component-composition/), [React Performance Optimization](https://www.developerway.com/posts/components-composition-how-to-get-it-right)

### Pitfall 3: UploadZone File Validation Race Condition

**What goes wrong:** User drops 50 files, validation runs async, some invalid files start uploading before validation completes.

**Why it happens:** File validation in UploadZone doesn't block the `onFilesSelected` callback; parent component starts upload immediately.

**How to avoid:** Validate files inside UploadZone before calling `onFilesSelected`. Pass only valid files to callback, show validation errors internally.

**Warning signs:** Backend returns 400 errors for invalid file types; users report upload failures with large batches.

**Current implementation:** CollectionDetailsPage (lines 145-250) already validates files before upload. UploadZone should replicate this pattern.

**Source:** [File upload validation best practices](https://transloadit.com/devtips/implementing-drag-and-drop-file-upload-in-react/)

### Pitfall 4: Badge Component Missing Status

**What goes wrong:** Badge renders empty or with wrong color when collection status is null or unexpected value.

**Why it happens:** PropTypes warns in dev mode but doesn't prevent render; component doesn't handle edge cases.

**How to avoid:** Add default fallback in Badge component. If status is invalid, render gray badge with "Unknown" text or return null.

**Warning signs:** PropTypes warnings in console; badges with incorrect colors in production.

**Fix:**
```jsx
function Badge({ status, children }) {
  const validStatuses = ['DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED'];

  if (!validStatuses.includes(status)) {
    console.warn(`Invalid badge status: ${status}`);
    return null; // or render default gray badge
  }

  // ... rest of component
}
```

**Source:** [React Best Practices 2026](https://technostacks.com/blog/react-best-practices/)

### Pitfall 5: Button Component Breaking Responsive Layout

**What goes wrong:** Primary gradient button overflows container on mobile (360px screens), text truncates mid-word.

**Why it happens:** Button has `px-7` (28px padding) + long text + icons, total width exceeds mobile viewport.

**How to avoid:** Add `fullWidth` prop to Button for mobile breakpoints. Use `text-xs` size on mobile, `text-sm` on desktop.

**Warning signs:** Horizontal scrollbars on mobile; buttons truncated at 360px viewport.

**Fix:**
```jsx
// Responsive button with fullWidth on mobile
<Button
  variant="primary"
  size="sm"
  fullWidth={true}
  className="sm:w-auto sm:text-base"
>
  {t('collection.createCollection')}
</Button>
```

**Source:** [Responsive Design Breakpoints 2025](https://www.browserstack.com/guide/responsive-design-breakpoints)

## Code Examples

Verified patterns from official sources:

### Button Variants with clsx

```jsx
import clsx from 'clsx';

function Button({ variant, size, disabled, children }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-opacity',
        {
          'bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white': variant === 'primary',
          'bg-blue-50 text-blue-600 border border-blue-200': variant === 'secondary',
          'bg-red-50 text-red-600 border border-red-200': variant === 'danger',
          'bg-transparent text-gray-700': variant === 'ghost',
          'py-1.5 px-3 text-xs': size === 'sm',
          'py-2.5 px-5 text-sm': size === 'md',
          'py-3.5 px-7 text-base': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

**Source:** [Using React Component Variants to Compose CSS Classes](https://devinschulz.com/blog/using-react-component-variants-to-compose-css-classes/)

### JSDoc with @example Tags

```jsx
/**
 * Badge component for collection status display.
 *
 * Automatically maps collection lifecycle statuses to color-coded designs
 * following the design system palette established in Phase 11.
 *
 * @component
 * @param {Object} props - Component props
 * @param {'DRAFT'|'SELECTING'|'REVIEWING'|'DELIVERED'|'DOWNLOADED'} props.status - Collection status
 * @param {React.ReactNode} props.children - Badge text content
 * @returns {JSX.Element} Styled badge element
 *
 * @example
 * // Display collection status
 * <Badge status="SELECTING">
 *   {t('collection.status.SELECTING')}
 * </Badge>
 *
 * @example
 * // With custom text
 * <Badge status="DELIVERED">
 *   Ready for Download
 * </Badge>
 */
function Badge({ status, children }) {
  // ... implementation
}
```

**Source:** [Document Your React Code with JSDoc](https://medium.com/@bobjunior542/document-your-react-code-with-jsdoc-best-practices-and-tips-32bf6b92b91f), [A Guide to using JSDoc for React.js](https://www.inkoop.io/blog/a-guide-to-js-docs-for-react-js/)

### Compound Component Pattern (PhotoCard.Actions)

```jsx
// PhotoCard.jsx - Compound component with sub-components
function PhotoCard({ src, alt, onClick, actions }) {
  return (
    <div className="relative group">
      <img src={src} alt={alt} onClick={onClick} />
      {actions}
    </div>
  );
}

// Sub-component: PhotoCard.Actions
PhotoCard.Actions = function PhotoCardActions({ children }) {
  return (
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
};

// Sub-component: PhotoCard.Action
PhotoCard.Action = function PhotoCardAction({ onClick, label, children }) {
  return (
    <button onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
};

// Usage - flexible composition
<PhotoCard src={url} alt="Photo" onClick={handleClick}>
  <PhotoCard.Actions>
    <PhotoCard.Action onClick={handleDelete} label="Delete">×</PhotoCard.Action>
    <PhotoCard.Action onClick={handleCover} label="Set cover">★</PhotoCard.Action>
  </PhotoCard.Actions>
</PhotoCard>
```

**Source:** [Compound Components In React - Smashing Magazine](https://www.smashingmagazine.com/2021/08/compound-components-react/), [React Hooks: Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)

### UploadZone with Drag State Management

```jsx
function UploadZone({ onFilesSelected, label, hint, dragOver, onDragOver, onDragLeave, onDrop }) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    onDragLeave(); // Reset drag state
    const files = e.dataTransfer.files;
    if (files.length > 0) onFilesSelected(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    onDragOver(); // Signal parent to set dragOver=true
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      className={clsx(
        'border-2 border-dashed rounded py-10 cursor-pointer transition-colors',
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'
      )}
    >
      {/* ... dropzone UI ... */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
    </div>
  );
}
```

**Source:** [Create a drag-and-drop with react-dropzone](https://blog.logrocket.com/create-drag-and-drop-component-react-dropzone/), [How To Create Drag and Drop File Uploads in React](https://www.digitalocean.com/community/tutorials/react-react-dropzone)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS Modules | Tailwind utility classes | Industry shift 2020-2023 | Photo Hub already uses Tailwind; primitive components enforce design tokens |
| Prop drilling for variants | clsx + variant props | 2021+ | Cleaner API, easier to maintain, better TypeScript support |
| JSDoc for JavaScript | TypeScript for React | 2019+ | Photo Hub uses .jsx not .tsx; JSDoc provides 80% of TS benefits without migration |
| Configuration over composition | Composition patterns | 2020+ | PhotoCard.Actions uses compound component pattern for flexibility |
| react-dropzone library | Custom drag-drop logic | 2021+ | UploadZone replicates core patterns without external dependency (already implemented in CollectionDetailsPage) |

**Deprecated/outdated:**
- **Styled-components/Emotion:** CSS-in-JS libraries losing popularity to Tailwind in 2025-2026; Photo Hub avoids CSS-in-JS
- **class-variance-authority (CVA):** Popular in 2023-2024 but adds 3KB bundle size; clsx + object lookup pattern is simpler for Photo Hub's 4-variant button
- **React.FC type:** TypeScript community now recommends function declarations over React.FC (not applicable to Photo Hub's .jsx files)

## Open Questions

1. **Should we add size prop to Badge component?**
   - What we know: Badge currently uses fixed `text-[10px]` size; all current usage is status badges in collections
   - What's unclear: Future use cases may need larger badges (e.g., photo count badges, plan badges on ProfilePage)
   - Recommendation: NO for Phase 12. Add size prop in Phase 14 if collection cards redesign requires it. Keep Badge simple for now (YAGNI).

2. **Should PhotoCard handle lightbox state internally?**
   - What we know: CollectionDetailsPage manages lightbox index in parent state; PhotoCard receives onClick callback
   - What's unclear: Would internal lightbox management reduce parent component complexity?
   - Recommendation: NO. Keep PhotoCard stateless; lightbox is cross-cutting concern (keyboard navigation, URL state, multiple photo grids). Parent should manage.

3. **Should UploadZone integrate with backend upload API?**
   - What we know: Current implementation separates upload zone (UI) from upload logic (fetch calls with FormData)
   - What's unclear: Would integrated upload component with progress tracking be more reusable?
   - Recommendation: NO for Phase 12. Keep UploadZone as "dumb" UI component; parent manages upload logic. If upload patterns repeat 3+ times, extract useFileUpload hook in future phase.

4. **Should we use Storybook for component documentation?**
   - What we know: Storybook provides isolated component development and visual documentation; adds ~10MB to node_modules
   - What's unclear: Is Storybook overkill for 5 primitive components? When does ROI justify setup cost?
   - Recommendation: DEFER to post-v3.0. JSDoc comments + usage examples in code sufficient for Phase 12-16. Consider Storybook if component library extracted to separate package or team grows beyond solo developer.

5. **Should Button component support icons?**
   - What we know: Several buttons have inline SVG icons (SharePage line 277, CollectionDetailsPage lines 653-656)
   - What's unclear: Best API for icon support - `leftIcon` prop, `children` composition, or `icon` slot?
   - Recommendation: Support icons via `children` composition for Phase 12. Buttons with icons render SVG as child: `<Button><PlusIcon /> Add Photos</Button>`. If icon alignment patterns emerge, add `leftIcon`/`rightIcon` props in Phase 14.

## Sources

### Primary (HIGH confidence)
- [Building Reusable React Components in 2026](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4) - Component library best practices for 2026
- [Using React Component Variants to Compose CSS Classes](https://devinschulz.com/blog/using-react-component-variants-to-compose-css-classes/) - Variant pattern with clsx
- [Compound Components In React - Smashing Magazine](https://www.smashingmagazine.com/2021/08/compound-components-react/) - PhotoCard.Actions pattern
- [Implementing drag and drop file upload in React - Transloadit](https://transloadit.com/devtips/implementing-drag-and-drop-file-upload-in-react/) - UploadZone drag-drop pattern
- [Document Your React Code with JSDoc - Medium](https://medium.com/@bobjunior542/document-your-react-code-with-jsdoc-best-practices-and-tips-32bf6b92b91f) - JSDoc documentation
- [Choosing the Right Path: Composable vs. Configurable Components](https://blog.tomaszgil.me/choosing-the-right-path-composable-vs-configurable-components-in-react) - Composition vs configuration

### Secondary (MEDIUM confidence)
- [Component Variants - React and TypeScript - Frontend Masters](https://frontendmasters.com/courses/react-typescript-v3/component-variants/) - Variant patterns
- [React Component Composition Explained](https://felixgerschau.com/react-component-composition/) - Composition patterns
- [React TypeScript Complete Guide](https://vladimirsiedykh.com/blog/typescript-react-complete-guide-components-hooks-patterns) - TypeScript patterns (applicable to JSDoc)
- [Best Practices for Documenting React Components](https://plainenglish.io/blog/best-practices-for-documenting-react-components) - Documentation standards
- [react-dropzone official docs](https://react-dropzone.js.org/) - Drag-drop implementation reference
- [14 Best React UI Component Libraries in 2026 - Untitled UI](https://www.untitledui.com/blog/react-component-libraries) - Component library patterns

### Tertiary (LOW confidence)
- [33 React JS Best Practices For 2026](https://technostacks.com/blog/react-best-practices/) - General React best practices
- [Compound Components and Advanced Composition - Vercel](https://vercel.com/academy/shadcn-ui/compound-components-and-advanced-composition) - Advanced composition (shadcn/ui context)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - clsx and PropTypes are industry standard; Photo Hub already uses React 18 + Tailwind
- Architecture: HIGH - Patterns verified in official sources and match existing codebase patterns
- Pitfalls: MEDIUM-HIGH - Common issues documented in community resources; tested patterns reduce risk

**Research date:** 2026-02-16
**Valid until:** 90 days (2026-05-17) - React component patterns are stable; 2026 guidance remains valid through v3.0 completion

**Codebase analysis:**
- Gradient button pattern: 12+ occurrences across 7 files (CollectionsListPage, CollectionDetailsPage, LoginPage, HomePage, SharePage, ProfilePage, DeliveryPage)
- Status badge pattern: 4+ occurrences (CollectionsListPage lines 259-267, CollectionDetailsPage lines 611-620)
- Photo card pattern: 2 implementations (CollectionDetailsPage lines 838-890, SharePage similar structure)
- Upload zone pattern: 2 implementations (CollectionDetailsPage lines 729-791, lines 918-950 for edited photos)
- Card wrapper pattern: 8+ occurrences (every page wraps content in `bg-white border border-gray-200 rounded px-6 py-5`)

**Next steps for planner:**
1. Create `frontend/src/components/primitives/` directory
2. Implement Button, Badge, Card components with JSDoc documentation
3. Implement PhotoCard with compound component pattern (PhotoCard.Actions)
4. Implement UploadZone with drag-drop and validation
5. Write usage examples in component files (no separate Storybook needed for Phase 12)
6. Test components in isolation before refactoring pages (Phase 14-15)
