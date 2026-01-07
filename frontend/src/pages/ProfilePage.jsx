import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function ProfilePage() {
  const { username } = useParams(); // naudojam TIK UI pavadinimui
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "https://api.pixelforge.pro/backend/auth/me.php",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const data = await response.json();

        setUserData(data.user);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;
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
      <h1>{username}'s Profile</h1>

      {userData ? (
        <>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          <p>
            <strong>Member since:</strong>{" "}
            {new Date(userData.createdAt).toLocaleDateString()}
          </p>
        </>
      ) : (
        <p>User data not found.</p>
      )}
    </div>
  );
}

export default ProfilePage;
