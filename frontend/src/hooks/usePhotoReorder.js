import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '../lib/api';

export function usePhotoReorder(collectionId, photos, setPhotos, userPlan) {
  const { t } = useTranslation();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const originalOrderRef = useRef(null);

  const isPro = userPlan === 'PRO';

  const enterReorderMode = useCallback(() => {
    originalOrderRef.current = [...photos];
    setIsReorderMode(true);
  }, [photos]);

  const cancelReorder = useCallback(() => {
    if (originalOrderRef.current) {
      setPhotos(originalOrderRef.current);
    }
    originalOrderRef.current = null;
    setIsReorderMode(false);
  }, [setPhotos]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPhotos((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, [setPhotos]);

  const hasOrderChanged = useCallback(() => {
    if (!originalOrderRef.current) return false;
    const original = originalOrderRef.current;
    if (original.length !== photos.length) return true;
    return original.some((p, i) => p.id !== photos[i]?.id);
  }, [photos]);

  const saveOrder = useCallback(async () => {
    setIsSaving(true);
    try {
      const payload = photos.map((p, i) => ({ id: p.id, order: i }));
      const { error } = await api.patch(`/collections/${collectionId}/reorder`, { photos: payload });
      if (error) {
        toast.error(t('collection.reorderError'));
      } else {
        toast.success(t('collection.reorderSaved'));
        originalOrderRef.current = null;
        setIsReorderMode(false);
      }
    } catch {
      toast.error(t('collection.reorderError'));
    } finally {
      setIsSaving(false);
    }
  }, [collectionId, photos, t]);

  return {
    isReorderMode,
    isPro,
    isSaving,
    enterReorderMode,
    cancelReorder,
    handleDragEnd,
    saveOrder,
    hasOrderChanged,
  };
}
