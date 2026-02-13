import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">
        {value}
      </span>
    </div>
  );
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_CONCURRENT_UPLOADS = 3;

const photoUrl = (storagePath) => {
  const base = import.meta.env.VITE_API_BASE_URL;
  const path = storagePath.startsWith("/") ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};

function CollectionDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const uploadBatchCounter = useRef(0);

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStates, setUploadStates] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [selections, setSelections] = useState([]);
  const [filter, setFilter] = useState('all');

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, photos.length]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/photos`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") setPhotos(data.photos || []);
      }
    } catch {
      // non-critical, photos just won't refresh
    }
  }, [id]);

  const fetchSelections = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/selections`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") setSelections(data.selections || []);
      }
    } catch {
      // non-critical, selections just won't load
    }
  }, [id]);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/collections/${id}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch collection details");
        const data = await response.json();
        if (data.status === "OK") {
          setCollection(data.collection);
        } else {
          setError(data.error || "An unknown error occurred.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
    fetchPhotos();
    fetchSelections();
  }, [id, fetchPhotos, fetchSelections]);

  // Reset filter when collection changes
  useEffect(() => {
    setFilter('all');
  }, [id]);

  const uploadFiles = async (files) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    // Client-side validation before uploading
    const batchId = ++uploadBatchCounter.current;
    const validFiles = [];
    const keys = [];
    let hasValidationErrors = false;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const key = `${batchId}-${file.name}-${i}`;
      keys.push(key);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadStates((prev) => ({ ...prev, [key]: "invalid-type" }));
        hasValidationErrors = true;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadStates((prev) => ({ ...prev, [key]: "too-large" }));
        hasValidationErrors = true;
        continue;
      }
      validFiles.push({ file, key });
    }

    if (hasValidationErrors) {
      toast.error(t("collection.uploadValidationError"));
    }

    // Mark valid files as uploading
    if (validFiles.length > 0) {
      setUploadStates((prev) => {
        const next = { ...prev };
        validFiles.forEach(({ key }) => (next[key] = "uploading"));
        return next;
      });
    }

    // Upload with concurrency limiter
    let idx = 0;
    let successCount = 0;
    let autoCoverPhotoId = null;
    const uploadNext = async () => {
      while (idx < validFiles.length) {
        const current = idx++;
        const { file, key } = validFiles[current];
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/photos`,
            { method: "POST", credentials: "include", body: formData }
          );
          if (res.ok) {
            successCount++;
            try {
              const data = await res.json();
              if (data.autoSetCover && data.photo?.id) {
                autoCoverPhotoId = data.photo.id;
              }
            } catch {
              // non-critical: response parse failure doesn't block upload
            }
          }
          setUploadStates((prev) => ({
            ...prev,
            [key]: res.ok ? "done" : "error",
          }));
        } catch {
          setUploadStates((prev) => ({ ...prev, [key]: "error" }));
        }
      }
    };

    const workers = [];
    for (let w = 0; w < Math.min(MAX_CONCURRENT_UPLOADS, validFiles.length); w++) {
      workers.push(uploadNext());
    }
    await Promise.all(workers);

    if (autoCoverPhotoId) {
      setCollection((prev) => ({ ...prev, coverPhotoId: autoCoverPhotoId }));
    }

    await fetchPhotos();

    if (successCount > 0) {
      toast.success(t("collection.uploadSuccess"));
    }

    // Clear done/validation states after a short delay
    setTimeout(() => {
      setUploadStates((prev) => {
        const next = { ...prev };
        keys.forEach((k) => {
          if (next[k] === "done" || next[k] === "invalid-type" || next[k] === "too-large") {
            delete next[k];
          }
        });
        return next;
      });
    }, 3000);
  };

  const handleFileChange = (e) => {
    uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const doDeletePhoto = async (photoId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/photos/${photoId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        const remaining = photos.filter((p) => p.id !== photoId);
        setPhotos(remaining);

        // Auto-promote cover if the deleted photo was the cover
        if (collection.coverPhotoId === photoId && remaining.length > 0) {
          // Find the next photo: the one after the deleted photo in the original list, or first if deleted was last
          const deletedIndex = photos.findIndex((p) => p.id === photoId);
          const promotedIndex = deletedIndex < remaining.length ? deletedIndex : 0;
          const promotedId = remaining[promotedIndex].id;

          // Update local state immediately (optimistic)
          setCollection((prev) => ({ ...prev, coverPhotoId: promotedId }));

          // Persist to backend
          try {
            await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/cover`,
              {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoId: promotedId }),
              }
            );
          } catch {
            // Non-critical: cover badge already updated in UI; backend will be consistent on next load
          }
        } else if (collection.coverPhotoId === photoId) {
          // No remaining photos — clear the cover
          setCollection((prev) => ({ ...prev, coverPhotoId: null }));
        }

        // Close lightbox if open
        setLightboxIndex(null);
      } else {
        toast.error(t("collection.deleteError"));
      }
    } catch {
      toast.error(t("collection.deleteError"));
    }
  };

  const handleDeletePhoto = (photoId) => {
    toast(t("collection.confirmDelete"), {
      position: "bottom-center",
      action: {
        label: t("collection.deletePhoto"),
        onClick: () => doDeletePhoto(photoId),
      },
      cancel: {
        label: t("common.cancel"),
        onClick: () => {},
      },
      duration: 8000,
    });
  };

  const handleSetCover = async (photoId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/cover`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId }),
        }
      );
      if (res.ok) {
        setCollection((prev) => ({ ...prev, coverPhotoId: photoId }));
      } else {
        toast.error(t("collection.setCoverError"));
      }
    } catch {
      toast.error(t("collection.setCoverError"));
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/share/${collection.shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t("collection.linkCopied"));
    });
  };

  const handleStartSelecting = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SELECTING' }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') {
          setCollection(data.collection);
          toast.success(t('collection.statusUpdated'));
        }
      } else {
        toast.error(t('collection.statusUpdateError'));
      }
    } catch {
      toast.error(t('collection.statusUpdateError'));
    }
  };

  const anyUploading = useMemo(
    () => Object.values(uploadStates).some((s) => s === "uploading"),
    [uploadStates]
  );
  const uploadErrors = useMemo(
    () => Object.values(uploadStates).filter((s) => s === "error").length,
    [uploadStates]
  );
  const validationErrors = useMemo(
    () => Object.values(uploadStates).filter((s) => s === "invalid-type" || s === "too-large").length,
    [uploadStates]
  );

  const selectedPhotoIds = useMemo(
    () => new Set(selections.map(s => s.photoId)),
    [selections]
  );

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return photos;
    if (filter === 'selected') return photos.filter(p => selectedPhotoIds.has(p.id));
    if (filter === 'not-selected') return photos.filter(p => !selectedPhotoIds.has(p.id));
    return photos;
  }, [filter, photos, selectedPhotoIds]);

  if (loading) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        {t("collection.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-7 px-6 font-sans max-w-[720px] mx-auto">
        <div className="text-red-800 bg-red-50 border border-red-300 rounded-md px-[14px] py-3 text-[13px]">
          {t("collection.error")} {error}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        {t("collection.notFound")}
      </div>
    );
  }

  return (
    <div className="py-7 px-6 font-sans max-w-[720px] mx-auto">
      {/* ── Back link ── */}
      <Link
        to="/collections"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-blue-600 no-underline mb-5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("collection.backToCollections")}
      </Link>

      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-[14px]">
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center text-[22px] shrink-0 select-none">
          🗂️
        </div>
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-[22px] font-bold text-gray-900 leading-tight">
            {collection.name}
          </h1>
          {collection.status !== 'DRAFT' && (
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              collection.status === 'SELECTING' ? 'bg-blue-100 text-blue-700' :
              collection.status === 'REVIEWING' ? 'bg-green-100 text-green-700' :
              collection.status === 'DELIVERED' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {t(`collection.status.${collection.status}`)}
            </span>
          )}
        </div>
      </div>

      {/* ── Collection Info Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t("collection.createdAt")}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[18px]">
          <InfoRow
            label={t("collection.createdAt")}
            value={new Date(collection.createdAt).toLocaleDateString()}
          />
          <InfoRow
            label={t("collection.statusLabel")}
            value={t(`collection.status.${collection.status}`)}
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-2 py-[9px] px-[22px] text-[14px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6,#6366f1)] border-none rounded-[6px] cursor-pointer font-sans transition-opacity duration-150 hover:opacity-[0.88]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {t("collection.copyShareLink")}
          </button>
          {collection.status === 'DRAFT' && (
            <button
              onClick={handleStartSelecting}
              className="inline-flex items-center gap-2 py-[9px] px-[22px] text-[14px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6,#6366f1)] border-none rounded-[6px] cursor-pointer font-sans transition-opacity duration-150 hover:opacity-[0.88]"
            >
              {t('collection.startSelecting')}
            </button>
          )}
        </div>
      </div>

      {/* ── Upload Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t("collection.photos")}
          {photos.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case tracking-normal">
              {t("collection.photosCount", { count: photos.length })}
            </span>
          )}
        </h2>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label={t("collection.uploadZoneLabel")}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-[10px] flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none
            ${dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
            }`}
        >
          <svg className={`w-9 h-9 ${dragOver ? "text-blue-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="m-0 text-sm font-medium text-gray-600">
            {t("collection.uploadZoneLabel")}
          </p>
          <p className="m-0 text-xs text-gray-400">
            {t("collection.uploadZoneHint")}
          </p>
          {anyUploading && (
            <p className="m-0 text-xs text-blue-600 font-medium animate-pulse">
              {t("collection.uploading")}
            </p>
          )}
          {uploadErrors > 0 && !anyUploading && (
            <p className="m-0 text-xs text-red-500 font-medium">
              {uploadErrors}x {t("collection.uploadError")}
            </p>
          )}
          {validationErrors > 0 && !anyUploading && (
            <p className="m-0 text-xs text-amber-600 font-medium">
              {validationErrors}x {t("collection.uploadValidationError")}
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Photo Grid Card ── */}
      {photos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
          {/* Filter tabs */}
          {selections.length > 0 && (
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer ${
                  filter === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('collection.filterAll')} ({photos.length})
              </button>
              <button
                onClick={() => setFilter('selected')}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer ${
                  filter === 'selected'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('collection.filterSelected')} ({selectedPhotoIds.size})
              </button>
              <button
                onClick={() => setFilter('not-selected')}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer ${
                  filter === 'not-selected'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('collection.filterNotSelected')} ({photos.length - selectedPhotoIds.size})
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredPhotos.map((photo) => {
              // Find index in full photos array for lightbox navigation
              const photoIndex = photos.findIndex(p => p.id === photo.id);
              return (
                <div key={photo.id} className="relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100">
                  {/* Thumbnail — click opens lightbox */}
                  <button
                    onClick={() => setLightboxIndex(photoIndex)}
                    className="w-full h-full block border-none p-0 bg-transparent cursor-zoom-in"
                    aria-label={photo.filename}
                  >
                    <img
                      src={photoUrl(photo.thumbnailPath ?? photo.storagePath)}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                  {/* Cover badge */}
                  {collection.coverPhotoId === photo.id && (
                    <div className="absolute top-1 left-1 bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full leading-tight pointer-events-none">
                      ★
                    </div>
                  )}
                  {/* Selection badge */}
                  {selectedPhotoIds.has(photo.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {/* Action overlay -- visible on hover (desktop) and focus-within (keyboard/touch) */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-end justify-start gap-1 p-1 pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto">
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                      title={t("collection.deletePhoto")}
                      aria-label={t("collection.deletePhoto")}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-100 text-gray-700 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      ×
                    </button>
                    {/* Set cover button */}
                    {collection.coverPhotoId !== photo.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetCover(photo.id); }}
                        title={t("collection.setCover")}
                        aria-label={t("collection.setCover")}
                        className="w-7 h-7 rounded-full bg-white/90 hover:bg-blue-100 text-gray-500 hover:text-blue-600 flex items-center justify-center text-sm transition-colors"
                      >
                        ★
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no photos */}
      {photos.length === 0 && !anyUploading && (
        <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
          <p className="m-0 text-sm text-gray-500 text-center py-5">
            {t("collection.noPhotos")}
          </p>
        </div>
      )}

      {/* ── Lightbox ── */}
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
            aria-label={t("collection.lightboxPrev")}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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
              setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
            }}
            aria-label={t("collection.lightboxNext")}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label={t("collection.lightboxClose")}
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

export default CollectionDetailsPage;
