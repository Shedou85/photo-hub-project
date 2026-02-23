import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

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
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_) {
      // ignore network errors — still log out locally
    }
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
    <div className="flex flex-col min-h-screen bg-surface-light">
      {/* Top header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
        <span className="font-extrabold text-lg tracking-[0.5px]">PixelForge</span>

        <div className="flex items-center gap-2">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-md text-red-500 hover:bg-red-50 transition-colors duration-150"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors duration-150 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {currentLang.label}
            <span>▾</span>
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md overflow-hidden z-50 min-w-[60px]">
              {languages
                .filter((l) => l.code !== i18n.language)
                .map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => {
                      i18n.changeLanguage(code);
                      setLangOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-xs font-bold text-left text-gray-700 cursor-pointer border-none bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150"
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
      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};

export default MobileLayout;
