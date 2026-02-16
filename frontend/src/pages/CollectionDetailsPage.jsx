import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PHOTO_GRID_CLASSES } from '../constants/styles';
import Button from '../components/primitives/Button';
import Badge from '../components/primitives/Badge';
import Accordion from '../components/Accordion';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400">
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
  const editedFileInputRef = useRef(null);
  const uploadBatchCounter = useRef(0);

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [editedPhotos, setEditedPhotos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStates, setUploadStates] = useState({});
  const [editedUploadStates, setEditedUploadStates] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [selections, setSelections] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showEditedFinalsZone, setShowEditedFinalsZone] = useState(false);

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

  const fetchEditedPhotos = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/edited`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") setEditedPhotos(data.editedPhotos || []);
      }
    } catch {
      // non-critical, edited photos just won't load
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

  // Fetch edited photos when collection is REVIEWING or DELIVERED
  useEffect(() => {
    if (collection && (collection.status === 'REVIEWING' || collection.status === 'DELIVERED')) {
      fetchEditedPhotos();
    }
  }, [collection, fetchEditedPhotos]);

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
      // Auto-collapse upload zone after successful upload
      setShowUploadZone(false);
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

  const uploadEditedFiles = async (files) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    // Client-side validation before uploading
    const batchId = ++uploadBatchCounter.current;
    const validFiles = [];
    const keys = [];
    let hasValidationErrors = false;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const key = `edited-${batchId}-${file.name}-${i}`;
      keys.push(key);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setEditedUploadStates((prev) => ({ ...prev, [key]: "invalid-type" }));
        hasValidationErrors = true;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setEditedUploadStates((prev) => ({ ...prev, [key]: "too-large" }));
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
      setEditedUploadStates((prev) => {
        const next = { ...prev };
        validFiles.forEach(({ key }) => (next[key] = "uploading"));
        return next;
      });
    }

    // Upload with concurrency limiter
    let idx = 0;
    let successCount = 0;
    const uploadNext = async () => {
      while (idx < validFiles.length) {
        const current = idx++;
        const { file, key } = validFiles[current];
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/edited`,
            { method: "POST", credentials: "include", body: formData }
          );
          if (res.ok) {
            successCount++;
          }
          setEditedUploadStates((prev) => ({
            ...prev,
            [key]: res.ok ? "done" : "error",
          }));
        } catch {
          setEditedUploadStates((prev) => ({ ...prev, [key]: "error" }));
        }
      }
    };

    const workers = [];
    for (let w = 0; w < Math.min(MAX_CONCURRENT_UPLOADS, validFiles.length); w++) {
      workers.push(uploadNext());
    }
    await Promise.all(workers);

    await fetchEditedPhotos();

    if (successCount > 0) {
      toast.success(t("collection.editedUploadSuccess"));
    }

    // Clear done/validation states after a short delay
    setTimeout(() => {
      setEditedUploadStates((prev) => {
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

  const handleEditedFileChange = (e) => {
    uploadEditedFiles(e.target.files);
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

  const handleCopyDeliveryLink = () => {
    if (!collection.deliveryToken) {
      toast.error(t('collection.deliveryTokenMissing'));
      return;
    }
    const url = `${window.location.origin}/deliver/${collection.deliveryToken}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('collection.deliveryLinkCopied'));
    }).catch(() => {
      toast.error(t('collection.linkCopyFailed'));
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

  const handleMarkAsDelivered = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DELIVERED' }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') {
          setCollection(data.collection);
          toast.success(t('collection.markedAsDelivered'));
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

  const anyEditedUploading = useMemo(
    () => Object.values(editedUploadStates).some((s) => s === "uploading"),
    [editedUploadStates]
  );
  const editedUploadErrors = useMemo(
    () => Object.values(editedUploadStates).filter((s) => s === "error").length,
    [editedUploadStates]
  );
  const editedValidationErrors = useMemo(
    () => Object.values(editedUploadStates).filter((s) => s === "invalid-type" || s === "too-large").length,
    [editedUploadStates]
  );

  if (loading) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        {t("collection.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans max-w-6xl mx-auto">
        <div className="text-red-800 bg-red-50 border border-red-300 rounded-md px-3.5 py-3 text-sm">
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
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Back link ── */}
      <Link
        to="/collections"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 no-underline mb-5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("collection.backToCollections")}
      </Link>

      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-3.5">
        <div className="w-13 h-13 rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center text-xl shrink-0 select-none">
          🗂️
        </div>
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-xl font-bold text-gray-900 leading-tight">
            {collection.name}
          </h1>
          {collection.status !== 'DRAFT' && (
            <Badge status={collection.status}>
              {t(`collection.status.${collection.status}`)}
            </Badge>
          )}
        </div>
      </div>

      {/* Next-step guidance (WORKFLOW-06) */}
      <p className="text-sm text-gray-500 mb-3 -mt-4">
        {t(`collection.nextStep.${collection.status}`)}
      </p>

      {/* ── Collection Info & Actions Accordion ── */}
      <Accordion title={t("collection.infoAndActions")} defaultOpen={true}>
        {/* Collection Info Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mb-4">
          <InfoRow
            label={t("collection.createdAt")}
            value={new Date(collection.createdAt).toLocaleDateString()}
          />
          <InfoRow
            label={t("collection.statusLabel")}
            value={t(`collection.status.${collection.status}`)}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Upload Section - Only show in DRAFT status */}
        {collection.status === 'DRAFT' && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
              {t("collection.uploadSection")}
            </h3>
            <Button
              variant="secondary"
              onClick={() => setShowUploadZone(!showUploadZone)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {photos.length === 0 ? t('collection.addPhotos') : t('collection.addMorePhotos')}
            </Button>
          </div>
        )}

        {/* Share Section - Only visible when photos exist */}
        {photos.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
              {t("collection.shareSection")}
            </h3>
            <Button variant="primary" onClick={handleCopyShareLink}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {t("collection.copyShareLink")}
            </Button>
          </div>
        )}

        {/* Phase-specific Actions */}
        {collection.status === 'DRAFT' && photos.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
              {t("collection.workflowActions")}
            </h3>
            <Button variant="secondary" onClick={handleStartSelecting}>
              {t("collection.startSelecting")}
            </Button>
          </div>
        )}

        {collection.status === 'REVIEWING' && (
          <div>
            <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
              {t("collection.reviewPhase")}
            </h3>

            {/* Shimmer button to toggle upload zone */}
            <div className="mb-3">
              <button
                onClick={() => setShowEditedFinalsZone(!showEditedFinalsZone)}
                className="relative overflow-hidden bg-[linear-gradient(135deg,#10b981,#059669)] text-white font-semibold px-5 py-2.5 rounded-sm inline-flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:scale-[1.02] shadow-[0_4px_14px_rgba(16,185,129,0.4)] before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] before:translate-x-[-100%] before:animate-shimmer motion-reduce:before:animate-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {t("collection.uploadEditedFinalsButton")}
              </button>
              {/* Helper text */}
              <p className="mt-2 text-xs text-gray-500">
                {t("collection.uploadEditedFinalsHint")}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4" />

            {/* Existing Mark as Delivered button */}
            <Button
              variant="primary"
              onClick={handleMarkAsDelivered}
              disabled={editedPhotos.length === 0}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t("collection.markAsDelivered")}
            </Button>
          </div>
        )}

        {(collection.status === 'DELIVERED' || collection.status === 'DOWNLOADED') && collection.deliveryToken && (
          <div>
            <h3 className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
              {t("collection.deliverPhase")}
            </h3>
            <Button variant="primary" onClick={handleCopyDeliveryLink}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t("collection.copyDeliveryLink")}
            </Button>
          </div>
        )}
      </Accordion>

      {/* ── Upload Dropzone (only shown when showUploadZone is true and status is DRAFT) ── */}
      {showUploadZone && collection.status === 'DRAFT' && (
        <div className="bg-white border border-gray-200 rounded px-6 py-5 mb-3">
          <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
            {photos.length === 0 ? t("collection.photos") : t("collection.uploadMore")}
          </h2>

          <div
            role="button"
            tabIndex={0}
            aria-label={t("collection.uploadZoneLabel")}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all duration-300 select-none
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
          </div>
          <button
            onClick={() => setShowUploadZone(false)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>

          {/* Upload status indicators (always shown when active) */}
          {anyUploading && (
            <p className="mt-3 mb-0 text-xs text-blue-600 font-medium animate-pulse">
              {t("collection.uploading")}
            </p>
          )}
          {uploadErrors > 0 && !anyUploading && (
            <p className="mt-3 mb-0 text-xs text-red-500 font-medium">
              {uploadErrors}x {t("collection.uploadError")}
            </p>
          )}
          {validationErrors > 0 && !anyUploading && (
            <p className="mt-3 mb-0 text-xs text-amber-600 font-medium">
              {validationErrors}x {t("collection.uploadValidationError")}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Edited Finals Upload Zone (REVIEWING only) - Now collapsible ── */}
      {showEditedFinalsZone && collection.status === 'REVIEWING' && (
        <div className="bg-white border border-gray-200 rounded px-6 py-5 mb-3">
          <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
            {t('collection.editedFinalsTitle')}
            {editedPhotos.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case tracking-normal">
                {t('collection.editedPhotosCount', { count: editedPhotos.length })}
              </span>
            )}
          </h2>

          {/* Green-themed drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t('collection.editedUploadZoneLabel')}
            onClick={() => editedFileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && editedFileInputRef.current?.click()}
            className="border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors select-none border-green-300 bg-green-50 hover:border-green-400"
          >
            <svg className="w-9 h-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="m-0 text-sm font-medium text-gray-600">
              {t('collection.editedUploadZoneLabel')}
            </p>
            <p className="m-0 text-xs text-gray-400">
              {t('collection.editedUploadZoneHint')}
            </p>
            {anyEditedUploading && (
              <p className="m-0 text-xs text-green-600 font-medium animate-pulse">
                {t("collection.uploading")}
              </p>
            )}
            {editedUploadErrors > 0 && !anyEditedUploading && (
              <p className="m-0 text-xs text-red-500 font-medium">
                {editedUploadErrors}x {t("collection.uploadError")}
              </p>
            )}
            {editedValidationErrors > 0 && !anyEditedUploading && (
              <p className="m-0 text-xs text-amber-600 font-medium">
                {editedValidationErrors}x {t("collection.uploadValidationError")}
              </p>
            )}
          </div>

          <input
            ref={editedFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleEditedFileChange}
          />

          {/* Edited photos grid */}
          {editedPhotos.length > 0 && (
            <div className={`mt-4 ${PHOTO_GRID_CLASSES}`}>
              {editedPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-sm overflow-hidden bg-gray-100">
                  <img
                    src={photoUrl(photo.storagePath)}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Cancel button to collapse zone */}
          <button
            onClick={() => setShowEditedFinalsZone(false)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}

      {/* ── Photo Grid Accordion ── */}
      {photos.length > 0 && (
        <Accordion title={t("collection.photos")} defaultOpen={true}>
          {/* Filter tabs */}
          {selections.length > 0 && (
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  filter === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('collection.filterAll')} ({photos.length})
              </button>
              <button
                onClick={() => setFilter('selected')}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  filter === 'selected'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('collection.filterSelected')} ({selectedPhotoIds.size})
              </button>
              <button
                onClick={() => setFilter('not-selected')}
                className={`px-4 py-2 text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  filter === 'not-selected'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('collection.filterNotSelected')} ({photos.length - selectedPhotoIds.size})
              </button>
            </div>
          )}

          <div className={PHOTO_GRID_CLASSES}>
            {filteredPhotos.map((photo) => {
              // Find index in full photos array for lightbox navigation
              const photoIndex = photos.findIndex(p => p.id === photo.id);
              return (
                <div key={photo.id} className="relative group aspect-square rounded-sm overflow-hidden bg-gray-100">
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
                    <div className="absolute top-1 left-1 bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight pointer-events-none">
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
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-end justify-start gap-1 p-1 pointer-events-none">
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                      title={t("collection.deletePhoto")}
                      aria-label={t("collection.deletePhoto")}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-100 text-gray-700 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors pointer-events-auto"
                    >
                      ×
                    </button>
                    {/* Set cover button */}
                    {collection.coverPhotoId !== photo.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetCover(photo.id); }}
                        title={t("collection.setCover")}
                        aria-label={t("collection.setCover")}
                        className="w-7 h-7 rounded-full bg-white/90 hover:bg-blue-100 text-gray-500 hover:text-blue-600 flex items-center justify-center text-sm transition-colors pointer-events-auto"
                      >
                        ★
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Accordion>
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
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10 border border-white/30 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10 border border-white/30 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label={t("collection.lightboxClose")}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center font-bold text-xl transition-colors z-10 border border-white/30 cursor-pointer"
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
