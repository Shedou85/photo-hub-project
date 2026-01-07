import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function CollectionDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
        const response = await fetch(`https://api.pixelforge.pro/backend/collections/${id}`, {
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
    return <div style={{ padding: 20, textAlign: "center" }}>Loading collection details...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        Error: {error}
      </div>
    );
  }

  if (!collection) {
    return <div style={{ padding: 20, textAlign: "center" }}>Collection not found.</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>{collection.name}</h1>
      {collection.description && <p>{collection.description}</p>}
      <p>
        <strong>Sukurta:</strong> {new Date(collection.createdAt).toLocaleDateString()}
      </p>
      {/* Add photos belonging to this collection here later */}
      <h2>Nuotraukos</h2>
      <p>Nuotraukų dar nėra.</p>
    </div>
  );
}

export default CollectionDetailsPage;
