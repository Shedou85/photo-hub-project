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

  // --- Shared input style factory ---
  const inputStyle = (fieldName) => ({
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    color: "#1f2937",
    background: "#ffffff",
    border: focusedField === fieldName ? "1.5px solid #3b82f6" : "1.5px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "sans-serif",
  });

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  };

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
        {t('collections.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "12px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#991b1b",
          }}
        >
          {t('collections.error')} {error}
        </div>
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
        {/* Gradient icon circle */}
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
            {t('collections.title')}
          </h1>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {t('collections.subtitle', '')}
          </p>
        </div>
      </div>

      {/* ── Create Collection Card ── */}
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
          {t('collections.createTitle')}
        </h2>

        <form onSubmit={handleCreateCollection}>
          {/* Name field */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="collectionName" style={labelStyle}>
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
              style={inputStyle("collectionName")}
            />
          </div>

          {/* Description field */}
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="collectionDescription" style={labelStyle}>
              {t('collections.descLabel')}
            </label>
            <textarea
              id="collectionDescription"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              onFocus={() => setFocusedField("collectionDescription")}
              onBlur={() => setFocusedField(null)}
              rows={3}
              style={{
                ...inputStyle("collectionDescription"),
                resize: "vertical",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* Feedback messages */}
          {createError && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: "16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#991b1b",
              }}
            >
              {createError}
            </div>
          )}

          {createSuccess && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: "16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#15803d",
                fontWeight: "500",
              }}
            >
              {createSuccess}
            </div>
          )}

          {/* Submit button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                padding: "9px 22px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#ffffff",
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "sans-serif",
                transition: "opacity 0.15s",
                opacity: btnHovered ? 0.88 : 1,
              }}
            >
              {t('collections.createBtn')}
            </button>
          </div>
        </form>
      </div>

      {/* ── Collections List Card ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
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
          {t('collections.title')}
        </h2>

        {collections.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {t('collections.empty')}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collection/${collection.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  onMouseEnter={() => setHoveredCollection(collection.id)}
                  onMouseLeave={() => setHoveredCollection(null)}
                  style={{
                    background: "#ffffff",
                    border: hoveredCollection === collection.id
                      ? "1px solid #3b82f6"
                      : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: hoveredCollection === collection.id
                      ? "0 1px 4px rgba(59, 130, 246, 0.10)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: collection.description ? "4px" : "0",
                    }}
                  >
                    {collection.name}
                  </div>

                  {collection.description && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "6px",
                        lineHeight: "1.4",
                      }}
                    >
                      {collection.description}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginTop: "6px",
                    }}
                  >
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
