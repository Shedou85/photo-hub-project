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
  { to: '/profile', key: 'nav.profile', icon: '👤' },
  { to: '/collections', key: 'nav.collections', icon: '🗂️' },
  { to: '/payments', key: 'nav.payments', icon: '💳' },
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
          className="bg-surface-dark flex flex-col top-0 h-screen sticky overflow-y-auto"
          style={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
          }}
        >

          {/* Sidebar header */}
          <div className="pt-6 px-5 pb-4 border-b border-white/[0.08]">
            <span className="font-extrabold text-lg text-white tracking-[0.5px]">PixelForge</span>
            {user && (
              <div className="mt-3.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name ? user.name[0].toUpperCase() : '?'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</div>
                  <div className="text-sidebar-text-dim text-xs mt-px">{user.plan?.replace('_', ' ')}</div>
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
          <nav className="p-3 flex-1">
            {items.map(({ to, key, icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} className={`flex items-center gap-3 py-2.5 px-3.5 rounded-lg mb-1 no-underline text-sm border-l-[3px]${active ? ' text-white bg-indigo-500/25 font-semibold border-indigo-500' : ' text-sidebar-text bg-transparent font-normal border-transparent'}`}>
                  <span className="text-base">{icon}</span>
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-3">
            <button onClick={handleLogout} className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm font-medium cursor-pointer text-left">
              <span className="text-sm md:text-base">🚪</span>
              {t('nav.logout')}
            </button>
          </div>

          {/* Sidebar footer */}
          <div className="py-3.5 px-5 border-t border-white/[0.08] text-xs text-sidebar-footer">
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
          <div className="flex items-center justify-end px-6 py-3 bg-surface-dark border-b border-white/[0.08]">
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
