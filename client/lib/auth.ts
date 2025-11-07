import Cookies from 'js-cookie';
import api from './api';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
  User,
} from '@/types';

// Auth API functions
export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register
  async register(data: RegisterData): Promise<{ message: string; user: User }> {
    const response = await api.post('/auth/register', { user: data });
    return response.data;
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Confirm email
  async confirmEmail(token: string): Promise<AuthResponse> {
    const response = await api.get(`/auth/confirm/${token}`);
    return response.data;
  },

  // Forgot password
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot_password', data);
    return response.data;
  },

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    const response = await api.post('/auth/reset_password', data);
    return response.data;
  },
};

/**
 * SECURITY: Token Storage Strategy
 *
 * We use cookies for secure token storage with the following benefits:
 * - Secure flag in production (HTTPS only)
 * - SameSite=Strict prevents CSRF attacks
 * - Automatic expiration handling
 * - Works with both client and server components
 *
 * Cookie Configuration:
 * - secure: true in production (requires HTTPS)
 * - sameSite: 'strict' - maximum protection
 * - expires: 1 day - matches backend JWT expiration
 *
 * NOTE: For maximum security, consider HTTP-only cookies set by the backend.
 * This implementation allows client-side access for flexibility.
 */
export const tokenStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('syncspace_token') || null;
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      Cookies.set('syncspace_token', token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: 1, // 1 day
      });
    }
  },

  removeToken(): void {
    if (typeof window !== 'undefined') {
      Cookies.remove('syncspace_token');
    }
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = Cookies.get('syncspace_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },

  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      Cookies.set('syncspace_user', JSON.stringify(user), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: 1, // 1 day
      });
    }
  },

  removeUser(): void {
    if (typeof window !== 'undefined') {
      Cookies.remove('syncspace_user');
    }
  },

  clear(): void {
    this.removeToken();
    this.removeUser();
  },
};
