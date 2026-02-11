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

  const handleShareCollection = (id, shareId) => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(id);
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
        <h2 className="mt-0 mb-4 text-[14px] font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('collections.title')}
        </h2>

        {collections.length === 0 ? (
          <div className="py-10 px-5 text-center text-gray-500 text-[14px]">
            {t('collections.empty')}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-[8px] px-4 py-3.5 border border-gray-200 hover:border-blue-400 hover:shadow-[0_1px_4px_rgba(59,130,246,0.10)] transition-[border-color,box-shadow] duration-150 flex items-center gap-3"
              >
                {/* Clickable name/date area */}
                <Link
                  to={`/collection/${collection.id}`}
                  className="no-underline text-inherit flex-1 min-w-0"
                >
                  <div className="text-[15px] font-semibold text-gray-900 truncate">
                    {collection.name}
                  </div>
                  <div className="text-[12px] text-gray-400 mt-1">
                    {t('collections.createdAt')}{" "}
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </div>
                </Link>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Share / Copy link */}
                  <button
                    onClick={() => handleShareCollection(collection.id, collection.shareId)}
                    title={t('collections.shareCollection')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium border transition-colors duration-150 cursor-pointer
                      ${copiedId === collection.id
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      }`}
                  >
                    {copiedId === collection.id ? (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t('collections.linkCopied')}
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {t('collections.shareCollection')}
                      </>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteCollection(collection.id)}
                    disabled={deletingId === collection.id}
                    title={t('collections.deleteCollection')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium border bg-gray-50 border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-150 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('collections.deleteCollection')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsListPage;
