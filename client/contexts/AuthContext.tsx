'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '@/types';
import { authService, tokenStorage } from '@/lib/auth';
import { wsClient } from '@/lib/websocket';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser();

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const { user: currentUser } = await authService.getCurrentUser();
          setUser(currentUser);
          tokenStorage.setUser(currentUser);

          // Connect WebSocket with token
          wsClient.connect(token);
        } catch (error) {
          // Token is invalid, clear storage
          tokenStorage.clear();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { token, user: authUser } = await authService.login(credentials);

    tokenStorage.setToken(token);
    tokenStorage.setUser(authUser);
    setUser(authUser);

    // Connect WebSocket
    wsClient.connect(token);

    // Redirect to home
    router.push('/');
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    return response;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);

    // Disconnect WebSocket
    wsClient.disconnect();

    // Redirect to landing page with login modal
    router.push('/?auth=login');
  };

  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authService.getCurrentUser();
      setUser(currentUser);
      tokenStorage.setUser(currentUser);
    } catch (error) {
      // Silent fail for background refresh - user will be redirected on next protected action
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
