import { BREAKPOINTS } from './src/constants/breakpoints.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'sm': `${BREAKPOINTS.MOBILE}px`,
        'md': `${BREAKPOINTS.TABLET}px`,
        'lg': `${BREAKPOINTS.DESKTOP}px`,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],      // 12px / 18px
        'sm': ['0.875rem', { lineHeight: '1.3125rem' }],     // 14px / 21px
        'base': ['1rem', { lineHeight: '1.5rem' }],           // 16px / 24px
        'lg': ['1.125rem', { lineHeight: '1.575rem' }],       // 18px / 25.2px
        'xl': ['1.375rem', { lineHeight: '1.925rem' }],       // 22px / 30.8px
        '2xl': ['1.75rem', { lineHeight: '2.275rem' }],       // 28px / 36.4px
        '3xl': ['2.25rem', { lineHeight: '2.7rem' }],         // 36px / 43.2px
        '4xl': ['3rem', { lineHeight: '3.3rem' }],             // 48px / 52.8px
      },
      borderRadius: {
        'sm': '0.5rem',       // 8px
        'DEFAULT': '0.625rem', // 10px — the main card radius used across codebase
        'md': '0.75rem',       // 12px
        'lg': '1rem',          // 16px
        'xl': '1.25rem',       // 20px
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.05)',
        'sm': '0 1px 3px rgba(0,0,0,0.05)',
        'DEFAULT': '0 2px 4px rgba(0,0,0,0.06)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 8px 24px rgba(0,0,0,0.12)',
        'xl': '0 16px 48px rgba(0,0,0,0.16)',
      },
      colors: {
        // Sidebar/dark theme colors (used in MainLayout, HomePage, LoginPage)
        'surface-dark': '#1a1a2e',
        'surface-darker': '#0d0f14',
        'surface-darkest': '#080a0f',
        'surface-dark-alt': '#1a1f35',
        // App background
        'surface-light': '#f5f6fa',
        // Sidebar text colors
        'sidebar-text': '#9ca3c4',
        'sidebar-text-dim': '#8b8fa8',
        'sidebar-footer': '#555e7a',
        // Brand gradient endpoints (for reference in docs; gradients still use arbitrary bg-[linear-gradient()])
        'brand-blue': '#3b82f6',
        'brand-indigo': '#6366f1',
      },
    },
  },
  plugins: [],
}
