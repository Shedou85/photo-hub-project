import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Mobile bottom tab navigation bar.
 *
 * Fixed position bottom navigation with 3 core actions (Collections, Profile, Payments).
 * Touch targets are 56x56px (exceeds WCAG 48px minimum for mobile).
 * iOS safe area padding applied via env(safe-area-inset-bottom) for home indicator.
 *
 * Uses 24px SVG icons (NOT emoji for cross-platform consistency).
 * Active state: blue background + blue text. Inactive: gray text with hover effect.
 * Accessible: role="navigation", aria-label, aria-current on active link.
 *
 * @component
 * @example
 * <BottomNavigation />
 */
const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/collections',
      label: t('nav.collections'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: t('nav.profile'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: '/payments',
      label: t('nav.payments'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label={t('nav.mainNavigation')}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ to, label, icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] px-3 py-2 rounded-lg transition-colors duration-150 no-underline${
                isActive
                  ? ' text-blue-600 bg-blue-50'
                  : ' text-gray-500 hover:bg-gray-50'
              }`}
            >
              {icon}
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
