import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function CollectionsListPage() {
  const { t } = useTranslation();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

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

  const handleCreateCollection = async (event) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!newCollectionName.trim()) {
      setCreateError(t('collections.nameRequired'));
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName }),
      });

      const data = await response.json();

      if (response.ok && data.status === "OK") {
        setCreateSuccess(t('collections.createSuccess'));
        setNewCollectionName("");
        const updatedResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections`, {
          credentials: "include",
        });
        const updatedData = await updatedResponse.json();
        if (updatedData.status === "OK") {
          setCollections(updatedData.collections);
        }
      } else {
        setCreateError(data.error || t('collections.createFailed'));
      }
    } catch (err) {
      setCreateError(err.message);
    }
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

      {/* ── Create Collection Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-[14px] font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('collections.createTitle')}
        </h2>

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

          {/* Feedback messages */}
          {createError && (
            <div className="px-3.5 py-3 mb-4 bg-red-50 border border-red-200 rounded-[6px] text-[13px] text-red-800">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="px-3.5 py-3 mb-4 bg-green-50 border border-green-200 rounded-[6px] text-[13px] text-green-700 font-medium">
              {createSuccess}
            </div>
          )}

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
      </div>

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
              <Link
                key={collection.id}
                to={`/collection/${collection.id}`}
                className="no-underline text-inherit"
              >
                <div className="bg-white rounded-[8px] px-4 py-3.5 cursor-pointer transition-[border-color,box-shadow] duration-150 border border-gray-200 hover:border-blue-500 hover:shadow-[0_1px_4px_rgba(59,130,246,0.10)]">
                  <div className="text-[15px] font-semibold text-gray-900 mb-0">
                    {collection.name}
                  </div>

                  <div className="text-[12px] text-gray-400 mt-1.5">
                    {t('collections.createdAt')}{" "}
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsListPage;
