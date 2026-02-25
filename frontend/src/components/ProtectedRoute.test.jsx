import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
    resetCsrfToken: vi.fn(),
}));

import { api } from '../lib/api';

function renderProtectedRoute({ mockAuthResponse, children }) {
  api.get.mockResolvedValue(mockAuthResponse);

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when authenticated', () => {
    it('renders children after session check', async () => {
      renderProtectedRoute({
        mockAuthResponse: {
          data: { status: 'OK', user: { id: 'u1', email: 'test@test.com' } },
          status: 200
        },
        children: <div>Protected Content</div>
      });

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('does not redirect to login', async () => {
      renderProtectedRoute({
        mockAuthResponse: {
          data: { status: 'OK', user: { id: 'u1', email: 'test@test.com' } },
          status: 200
        },
        children: <div>Protected Content</div>
      });

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('redirects to /login', async () => {
      renderProtectedRoute({
        mockAuthResponse: { data: { error: 'Not authenticated' }, status: 401 },
        children: <div>Protected Content</div>
      });

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('does not render children', async () => {
      renderProtectedRoute({
        mockAuthResponse: { data: { error: 'Not authenticated' }, status: 401 },
        children: <div>Protected Content</div>
      });

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
