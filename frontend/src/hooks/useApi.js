// frontend/src/hooks/useApi.js
// Custom hook for API requests with loading/error states and cancellation

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '../lib/api';

/**
 * Hook for making API requests with automatic loading/error state management
 *
 * Usage:
 *   const { execute, loading, error, data } = useApi();
 *
 *   // In an event handler or useEffect:
 *   const result = await execute('/collections', { method: 'GET' });
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (endpoint, options = {}) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const result = await apiRequest(endpoint, {
      ...options,
      signal: controller.signal,
    });

    // Don't update state if this request was cancelled
    if (result.error === 'Request cancelled') {
      return result;
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    return result;
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
}

export default useApi;
