import React from 'react';
import useMediaQuery from '../hooks/useMediaQuery';
import { BREAKPOINTS } from '../constants/breakpoints';
import MainLayout from './MainLayout';
import MobileLayout from './MobileLayout';

/**
 * Responsive layout switcher.
 *
 * Conditionally renders MainLayout (desktop sidebar) or MobileLayout (bottom nav)
 * based on viewport width using the useMediaQuery hook.
 *
 * Breakpoint: 768px (BREAKPOINTS.TABLET)
 * - Desktop (>=768px): MainLayout with 256px persistent sidebar
 * - Mobile (<768px): MobileLayout with bottom tab navigation
 *
 * @component
 * @example
 * <Route element={<ProtectedRoute><ResponsiveLayout /></ProtectedRoute>}>
 *   <Route path="/profile" element={<ProfilePage />} />
 * </Route>
 */
const ResponsiveLayout = () => {
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.TABLET}px)`);
  return isDesktop ? <MainLayout /> : <MobileLayout />;
};

export default ResponsiveLayout;
