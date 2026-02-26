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
import NotFoundPage from './pages/NotFoundPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import ErrorBoundary from './components/ErrorBoundary';
import { initGA, trackPageView } from './lib/analytics';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-darker flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm text-white/40 tracking-wide">PixelForge</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <Toaster position="bottom-right" richColors />
    <CookieConsentBanner />
    <ErrorBoundary>
    <ScrollToTop />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
    </>
  );
}

export default App;
