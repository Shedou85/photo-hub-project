import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('loads user from localStorage if present', () => {
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('starts with no user when localStorage is empty', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('user', 'invalid-json');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('sets user in state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };

      act(() => {
        result.current.login(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('sets user in localStorage', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };

      act(() => {
        result.current.login(mockUser);
      });

      const storedUser = JSON.parse(localStorage.getItem('user'));
      expect(storedUser).toEqual(mockUser);
    });

    it('sets isAuthenticated to true', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      const mockUser = { id: 'user123', email: 'test@example.com' };

      act(() => {
        result.current.login(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears user from state', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.user).toEqual(mockUser);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });

    it('clears user from localStorage', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('user')).toBeNull();
    });

    it('sets isAuthenticated to false', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('isAuthenticated computed value', () => {
    it('is true when user exists', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      act(() => {
        result.current.login({ id: 'user123', email: 'test@example.com' });
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('is false when user is null', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('updates reactively on state change', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.login({ id: 'user123', email: 'test@example.com' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
