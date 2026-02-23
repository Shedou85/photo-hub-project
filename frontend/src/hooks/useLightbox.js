import { useState, useEffect, useCallback } from 'react';

export function useLightbox(photosLength) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

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

  const open = useCallback((index) => setLightboxIndex(index), []);
  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : photosLength - 1));
  }, [photosLength]);
  const next = useCallback(() => {
    setLightboxIndex((i) => (i < photosLength - 1 ? i + 1 : 0));
  }, [photosLength]);

  return { lightboxIndex, open, close, prev, next };
}
