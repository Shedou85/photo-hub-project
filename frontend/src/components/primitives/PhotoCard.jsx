import { memo } from 'react';
import clsx from 'clsx';

/**
 * PhotoCard component for displaying photo thumbnails in grids with optional selection and cover badges
 *
 * @param {object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 * @param {function} props.onClick - Click handler for the photo (e.g., open lightbox)
 * @param {boolean} [props.isCover=false] - Show cover badge
 * @param {boolean} [props.isSelected=false] - Show selection checkmark
 * @param {React.ReactNode} [props.actions] - Hover action overlay (use PhotoCard.Actions and PhotoCard.Action)
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * // Basic photo card
 * <PhotoCard
 *   src={photoUrl}
 *   alt="Photo 1"
 *   onClick={() => openLightbox(0)}
 * />
 *
 * @example
 * // Photo card with cover badge, selection, and hover actions
 * <PhotoCard
 *   src={photoUrl}
 *   alt="Photo 1"
 *   onClick={() => openLightbox(0)}
 *   isCover={true}
 *   isSelected={selectedIds.has(photo.id)}
 *   actions={
 *     <PhotoCard.Actions>
 *       <PhotoCard.Action onClick={handleDelete} label="Delete">×</PhotoCard.Action>
 *       <PhotoCard.Action onClick={handleSetCover} label="Set as cover">★</PhotoCard.Action>
 *     </PhotoCard.Actions>
 *   }
 * />
 */
const PhotoCard = memo(function PhotoCard({
  src,
  alt,
  onClick,
  isCover = false,
  isSelected = false,
  actions,
  className
}) {
  return (
    <div className={clsx('relative group aspect-square overflow-hidden bg-white/[0.06] rounded-sm', className)}>
      {/* Clickable photo area */}
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

      {/* Selection checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Actions overlay */}
      {actions}
    </div>
  );
});

/**
 * Container for hover action buttons displayed on PhotoCard hover (compound component pattern).
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - PhotoCard.Action elements
 */
PhotoCard.Actions = function PhotoCardActions({ children }) {
  return (
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-end justify-start gap-1 p-1 pointer-events-none">
      {children}
    </div>
  );
};

/**
 * Individual action button within PhotoCard.Actions overlay.
 *
 * @param {object} props - Component props
 * @param {function} props.onClick - Click handler for the action
 * @param {string} props.label - Accessible label for the action
 * @param {React.ReactNode} props.children - Icon content
 */
PhotoCard.Action = function PhotoCardAction({ onClick, label, children }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      title={label}
      aria-label={label}
      className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/30 text-white/70 hover:text-red-400 flex items-center justify-center text-sm font-bold transition-colors pointer-events-auto"
    >
      {children}
    </button>
  );
};

export default PhotoCard;
