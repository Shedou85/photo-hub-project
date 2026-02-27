export const photoUrl = (storagePath) => {
  if (!storagePath) return null;
  const base = import.meta.env.VITE_MEDIA_BASE_URL;
  const path = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};
