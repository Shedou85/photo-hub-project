import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

function CollectionsListPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredCollection, setHoveredCollection] = useState(null);
  const [btnHovered, setBtnHovered] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

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
  }, [isAuthenticated, navigate]);

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
        body: JSON.stringify({ name: newCollectionName, description: newCollectionDescription }),
      });

      const data = await response.json();

      if (response.ok && data.status === "OK") {
        setCreateSuccess(t('collections.createSuccess'));
        setNewCollectionName("");
        setNewCollectionDescription("");
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
        {/* Gradient icon circle */}
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center text-[22px] shrink-0 select-none">
          🗂️
        </div>

        <div>
          <h1 className="m-0 text-[22px] font-bold text-gray-900 leading-tight">
            {t('collections.title')}
          </h1>
          <p className="mt-0.5 mb-0 text-[13px] text-gray-500">
            {t('collections.subtitle', '')}
          </p>
        </div>
      </div>

      {/* ── Create Collection Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-[14px] font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('collections.createTitle')}
        </h2>

        <form onSubmit={handleCreateCollection}>
          {/* Name field */}
          <div className="mb-4">
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
              onFocus={() => setFocusedField("collectionName")}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full py-[9px] px-3 text-[14px] text-gray-800 bg-white rounded-[6px] outline-none box-border transition-colors duration-150 font-sans ${
                focusedField === "collectionName"
                  ? "border-[1.5px] border-blue-500"
                  : "border-[1.5px] border-gray-300"
              }`}
            />
          </div>

          {/* Description field */}
          <div className="mb-6">
            <label
              htmlFor="collectionDescription"
              className="block mb-[5px] text-[13px] font-semibold text-gray-700"
            >
              {t('collections.descLabel')}
            </label>
            <textarea
              id="collectionDescription"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              onFocus={() => setFocusedField("collectionDescription")}
              onBlur={() => setFocusedField(null)}
              rows={3}
              className={`w-full py-[9px] px-3 text-[14px] text-gray-800 bg-white rounded-[6px] outline-none box-border transition-colors duration-150 font-sans resize-y leading-[1.5] ${
                focusedField === "collectionDescription"
                  ? "border-[1.5px] border-blue-500"
                  : "border-[1.5px] border-gray-300"
              }`}
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
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              className={`py-[9px] px-[22px] text-[14px] font-semibold text-white bg-[linear-gradient(135deg,#3b82f6,#6366f1)] border-none rounded-[6px] cursor-pointer font-sans transition-opacity duration-150 ${
                btnHovered ? "opacity-[0.88]" : "opacity-100"
              }`}
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
                <div
                  onMouseEnter={() => setHoveredCollection(collection.id)}
                  onMouseLeave={() => setHoveredCollection(null)}
                  className={`bg-white rounded-[8px] px-4 py-3.5 cursor-pointer transition-[border-color,box-shadow] duration-150 ${
                    hoveredCollection === collection.id
                      ? "border border-blue-500 shadow-[0_1px_4px_rgba(59,130,246,0.10)]"
                      : "border border-gray-200 shadow-none"
                  }`}
                >
                  <div
                    className={`text-[15px] font-semibold text-gray-900 ${
                      collection.description ? "mb-1" : "mb-0"
                    }`}
                  >
                    {collection.name}
                  </div>

                  {collection.description && (
                    <div className="text-[13px] text-gray-500 mb-1.5 leading-[1.4]">
                      {collection.description}
                    </div>
                  )}

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
