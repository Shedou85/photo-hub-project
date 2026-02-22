import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from './Badge';

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
    <div className="group relative bg-white border border-gray-200 rounded-[10px] overflow-hidden transition-all duration-300 hover:border-blue-300 hover:-translate-y-[2px]">
      {/* Status badge - only show for non-DRAFT */}
      {status !== 'DRAFT' && (
        <div className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm rounded-full">
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
            <h3 className="text-base font-semibold truncate drop-shadow-md mb-1">
              {name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/70 drop-shadow-md">
              <span>{t('collections.photosCount', { count: photoCount })}</span>
              <span>&middot;</span>
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Actions section */}
      {actions && (
        <div className="p-3 flex justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export default CollectionCard;
