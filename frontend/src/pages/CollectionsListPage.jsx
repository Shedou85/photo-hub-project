import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function CollectionsListPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
        const response = await fetch("https://api.pixelforge.pro/backend/collections", {
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
      setCreateError("Collection name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("https://api.pixelforge.pro/backend/collections", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCollectionName, description: newCollectionDescription }),
      });

      const data = await response.json();

      if (response.ok && data.status === "OK") {
        setCreateSuccess("Collection created successfully!");
        setNewCollectionName("");
        setNewCollectionDescription("");
        // Re-fetch collections to update the list
        const updatedResponse = await fetch("https://api.pixelforge.pro/backend/collections", {
          credentials: "include",
        });
        const updatedData = await updatedResponse.json();
        if (updatedData.status === "OK") {
          setCollections(updatedData.collections);
        }
      } else {
        setCreateError(data.error || "Failed to create collection.");
      }
    } catch (err) {
      setCreateError(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Loading collections...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Mano Kolekcijos</h1>

      <h2>Sukurti naują kolekciją</h2>
      <form onSubmit={handleCreateCollection} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", marginBottom: "30px" }}>
        <div>
          <label htmlFor="collectionName">Kolekcijos pavadinimas:</label>
          <input
            type="text"
            id="collectionName"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="collectionDescription">Aprašymas (neprivaloma):</label>
          <textarea
            id="collectionDescription"
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
          />
        </div>
        <button type="submit">Sukurti kolekciją</button>
        {createError && <p style={{ color: "red" }}>{createError}</p>}
        {createSuccess && <p style={{ color: "green" }}>{createSuccess}</p>}
      </form>

      {collections.length === 0 ? (
        <p>Jūs neturite jokių kolekcijų.</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {collections.map((collection) => (
            <li
              key={collection.id}
              style={{
                border: "1px solid #ccc",
                margin: "10px 0",
                padding: "15px",
                borderRadius: "5px",
              }}
            >
              <Link to={`/collection/${collection.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h3>{collection.name}</h3>
                {collection.description && <p>{collection.description}</p>}
                <p style={{ fontSize: "0.8em", color: "#666" }}>
                  Sukurta: {new Date(collection.createdAt).toLocaleDateString()}
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