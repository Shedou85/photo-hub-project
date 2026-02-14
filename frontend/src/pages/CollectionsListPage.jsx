import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Accordion from "../components/Accordion";

function CollectionsListPage() {
  const { t } = useTranslation();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");

  // Status-to-border mapping for collection cards
  const STATUS_BORDER = {
    SELECTING: 'border-2 border-blue-500',
    REVIEWING: 'border-2 border-green-500',
  };

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
        setNewCollectionName("");
        const updatedResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
          credentials: "include",
        });
        const updatedData = await updatedResponse.json();
        if (updatedData.status === "OK") {
          setCollections(updatedData.collections);
        }
      } else {
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
        <div className="inline-block px-3.5 py-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-800">
          {t('collections.error')} {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-7 font-sans max-w-[720px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-3.5">
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center text-[22px] shrink-0 select-none">
          🗂️
        </div>
        <h1 className="m-0 text-[22px] font-bold text-gray-900 leading-tight">
          {t('collections.title')}
        </h1>
      </div>

      {/* ── Create Collection Accordion ── */}
      <Accordion title={t('collections.createTitle')}>
        <form onSubmit={handleCreateCollection}>
          {/* Name field */}
          <div className="mb-6">
            <label
              htmlFor="collectionName"
              className="block mb-[5px] text-[13px] font-semibold text-gray-700"
            >
              {t('collections.nameLabel')}
            </label>
            <input
              type="text"
              id="collectionName"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              required
              className="w-full py-[9px] px-3 text-[14px] text-gray-800 bg-white border-[1.5px] border-gray-300 focus:border-blue-500 rounded-[6px] outline-none box-border transition-colors duration-150 font-sans"
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="py-[9px] px-[22px] text-[14px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6,#6366f1)] border-none rounded-[6px] cursor-pointer font-sans transition-opacity duration-150 hover:opacity-[0.88]"
            >
              {t('collections.createBtn')}
            </button>
          </div>
        </form>
      </Accordion>

      {/* ── Collections List Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5">


        {collections.length === 0 ? (
          <div className="py-10 px-5 text-center text-gray-500 text-[14px]">
            {t('collections.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const statusBorder = STATUS_BORDER[collection.status] ?? '';
              return (
              <div
                key={collection.id}
                className={`bg-white rounded-[10px] shadow-md hover:shadow-lg overflow-hidden group rotate-[0.5deg] hover:rotate-[1.5deg] hover:-translate-y-1 transition-all duration-300 ease-out ${statusBorder}`}
              >
                {/* Photo Area — clickable link */}
                <Link
                  to={`/collection/${collection.id}`}
                  className="block no-underline text-inherit"
                >
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden border-b-4 border-white">
                    {collection.coverPhotoPath ? (
                      <img
                        src={photoUrl(collection.coverPhotoPath)}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-5xl font-bold">
                        {collection.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold px-4 py-2 bg-black bg-opacity-50 rounded-md">
                        {t('collections.viewCollection')}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Text + Actions */}
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {t('collections.createdAt')}{" "}
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </p>
                  {collection.status !== 'DRAFT' && (
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${
                      collection.status === 'SELECTING' ? 'bg-blue-100 text-blue-700' :
                      collection.status === 'REVIEWING' ? 'bg-green-100 text-green-700' :
                      collection.status === 'DELIVERED' ? 'bg-purple-100 text-purple-700' :
                      collection.status === 'DOWNLOADED' ? 'bg-purple-200 text-purple-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t(`collections.status.${collection.status}`)}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleShareCollection(collection.id, collection.shareId)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[5px] transition-colors duration-150"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {copiedId === collection.id ? t('collections.linkCopied') : t('collections.shareCollection')}
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection.id)}
                      disabled={deletingId === collection.id}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[5px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('collections.deleteCollection')}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsListPage;
