import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { downloadPhoto, downloadAllAsZip } from '../utils/download';
import { photoUrl } from '../utils/photoUrl';

function DeliveryPage() {
  const { deliveryToken } = useParams();
  const { t, i18n } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(new Set());

  const languages = [
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];

  const handleImageLoad = useCallback((photoId) => {
    setImagesLoaded((prev) => new Set(prev).add(photoId));
  }, []);

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

  // Fetch delivery data on mount
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/deliver/${deliveryToken}`
        );

        if (!response.ok) {
          if (response.status === 404) setError('notFound');
          else if (response.status === 403) setError('notReady');
          else setError('error');
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

  // Language selector — shared across all states
  const LanguageSelector = () => (
    <div className="absolute top-4 right-4 flex gap-1.5 z-10">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
            i18n.language === code
              ? 'bg-indigo-600 text-white'
              : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // ── Loading state (skeleton) ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans relative">
        <LanguageSelector />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12">
          {/* Header skeleton */}
          <div className="text-center mb-12 animate-pulse">
            <div className="h-3 w-24 bg-slate-800 rounded mx-auto mb-5" />
            <div className="h-9 w-64 bg-slate-800 rounded-lg mx-auto mb-3" />
            <div className="h-4 w-20 bg-slate-800 rounded mx-auto mb-6" />
            <div className="h-10 w-52 bg-slate-800 rounded-lg mx-auto" />
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-slate-800/60 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !collection) {
    const errorMessages = {
      notFound: t('delivery.notFound'),
      notReady: t('delivery.notReady'),
      error: t('delivery.error'),
    };

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans px-5 relative">
        <LanguageSelector />
        <div className="max-w-[480px] text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-7 h-7 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <p className="text-slate-400 text-base m-0">
            {errorMessages[error] || errorMessages.error}
          </p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        {/* Subtle radial gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_70%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10 text-center">
          {/* Language selector */}
          <div className="absolute top-4 right-4 flex gap-1.5">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                  i18n.language === code
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Client name eyebrow */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-4 font-medium">
            {collection.clientName || 'Gallery'}
          </p>

          {/* Collection name */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
            {collection.name}
          </h1>

          {/* Photo count */}
          <p className="text-sm text-slate-500 mb-6">
            {t('delivery.photosCount', { count: photos.length })}
          </p>

          {/* Download All as ZIP button */}
          {photos.length > 0 && (
            <button
              onClick={() => downloadAllAsZip(deliveryToken)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200 shadow-lg shadow-indigo-500/20"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {t('delivery.downloadAllAsZip')}
            </button>
          )}
        </div>
      </div>

      {/* ── Photo Grid ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {photos.map((photo, index) => {
              const isLoaded = imagesLoaded.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  {/* Per-image skeleton */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-slate-800/60 animate-pulse" />
                  )}

                  <img
                    src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                    alt={photo.filename}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 select-none ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(photo.id)}
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
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">{t('delivery.noPhotos')}</p>
          </div>
        )}

        {/* ── Footer branding ── */}
        <div className="mt-16 pt-6 border-t border-white/5 text-center">
          <p className="text-[11px] text-slate-600">{t('delivery.poweredBy')}</p>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top-center counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-sm font-medium tabular-nums">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Top-left: download pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadPhoto(
                deliveryToken,
                photos[lightboxIndex].id,
                photos[lightboxIndex].filename
              );
            }}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {t('delivery.downloadPhoto')}
          </button>

          {/* Top-right: close circle */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label={t('delivery.lightboxClose')}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-16">
            <img
              src={photoUrl(photos[lightboxIndex].storagePath)}
              alt={photos[lightboxIndex].filename}
              className="max-w-full max-h-full object-contain rounded select-none"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>

          {/* Prev arrow — rounded pill button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
            }}
            aria-label={t('delivery.lightboxPrev')}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next arrow — rounded pill button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
            }}
            aria-label={t('delivery.lightboxNext')}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default DeliveryPage;
