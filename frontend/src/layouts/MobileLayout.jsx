import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNavigation from '../components/BottomNavigation';

/**
 * Mobile layout shell with bottom tab navigation.
 *
 * Layout structure:
 * - Fixed top header with logo and language switcher
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
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef(null);

  const languages = [
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];

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

        {/* Language switcher */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setLangOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
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
                    className="block w-full px-3 py-2 text-xs font-bold text-left cursor-pointer border-none bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150"
                  >
                    {label}
                  </button>
                ))}
            </div>
          )}
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
