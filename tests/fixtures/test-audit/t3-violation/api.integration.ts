import { ApiClient } from '../../../src/api-client';

jest.mock('node-fetch');
import fetch from 'node-fetch';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ApiClient Integration', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should fetch user from API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'John Doe' }),
      } as any);

      const user = await apiClient.getUser(1);

      expect(user).toEqual({ id: 1, name: 'John Doe' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      await expect(apiClient.getUser(999)).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create user via API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 2, name: 'Jane Doe' }),
      } as any);

      const user = await apiClient.createUser({ name: 'Jane Doe' });

      expect(user.id).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Jane Doe' }),
        })
      );
    });
  });
});
