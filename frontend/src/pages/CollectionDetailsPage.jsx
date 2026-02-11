import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

const photoUrl = (storagePath) =>
  `${import.meta.env.VITE_API_BASE_URL}/${storagePath}`;

function CollectionDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStates, setUploadStates] = useState({}); // { [filename+idx]: 'uploading'|'done'|'error' }

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
  }, [id, fetchPhotos]);

  const uploadFiles = async (files) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    const keys = fileArray.map((f, i) => `${f.name}-${i}`);
    setUploadStates((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = "uploading"));
      return next;
    });

    await Promise.all(
      fileArray.map(async (file, i) => {
        const key = keys[i];
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/photos`,
            { method: "POST", credentials: "include", body: formData }
          );
          setUploadStates((prev) => ({
            ...prev,
            [key]: res.ok ? "done" : "error",
          }));
        } catch {
          setUploadStates((prev) => ({ ...prev, [key]: "error" }));
        }
      })
    );

    await fetchPhotos();

    // Clear done states after a short delay
    setTimeout(() => {
      setUploadStates((prev) => {
        const next = { ...prev };
        keys.forEach((k) => {
          if (next[k] === "done") delete next[k];
        });
        return next;
      });
    }, 2000);
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

  const handleDeletePhoto = async (photoId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/photos/${photoId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }
    } catch {
      // ignore
    }
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
      }
    } catch {
      // ignore
    }
  };

  const anyUploading = Object.values(uploadStates).some((s) => s === "uploading");
  const uploadErrors = Object.values(uploadStates).filter((s) => s === "error").length;

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
      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-[14px]">
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center text-[22px] shrink-0 select-none">
          🗂️
        </div>
        <div>
          <h1 className="m-0 text-[22px] font-bold text-gray-900 leading-tight">
            {collection.name}
          </h1>
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
              {uploadErrors}× {t("collection.uploadError")}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-[6px] overflow-hidden bg-gray-100">
                <img
                  src={photoUrl(photo.storagePath)}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Cover badge */}
                {collection.coverPhotoId === photo.id && (
                  <div className="absolute top-1 left-1 bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full leading-tight">
                    ★
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-start gap-1 p-1">
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    title={t("collection.deletePhoto")}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-100 text-gray-700 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors"
                  >
                    ×
                  </button>
                  {/* Set cover button */}
                  {collection.coverPhotoId !== photo.id && (
                    <button
                      onClick={() => handleSetCover(photo.id)}
                      title={t("collection.setCover")}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-blue-100 text-gray-500 hover:text-blue-600 flex items-center justify-center text-sm transition-colors"
                    >
                      ★
                    </button>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}

export default CollectionDetailsPage;
