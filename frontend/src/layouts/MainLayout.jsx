import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const SIDEBAR_WIDTH = 240;
const BREAKPOINT = 768;

const NAV_ITEMS = () => [
  { to: '/profile', key: 'nav.profile', icon: '👤' },
  { to: '/collections', key: 'nav.collections', icon: '🗂️' },
  { to: '/payments', key: 'nav.payments', icon: '💳' },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'lt', label: 'LT' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const items = NAV_ITEMS();

  return (
    // Outer wrapper: column so mobile topbar sits above the row
    <div className="flex flex-col min-h-screen bg-[#f5f6fa]">

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header className="flex items-center gap-3 px-4 py-3 bg-[#1a1a2e] text-white sticky top-0 z-[1001] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="bg-transparent border-none text-white text-2xl cursor-pointer leading-none px-1"
          >
            ☰
          </button>
          <span className="font-bold text-base">PixelForge</span>
        </header>
      )}

      {/* ── Row: sidebar + content ── */}
      <div className="flex flex-1 relative">

        {/* Overlay (mobile) */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-[1002]"
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`bg-[#1a1a2e] flex flex-col top-0 h-screen z-[1003] overflow-y-auto${isMobile ? ' fixed' : ' sticky'}`}
          style={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
            left: isMobile ? (sidebarOpen ? 0 : -SIDEBAR_WIDTH) : 0,
            transition: 'left 0.25s ease',
            boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
          }}
        >

          {/* Sidebar header */}
          <div className="pt-6 px-5 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-lg text-white tracking-[0.5px]">
                PixelForge
              </span>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                  className="bg-transparent border-none text-[#9ca3c4] text-xl cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* User info */}
            {user && (
              <div className="mt-[14px] flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name ? user.name[0].toUpperCase() : '?'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {user.name}
                  </div>
                  <div className="text-[#8b8fa8] text-[11px] mt-px">
                    {user.plan?.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="p-3 flex-1">
            {items.map(({ to, key, icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 py-2.5 px-3.5 rounded-lg mb-1 no-underline text-sm border-l-[3px]${
                    active
                      ? ' text-white bg-indigo-500/25 font-semibold border-indigo-500'
                      : ' text-[#9ca3c4] bg-transparent font-normal border-transparent'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          {/* Language switcher */}
          <div className="px-3 pb-2">
            <div className="flex gap-1.5 py-2 px-3.5 rounded-lg bg-white/5">
              {languages.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => i18n.changeLanguage(code)}
                  className={`flex-1 py-[5px] rounded-md border-none cursor-pointer text-xs font-bold${
                    i18n.language === code
                      ? ' bg-indigo-500 text-white'
                      : ' bg-transparent text-gray-500'
                  }`}
                  style={{ transition: 'background 0.15s, color 0.15s' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Logout button */}
          <div className="p-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 py-2.5 px-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium cursor-pointer text-left"
            >
              <span className="text-base">🚪</span>
              {t('nav.logout')}
            </button>
          </div>

          {/* Sidebar footer */}
          <div className="py-[14px] px-5 border-t border-white/[0.08] text-[11px] text-[#555e7a]">
            © {new Date().getFullYear()} PixelForge
          </div>
        </aside>

        {/* ── Page content ── */}
        <main className={`flex-1 min-w-0${isMobile ? ' p-4' : ' py-7 px-8'}`}>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default MainLayout;
