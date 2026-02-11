import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// --- Sub-component: read-only meta info row ---
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">
        {value}
      </span>
    </div>
  );
}

function CollectionDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollectionDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/collections/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch collection details");
        }

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
    };

    fetchCollectionDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        {t('collection.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-7 px-6 font-sans max-w-[720px] mx-auto">
        <div className="text-red-800 bg-red-50 border border-red-300 rounded-md px-[14px] py-3 text-[13px]">
          {t('collection.error')} {error}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="py-10 px-5 text-center font-sans text-gray-500">
        {t('collection.notFound')}
      </div>
    );
  }

  return (
    <div className="py-7 px-6 font-sans max-w-[720px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center mb-7 gap-[14px]">
        {/* Icon gradient circle */}
        <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] flex items-center justify-center text-[22px] shrink-0 select-none">
          🗂️
        </div>

        <div>
          <h1 className="m-0 text-[22px] font-bold text-gray-900 leading-tight">
            {collection.name}
          </h1>
        </div>
      </div>

      {/* ── Collection Info Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('collection.createdAt')}
        </h2>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[18px]">
          <InfoRow
            label={t('collection.createdAt')}
            value={new Date(collection.createdAt).toLocaleDateString()}
          />
        </div>
      </div>

      {/* ── Photos Card ── */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-5 mb-5">
        <h2 className="mt-0 mb-4 text-sm font-bold text-gray-700 uppercase tracking-[0.05em]">
          {t('collection.photos')}
        </h2>

        <p className="m-0 text-sm text-gray-500 text-center py-5">
          {t('collection.noPhotos')}
        </p>
      </div>
    </div>
  );
}

export default CollectionDetailsPage;
