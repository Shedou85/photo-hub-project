import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { api } from '../lib/api';

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
  const { i18n, t } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef(null);

  const languages = [
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];

  const handleLogout = async () => {
    await api.post('/logout');
    flushSync(() => logout());
    navigate('/');
  };

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const currentLang = languages.find((l) => l.code === i18n.language) ?? languages[0];

  return (
    <div className="flex flex-col min-h-screen bg-surface-darker">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      {/* Top header */}
      <header className="flex items-center justify-between px-4 py-3 bg-surface-dark border-b border-white/[0.08] sticky top-0 z-40">
        <span className="font-extrabold text-lg tracking-[0.5px] text-white">PixelForge</span>

        <div className="flex items-center gap-2">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-md text-red-400 hover:bg-red-500/10 transition-colors duration-150"
            aria-label={t('nav.logout')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          {/* Language switcher */}
          <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setLangOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/[0.12] bg-white/[0.06] text-xs font-bold text-white/70 cursor-pointer hover:bg-white/[0.1] transition-colors duration-150 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {currentLang.label}
            <span>▾</span>
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-1 bg-surface-dark border border-white/[0.12] rounded-md shadow-md overflow-hidden z-50 min-w-[60px]">
              {languages
                .filter((l) => l.code !== i18n.language)
                .map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => {
                      i18n.changeLanguage(code);
                      setLangOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-xs font-bold text-left text-white/70 cursor-pointer border-none bg-transparent hover:bg-indigo-500/15 hover:text-indigo-400 transition-colors duration-150"
                  >
                    {label}
                  </button>
                ))}
            </div>
          )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MobileLayout;
