import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function useCollectionData(id) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState([]);
  const [editedPhotos, setEditedPhotos] = useState([]);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch collection details");
      const data = await response.json();
      if (data.status === "OK") {
        setCollection(data.collection);
      } else {
        setError(data.error || "An unknown error occurred.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSelections = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/selections`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") setSelections(data.selections || []);
      }
    } catch { /* non-critical */ }
  }, [id]);

  const fetchEditedPhotos = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}/edited`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") setEditedPhotos(data.editedPhotos || []);
      }
    } catch { /* non-critical */ }
  }, [id]);

  const handleStartSelecting = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/collections/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SELECTING' }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') {
          setCollection(data.collection);
          toast.success(t('collection.statusUpdated'));
        }
      } else {
        toast.error(t('collection.statusUpdateError'));
      }
    } catch {
      toast.error(t('collection.statusUpdateError'));
    }
  }, [id, t]);

  const doDeleteCollection = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        navigate('/collections');
        toast.success(t('collection.collectionDeleted'));
      } else {
        toast.error(t('collection.collectionDeleteError'));
      }
    } catch {
      toast.error(t('collection.collectionDeleteError'));
    }
  }, [id, navigate, t]);

  const handleSaveEdit = useCallback(async (editData) => {
    // Save previous state for rollback
    const previousCollection = collection;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        toast.success(t('collection.collectionUpdated'));
        return true;
      } else {
        toast.error(t('collection.saveError'));
        return false;
      }
    } catch {
      // Rollback on failure
      setCollection(previousCollection);
      toast.error(t('collection.saveError'));
      return false;
    }
  }, [id, t, collection]);

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
