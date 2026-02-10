import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

// --- Sub-component: read-only meta info row ---
function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: "600",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#9ca3af",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "14px",
          color: "#1f2937",
          fontWeight: "500",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CollectionDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

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
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        {t('collection.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "28px 24px",
          fontFamily: "sans-serif",
          maxWidth: "720px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            color: "#991b1b",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            padding: "12px 14px",
            fontSize: "13px",
          }}
        >
          {t('collection.error')} {error}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        {t('collection.notFound')}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px 24px",
        fontFamily: "sans-serif",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "28px",
          gap: "14px",
        }}
      >
        {/* Icon gradient circle */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          🗂️
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {collection.name}
          </h1>
          {collection.description && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Collection Info Card ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t('collection.createdAt')}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "18px",
          }}
        >
          <InfoRow
            label={t('collection.createdAt')}
            value={new Date(collection.createdAt).toLocaleDateString()}
          />
        </div>
      </div>

      {/* ── Photos Card ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t('collection.photos')}
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#6b7280",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          {t('collection.noPhotos')}
        </p>
      </div>
    </div>
  );
}

export default CollectionDetailsPage;
