import { describe, it, expect, afterEach } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

// Helper to render ProtectedRoute with controlled auth state
// Note: We use rtlRender directly here to avoid nested Router from test-utils
function renderProtectedRoute({ isAuthenticated, children }) {
  // Mock localStorage for auth state
  if (isAuthenticated) {
    localStorage.setItem('user', JSON.stringify({ id: 'user123', email: 'test@example.com' }));
  } else {
    localStorage.removeItem('user');
  }

  return rtlRender(
    <AuthProvider>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute>{children}</ProtectedRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe('when authenticated', () => {
    it('renders children', () => {
      renderProtectedRoute({
        isAuthenticated: true,
        children: <div>Protected Content</div>
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not redirect to login', () => {
      renderProtectedRoute({
        isAuthenticated: true,
        children: <div>Protected Content</div>
      });

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('does not render children', () => {
      renderProtectedRoute({
        isAuthenticated: false,
        children: <div>Protected Content</div>
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to /login', () => {
      renderProtectedRoute({
        isAuthenticated: false,
        children: <div>Protected Content</div>
      });

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
