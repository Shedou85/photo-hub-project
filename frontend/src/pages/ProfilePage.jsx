import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
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

      <>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Member since:</strong>{" "}
          {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default ProfilePage;
