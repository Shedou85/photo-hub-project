// frontend/src/lib/api.js
// Centralized API client with CSRF protection, error handling, and request cancellation

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.pixelforge.pro/backend';

let csrfToken = null;

/**
 * Fetch CSRF token from backend
 */
async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/csrf-token`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
    }
  } catch (e) {
    console.warn('Failed to fetch CSRF token:', e);
  }
}

/**
 * Core API request function
 * @param {string} endpoint - API path (e.g., '/collections')
 * @param {object} options - fetch options
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<{data: any, error: string|null, status: number}>}
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    signal = null,
    headers: customHeaders = {},
  } = options;

  // Fetch CSRF token if we don't have one and this is a state-changing request
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && !csrfToken) {
    await fetchCsrfToken();
  }

  const isFormData = body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
  };

  // Add CSRF token for state-changing requests
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const fetchOptions = {
    method,
    headers,
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    fetchOptions.body = isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body));
  }

  if (signal) {
    fetchOptions.signal = signal;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

    // Handle 403 with CSRF error — retry once with fresh token
    if (res.status === 403) {
      const errorData = await res.json().catch(() => ({}));
      if (errorData.error === 'Invalid or missing CSRF token') {
        csrfToken = null;
        await fetchCsrfToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            ...fetchOptions,
            headers,
          });
          const retryData = await retryRes.json().catch(() => null);
          return {
            data: retryData,
            error: retryRes.ok ? null : retryData?.error || retryData?.message || 'Request failed',
            status: retryRes.status,
          };
        }
      }
      return {
        data: errorData,
        error: errorData?.error || 'Forbidden',
        status: 403,
      };
    }

    const data = await res.json().catch(() => null);

    return {
      data,
      error: res.ok ? null : data?.error || data?.message || 'Request failed',
      status: res.status,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { data: null, error: 'Request cancelled', status: 0 };
    }
    return { data: null, error: err.message || 'Network error', status: 0 };
  }
}

// Convenience methods
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Reset CSRF token (call on logout)
 */
export function resetCsrfToken() {
  csrfToken = null;
}

export default api;
