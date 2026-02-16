import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive media query detection.
 *
 * Uses window.matchMedia API to detect viewport size changes at runtime.
 * Initializes state synchronously from current matchMedia result (SSR-safe).
 * Uses modern addEventListener API (not deprecated addListener).
 *
 * @param {string} query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns {boolean} Whether the media query currently matches
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * return isDesktop ? <DesktopLayout /> : <MobileLayout />;
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

export default useMediaQuery;
