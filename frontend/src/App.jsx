import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SharePage from './pages/SharePage';
import DeliveryPage from './pages/DeliveryPage';
import CollectionsListPage from './pages/CollectionsListPage';
import CollectionDetailsPage from './pages/CollectionDetailsPage';
import ProfilePage from './pages/ProfilePage';
import PaymentsPage from './pages/PaymentsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ResponsiveLayout from './layouts/ResponsiveLayout';
import AdminPage from './pages/AdminPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import { initGA, trackPageView } from './lib/analytics';

function App() {
  const { isAuthenticated } = useAuth();

  // Fire GA on repeat visits (user already consented)
  useEffect(() => {
    try {
      if (localStorage.getItem('cookieConsent') === 'accepted') {
        initGA();
      }
    } catch { /* storage unavailable */ }
  }, []);

  // Track SPA page views after GA is ready
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <>
    <Toaster position="bottom-right" richColors />
    <CookieConsentBanner />
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/collections" replace /> : <HomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/collections" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/collections" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/share/:shareId" element={<SharePage />} />
      <Route path="/deliver/:deliveryToken" element={<DeliveryPage />} />

      <Route element={<ProtectedRoute><ResponsiveLayout /></ProtectedRoute>}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/collections" element={<CollectionsListPage />} />
        <Route path="/collection/:id" element={<CollectionDetailsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute><ResponsiveLayout /></AdminRoute>}>
        <Route index element={<AdminPage />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
