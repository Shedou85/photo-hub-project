import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { photoUrl } from "../utils/photoUrl";

function SharePage() {
  const { shareId } = useParams();
  const { t } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());
  const [requestsInFlight, setRequestsInFlight] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [collectionPassword, setCollectionPassword] = useState('');
  const [shareToken, setShareToken] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(new Set());

  const canSelect = collection?.status === 'SELECTING';

  const handleImageLoad = useCallback((photoId) => {
    setImagesLoaded(prev => new Set(prev).add(photoId));
  }, []);

  const toggleSelection = async (photoId) => {
    if (requestsInFlight.has(photoId)) return;

    const wasSelected = selectedPhotoIds.has(photoId);

    // Optimistic update
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      wasSelected ? next.delete(photoId) : next.add(photoId);
      return next;
    });

    setRequestsInFlight(prev => new Set(prev).add(photoId));

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      // Use share token if available, otherwise fall back to password
      const authHeader = shareToken
        ? { 'X-Share-Token': shareToken }
        : collectionPassword ? { 'X-Collection-Password': collectionPassword } : {};
      if (wasSelected) {
        const res = await fetch(`${baseUrl}/share/${shareId}/selections/${photoId}`, {
          method: 'DELETE',
          headers: authHeader,
        });
        if (!res.ok) throw new Error('Deselect failed');
      } else {
        const res = await fetch(`${baseUrl}/share/${shareId}/selections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ photoId }),
        });
        if (!res.ok) throw new Error('Select failed');
      }
    } catch {
      setSelectedPhotoIds(prev => {
        const rollback = new Set(prev);
        wasSelected ? rollback.add(photoId) : rollback.delete(photoId);
        return rollback;
      });
      toast.error(t('share.selectionError'));
    } finally {
      setRequestsInFlight(prev => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  };

  const submitSelections = async () => {
    if (isSubmitting || selectedPhotoIds.size === 0) return;

    setIsSubmitting(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      // Use share token if available, otherwise fall back to password
      const authHeader = shareToken
        ? { 'X-Share-Token': shareToken }
        : collectionPassword ? { 'X-Collection-Password': collectionPassword } : {};
      const res = await fetch(`${baseUrl}/share/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ status: 'REVIEWING' }),
      });

      if (!res.ok) throw new Error('Submit failed');

      const data = await res.json();
      if (data.status === 'OK') {
        setCollection(prev => ({ ...prev, status: 'REVIEWING' }));
        setIsSubmitted(true);
        toast.success(t('share.submitSelectionsSuccess'));
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      toast.error(t('share.submitSelectionsError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim() || passwordSubmitting) return;
    setPasswordSubmitting(true);
    setPasswordError(false);
    setCollectionPassword(passwordInput);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null || !collection?.photos) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i > 0 ? i - 1 : collection.photos.length - 1));
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i < collection.photos.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, collection?.photos]);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const headers = {};
        // Use share token if available, otherwise use password
        if (shareToken) {
          headers['X-Share-Token'] = shareToken;
        } else if (collectionPassword) {
          headers['X-Collection-Password'] = collectionPassword;
        }
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/share/${shareId}`,
          { headers }
        );

        if (!response.ok) {
          if (response.status === 401) {
            const body = await response.json().catch(() => ({}));
            if (body.passwordRequired) {
              setPasswordRequired(true);
              setPasswordError(!!collectionPassword);
              setPasswordSubmitting(false);
              setCollectionPassword('');
              setShareToken(null);
              setLoading(false);
              return;
            }
          }
          if (response.status === 404) {
            setError("notFound");
          } else {
            setError("error");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.status === "OK" && data.collection) {
          const coll = data.collection;

          if ((coll.status === 'DELIVERED' || coll.status === 'DOWNLOADED') && coll.deliveryToken) {
            window.location.href = `/deliver/${coll.deliveryToken}`;
            return;
          }

          // Store share token if provided in response
          if (data.shareToken) {
            setShareToken(data.shareToken);
          }

          setPasswordRequired(false);
          setPasswordSubmitting(false);
          setCollection(coll);
          const initialSelections = new Set(
            (coll.selections || []).map(s => s.photoId)
          );
          setSelectedPhotoIds(initialSelections);
        } else {
          setError("notFound");
        }
      } catch {
        setError("error");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [shareId, collectionPassword, shareToken]);

  // ── Loading state (skeleton) ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12">
          {/* Header skeleton */}
          <div className="text-center mb-12 animate-pulse">
            <div className="h-3 w-24 bg-slate-800 rounded mx-auto mb-5" />
            <div className="h-9 w-64 bg-slate-800 rounded-lg mx-auto mb-3" />
            <div className="h-4 w-20 bg-slate-800 rounded mx-auto" />
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-slate-800/60 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Password gate ──
  if (passwordRequired && !collection) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans px-5">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              {t('share.passwordRequired')}
            </h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                {t('share.passwordLabel')}
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t('share.passwordPlaceholder')}
                className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  passwordError ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-xs mt-1.5">{t('share.passwordError')}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!passwordInput.trim() || passwordSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:text-white/50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {passwordSubmitting ? t('share.passwordSubmitting') : t('share.passwordSubmit')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans px-5">
        <div className="max-w-[480px] text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-slate-400 text-base m-0">{t("share.notFound")}</p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  // ── Success state after submission ──
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans px-5">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {t('share.selectionsSubmitted')}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t('share.selectionsSubmittedMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_70%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10 text-center">
          {/* Photographer branding */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-4 font-medium">
            {collection.clientName || 'Gallery'}
          </p>

          {/* Collection name */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
            {collection.name}
          </h1>

          {/* Photo count */}
          <p className="text-sm text-slate-500 mb-6">
            {t("share.photosCount", { count: photos.length })}
          </p>

          {/* Selection progress pill */}
          {canSelect && selectedPhotoIds.size > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('share.selectedCount', { count: selectedPhotoIds.size })}
            </div>
          )}
        </div>
      </div>

      {/* ── Photo Grid ── */}
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 ${canSelect && selectedPhotoIds.size > 0 ? 'pb-28' : 'pb-12'}`}>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {photos.map((photo, index) => {
              const isSelected = selectedPhotoIds.has(photo.id);
              const isLoaded = imagesLoaded.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950'
                      : ''
                  }`}
                  onClick={() => setLightboxIndex(index)}
                >
                  {/* Skeleton placeholder */}
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

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {/* Selection checkbox */}
                  {canSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(photo.id);
                      }}
                      className={`absolute top-2.5 right-2.5 w-[22px] h-[22px] rounded-[3px] border-2 flex items-center justify-center transition-colors duration-150 ${
                        isSelected
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'bg-transparent border-white/60 group-hover:border-white'
                      }`}
                      aria-label={isSelected ? t('share.selected') : t('share.select')}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">{t("share.photos")} (0)</p>
          </div>
        )}

        {/* ── Footer branding ── */}
        <div className="mt-16 pt-6 border-t border-white/5 text-center">
          <p className="text-[11px] text-slate-600">
            {t("share.poweredBy")}
          </p>
        </div>
      </div>

      {/* ── Floating selection bar ── */}
      {canSelect && selectedPhotoIds.size > 0 && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">
                  {t('share.selectedCount', { count: selectedPhotoIds.size })}
                </span>
              </div>
              <button
                onClick={submitSelections}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:text-white/50 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 text-sm active:scale-[0.97]"
              >
                {isSubmitting ? t('share.submitting') : t('share.submitSelections', { count: selectedPhotoIds.size })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label={t("share.lightboxClose")}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-sm font-medium tabular-nums">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Selection toggle in lightbox */}
          {canSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(photos[lightboxIndex].id);
              }}
              className={`absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedPhotoIds.has(photos[lightboxIndex].id)
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {selectedPhotoIds.has(photos[lightboxIndex].id) ? t('share.selected') : t('share.select')}
            </button>
          )}

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

          {/* Prev arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
            }}
            aria-label={t("share.lightboxPrev")}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
            }}
            aria-label={t("share.lightboxNext")}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default SharePage;
