import { useState, useMemo, useEffect } from 'react';

export function usePhotoFiltering(photos, selections, collectionId) {
  const [filter, setFilter] = useState('all');

  // Reset filter when collection changes
  useEffect(() => {
    setFilter('all');
  }, [collectionId]);

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

  return { filter, setFilter, selectedPhotoIds, filteredPhotos };
}
