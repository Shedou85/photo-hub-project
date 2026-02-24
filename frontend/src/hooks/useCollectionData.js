import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '../lib/api';

export function useCollectionData(id) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState([]);
  const [editedPhotos, setEditedPhotos] = useState([]);

  const fetchCollection = useCallback(async () => {
    const { data, error: fetchError } = await api.get(`/collections/${id}`);
    if (!fetchError && data?.status === "OK") {
      setCollection(data.collection);
    } else {
      setError(fetchError || data?.error || "An unknown error occurred.");
    }
    setLoading(false);
  }, [id]);

  const fetchSelections = useCallback(async () => {
    const { data, error: fetchError } = await api.get(`/collections/${id}/selections`);
    if (!fetchError && data?.status === "OK") {
      setSelections(data.selections || []);
    }
  }, [id]);

  const fetchEditedPhotos = useCallback(async () => {
    const { data, error: fetchError } = await api.get(`/collections/${id}/edited`);
    if (!fetchError && data?.status === "OK") {
      setEditedPhotos(data.editedPhotos || []);
    }
  }, [id]);

  const handleStartSelecting = useCallback(async () => {
    const { data, error: fetchError } = await api.patch(`/collections/${id}`, { status: 'SELECTING' });
    if (!fetchError && data?.status === 'OK') {
      setCollection(data.collection);
      toast.success(t('collection.statusUpdated'));
    } else {
      toast.error(t('collection.statusUpdateError'));
    }
  }, [id, t]);

  const doDeleteCollection = useCallback(async () => {
    const { error: fetchError } = await api.delete(`/collections/${id}`);
    if (!fetchError) {
      navigate('/collections');
      toast.success(t('collection.collectionDeleted'));
    } else {
      toast.error(t('collection.collectionDeleteError'));
    }
  }, [id, navigate, t]);

  const handleSaveEdit = useCallback(async (editData) => {
    // Save previous state for rollback via functional updater
    let previousCollection = null;
    setCollection((prev) => { previousCollection = prev; return prev; });

    const { data, error: fetchError } = await api.patch(`/collections/${id}`, editData);
    if (!fetchError) {
      setCollection(data.collection);
      toast.success(t('collection.collectionUpdated'));
      return true;
    } else {
      // Rollback on failure
      setCollection(previousCollection);
      toast.error(t('collection.saveError'));
      return false;
    }
  }, [id, t]);

  // Initial fetch
  useEffect(() => {
    fetchCollection();
    fetchSelections();
  }, [fetchCollection, fetchSelections]);

  // Fetch edited photos when REVIEWING or DELIVERED
  useEffect(() => {
    if (collection && (collection.status === 'REVIEWING' || collection.status === 'DELIVERED')) {
      fetchEditedPhotos();
    }
  }, [collection?.status, fetchEditedPhotos]);

  return {
    collection, setCollection,
    loading, error,
    selections,
    editedPhotos, setEditedPhotos, fetchEditedPhotos,
    handleStartSelecting,
    doDeleteCollection,
    handleSaveEdit,
  };
}
