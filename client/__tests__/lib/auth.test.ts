import { tokenStorage } from '@/lib/auth';

describe('tokenStorage', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('token management', () => {
    it('should store and retrieve token', () => {
      const testToken = 'test-jwt-token';
      tokenStorage.setToken(testToken);
      expect(tokenStorage.getToken()).toBe(testToken);
    });

    it('should remove token', () => {
      tokenStorage.setToken('test-token');
      tokenStorage.removeToken();
      expect(tokenStorage.getToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(tokenStorage.getToken()).toBeNull();
    });
  });

  describe('user management', () => {
    const testUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      profile_picture: 'https://example.com/avatar.jpg',
      created_at: '2024-01-01',
    };

    it('should store and retrieve user', () => {
      tokenStorage.setUser(testUser);
      const retrieved = tokenStorage.getUser();
      expect(retrieved).toEqual(testUser);
    });

    it('should remove user', () => {
      tokenStorage.setUser(testUser);
      tokenStorage.removeUser();
      expect(tokenStorage.getUser()).toBeNull();
    });

    it('should return null when no user exists', () => {
      expect(tokenStorage.getUser()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear both token and user', () => {
      const testUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        profile_picture: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01',
      };

      tokenStorage.setToken('test-token');
      tokenStorage.setUser(testUser);

      tokenStorage.clear();

      expect(tokenStorage.getToken()).toBeNull();
      expect(tokenStorage.getUser()).toBeNull();
    });
  });

  describe('SSR safety', () => {
    it('should handle server-side rendering gracefully', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(tokenStorage.getToken()).toBeNull();
      expect(tokenStorage.getUser()).toBeNull();

      // Restore window
      global.window = originalWindow;
    });
  });
});
