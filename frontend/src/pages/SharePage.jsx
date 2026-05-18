import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { photoUrl, watermarkedPreviewUrl } from "../utils/photoUrl";
import SelectionBorder from "../components/primitives/SelectionBorder";
import UpgradeModal from "../components/primitives/UpgradeModal";
import SharePhotoCard from "../components/collection/SharePhotoCard";
import ShareLightbox from "../components/collection/ShareLightbox";
import { useImageLoadingSet } from "../hooks/useImageLoading";
import { getAccentButtonStyle } from "../utils/brandingUtils";
import SEO from "../components/SEO";

const UNLIMITED_ACCESS = true;

function SharePage() {
  const { shareId } = useParams();
  const { t } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [photoLabels, setPhotoLabels] = useState(new Map());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeShownThisSession, setUpgradeShownThisSession] = useState(false);
  const [requestsInFlight, setRequestsInFlight] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [collectionPassword, setCollectionPassword] = useState('');
  const [shareToken, setShareToken] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [preferredColumnCount, setPreferredColumnCount] = useState(null); // null means auto
  const { handleImageLoad, isImageLoaded } = useImageLoadingSet();
  const preloadedRef = useRef(new Set());

  // Track scroll and window size
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Determine column count based on width and preference
  const columnCount = useMemo(() => {
    if (windowWidth < 640) return 2; // Mobile always 2
    
    if (preferredColumnCount) {
      // Respect preference but cap at 3 for tablets
      if (windowWidth < 1024) return Math.min(preferredColumnCount, 3);
      return preferredColumnCount;
    }

    // Auto defaults
    if (windowWidth >= 1024) return 4;
    if (windowWidth >= 768) return 3;
    return 2;
  }, [windowWidth, preferredColumnCount]);

  // Distribute photos into columns for a stable masonry feel
  const columns = useMemo(() => {
    if (!collection?.photos) return [];
    const cols = Array.from({ length: columnCount }, () => []);
    collection.photos.forEach((photo, idx) => {
      cols[idx % columnCount].push(photo);
    });
    return cols;
  }, [collection?.photos, columnCount]);

  const canSelect = collection?.status === 'SELECTING';
  const hasProFeatures = UNLIMITED_ACCESS || (collection?.proFeatures ?? false);
  const branding = collection?.branding ?? null;
  const accentColor = branding?.accentColor || null;
  const selectedPhotoIds = useMemo(() => new Set(photoLabels.keys()), [photoLabels]);
  const labelCounts = useMemo(() => {
    const counts = { FAVORITE: 0, SELECTED: 0, REJECTED: 0 };
    for (const label of photoLabels.values()) {
      if (counts[label] !== undefined) counts[label]++;
    }
    return counts;
  }, [photoLabels]);

  const selectionLimit = collection?.selectionLimit ?? null;
  const nonRejectedCount = labelCounts.SELECTED + labelCounts.FAVORITE;
  const isLimitReached = selectionLimit !== null && nonRejectedCount >= selectionLimit;

  const setLabel = async (photoId, label) => {
    if (requestsInFlight.has(photoId)) return;

    // PRO gate for non-SELECTED labels
    if (!UNLIMITED_ACCESS && label !== 'SELECTED' && !hasProFeatures) {
      if (!upgradeShownThisSession) {
        setShowUpgradeModal(true);
        setUpgradeShownThisSession(true);
      }
      return;
    }

    const currentLabel = photoLabels.get(photoId);
    const isRemoval = currentLabel === label;

    // Client-side selection limit check
    if (!isRemoval && label !== 'REJECTED' && selectionLimit !== null) {
      const isNewSelection = !currentLabel || currentLabel === 'REJECTED';
      if (isNewSelection && nonRejectedCount >= selectionLimit) {
        toast.error(t('share.selectionLimitReachedToast', { limit: selectionLimit }));
        return;
      }
    }

    // Optimistic update
    setPhotoLabels(prev => {
      const next = new Map(prev);
      if (isRemoval) {
        next.delete(photoId);
      } else {
        next.set(photoId, label);
      }
      return next;
    });

    setRequestsInFlight(prev => new Set(prev).add(photoId));

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const authHeader = shareToken
        ? { 'X-Share-Token': shareToken }
        : collectionPassword ? { 'X-Collection-Password': collectionPassword } : {};

      if (isRemoval) {
        const res = await fetch(`${baseUrl}/share/${shareId}/selections/${photoId}`, {
          method: 'DELETE',
          headers: authHeader,
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Deselect failed');
      } else {
        const res = await fetch(`${baseUrl}/share/${shareId}/selections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ photoId, label }),
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.error === 'SELECTION_LIMIT_REACHED') {
            throw { limitReached: true };
          }
          throw new Error('Select failed');
        }
      }
    } catch (err) {
      // Rollback
      setPhotoLabels(prev => {
        const rollback = new Map(prev);
        if (isRemoval) {
          rollback.set(photoId, currentLabel);
        } else if (currentLabel) {
          rollback.set(photoId, currentLabel);
        } else {
          rollback.delete(photoId);
        }
        return rollback;
      });
      if (err?.limitReached) {
        toast.error(t('share.selectionLimitReachedToast', { limit: selectionLimit }));
      } else {
        toast.error(t('share.selectionError'));
      }
    } finally {
      setRequestsInFlight(prev => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  };

  const toggleSelection = (photoId) => setLabel(photoId, 'SELECTED');

  const handleOpenReviewModal = useCallback(() => {
    if (selectedPhotoIds.size === 0) return;
    setShowReviewModal(true);
    document.body.classList.add('overflow-hidden');
  }, [selectedPhotoIds.size]);

  const handleCloseReviewModal = useCallback(() => {
    setShowReviewModal(false);
    document.body.classList.remove('overflow-hidden');
  }, []);

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
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Submit failed');

      const data = await res.json();
      if (data.status === 'OK') {
        setCollection(prev => ({ ...prev, status: 'REVIEWING' }));
        setShowReviewModal(false);
        document.body.classList.remove('overflow-hidden');
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

  // Preload adjacent lightbox images
  useEffect(() => {
    if (lightboxIndex === null || !collection?.photos) return;
    const photos = collection.photos;
    const indices = [
      (lightboxIndex - 1 + photos.length) % photos.length,
      (lightboxIndex + 1) % photos.length,
    ];
    for (const idx of indices) {
      if (preloadedRef.current.has(idx)) continue;
      const photo = photos[idx];
      if (!photo) continue;
      const url = collection.watermarked
        ? watermarkedPreviewUrl(shareId, photo.id, shareToken)
        : photoUrl(photo.storagePath);
      const img = new Image();
      img.src = url;
      preloadedRef.current.add(idx);
    }
  }, [lightboxIndex, collection, shareId, shareToken]);

  // Escape key handler for review modal
  useEffect(() => {
    if (!showReviewModal) return;
    const handler = (e) => {
      if (e.key === "Escape") handleCloseReviewModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showReviewModal, handleCloseReviewModal]);

  // Auto-close review modal if all photos are removed
  useEffect(() => {
    if (showReviewModal && selectedPhotoIds.size === 0) {
      handleCloseReviewModal();
    }
  }, [showReviewModal, selectedPhotoIds.size, handleCloseReviewModal]);

  // Cleanup overflow-hidden on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

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
          { headers, credentials: 'include' }
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
          if (UNLIMITED_ACCESS) {
            coll.proFeatures = true;
            if (coll.status === 'SELECTING') coll.watermarked = true;
          }
          setCollection(coll);
          const initialLabels = new Map(
            (coll.selections || []).map(s => [s.photoId, s.label || 'SELECTED'])
          );
          setPhotoLabels(initialLabels);
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
  }, [shareId, collectionPassword]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading state (Advanced Masonry Skeleton) ──
  if (loading) {
    const skeletonColumnCount = windowWidth >= 1024 ? 4 : windowWidth >= 768 ? 3 : 2;
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
          {/* Header skeleton */}
          <div className="text-center mb-16 animate-pulse">
            <div className="h-4 w-24 bg-white/[0.05] rounded-full mx-auto mb-6" />
            <div className="h-16 w-3/4 max-w-lg bg-white/[0.05] rounded-2xl mx-auto mb-4" />
            <div className="h-4 w-48 bg-white/[0.03] rounded-lg mx-auto" />
          </div>

          {/* Masonry Grid Skeleton */}
          <div className="flex gap-4 items-start max-w-7xl mx-auto">
            {Array.from({ length: skeletonColumnCount }).map((_, colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-4">
                {[...Array(colIdx % 2 === 0 ? 3 : 4)].map((_, i) => {
                  // Varied heights for masonry feel
                  const heights = ['aspect-[4/5]', 'aspect-[3/2]', 'aspect-[1/1]', 'aspect-[2/3]'];
                  const heightClass = heights[(i + colIdx) % heights.length];
                  
                  return (
                    <div 
                      key={i} 
                      className={`relative w-full ${heightClass} rounded-xl bg-white/[0.03] overflow-hidden border border-white/[0.05]`}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
                    </div>
                  );
                })}
              </div>
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
        <div className="w-full max-w-[380px] animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-serif-display text-2xl text-white mb-2">
              {t('share.passwordRequired')}
            </h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5">
                {t('share.passwordLabel')}
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t('share.passwordPlaceholder')}
                className={`w-full px-4 py-3 bg-white/[0.04] border rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.08] transition-colors ${
                  passwordError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'
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
              className="w-full py-3 px-4 bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_4px_16px_rgba(99,102,241,0.35)]"
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
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-white/40 text-base m-0">{t("share.notFound")}</p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  // Cover photo for hero background
  const coverPhoto = collection.coverPhotoId
    ? photos.find(p => p.id === collection.coverPhotoId) || photos[0]
    : photos[0];

  // ── Success state after submission ──
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans px-5">
        <div className="text-center max-w-md animate-scale-in">
          <div className="w-24 h-24 rounded-full border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path className="check-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif-display text-3xl text-white mb-4">
            {t('share.selectionsSubmitted')}
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            {t('share.selectionsSubmittedMessage')}
          </p>
        </div>
      </div>
    );
  }

  const selectedCount = selectedPhotoIds.size;
  const progressTotal = selectionLimit ?? photos.length;
  const progressPercent = progressTotal > 0 ? Math.min((nonRejectedCount / progressTotal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <SEO
        title={collection?.name || t('share.photos')}
        description={t('seo.shareDescription', { name: collection?.name || '' })}
        path={`/share/${shareId}`}
        noindex
      />
      {/* ── Hero Section with Parallax Cover ── */}
      <div className="relative h-[65vh] sm:h-[85vh] overflow-hidden flex items-center justify-center">
        {/* Parallax background wrapper */}
        {coverPhoto && (
          <div 
            className="absolute inset-0 z-0 will-change-transform"
            style={{ 
              transform: `translateY(${scrollY * 0.4}px)`,
            }}
          >
            <img
              src={collection.watermarked && coverPhoto.watermarkedThumbnailPath
                ? photoUrl(coverPhoto.watermarkedThumbnailPath)
                : photoUrl(coverPhoto.thumbnailPath ?? coverPhoto.storagePath)}
              alt=""
              className="w-full h-full object-cover scale-110 brightness-[0.45]"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Refined gradient overlay for better text contrast and transition to grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.3)_100%)] z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/40 to-slate-950 z-[2]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Photographer branding logo */}
          {branding?.logoUrl && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0s', opacity: 0 }}>
              <img
                src={branding.logoUrl}
                alt={branding.photographerName || ''}
                className="h-12 sm:h-16 mx-auto object-contain opacity-90 drop-shadow-2xl"
              />
            </div>
          )}

          {/* Client name eyebrow */}
          <div className="inline-block px-4 py-1.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8 animate-fade-in-up shadow-2xl" style={{ animationDelay: '0.05s', opacity: 0 }}>
            <p className="text-[10px] sm:text-[12px] uppercase tracking-[0.4em] text-white/80 font-bold">
              {collection.clientName || 'Gallery'}
            </p>
          </div>

          {/* Collection name - Enhanced Typography with Gradient & Serif */}
          <h1 className="font-serif-display text-6xl sm:text-8xl lg:text-9xl font-black mb-8 animate-fade-in-up drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] leading-[0.9] tracking-tight" style={{ animationDelay: '0.15s', opacity: 0 }}>
            <span className="bg-[linear-gradient(180deg,#ffffff_30%,#a5b4fc_100%)] bg-clip-text text-transparent italic mr-2">
              {collection.name.split(' ')[0]}
            </span>
            <span className="text-white block sm:inline mt-2 sm:mt-0">
              {collection.name.split(' ').slice(1).join(' ')}
            </span>
          </h1>

          {/* Subtitle for clients - Light weight and better spacing */}
          {canSelect && (
            <p className="text-lg sm:text-xl text-white/50 mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up tracking-wide" style={{ animationDelay: '0.25s', opacity: 0 }}>
              {t('share.heroSubtitle')}
            </p>
          )}

          {/* Photo count and Selection progress */}
          <div className="flex flex-col items-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
            {canSelect && (selectedCount > 0 || selectionLimit !== null) && (
              <div className="flex flex-col items-center">
                {selectionLimit !== null ? (
                  <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-4 backdrop-blur-md ${
                    isLimitReached
                      ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('share.selectionLimit', { current: nonRejectedCount, limit: selectionLimit })}
                  </div>
                ) : hasProFeatures ? (
                  <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm font-semibold mb-4 shadow-xl">
                    {labelCounts.FAVORITE > 0 && (
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {labelCounts.FAVORITE}
                      </span>
                    )}
                    {labelCounts.SELECTED > 0 && (
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {labelCounts.SELECTED}
                      </span>
                    )}
                    {labelCounts.REJECTED > 0 && (
                      <span className="flex items-center gap-1.5 text-red-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {labelCounts.REJECTED}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-4 backdrop-blur-md shadow-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('share.selectedCount', { count: selectedCount })}
                  </div>
                )}
                {/* Progress bar */}
                <div className="w-56 h-[4px] bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)] ${!accentColor ? 'bg-gradient-to-r from-indigo-500 to-blue-400' : ''}`}
                    style={{ width: `${progressPercent}%`, ...(accentColor ? { background: accentColor, boxShadow: `0 0 10px ${accentColor}80` } : {}) }}
                  />
                </div>
              </div>
            )}
            <p className="text-[12px] tracking-[0.2em] text-white/40 uppercase font-medium">
              {t("share.photosCount", { count: photos.length })}
            </p>
          </div>
        </div>

        {/* Scroll indicator mouse icon */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-30">
          <div className="w-5 h-8 border-2 border-white rounded-full flex justify-center pt-2">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Photo Grid ── */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 ${canSelect && selectedCount > 0 ? 'pb-28' : 'pb-12'}`}>
        
        {/* Grid Density Controls */}
        {photos.length > 0 && (
          <div className="flex justify-end mb-8 animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setPreferredColumnCount(num)}
                  className={`flex items-center justify-center w-11 h-10 rounded-xl transition-all duration-500 ${
                    columnCount === num 
                      ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                      : 'text-white/20 hover:text-white/50 hover:bg-white/[0.05]'
                  }`}
                  title={`${num} ${t('common.columns', { defaultValue: 'Columns' })}`}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: num }).map((_, i) => (
                      <div key={i} className={`w-[3px] h-3.5 rounded-full transition-colors duration-500 ${columnCount === num ? 'bg-indigo-400' : 'bg-current'}`} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {photos.length > 0 && (
          <div className="flex gap-4 items-start">
            {columns.map((columnPhotos, colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-4">
                {columnPhotos.map((photo) => {
                  const photoLabel = photoLabels.get(photo.id);
                  const isLabeled = !!photoLabel;
                  const originalIndex = photos.findIndex(p => p.id === photo.id);
                  
                  return (
                    <SharePhotoCard
                      key={photo.id}
                      photo={photo}
                      collection={collection}
                      photoLabel={photoLabel}
                      isLabeled={isLabeled}
                      originalIndex={originalIndex}
                      onOpenLightbox={setLightboxIndex}
                      onSetLabel={setLabel}
                      canSelect={canSelect}
                      isLimitReached={isLimitReached}
                      hasProFeatures={hasProFeatures}
                      accentColor={accentColor}
                      isImageLoaded={isImageLoaded(photo.id)}
                      onImageLoad={() => handleImageLoad(photo.id)}
                      requestsInFlight={requestsInFlight}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">{t("share.photos")} (0)</p>
          </div>
        )}

        {/* ── Footer branding ── */}
        <div className="mt-20 pb-8 text-center">
          <div className="h-px w-16 bg-white/10 mx-auto mb-6" />
          {branding?.logoUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={branding.logoUrl}
                alt={branding.photographerName || ''}
                className="h-8 object-contain opacity-60"
              />
              <p className="text-[10px] text-white/15">
                {t("share.poweredBy")}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-white/20">
              {t("share.poweredBy")}
            </p>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom CTA Bar ── */}
      {canSelect && selectedCount > 0 && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up">
          {/* Gradient glow line */}
          <div
            className={`h-px ${!accentColor ? 'bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent' : ''}`}
            style={accentColor ? { background: `linear-gradient(to right, transparent, ${accentColor}66, transparent)` } : undefined}
          />
          <div className="bg-slate-900/95 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${!accentColor ? 'bg-indigo-500/10' : ''}`}
                  style={accentColor ? { backgroundColor: `${accentColor}1a` } : undefined}
                >
                  <svg className="w-4 h-4" style={accentColor ? { color: accentColor } : undefined} fill="none" viewBox="0 0 24 24" stroke={accentColor || undefined} strokeWidth={2}>
                    <path className={!accentColor ? 'text-indigo-400 stroke-current' : ''} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">
                  {selectionLimit !== null
                    ? t('share.selectionLimit', { current: nonRejectedCount, limit: selectionLimit })
                    : t('share.selectedCount', { count: selectedCount })}
                </span>
              </div>
              <button
                onClick={handleOpenReviewModal}
                className={`hover:brightness-110 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 text-sm active:scale-[0.97] ${
                  !accentColor ? 'bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_20px_rgba(99,102,241,0.3)]' : ''
                }`}
                style={getAccentButtonStyle(accentColor)}
              >
                {t('share.submitSelections', { count: selectedCount })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      <ShareLightbox
        isOpen={lightboxIndex !== null}
        currentIndex={lightboxIndex}
        photos={photos}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        canSelect={canSelect}
        hasProFeatures={hasProFeatures}
        photoLabels={photoLabels}
        onSetLabel={setLabel}
        toggleSelection={toggleSelection}
        selectedPhotoIds={selectedPhotoIds}
        shareId={shareId}
        shareToken={shareToken}
        collectionWatermarked={collection?.watermarked}
      />

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex flex-col animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={t('share.reviewTitle')}
        >
          {/* Modal content container */}
          <div className="flex flex-col h-full bg-slate-950 animate-scale-in">

            {/* Header */}
            <div className="flex-shrink-0 flex items-start justify-between px-5 sm:px-8 pt-6 pb-5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                  {t('share.reviewTitle')}
                </h2>
                <p className="text-sm text-white/50 mt-1 leading-relaxed max-w-md">
                  {t('share.reviewSubtitle')}
                </p>
              </div>
              <button
                onClick={handleCloseReviewModal}
                aria-label={t('share.editSelection')}
                className="flex-shrink-0 ml-4 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Selected count badge */}
            <div className="flex-shrink-0 px-5 sm:px-8 pt-4 pb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('share.selectedCount', { count: selectedPhotoIds.size })}
              </span>
            </div>

            {/* Scrollable photo grid */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {photos
                  .filter(photo => selectedPhotoIds.has(photo.id))
                  .map(photo => (
                    <div
                      key={photo.id}
                      className="group/review relative aspect-[4/5] rounded-lg overflow-hidden"
                    >
                      <img
                        src={collection.watermarked && photo.watermarkedThumbnailPath
                          ? photoUrl(photo.watermarkedThumbnailPath)
                          : photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                      {/* Selected indicator border */}
                      <SelectionBorder label={photoLabels.get(photo.id)} />
                      {/* Label badge */}
                      {photoLabels.get(photo.id) && (
                        <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none ${
                          photoLabels.get(photo.id) === 'FAVORITE' ? 'bg-amber-500' :
                          photoLabels.get(photo.id) === 'REJECTED' ? 'bg-red-500' : 'bg-indigo-500'
                        }`}>
                          {photoLabels.get(photo.id) === 'FAVORITE' && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                          {photoLabels.get(photo.id) === 'SELECTED' && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {photoLabels.get(photo.id) === 'REJECTED' && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={() => toggleSelection(photo.id)}
                        disabled={requestsInFlight.has(photo.id)}
                        aria-label={t('share.removeFromSelection')}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-red-500 hover:text-white transition-all duration-200 sm:opacity-0 sm:group-hover/review:opacity-100 disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sticky bottom action bar */}
            <div className="flex-shrink-0 border-t border-white/[0.08]">
              {/* Gradient glow line */}
              <div
                className={`h-px ${!accentColor ? 'bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent' : ''}`}
                style={accentColor ? { background: `linear-gradient(to right, transparent, ${accentColor}4d, transparent)` } : undefined}
              />
              <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  onClick={handleCloseReviewModal}
                  disabled={isSubmitting}
                  className="order-2 sm:order-1 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1] transition-all disabled:opacity-50"
                >
                  {t('share.editSelection')}
                </button>
                <button
                  onClick={submitSelections}
                  disabled={isSubmitting || selectedPhotoIds.size === 0}
                  className={`order-1 sm:order-2 px-6 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 text-white transition-all active:scale-[0.97] ${
                    !accentColor ? 'bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] shadow-[0_4px_16px_rgba(99,102,241,0.35)]' : ''
                  }`}
                  style={getAccentButtonStyle(accentColor)}
                >
                  {isSubmitting ? t('share.confirming') : t('share.confirmSelection')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          showCta={false}
        />
      )}
    </div>
  );
}

export default SharePage;
