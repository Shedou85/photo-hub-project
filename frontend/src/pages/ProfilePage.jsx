import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ProfilePage() {
  const { username } = useParams(); // The route parameter is named 'username'
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // The backend endpoint expects a 'name' query parameter.
        // We use the 'username' from the URL as its value.
        const response = await fetch(`https://api.pixelforge.pro/backend/user?name=${username}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setUserData(data.user);
        } else {
          setError(data.error || 'Failed to fetch user data.');
        }
      } catch (err) {
        setError('An error occurred while fetching user data.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
        fetchUserData();
    }
  }, [username]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{username}'s Profile</h1>
      {userData ? (
        <div>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Member since:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>User data not found.</p>
      )}
    </div>
  );
}

export default ProfilePage;
