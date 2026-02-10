import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
    return <div style={{ padding: 20, textAlign: "center" }}>{t('collection.loading')}</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        {t('collection.error')} {error}
      </div>
    );
  }

  if (!collection) {
    return <div style={{ padding: 20, textAlign: "center" }}>{t('collection.notFound')}</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>{collection.name}</h1>
      {collection.description && <p>{collection.description}</p>}
      <p>
        <strong>{t('collection.createdAt')}</strong> {new Date(collection.createdAt).toLocaleDateString()}
      </p>
      <h2>{t('collection.photos')}</h2>
      <p>{t('collection.noPhotos')}</p>
    </div>
  );
}

export default CollectionDetailsPage;
