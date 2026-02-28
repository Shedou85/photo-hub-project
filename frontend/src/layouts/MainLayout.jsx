import React from 'react';
import { flushSync } from 'react-dom';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SIDEBAR_WIDTH = 256;
const MS_PER_DAY = 86_400_000;

const NAV_ITEMS = () => [
  {
    to: '/profile',
    key: 'nav.profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    to: '/collections',
    key: 'nav.collections',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/payments',
    key: 'nav.payments',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await api.post('/logout');
    flushSync(() => logout());
    navigate('/');
  };

  const items = NAV_ITEMS();

  if (user?.role === 'ADMIN') {
    items.push({
      to: '/admin',
      key: 'nav.admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    });
  }

  const daysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt) - new Date()) / MS_PER_DAY))
    : null;
  const isActiveTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'FREE_TRIAL' && daysLeft !== null;
  const isExpiredTrial = user?.plan === 'FREE_TRIAL' && user?.subscriptionStatus === 'INACTIVE';

  return (
    <div className="flex flex-col min-h-screen bg-surface-darker">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Row: sidebar + content */}
      <div className="flex flex-1 relative">

        {/* Sidebar */}
        <aside
          className="sidebar-glass glass-border-gradient sidebar-edge flex flex-col top-0 h-screen sticky overflow-y-auto"
          style={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
          }}
        >

          {/* Sidebar header — brand + user card */}
          <div className="pt-6 px-5 pb-4 relative divider-glow">
            <span className="font-extrabold text-lg text-white tracking-[0.5px] drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">PixelForge</span>
            {user && (
              <div className="mt-3.5 p-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.06] shadow-glass">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-glow-indigo-sm">
                    {user.name ? user.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-white font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</div>
                    <span className="inline-block mt-0.5 bg-white/[0.06] rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">{user.plan?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {isActiveTrial && daysLeft !== null && (
              <Link to="/payments" className="mt-3 block no-underline">
                <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  daysLeft <= 3
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : daysLeft <= 7
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {t('plans.trialDaysLeft', { days: daysLeft })}
                </div>
              </Link>
            )}
            {isExpiredTrial && (
              <Link to="/payments" className="mt-3 block no-underline">
                <div className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                  {t('plans.trialExpired')}
                </div>
              </Link>
            )}
          </div>

          {/* Nav links */}
          <nav className="px-3 py-3 flex-1 space-y-1">
            {items.map(({ to, key, icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`group flex items-center gap-3 py-2.5 px-3 rounded-lg no-underline text-sm border-l-2 transition-all duration-200${
                    active
                      ? ' nav-glass-active text-white font-medium border-indigo-400/60'
                      : ' text-sidebar-text bg-transparent font-normal border-transparent hover:bg-white/[0.04] hover:text-white/80'
                  }`}
                >
                  <span className={`transition-transform duration-200 group-hover:scale-105${active ? ' drop-shadow-[0_0_6px_rgba(99,102,241,0.3)]' : ''}`}>{icon}</span>
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-3 relative divider-glow">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-white/[0.03] border border-transparent text-white/40 text-xs md:text-sm font-medium cursor-pointer text-left transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-400/80 hover:border-red-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t('nav.logout')}
            </button>
          </div>

          {/* Sidebar footer */}
          <div className="py-3.5 px-5 text-xs text-sidebar-footer">
            <a href="mailto:pixelforge@pixelforge.pro"
               className="flex items-center gap-1.5 text-sidebar-footer hover:text-white transition-colors duration-150 no-underline mb-2">
              ✉ {t('nav.contact')}
            </a>
            © {new Date().getFullYear()} PixelForge
          </div>
        </aside>

        {/* Page content */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Top bar with language switcher */}
          <div className="flex items-center justify-end px-6 py-2.5 header-glass divider-glow divider-glow-full sticky top-0 z-30">
            <LanguageSwitcher />
          </div>

          {/* Page content */}
          <main id="main-content" className="py-7 px-8 relative">
            {/* Subtle grid pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
            {/* Ambient glow */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px]" />
            <div className="relative">
              <Outlet />
            </div>
          </main>

        </div>

      </div>
    </div>
  );
};

export default MainLayout;
