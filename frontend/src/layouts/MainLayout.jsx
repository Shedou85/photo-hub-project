import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SIDEBAR_WIDTH = 240;
const BREAKPOINT = 768;

const navItems = (username) => [
  { to: `/${username}`, label: 'Profilis', icon: '👤' },
  { to: '/collections', label: 'Kolekcijos', icon: '🗂️' },
  { to: '/payments', label: 'Mokėjimai', icon: '💳' },
];

const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const items = navItems(user?.name);

  return (
    // Outer wrapper: column so mobile topbar sits above the row
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f6fa' }}>

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: '#1a1a2e',
          color: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >
            ☰
          </button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>PixelForge</span>
        </header>
      )}

      {/* ── Row: sidebar + content ── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>

        {/* Overlay (mobile) */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1002,
            }}
          />
        )}

        {/* ── Sidebar ── */}
        <aside style={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          background: '#1a1a2e',
          display: 'flex',
          flexDirection: 'column',
          // Desktop: sticky so it stays while page scrolls
          // Mobile: fixed, slides in/out
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: isMobile ? (sidebarOpen ? 0 : -SIDEBAR_WIDTH) : 0,
          height: '100vh',
          zIndex: 1003,
          transition: 'left 0.25s ease',
          overflowY: 'auto',
          boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }}>

          {/* Sidebar header */}
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: 0.5 }}>
                PixelForge
              </span>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                  style={{ background: 'none', border: 'none', color: '#9ca3c4', fontSize: 20, cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* User info */}
            {user && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {user.name ? user.name[0].toUpperCase() : '?'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ color: '#8b8fa8', fontSize: 11, marginTop: 1 }}>
                    {user.plan?.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav style={{ padding: '12px', flex: 1 }}>
            {items.map(({ to, label, icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 4,
                    textDecoration: 'none',
                    color: active ? '#fff' : '#9ca3c4',
                    background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                    fontSize: 14,
                    borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#555e7a' }}>
            © 2025 PixelForge
          </div>
        </aside>

        {/* ── Page content ── */}
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: isMobile ? '16px' : '28px 32px',
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default MainLayout;
