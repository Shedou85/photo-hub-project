import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, apiRequest, resetCsrfToken } from './api';

describe('api client', () => {
  beforeEach(() => {
    // Reset CSRF state before each test
    resetCsrfToken();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('api.get()', () => {
    it('makes a GET request with credentials: include', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ collections: [] }),
      });

      await api.get('/collections');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/collections'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('returns { data, error: null, status } on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', name: 'Test' }),
      });

      const result = await api.get('/collections/1');

      expect(result).toEqual({
        data: { id: '1', name: 'Test' },
        error: null,
        status: 200,
      });
    });

    it('returns { data, error, status } on server error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const result = await api.get('/collections/missing');

      expect(result.status).toBe(404);
      expect(result.error).toBe('Not found');
    });

    it('returns { data: null, error, status: 0 } on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await api.get('/collections');

      expect(result).toEqual({
        data: null,
        error: 'Network error',
        status: 0,
      });
    });

    it('does not send a body for GET', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await api.get('/collections');

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.body).toBeUndefined();
    });
  });

  describe('api.post()', () => {
    it('fetches CSRF token before POST if none is cached', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        // First call: CSRF token endpoint
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'test-csrf-token' }),
        })
        // Second call: actual POST
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: 'new-id' }),
        });

      await api.post('/collections', { name: 'New Collection' });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      // First call should be to CSRF endpoint
      expect(fetchSpy.mock.calls[0][0]).toContain('/csrf-token');
    });

    it('includes X-CSRF-Token header on POST', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'my-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: 'abc' }),
        });

      await api.post('/collections', { name: 'Test' });

      const [, postOptions] = fetchSpy.mock.calls[1];
      expect(postOptions.headers['X-CSRF-Token']).toBe('my-token');
    });

    it('sends JSON body on POST', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'tok' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: 'abc' }),
        });

      const body = { name: 'My Collection' };
      await api.post('/collections', body);

      const [, postOptions] = fetchSpy.mock.calls[1];
      expect(postOptions.body).toBe(JSON.stringify(body));
      expect(postOptions.headers['Content-Type']).toBe('application/json');
    });

    it('returns { data, error: null, status } on success', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'tok' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: 'new-id', name: 'Created' }),
        });

      const result = await api.post('/collections', { name: 'Created' });

      expect(result).toEqual({
        data: { id: 'new-id', name: 'Created' },
        error: null,
        status: 201,
      });
    });

    it('skips Content-Type for FormData body', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'tok' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const formData = new FormData();
      formData.append('file', new Blob(['content']), 'photo.jpg');

      await api.post('/upload', formData);

      const [, postOptions] = fetchSpy.mock.calls[1];
      expect(postOptions.headers['Content-Type']).toBeUndefined();
      expect(postOptions.body).toBe(formData);
    });
  });

  describe('api.patch()', () => {
    it('makes a PATCH request with correct method', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'tok' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ updated: true }),
        });

      await api.patch('/profile/me', { name: 'New Name' });

      const [, patchOptions] = fetchSpy.mock.calls[1];
      expect(patchOptions.method).toBe('PATCH');
    });
  });

  describe('api.delete()', () => {
    it('makes a DELETE request with correct method', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'tok' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ deleted: true }),
        });

      await api.delete('/collections/abc');

      const [, deleteOptions] = fetchSpy.mock.calls[1];
      expect(deleteOptions.method).toBe('DELETE');
    });
  });

  describe('CSRF retry on 403', () => {
    it('retries with fresh CSRF token when 403 response has CSRF error', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        // 1. Initial CSRF fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'stale-token' }),
        })
        // 2. POST fails with CSRF 403
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: 'Invalid or missing CSRF token' }),
        })
        // 3. Fresh CSRF fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'fresh-token' }),
        })
        // 4. Retry POST succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ id: 'new' }),
        });

      const result = await api.post('/collections', { name: 'Test' });

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      expect(result.status).toBe(201);
      expect(result.error).toBeNull();
    });
  });

  describe('AbortError handling', () => {
    it('returns { data: null, error: "Request cancelled", status: 0 } on AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError);

      const result = await api.get('/collections');

      expect(result).toEqual({
        data: null,
        error: 'Request cancelled',
        status: 0,
      });
    });
  });
});
