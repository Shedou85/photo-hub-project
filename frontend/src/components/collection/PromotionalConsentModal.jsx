import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const photoUrl = (storagePath) => {
  const base = import.meta.env.VITE_API_BASE_URL;
  const path = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  return `${base}/${path}`;
};

function PromotionalConsentModal({ collection, photos, onClose, onDelivered }) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [loading, onClose]);

  const togglePhoto = (photoId) => {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, photoId];
    });
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      const patchRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${collection.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DELIVERED', allowPromotionalUse: true }),
        }
      );
      if (!patchRes.ok) {
        toast.error(t('collection.statusUpdateError'));
        setLoading(false);
        return;
      }
      const patchData = await patchRes.json();
      if (patchData.status !== 'OK') {
        toast.error(t('collection.statusUpdateError'));
        setLoading(false);
        return;
      }

      // Submit each selected photo as promotional
      for (let i = 0; i < selectedIds.length; i++) {
        const photoId = selectedIds[i];
        try {
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/collections/${collection.id}/promotional`,
            {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoId, order: i }),
            }
          );
        } catch {
          // Non-critical: promotional photo submission failure doesn't block delivery
        }
      }

      setLoading(false);
      onDelivered(patchData.collection);
    } catch {
      toast.error(t('collection.statusUpdateError'));
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${collection.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DELIVERED' }),
        }
      );
      if (!res.ok) {
        toast.error(t('collection.statusUpdateError'));
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.status !== 'OK') {
        toast.error(t('collection.statusUpdateError'));
        setLoading(false);
        return;
      }
      setLoading(false);
      onDelivered(data.collection);
    } catch {
      toast.error(t('collection.statusUpdateError'));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="bg-white rounded-[10px] shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 m-0 leading-snug">
            {t('promotional.modalTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed m-0">
            {t('promotional.modalDesc')}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs font-semibold tracking-[0.06em] uppercase text-gray-400 mb-3">
            {t('promotional.selectHint')}
          </p>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo) => {
                const src = photo.thumbnailPath
                  ? photoUrl(photo.thumbnailPath)
                  : photoUrl(photo.storagePath);
                const isSelected = selectedIds.includes(photo.id);

                return (
                  <div
                    key={photo.id}
                    data-photo-item
                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer"
                    onClick={() => togglePhoto(photo.id)}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.closest('[data-photo-item]')?.classList.add('hidden');
                      }}
                    />
                    {/* Selection ring overlay */}
                    <div
                      className={`absolute inset-0 transition-all duration-150 ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/10'
                          : 'hover:bg-black/10'
                      }`}
                    />
                    {/* Check icon */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              {t('collection.noPhotos')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500 shrink-0">
            {t('promotional.selectedCount', { count: selectedIds.length })}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('promotional.skipBtn')}
            </button>
            <button
              onClick={handleAllow}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[linear-gradient(135deg,#3b82f6_0%,#6366f1_100%)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(99,102,241,0.35)]"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {t('promotional.allowBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromotionalConsentModal;
