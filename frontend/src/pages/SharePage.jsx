import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Button from '../components/primitives/Button';
import { PHOTO_GRID_CLASSES } from '../constants/styles';

const photoUrl = (storagePath) => {
  const base = import.meta.env.VITE_API_BASE_URL;
  const path = storagePath.startsWith("/") ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};

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

  const canSelect = collection?.status === 'SELECTING';

  const toggleSelection = async (photoId) => {
    if (requestsInFlight.has(photoId)) return; // Prevent rapid-click race conditions

    const wasSelected = selectedPhotoIds.has(photoId);

    // Optimistic update
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      wasSelected ? next.delete(photoId) : next.add(photoId);
      return next;
    });

    // Mark request in-flight
    setRequestsInFlight(prev => new Set(prev).add(photoId));

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (wasSelected) {
        const res = await fetch(`${baseUrl}/share/${shareId}/selections/${photoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Deselect failed');
      } else {
        const res = await fetch(`${baseUrl}/share/${shareId}/selections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });
        if (!res.ok) throw new Error('Select failed');
      }
    } catch {
      // Rollback on error
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
      const res = await fetch(`${baseUrl}/share/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        // PUBLIC endpoint — no credentials needed
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/share/${shareId}`
        );

        if (!response.ok) {
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

          // Redirect to delivery page if collection is in delivery phase
          if ((coll.status === 'DELIVERED' || coll.status === 'DOWNLOADED') && coll.deliveryToken) {
            window.location.href = `/deliver/${coll.deliveryToken}`;
            return;
          }

          setCollection(coll);
          // Initialize selections from share endpoint response (added by 03-01)
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
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-gray-500 text-sm">{t("share.loading")}</div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans px-5">
        <div className="max-w-[480px] text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-700 text-base m-0">{t("share.notFound")}</p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Content container */}
      <div className={`max-w-[720px] mx-auto py-10 px-6 ${canSelect && selectedPhotoIds.size > 0 && !isSubmitted ? 'pb-24' : ''}`}>
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
          <p className="text-xs text-gray-400 m-0">
            {t("share.photosCount", { count: photos.length })}
          </p>
          {canSelect && selectedPhotoIds.size > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 py-[6px] px-[14px] bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('share.selectedCount', { count: selectedPhotoIds.size })}
            </div>
          )}
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className={`${PHOTO_GRID_CLASSES} mb-10`}>
            {photos.map((photo, index) => {
              const isSelected = selectedPhotoIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`relative group aspect-square rounded-sm overflow-hidden bg-gray-100 cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                    alt={photo.filename}
                    className="w-full h-full object-cover select-none"
                    loading="lazy"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />

                  {/* Clickable checkbox overlay — only in SELECTING status */}
                  {canSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(photo.id);
                      }}
                      className={`absolute top-2 right-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shadow-sm ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                      aria-label={isSelected ? t('share.selected') : t('share.select')}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
          <div className="text-center py-16 text-gray-400 text-sm">
            {t("share.photos")} (0)
          </div>
        )}

        {/* Submit selections section — only show in SELECTING status with selections */}
        {canSelect && selectedPhotoIds.size > 0 && !isSubmitted && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
            <div className="max-w-[720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-700">
                {t('share.selectedCount', { count: selectedPhotoIds.size })}
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={submitSelections}
                disabled={isSubmitting}
                fullWidth
                className="sm:w-auto"
              >
                {isSubmitting ? t('share.submitting') : t('share.submitSelections', { count: selectedPhotoIds.size })}
              </Button>
            </div>
          </div>
        )}

        {/* Success message after submission */}
        {isSubmitted && (
          <div className="bg-green-50 border border-green-200 rounded p-5 mt-8 text-center">
            <div className="text-green-600 font-semibold text-base mb-2">
              {t('share.selectionsSubmitted')}
            </div>
            <p className="text-sm text-green-700 m-0">
              {t('share.selectionsSubmittedMessage')}
            </p>
          </div>
        )}

        {/* Footer branding */}
        <div className="text-center text-xs text-gray-400 py-5 border-t border-gray-200 mt-8">
          {t("share.poweredBy")}
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
            aria-label={t("share.lightboxPrev")}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition-all z-10"
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Selection toggle in lightbox */}
          {canSelect && lightboxIndex !== null && photos[lightboxIndex] && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(photos[lightboxIndex].id);
              }}
              className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors z-10 ${
                selectedPhotoIds.has(photos[lightboxIndex].id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {selectedPhotoIds.has(photos[lightboxIndex].id) ? t('share.selected') : t('share.select')}
            </button>
          )}

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
              setLightboxIndex((i) =>
                i < photos.length - 1 ? i + 1 : 0
              );
            }}
            aria-label={t("share.lightboxNext")}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition-all z-10"
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label={t("share.lightboxClose")}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:scale-110 transition-all z-10"
          >
            <svg
              className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-lg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
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

export default SharePage;
