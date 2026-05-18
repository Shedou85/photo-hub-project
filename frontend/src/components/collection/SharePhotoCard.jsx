import { memo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import OptimizedImage from '../primitives/OptimizedImage';
import SelectionBorder from '../primitives/SelectionBorder';
import { photoUrl } from '../../utils/photoUrl';

const SharePhotoCard = memo(({
  photo,
  collection,
  photoLabel,
  isLabeled,
  index: _index,
  originalIndex,
  onOpenLightbox,
  onSetLabel,
  canSelect,
  isLimitReached,
  hasProFeatures,
  accentColor,
  isImageLoaded,
  onImageLoad,
  requestsInFlight: _requestsInFlight
}) => {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [showBurst, setShowBurst] = useState(false);
  const lastLabelRef = useRef(photoLabel);

  // Fallback logic for watermarked images
  const watermarkedSrc = collection.watermarked && photo.watermarkedThumbnailPath
    ? photoUrl(photo.watermarkedThumbnailPath)
    : null;
  const regularSrc = photoUrl(photo.thumbnailPath ?? photo.storagePath);
  
  const [currentSrc, setCurrentSrc] = useState(watermarkedSrc || regularSrc);
  const [hasFallbackTriggered, setHasFallbackTriggered] = useState(false);
  
  // Base scale for labeled vs unlabeled
  const baseScale = isLabeled ? 1.02 : 1;
  const hoverScale = 1.05;

  const [tiltStyles, setTiltStyles] = useState({ 
    transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(${baseScale})` 
  });

  // Sync src if collection/photo changes
  useEffect(() => {
    setCurrentSrc(watermarkedSrc || regularSrc);
    setHasFallbackTriggered(false);
  }, [watermarkedSrc, regularSrc]);

  // Trigger burst animation on label change
  useEffect(() => {
    if (photoLabel !== lastLabelRef.current && photoLabel !== null) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 600);
      lastLabelRef.current = photoLabel;
      return () => clearTimeout(timer);
    }
    lastLabelRef.current = photoLabel;
  }, [photoLabel]);

  const handleImageError = () => {
    if (watermarkedSrc && !hasFallbackTriggered) {
      console.warn(`Watermarked image failed to load for photo ${photo.id}, falling back to regular thumbnail.`);
      setCurrentSrc(regularSrc);
      setHasFallbackTriggered(true);
    }
  };

  const isThisPhotoNonRejected = photoLabel === 'SELECTED' || photoLabel === 'FAVORITE';
  const limitBlocksNew = isLimitReached && !isThisPhotoNonRejected;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (max 2 degrees for an extremely subtle feel)
    const rotateX = ((y - centerY) / centerY) * -2;
    const rotateY = ((x - centerX) / centerX) * 2;
    
    setTiltStyles({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hoverScale})`,
      transition: 'transform 0.15s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyles({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(${baseScale})`,
      transition: 'transform 0.4s ease-out'
    });
  };

  return (
    <div 
      className="photo-card-enter"
      style={{ 
        animationDelay: `${Math.min(originalIndex * 40, 600)}ms`,
        perspective: '1000px' // Move perspective to parent for better Safari stability
      }}
    >
      <div
        ref={cardRef}
        className={`group relative rounded-xl cursor-pointer border will-change-transform ${
          isLabeled
            ? 'border-white/40 bg-white/5 shadow-2xl z-10'
            : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:z-20'
        }`}
        style={{
          ...tiltStyles,
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          WebkitTransformStyle: 'preserve-3d',
          transformStyle: 'preserve-3d',
          WebkitTransform: tiltStyles.transform
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onOpenLightbox(originalIndex)}
      >
        <div className="relative rounded-xl overflow-hidden w-full h-full">
          <OptimizedImage
            src={currentSrc}
            alt={photo.filename}
            lqip={photo.lqip}
            isLoaded={isImageLoaded}
            onLoad={onImageLoad}
            onError={handleImageError}
            priority={originalIndex < 8}
            className="w-full h-auto select-none"
            containerClassName="w-full h-full"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />

          {/* Burst Feedback Animation */}
          {showBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className={`w-32 h-32 rounded-full blur-xl selection-burst ${
                photoLabel === 'FAVORITE' ? 'bg-amber-400' :
                photoLabel === 'REJECTED' ? 'bg-red-500' : 'bg-indigo-500'
              }`} />
            </div>
          )}

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

SharePhotoCard.displayName = 'SharePhotoCard';

export default SharePhotoCard;
