import React from 'react';
import { useParams } from 'react-router-dom';

function ProfilePage() {
  const { username } = useParams();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to your profile, {username}!</h1>
      <p>This is your personal page.</p>
    </div>
  );
}

export default ProfilePage;
