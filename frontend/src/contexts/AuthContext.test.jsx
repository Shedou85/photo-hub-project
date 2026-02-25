import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
    resetCsrfToken: vi.fn(),
}));

import { api, resetCsrfToken } from '../lib/api';

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts in loading state', () => {
      api.get.mockReturnValue(new Promise(() => {})); // never resolves
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets user from /auth/me on valid session', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test' };
      api.get.mockResolvedValue({ data: { status: 'OK', user: mockUser }, status: 200 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets user to null on 401', async () => {
      api.get.mockResolvedValue({ data: { error: 'Not authenticated' }, status: 401 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets user to null on network error', async () => {
      api.get.mockResolvedValue({ data: null, error: 'Network error', status: 0 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('sets user in state', async () => {
      api.get.mockResolvedValue({ data: null, status: 401 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      await waitFor(() => expect(result.current.loading).toBe(false));

      const mockUser = { id: 'user123', email: 'test@example.com' };
      act(() => { result.current.login(mockUser); });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('does not write to localStorage', async () => {
      api.get.mockResolvedValue({ data: null, status: 401 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => { result.current.login({ id: 'u1', email: 'a@b.com' }); });

      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears user and resets CSRF token', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      api.get.mockResolvedValue({ data: { status: 'OK', user: mockUser }, status: 200 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => { result.current.logout(); });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(resetCsrfToken).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated computed value', () => {
    it('updates reactively on login/logout', async () => {
      api.get.mockResolvedValue({ data: null, status: 401 });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isAuthenticated).toBe(false);

      act(() => { result.current.login({ id: 'user123', email: 'test@example.com' }); });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => { result.current.logout(); });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
