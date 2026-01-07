import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex' }}>
      <div
        style={{
          width: '200px',
          background: '#f0f0f0',
          padding: '20px',
          height: '100vh',
        }}
      >
        <h2>Menu</h2>
        <ul>
          <li>
            <Link to={`/${user?.name}`}>Profilis</Link>
          </li>
          <li>
            <Link to="/collections">Kolekcijos</Link>
          </li>
          <li>
            <Link to="/payments">Mokėjimai</Link>
          </li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
