import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProfilePage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "https://api.pixelforge.pro/backend/profile/me",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, bio }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "OK" && data.user) {
        login(data.user);
        setSuccess("Profile updated successfully!");
      } else {
        setError(
          `Profile update failed: ${
            data.error ||
            data.message ||
            "The server returned an unexpected response."
          }`
        );
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>{user.name}'s Profile</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "400px" }}>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={user.email} disabled />
        </div>
        <div>
          <label htmlFor="createdAt">Member since:</label>
          <input type="text" id="createdAt" value={new Date(user.createdAt).toLocaleDateString()} disabled />
        </div>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <button type="submit">Save</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default ProfilePage;

