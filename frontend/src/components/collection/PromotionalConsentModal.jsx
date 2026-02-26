import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '../../lib/api';

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
      const { data: patchData, error: patchError } = await api.patch(
        `/collections/${collection.id}`,
        { status: 'DELIVERED', allowPromotionalUse: true }
      );
      if (patchError || patchData?.status !== 'OK') {
        toast.error(t('collection.statusUpdateError'));
        setLoading(false);
        return;
      }

      // Submit each selected photo as promotional
      for (let i = 0; i < selectedIds.length; i++) {
        const photoId = selectedIds[i];
        try {
          await api.post(
            `/collections/${collection.id}/promotional`,
            { photoId, order: i }
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
      const { data, error } = await api.patch(
        `/collections/${collection.id}`,
        { status: 'DELIVERED' }
      );
      if (error || data?.status !== 'OK') {
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
      <div className="bg-surface-dark border border-white/10 rounded-[10px] shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-white m-0 leading-snug">
            {t('promotional.modalTitle')}
          </h2>
          <p className="mt-2 text-sm text-white/60 leading-relaxed m-0">
            {t('promotional.modalDesc')}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs font-semibold tracking-[0.06em] uppercase text-white/50 mb-3">
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
                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onClick={() => togglePhoto(photo.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && togglePhoto(photo.id)}
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
            <p className="text-sm text-white/50 text-center py-8">
              {t('collection.noPhotos')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/[0.08] flex items-center justify-between gap-4">
          <span className="text-sm text-white/50 shrink-0">
            {t('promotional.selectedCount', { count: selectedIds.length })}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-sm text-white/50 hover:text-white/70 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
