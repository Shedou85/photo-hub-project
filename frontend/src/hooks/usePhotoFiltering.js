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

  // Map<photoId, label> built from selections
  const photoLabelMap = useMemo(
    () => new Map(selections.map(s => [s.photoId, s.label || 'SELECTED'])),
    [selections]
  );

  // Label counts
  const labelCounts = useMemo(() => {
    const counts = { SELECTED: 0, FAVORITE: 0, REJECTED: 0 };
    for (const label of photoLabelMap.values()) {
      if (counts[label] !== undefined) counts[label]++;
    }
    return counts;
  }, [photoLabelMap]);

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return photos;
    if (filter === 'selected') return photos.filter(p => selectedPhotoIds.has(p.id));
    if (filter === 'not-selected') return photos.filter(p => !selectedPhotoIds.has(p.id));
    if (filter === 'favorite') return photos.filter(p => photoLabelMap.get(p.id) === 'FAVORITE');
    if (filter === 'label-selected') return photos.filter(p => photoLabelMap.get(p.id) === 'SELECTED');
    if (filter === 'rejected') return photos.filter(p => photoLabelMap.get(p.id) === 'REJECTED');
    if (filter === 'not-labeled') return photos.filter(p => !selectedPhotoIds.has(p.id));
    return photos;
  }, [filter, photos, selectedPhotoIds, photoLabelMap]);

  return { filter, setFilter, selectedPhotoIds, filteredPhotos, photoLabelMap, labelCounts };
}
