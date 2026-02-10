import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // Re-using existing styles

function HomePage() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ color: 'purple' }}>PixelForge is under construction</h1>
        <p>Svetainė netrukus bus prieinama.</p>
        <Link to="/login">
          <button style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
            Login
          </button>
        </Link>
      </header>
    </div>
  );
}

export default HomePage;
