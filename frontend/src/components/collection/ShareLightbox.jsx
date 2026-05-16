import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { photoUrl, watermarkedPreviewUrl } from '../../utils/photoUrl';

const ShareLightbox = ({
  isOpen,
  currentIndex,
  photos,
  onClose,
  onNavigate,
  canSelect,
  hasProFeatures,
  photoLabels,
  onSetLabel,
  toggleSelection,
  selectedPhotoIds,
  shareId,
  shareToken,
  collectionWatermarked
}) => {
  const { t } = useTranslation();
  const thumbnailsRef = useRef(null);
  const activeThumbRef = useRef(null);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbRef.current && thumbnailsRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  if (!isOpen || !photos[currentIndex]) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/98 backdrop-blur-md flex flex-col overflow-hidden"
      onClick={onClose}
    >
      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />

      {/* Header / Controls - Still absolute to float over image if needed, but we provide padding */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6">
        {/* Selection toggle in lightbox */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {canSelect && hasProFeatures ? (
            <div className="flex items-center gap-1.5">
              {[
                { label: 'FAVORITE', icon: 'star', bg: 'bg-amber-500', shadow: 'shadow-amber-500/30' },
                { label: 'SELECTED', icon: 'check', bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/30' },
                { label: 'REJECTED', icon: 'x', bg: 'bg-red-500', shadow: 'shadow-red-500/30' },
              ].map(({ label, icon, bg, shadow }) => {
                const isActive = photoLabels.get(currentPhoto.id) === label;
                return (
                  <button
                    key={label}
                    onClick={() => onSetLabel(currentPhoto.id, label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `${bg} text-white shadow-lg ${shadow}`
                        : 'bg-white/10 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white border border-white/5'
                    }`}
                  >
                    {icon === 'star' && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                    {icon === 'check' && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {icon === 'x' && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="hidden xs:inline">{t(`share.label${label.charAt(0) + label.slice(1).toLowerCase()}`)}</span>
                  </button>
                );
              })}
            </div>
          ) : canSelect && (
            <button
              onClick={() => toggleSelection(currentPhoto.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedPhotoIds.has(currentPhoto.id)
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/10 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white border border-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {selectedPhotoIds.has(currentPhoto.id) ? t('share.selected') : t('share.select')}
            </button>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <div className="text-[11px] text-white/40 font-mono tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            {currentIndex + 1} / {photos.length}
          </div>
          <button
            onClick={onClose}
            aria-label={t("share.lightboxClose")}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Container - Uses flex-1 to fill all available space */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-8 pt-20 sm:pt-24 min-h-0">
        <img
          src={collectionWatermarked
            ? watermarkedPreviewUrl(shareId, currentPhoto.id, shareToken)
            : photoUrl(currentPhoto.storagePath)}
          alt={currentPhoto.filename}
          className="max-w-full max-h-full object-contain rounded-sm shadow-2xl select-none animate-scale-in"
          crossOrigin={collectionWatermarked ? "use-credentials" : undefined}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
        
        {/* Prev — full-height hit area */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1);
          }}
          aria-label={t("share.lightboxPrev")}
          className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 flex items-center justify-start pl-4 group/nav cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all opacity-0 group-hover/nav:opacity-100 shadow-2xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>

        {/* Next — full-height hit area */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0);
          }}
          aria-label={t("share.lightboxNext")}
          className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 flex items-center justify-end pr-4 group/nav cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all opacity-0 group-hover/nav:opacity-100 shadow-2xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ShareLightbox;
