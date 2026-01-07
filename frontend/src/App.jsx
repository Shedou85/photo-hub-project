import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CollectionsPage from './pages/CollectionsPage';
import PaymentsPage from './pages/PaymentsPage';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import './App.css';

function App() {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      login(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={isAuthenticated() && user ? <Navigate to={`/${user.name}`} replace /> : <HomePage />} />
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />} />
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/:username" element={<ProfilePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>
    </Routes>
  );
}

export default App;

