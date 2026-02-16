import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from './Badge';

/**
 * CollectionCard component - displays a collection with edge-to-edge cover image,
 * gradient overlay, hover elevation, and action buttons
 *
 * @param {object} props - Component props
 * @param {string} props.id - Collection ID
 * @param {string} props.name - Collection name
 * @param {string} props.createdAt - Collection creation date (ISO string)
 * @param {number} props.photoCount - Number of photos in collection
 * @param {'DRAFT' | 'SELECTING' | 'REVIEWING' | 'DELIVERED' | 'DOWNLOADED'} props.status - Collection status
 * @param {string} [props.coverImageUrl] - Cover image URL (optional)
 * @param {React.ReactNode} props.actions - Action buttons to display in footer
 *
 * @example
 * // Collection card with actions
 * <CollectionCard
 *   id="cuid123"
 *   name="Wedding Photos"
 *   createdAt="2025-01-15T10:00:00Z"
 *   photoCount={150}
 *   status="SELECTING"
 *   coverImageUrl="https://example.com/cover.jpg"
 *   actions={
 *     <>
 *       <Button variant="secondary" size="sm">Share</Button>
 *       <Button variant="danger" size="sm">Delete</Button>
 *     </>
 *   }
 * />
 */
function CollectionCard({
  id,
  name,
  createdAt,
  photoCount,
  status,
  coverImageUrl,
  actions
}) {
  const { t } = useTranslation();

  return (
    <div className="group relative bg-white rounded-[16px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Status badge - only show for non-DRAFT */}
      {status !== 'DRAFT' && (
        <div className="absolute top-3 right-3 z-10">
          <Badge status={status} showDot>
            {t(`collections.status.${status}`)}
          </Badge>
        </div>
      )}

      {/* Cover image area - clickable link */}
      <Link to={`/collection/${id}`} className="block">
        <div className="relative aspect-[3/2] overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white text-5xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-bold truncate drop-shadow-md mb-1">
              {name}
            </h3>
            <div className="flex items-center gap-2 text-sm drop-shadow-md">
              <span>{t('collections.photosCount', { count: photoCount })}</span>
              <span>•</span>
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white text-lg font-semibold px-4 py-2 bg-black/50 rounded-md">
              {t('collections.viewCollection')}
            </span>
          </div>
        </div>
      </Link>

      {/* Actions section */}
      <div className="p-4 flex gap-2">
        {actions}
      </div>
    </div>
  );
}

export default CollectionCard;
