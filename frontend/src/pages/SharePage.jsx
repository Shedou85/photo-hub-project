import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
          setCollection(data.collection);
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
          <div className="text-[48px] mb-3">🔍</div>
          <p className="text-gray-700 text-base m-0">{t("share.notFound")}</p>
        </div>
      </div>
    );
  }

  const photos = collection.photos || [];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Content container */}
      <div className="max-w-[720px] mx-auto py-10 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 m-0 mb-2">
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
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-10">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            {t("share.photos")} (0)
          </div>
        )}

        {/* Footer branding */}
        <div className="text-center text-xs text-gray-400 py-5 border-t border-gray-200">
          {t("share.poweredBy")}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Prev arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
            }}
            aria-label={t("share.lightboxPrev")}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Image */}
          <img
            src={photoUrl(photos[lightboxIndex].storagePath)}
            alt={photos[lightboxIndex].filename}
            className="max-w-[88vw] max-h-[88vh] object-contain rounded-[4px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
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
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
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
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center font-bold text-lg transition-colors z-10"
          >
            ×
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
