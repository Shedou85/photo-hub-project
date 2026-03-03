import { useState, useEffect, useCallback, useRef } from 'react';

export function useLightbox(photosLength, getPhotoUrl) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const preloadedRef = useRef(new Set());

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i > 0 ? i - 1 : photosLength - 1));
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i < photosLength - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, photosLength]);

  // Preload adjacent images when lightbox is open
  useEffect(() => {
    if (lightboxIndex === null || !getPhotoUrl || photosLength === 0) return;

    const indices = [
      (lightboxIndex - 1 + photosLength) % photosLength,
      (lightboxIndex + 1) % photosLength,
    ];

    for (const idx of indices) {
      if (preloadedRef.current.has(idx)) continue;
      const url = getPhotoUrl(idx);
      if (url) {
        const img = new Image();
        img.src = url;
        preloadedRef.current.add(idx);
      }
    }
  }, [lightboxIndex, getPhotoUrl, photosLength]);

  const open = useCallback((index) => setLightboxIndex(index), []);
  const close = useCallback(() => {
    setLightboxIndex(null);
    preloadedRef.current.clear();
  }, []);
  const prev = useCallback(() => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : photosLength - 1));
  }, [photosLength]);
  const next = useCallback(() => {
    setLightboxIndex((i) => (i < photosLength - 1 ? i + 1 : 0));
  }, [photosLength]);

  return { lightboxIndex, open, close, prev, next };
}
