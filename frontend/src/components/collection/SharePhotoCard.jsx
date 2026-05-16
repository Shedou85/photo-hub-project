import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import OptimizedImage from '../primitives/OptimizedImage';
import SelectionBorder from '../primitives/SelectionBorder';
import { photoUrl } from '../../utils/photoUrl';

const SharePhotoCard = memo(({
  photo,
  collection,
  photoLabel,
  isLabeled,
  index,
  originalIndex,
  onOpenLightbox,
  onSetLabel,
  canSelect,
  isLimitReached,
  hasProFeatures,
  accentColor,
  isImageLoaded,
  onImageLoad,
  requestsInFlight
}) => {
  const { t } = useTranslation();

  const isThisPhotoNonRejected = photoLabel === 'SELECTED' || photoLabel === 'FAVORITE';
  const limitBlocksNew = isLimitReached && !isThisPhotoNonRejected;

  return (
    <div 
      className="photo-card-enter"
      style={{ animationDelay: `${Math.min(originalIndex * 40, 600)}ms` }}
    >
      <div
        className={`group relative rounded-xl cursor-pointer transition-all duration-300 border hover:scale-105 hover:z-20 ${
          isLabeled
            ? 'border-white/40 bg-white/5 shadow-2xl scale-[1.02] z-10'
            : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02] hover:shadow-2xl hover:shadow-indigo-500/10'
        }`}
        onClick={() => onOpenLightbox(originalIndex)}
      >
        <div className="relative rounded-xl overflow-hidden w-full h-full">
          <OptimizedImage
            src={collection.watermarked && photo.watermarkedThumbnailPath
              ? photoUrl(photo.watermarkedThumbnailPath)
              : photoUrl(photo.thumbnailPath ?? photo.storagePath)}
            alt={photo.filename}
            lqip={photo.lqip}
            isLoaded={isImageLoaded}
            onLoad={onImageLoad}
            priority={originalIndex < 8}
            className="w-full h-auto select-none"
            containerClassName="w-full h-full"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />

          {/* Bottom vignette on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Selected overlay border + animated trace */}
        {isLabeled && <SelectionBorder label={photoLabel} />}

        {/* Label buttons — vertical stack of 3 */}
        {canSelect && (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetLabel(photo.id, 'FAVORITE');
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                photoLabel === 'FAVORITE'
                  ? 'bg-amber-500 shadow-lg shadow-amber-500/40'
                  : !hasProFeatures || limitBlocksNew
                    ? 'bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-40 cursor-not-allowed'
                    : 'bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-amber-500/70'
              }`}
              title={limitBlocksNew ? t('share.selectionLimitReached') : undefined}
              aria-label={t('share.labelFavorite')}
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            {/* Selected button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetLabel(photo.id, 'SELECTED');
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                photoLabel === 'SELECTED'
                  ? `${!accentColor ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40' : 'shadow-lg'}`
                  : limitBlocksNew
                    ? 'bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-40 cursor-not-allowed'
                    : `bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 ${!accentColor ? 'hover:bg-indigo-500/70' : ''}`
              }`}
              style={photoLabel === 'SELECTED' && accentColor
                ? { backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}66` }
                : (photoLabel !== 'SELECTED' && accentColor ? { '--hover-bg': `${accentColor}b3` } : {})}
              title={limitBlocksNew ? t('share.selectionLimitReached') : undefined}
              aria-label={t('share.labelSelected')}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            {/* Rejected button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetLabel(photo.id, 'REJECTED');
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                photoLabel === 'REJECTED'
                  ? 'bg-red-500 shadow-lg shadow-red-500/40'
                  : hasProFeatures
                    ? 'bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-red-500/70'
                    : 'bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-40 cursor-not-allowed'
              }`}
              aria-label={t('share.labelRejected')}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default SharePhotoCard;
