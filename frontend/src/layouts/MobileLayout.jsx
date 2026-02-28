import React from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { api } from '../lib/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

/**
 * Mobile layout shell with bottom tab navigation.
 *
 * Layout structure:
 * - Fixed top header with logo, logout button, and language switcher
 * - Main content area with bottom padding (pb-24 = 96px) to prevent content hiding under bottom nav
 * - Fixed bottom tab navigation
 *
 * Language switcher extracted from MainLayout — same dropdown logic and styling.
 *
 * @component
 * @example
 * <MobileLayout />
 */
const MobileLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await api.post('/logout');
    flushSync(() => logout());
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-darker">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      {/* Top header */}
      <header className="flex items-center justify-between px-4 py-3 header-glass divider-glow divider-glow-full fixed top-0 left-0 right-0 z-40">
        <span className="font-extrabold text-lg tracking-[0.5px] text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.15)]">PixelForge</span>

        <div className="flex items-center gap-2">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-md text-white/40 hover:text-red-400/80 hover:bg-white/[0.06] transition-colors duration-200"
            aria-label={t('nav.logout')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          {/* Language switcher */}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 p-4 pt-[60px] pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MobileLayout;
