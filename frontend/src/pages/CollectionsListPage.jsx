import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Accordion from "../components/Accordion";
import PageHeader from "../components/PageHeader";
import Button from "../components/primitives/Button";
import CollectionCard from "../components/primitives/CollectionCard";
import { useAuth } from "../contexts/AuthContext";

function CollectionsListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");

  const isExpiredTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'INACTIVE';
  const isActiveTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'FREE_TRIAL';

  // Expired trial: cumulative limit (collectionsCreatedCount)
  // Active trial: 20 active collections (STANDARD level)
  const FREE_CUMULATIVE_LIMIT = 5;
  const ACTIVE_TRIAL_LIMIT = 20;

  const activeCount = collections.filter(c => c.status !== 'ARCHIVED').length;
  const cumulativeCount = user?.collectionsCreatedCount ?? 0;

  const atLimit = isExpiredTrial
    ? cumulativeCount >= FREE_CUMULATIVE_LIMIT
    : isActiveTrial
      ? activeCount >= ACTIVE_TRIAL_LIMIT
      : false;

  const showLimitBanner = isExpiredTrial || isActiveTrial;
  const limitUsed = isExpiredTrial ? cumulativeCount : activeCount;
  const limitMax = isExpiredTrial ? FREE_CUMULATIVE_LIMIT : ACTIVE_TRIAL_LIMIT;

  // Helper function to get photo URL
  const photoUrl = (storagePath) => {
    const base = import.meta.env.VITE_API_BASE_URL;
    // Assuming storagePath is relative, like "uploads/collectionId/photoId.jpg"
    // And that the backend serves these from a base URL like VITE_API_BASE_URL
    const path = storagePath.startsWith("/") ? storagePath.slice(1) : storagePath;
    return `${base}/${path}`;
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch collections");
        }

        const data = await response.json();
        if (data.status === "OK") {
          setCollections(data.collections);
        } else {
          setError(data.error || "An unknown error occurred.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleCreateCollection = (event) => {
    event.preventDefault();

    if (!newCollectionName.trim()) {
      toast.error(t('collections.nameRequired'));
      return;
    }

    const name = newCollectionName;

    const createPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok && data.status === "OK") {
        navigate(`/collection/${data.collection.id}`);
        setNewCollectionName("");
      } else {
        if (data.error === 'COLLECTION_LIMIT_REACHED') {
          throw new Error(t('plans.limitReachedCollections') + ' ' + t('plans.upgradeHint'));
        }
        throw new Error(data.error || t('collections.createFailed'));
      }
    });

    toast.promise(createPromise, {
      loading: t('collections.creating'),
      success: t('collections.createSuccess'),
      error: (err) => err.message,
    });
  };

  const doDeleteCollection = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        toast.success(t('collections.deleteCollectionSuccess'));
      } else {
        toast.error(t('collections.deleteCollectionFailed'));
      }
    } catch {
      toast.error(t('collections.deleteCollectionFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCollection = (id) => {
    toast(t('collections.confirmDeleteCollection'), {
      position: 'bottom-center',
      action: {
        label: t('collections.deleteCollection'),
        onClick: () => doDeleteCollection(id),
      },
      cancel: {
        label: t('common.cancel'),
        onClick: () => {},
      },
      duration: 8000,
    });
  };

  // This function is no longer directly used on the card but remains for the collection details page.
  const handleShareCollection = (id, shareId) => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(id);
      toast.success(t('collections.linkCopied'));
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    });
  };

  if (loading) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        {t('collections.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        <div className="inline-block px-3.5 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {t('collections.error')} {error}
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <PageHeader
        icon="🗂️"
        title={t('collections.title')}
        subtitle={t('collections.subtitle')}
      />

      {/* ── Plan Limit Banner ── */}
      {showLimitBanner && (
        <div className={`mb-4 px-4 py-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${
          atLimit
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-100 text-blue-700'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {isExpiredTrial ? t('plans.freePlanBadge') : t('plans.trialBadge')}
            </span>
            <span>{t('plans.collectionsUsed', { used: limitUsed, limit: limitMax })}</span>
            {atLimit && <span>{isExpiredTrial ? t('plans.limitReachedCumulative') : t('plans.limitReachedCollections')}</span>}
          </div>
          <Link
            to="/payments"
            className="shrink-0 text-xs font-semibold underline hover:no-underline"
          >
            {t('plans.upgradeLink')}
          </Link>
        </div>
      )}

      {/* ── Create Collection Accordion ── */}
      <Accordion title={t('collections.createTitle')}>
        <form onSubmit={handleCreateCollection}>
          {/* Name field */}
          <div className="mb-6">
            <label
              htmlFor="collectionName"
              className="block mb-1 text-sm font-semibold text-gray-700"
            >
              {t('collections.nameLabel')}
            </label>
            <input
              type="text"
              id="collectionName"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              required
              className="w-full py-2.5 px-5 text-sm text-gray-800 bg-white border-[1.5px] border-gray-300 focus:border-blue-500 rounded-sm outline-none box-border transition-colors duration-150 font-sans"
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={atLimit}>
              {t('collections.createBtn')}
            </Button>
          </div>
        </form>
      </Accordion>

      {/* ── Collections List Card ── */}
      <div className="bg-white border border-gray-200 rounded px-6 py-5">


        {collections.length === 0 ? (
          <div className="py-10 px-5 text-center text-gray-500 text-sm">
            {t('collections.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                id={collection.id}
                name={collection.name}
                createdAt={collection.createdAt}
                photoCount={collection.photoCount ?? 0}
                status={collection.status}
                coverImageUrl={collection.coverPhotoPath ? photoUrl(collection.coverPhotoPath) : null}
                actions={
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleShareCollection(collection.id, collection.shareId)}
                      className="flex-1 min-h-[48px]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {copiedId === collection.id ? t('collections.linkCopied') : t('collections.shareCollection')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteCollection(collection.id)}
                      disabled={deletingId === collection.id}
                      className="flex-1 min-h-[48px]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('collections.deleteCollection')}
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsListPage;
