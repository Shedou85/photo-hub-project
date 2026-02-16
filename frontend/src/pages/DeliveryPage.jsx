import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { downloadPhoto, downloadAllAsZip } from '../utils/download';

const photoUrl = (storagePath) => {
  const base = import.meta.env.VITE_API_BASE_URL;
  const path = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};

function DeliveryPage() {
  const { deliveryToken } = useParams();
  const { t, i18n } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const languages = [
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null || !collection?.photos) return;
    const handler = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i > 0 ? i - 1 : collection.photos.length - 1));
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (i < collection.photos.length - 1 ? i + 1 : 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, collection?.photos]);

  // Fetch collection and photos on mount
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/deliver/${deliveryToken}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('notFound');
          } else if (response.status === 403) {
            setError('notReady');
          } else {
            setError('error');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.status === 'OK' && data.collection) {
          setCollection(data.collection);
        } else {
          setError('notFound');
        }
      } catch {
        setError('error');
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [deliveryToken]);

  // Language selector component (reusable)
  const LanguageSelector = () => (
    <div className="absolute top-4 right-4 flex gap-2">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors duration-150 ${
            i18n.language === code
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans relative">
        <LanguageSelector />
        <div className="text-gray-500 text-sm">{t('delivery.loading')}</div>
      </div>
    );
  }

  if (error || !collection) {
    const errorMessages = {
      notFound: t('delivery.notFound'),
      notReady: t('delivery.notReady'),
      error: t('delivery.error'),
    };

    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans px-5 relative">
        <LanguageSelector />
        <div className="max-w-[480px] text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-700 text-base m-0">
            {errorMessages[error] || errorMessages.error}
          </p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  return (
    <div className="min-h-screen bg-white font-sans relative">
      <LanguageSelector />
      {/* Content container */}
      <div className="max-w-[720px] mx-auto py-10 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 m-0 mb-2">
            {collection.name}
          </h1>
          {collection.clientName && (
            <p className="text-sm text-gray-500 m-0 mb-3">
              {collection.clientName}
            </p>
          )}
          <p className="text-xs text-gray-400 m-0 mb-5">
            {t('delivery.photosCount', { count: photos.length })}
          </p>

          {/* Download All as ZIP button */}
          {photos.length > 0 && (
            <button
              onClick={() => downloadAllAsZip(deliveryToken)}
              className="inline-flex items-center gap-2 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white font-semibold text-base py-3.5 px-6 rounded hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('delivery.downloadAllAsZip')}
            </button>
          )}
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-10">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-sm overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photoUrl(photo.storagePath)}
                  alt={photo.filename}
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* Hover overlay with download button */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPhoto(deliveryToken, photo.id, photo.filename);
                    }}
                    className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all pointer-events-auto"
                    aria-label={t('delivery.downloadPhoto')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            {t('delivery.noPhotos')}
          </div>
        )}

        {/* Footer branding */}
        <div className="text-center text-xs text-gray-400 py-5 border-t border-gray-200 mt-8">
          {t('delivery.poweredBy')}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Prev arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
            }}
            aria-label={t('delivery.lightboxPrev')}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition-all z-10"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Download button in lightbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadPhoto(deliveryToken, photos[lightboxIndex].id, photos[lightboxIndex].filename);
            }}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('delivery.downloadPhoto')}
          </button>

          {/* Image */}
          <img
            src={photoUrl(photos[lightboxIndex].storagePath)}
            alt={photos[lightboxIndex].filename}
            className="max-w-[88vw] max-h-[88vh] object-contain rounded-[4px] shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />

          {/* Next arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
            }}
            aria-label={t('delivery.lightboxNext')}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition-all z-10"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label={t('delivery.lightboxClose')}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:scale-110 transition-all z-10"
          >
            <svg className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm select-none">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryPage;
