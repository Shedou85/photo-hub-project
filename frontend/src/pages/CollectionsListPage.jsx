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
    return <div style={{ padding: 20, textAlign: "center" }}>{t('collections.loading')}</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        {t('collections.error')} {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>{t('collections.title')}</h1>

      <h2>{t('collections.createTitle')}</h2>
      <form onSubmit={handleCreateCollection} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", marginBottom: "30px" }}>
        <div>
          <label htmlFor="collectionName">{t('collections.nameLabel')}:</label>
          <input
            type="text"
            id="collectionName"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="collectionDescription">{t('collections.descLabel')}:</label>
          <textarea
            id="collectionDescription"
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
          />
        </div>
        <button type="submit">{t('collections.createBtn')}</button>
        {createError && <p style={{ color: "red" }}>{createError}</p>}
        {createSuccess && <p style={{ color: "green" }}>{createSuccess}</p>}
      </form>

      {collections.length === 0 ? (
        <p>{t('collections.empty')}</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {collections.map((collection) => (
            <li
              key={collection.id}
              style={{ border: "1px solid #ccc", margin: "10px 0", padding: "15px", borderRadius: "5px" }}
            >
              <Link to={`/collection/${collection.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h3>{collection.name}</h3>
                {collection.description && <p>{collection.description}</p>}
                <p style={{ fontSize: "0.8em", color: "#666" }}>
                  {t('collections.createdAt')} {new Date(collection.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollectionsListPage;
