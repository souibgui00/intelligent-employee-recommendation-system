import { ApiService, API_URL } from '../api';

describe('ApiService', () => {
  let apiService;
  let fetchMock;

  beforeEach(() => {
    apiService = new ApiService();
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
    globalThis.sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('request method', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { id: 1, name: 'Test' };
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await apiService.request('/test', { method: 'GET' });

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/test`, expect.any(Object));
    });

    it('should include Authorization header when token exists', async () => {
      const token = 'test-token-123';
      globalThis.sessionStorage.setItem('skillmatch_token', token);
      
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await apiService.request('/test', { method: 'GET' });

      const callArgs = fetchMock.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not include Authorization header when token is missing', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await apiService.request('/test', { method: 'GET' });

      const callArgs = fetchMock.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('should handle 401 responses with token refresh', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      const newRefreshToken = 'new-refresh-token';
      
      globalThis.sessionStorage.setItem('skillmatch_token', oldToken);
      globalThis.sessionStorage.setItem('skillmatch_refresh_token', 'refresh-token');

      // First call returns 401
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
      );
      
      // Refresh token call succeeds
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ 
          access_token: newToken, 
          refresh_token: newRefreshToken 
        }), { status: 200 })
      );

      // Retry of original request succeeds
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'success' }), { status: 200 })
      );

      const result = await apiService.request('/test', { method: 'GET' });

      expect(result).toEqual({ data: 'success' });
      expect(globalThis.sessionStorage.getItem('skillmatch_token')).toBe(newToken);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should clear tokens and redirect on failed token refresh', async () => {
      globalThis.sessionStorage.setItem('skillmatch_token', 'token');
      globalThis.sessionStorage.setItem('skillmatch_refresh_token', 'refresh');
      globalThis.sessionStorage.setItem('skillmatch_user', 'user');

      // First call returns 401
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 401 })
      );

      // Refresh fails
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 401 })
      );

      const originalLocation = globalThis.window.location;
      delete globalThis.window.location;
      globalThis.window.location = { href: '', pathname: '/dashboard' };

      await expect(apiService.request('/test', { method: 'GET' })).rejects.toThrow();

      expect(globalThis.sessionStorage.getItem('skillmatch_token')).toBeNull();
      expect(globalThis.sessionStorage.getItem('skillmatch_refresh_token')).toBeNull();
      expect(globalThis.window.location.href).toBe('/login');
      globalThis.window.location = originalLocation;
    });

    it('should throw error on failed request', async () => {
      const errorMessage = 'Server error';
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: errorMessage }), { status: 500 })
      );

      await expect(apiService.request('/test', { method: 'GET' })).rejects.toThrow(errorMessage);
    });

    it('should handle empty response body', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('', { status: 200 })
      );

      const result = await apiService.request('/test', { method: 'GET' });

      expect(result).toEqual({});
    });

    it('should merge custom headers with default headers', async () => {
      const customHeaders = { 'X-Custom': 'value' };
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await apiService.request('/test', { method: 'GET', headers: customHeaders });

      const callArgs = fetchMock.mock.calls[0][1];
      expect(callArgs.headers['X-Custom']).toBe('value');
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('GET method', () => {
    it('should call request with GET method', async () => {
      const requestSpy = jest.spyOn(apiService, 'request').mockResolvedValue({ data: 'test' });

      await apiService.get('/test');

      expect(requestSpy).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'GET' }));
    });
  });

  describe('POST method', () => {
    it('should call request with POST method and body', async () => {
      const body = { name: 'Test' };
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await apiService.post('/test', body);

      expect(result).toEqual({ success: true });
      const callArgs = fetchMock.mock.calls[0][1];
      expect(callArgs.method).toBe('POST');
      expect(callArgs.body).toBe(JSON.stringify(body));
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      fetchMock.mockRejectedValueOnce(networkError);

      await expect(apiService.request('/test', { method: 'GET' })).rejects.toThrow('Network error');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMessage = 'Test error';
      
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: errorMessage }), { status: 500 })
      );

      await expect(apiService.request('/test', { method: 'GET' })).rejects.toThrow(errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
