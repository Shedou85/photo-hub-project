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
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/[0.04] text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.08]'
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
          {/* Header skeleton */}
          <div className="text-center mb-12 animate-pulse">
            <div className="h-10 w-72 bg-white/[0.06] rounded-lg mx-auto mb-3" />
            <div className="h-4 w-48 bg-white/[0.03] rounded mx-auto mb-6" />
            <div className="h-12 w-56 bg-white/[0.06] rounded-xl mx-auto" />
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] rounded-lg bg-white/[0.06] animate-pulse"
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
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-7 h-7 text-white/30"
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
          <p className="text-white/40 text-base m-0">
            {errorMessages[error] || errorMessages.error}
          </p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* ── Celebration Hero ── */}
      <div className="relative overflow-hidden">
        {/* Radial glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(99,102,241,0.12),transparent_60%)]" />
        {/* Blurred circle accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/[0.06] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
          {/* Language selector */}
          <div className="absolute top-4 right-4 flex gap-1.5">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                  i18n.language === code
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/[0.04] text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.08]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Hero title */}
          <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight mb-3 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            {t('delivery.heroTitle')}
          </h1>

          {/* Collection name as subtitle */}
          <p className="text-lg sm:text-xl text-white/50 mb-2 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            {collection.name}
          </p>

          {/* Photo count */}
          <p className="text-sm text-white/30 mb-8 animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
            {t('delivery.photosCount', { count: photos.length })}
          </p>

          {/* Download All as ZIP button — large prominent */}
          {photos.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
              <button
                onClick={() => downloadAllAsZip(deliveryToken)}
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:brightness-110 text-white text-base font-semibold rounded-xl transition-all duration-200 shadow-[0_8px_32px_rgba(99,102,241,0.35)] active:scale-[0.97]"
              >
                <svg
                  className="w-5 h-5"
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
              <p className="text-xs text-white/30 mt-3">{t('delivery.downloadHint')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Photo Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {photos.length > 0 && (
          <>
            {/* Section separator */}
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-xs uppercase tracking-[0.15em] text-white/30 font-medium whitespace-nowrap">
                {t('delivery.individualDownloads')}
              </span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {photos.map((photo, index) => {
                const isLoaded = imagesLoaded.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    className="photo-card-enter group relative aspect-[3/2] rounded-lg overflow-hidden cursor-pointer"
                    style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
                    onClick={() => setLightboxIndex(index)}
                  >
                    {/* Per-image skeleton */}
                    {!isLoaded && (
                      <div className="absolute inset-0 bg-white/[0.06] animate-pulse" />
                    )}

                    <img
                      src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                      alt={photo.filename}
                      className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.05] select-none ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      loading="lazy"
                      onLoad={() => handleImageLoad(photo.id)}
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />

                    {/* Download overlay — bottom gradient with filename + button */}
                    <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                      <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-12 pb-3 px-3">
                        <div className="flex items-center justify-between gap-2 pointer-events-auto">
                          <span className="text-xs text-white/60 truncate">{photo.filename}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPhoto(deliveryToken, photo.id, photo.filename);
                            }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-medium rounded-full transition-all"
                            aria-label={t('delivery.downloadPhoto')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {t('delivery.download')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-white/20"
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
            <p className="text-white/30 text-sm">{t('delivery.noPhotos')}</p>
          </div>
        )}

        {/* ── Footer branding ── */}
        <div className="mt-20 pb-8 text-center">
          <div className="h-px w-16 bg-white/10 mx-auto mb-6" />
          <p className="text-[11px] text-white/20">{t('delivery.poweredBy')}</p>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top gradient fade */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />

          {/* Top-center counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-xs text-white/30 font-medium tabular-nums">
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
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium transition-all duration-200"
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
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
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
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-20">
            <img
              src={photoUrl(photos[lightboxIndex].storagePath)}
              alt={photos[lightboxIndex].filename}
              className="max-w-full max-h-full object-contain rounded select-none animate-scale-in"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>

          {/* Prev — full-height invisible hit area */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
            }}
            aria-label={t('delivery.lightboxPrev')}
            className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 z-10 flex items-center justify-start pl-2 sm:pl-6 group/nav cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover/nav:opacity-100">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>

          {/* Next — full-height invisible hit area */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
            }}
            aria-label={t('delivery.lightboxNext')}
            className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 z-10 flex items-center justify-end pr-2 sm:pr-6 group/nav cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover/nav:opacity-100">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default DeliveryPage;
