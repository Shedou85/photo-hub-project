export const photoUrl = (storagePath) => {
  if (!storagePath) return null;
  const base = import.meta.env.VITE_MEDIA_BASE_URL;
  const path = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};

export const watermarkedPreviewUrl = (shareId, photoId, shareToken = null) => {
  const base = import.meta.env.VITE_API_BASE_URL;
  let url = `${base}/share/${shareId}/preview/${photoId}`;
  if (shareToken) url += `?token=${encodeURIComponent(shareToken)}`;
  return url;
};
