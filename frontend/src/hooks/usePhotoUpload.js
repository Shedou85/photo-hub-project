import { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '../lib/api';

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_CONCURRENT_UPLOADS = 3;

export function usePhotoUpload(id, collection, setCollection) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [uploadStates, setUploadStates] = useState({});
  const [editedUploadStates, setEditedUploadStates] = useState({});
  const uploadBatchCounter = useRef(0);
  // Queue for thread-safe concurrent uploads (#11 race condition fix)
  const uploadQueueRef = useRef([]);

  const fetchPhotos = useCallback(async () => {
    try {
      const { data } = await api.get(`/collections/${id}/photos`);
      if (data?.status === "OK") setPhotos(data.photos || []);
    } catch { /* non-critical */ }
  }, [id]);

  const uploadFiles = useCallback(async (files, setShowUploadZone) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

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

    if (validFiles.length > 0) {
      setUploadStates((prev) => {
        const next = { ...prev };
        validFiles.forEach(({ key }) => (next[key] = "uploading"));
        return next;
      });
    }

    // RACE CONDITION FIX (#11): Use queue pattern instead of shared mutable index
    const queue = [...validFiles];
    let successCount = 0;
    let autoCoverPhotoId = null;

    const processNext = async () => {
      while (true) {
        // Atomically dequeue (safe because JS is single-threaded at this sync point)
        const item = queue.shift();
        if (!item) break;

        const { file, key } = item;
        const formData = new FormData();
        formData.append("file", file);
        try {
          const { data, error, status } = await api.post(`/collections/${id}/photos`, formData);
          if (!error && status >= 200 && status < 300) {
            successCount++;
            if (data?.autoSetCover && data.photo?.id) {
              autoCoverPhotoId = data.photo.id;
            }
            setUploadStates((prev) => ({ ...prev, [key]: "done" }));
          } else {
            if (data?.error === 'PHOTO_LIMIT_REACHED') {
              toast.error(t('plans.limitReachedPhotos') + ' ' + t('plans.upgradeHint'));
            }
            setUploadStates((prev) => ({ ...prev, [key]: "error" }));
          }
        } catch {
          setUploadStates((prev) => ({ ...prev, [key]: "error" }));
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT_UPLOADS, validFiles.length) },
      () => processNext()
    );
    await Promise.all(workers);

    if (autoCoverPhotoId) {
      setCollection((prev) => ({ ...prev, coverPhotoId: autoCoverPhotoId }));
    }

    await fetchPhotos();

    if (successCount > 0) {
      toast.success(t("collection.uploadSuccess"));
      if (setShowUploadZone) setShowUploadZone(false);
    }

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
  }, [id, t, fetchPhotos, setCollection]);

  const uploadEditedFiles = useCallback(async (files, fetchEditedPhotos) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

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

    if (validFiles.length > 0) {
      setEditedUploadStates((prev) => {
        const next = { ...prev };
        validFiles.forEach(({ key }) => (next[key] = "uploading"));
        return next;
      });
    }

    // RACE CONDITION FIX: Queue pattern
    const queue = [...validFiles];
    let successCount = 0;

    const processNext = async () => {
      while (true) {
        const item = queue.shift();
        if (!item) break;

        const { file, key } = item;
        const formData = new FormData();
        formData.append("file", file);
        try {
          const { error, status } = await api.post(`/collections/${id}/edited`, formData);
          const ok = !error && status >= 200 && status < 300;
          if (ok) successCount++;
          setEditedUploadStates((prev) => ({
            ...prev,
            [key]: ok ? "done" : "error",
          }));
        } catch {
          setEditedUploadStates((prev) => ({ ...prev, [key]: "error" }));
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT_UPLOADS, validFiles.length) },
      () => processNext()
    );
    await Promise.all(workers);

    if (fetchEditedPhotos) await fetchEditedPhotos();

    if (successCount > 0) {
      toast.success(t("collection.editedUploadSuccess"));
    }

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
  }, [id, t]);

  const doDeletePhoto = useCallback(async (photoId) => {
    // Save previous states for rollback
    const previousPhotos = photos;
    const previousCoverPhotoId = collection?.coverPhotoId;

    try {
      const { error } = await api.delete(`/collections/${id}/photos/${photoId}`);
      if (!error) {
        setPhotos(prev => {
          const remaining = prev.filter((p) => p.id !== photoId);

          // Handle cover photo logic
          if (collection?.coverPhotoId === photoId && remaining.length > 0) {
            const deletedIndex = prev.findIndex((p) => p.id === photoId);
            const promotedIndex = deletedIndex < remaining.length ? deletedIndex : 0;
            const promotedId = remaining[promotedIndex].id;
            setCollection((c) => ({ ...c, coverPhotoId: promotedId }));

            // Persist cover change (fire-and-forget)
            api.patch(`/collections/${id}/cover`, { photoId: promotedId }).catch(() => {});
          } else if (collection?.coverPhotoId === photoId) {
            setCollection((c) => ({ ...c, coverPhotoId: null }));
          }

          return remaining;
        });
      } else {
        toast.error(t("collection.deleteError"));
      }
    } catch {
      // Rollback on failure
      setPhotos(previousPhotos);
      setCollection((c) => ({ ...c, coverPhotoId: previousCoverPhotoId }));
      toast.error(t("collection.deleteError"));
    }
  }, [id, collection?.coverPhotoId, t, setCollection, photos]);

  const handleSetCover = useCallback(async (photoId) => {
    // Save previous state for rollback
    const previousCoverPhotoId = collection?.coverPhotoId;

    // Optimistic update
    setCollection((prev) => ({ ...prev, coverPhotoId: photoId }));

    try {
      const { error } = await api.patch(`/collections/${id}/cover`, { photoId });
      if (error) {
        throw new Error("Failed to set cover");
      }
    } catch {
      // Rollback on failure
      setCollection((prev) => ({ ...prev, coverPhotoId: previousCoverPhotoId }));
      toast.error(t("collection.setCoverError"));
    }
  }, [id, t, setCollection, collection?.coverPhotoId]);

  const handleDeletePhoto = useCallback((photoId) => {
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
  }, [t, doDeletePhoto]);

  // Computed states
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

  return {
    photos, setPhotos, fetchPhotos,
    uploadFiles, uploadEditedFiles,
    handleDeletePhoto, handleSetCover,
    uploadStates, editedUploadStates,
    anyUploading, uploadErrors, validationErrors,
    anyEditedUploading, editedUploadErrors, editedValidationErrors,
  };
}
