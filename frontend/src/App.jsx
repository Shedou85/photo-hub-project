import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CollectionsListPage from './pages/CollectionsListPage';
import CollectionDetailsPage from './pages/CollectionDetailsPage';
import ProfilePage from './pages/ProfilePage';
import PaymentsPage from './pages/PaymentsPage';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
    <Toaster position="top-right" richColors />
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/collections" replace /> : <HomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/collections" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/collections" element={<CollectionsListPage />} />
        <Route path="/collection/:id" element={<CollectionDetailsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
