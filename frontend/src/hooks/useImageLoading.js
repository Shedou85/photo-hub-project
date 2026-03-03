import { useState, useCallback } from 'react';

/**
 * Tracks loaded/errored state for a set of images by ID.
 * Used in photo grids where multiple images load independently.
 */
export function useImageLoadingSet() {
  const [loadedIds, setLoadedIds] = useState(new Set());
  const [erroredIds, setErroredIds] = useState(new Set());

  const handleImageLoad = useCallback((id) => {
    setLoadedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleImageError = useCallback((id) => {
    setErroredIds((prev) => new Set(prev).add(id));
  }, []);

  const isImageLoaded = useCallback((id) => loadedIds.has(id), [loadedIds]);
  const isImageErrored = useCallback((id) => erroredIds.has(id), [erroredIds]);

  return { handleImageLoad, handleImageError, isImageLoaded, isImageErrored };
}
