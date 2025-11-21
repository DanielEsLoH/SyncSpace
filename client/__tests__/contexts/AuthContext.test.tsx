
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authService, tokenStorage } from '@/lib/auth';
import { wsClient } from '@/lib/websocket';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  tokenStorage: {
    getToken: jest.fn(),
    getUser: jest.fn(),
    setToken: jest.fn(),
    setUser: jest.fn(),
    clear: jest.fn(),
  },
}));
jest.mock('@/lib/websocket', () => ({
  wsClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const mockedWsClient = wsClient as jest.Mocked<typeof wsClient>;

const mockUser: User = { id: 1, name: 'Test User', email: 'test@example.com' };

// A test component to consume the context
const AuthConsumer = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    mockedUseRouter.mockReturnValue({ push: mockRouterPush });
    jest.clearAllMocks();
  });

  it('should finish the loading state when unauthenticated', async () => {
    mockedTokenStorage.getToken.mockReturnValue(null);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Wait for the loading to be false
    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('false'));
    
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.queryByTestId('user-name')).toBeNull();
  });

  it('should initialize with a logged-in user if token is valid', async () => {
    mockedTokenStorage.getToken.mockReturnValue('test_token');
    mockedTokenStorage.getUser.mockReturnValue(mockUser);
    mockedAuthService.getCurrentUser.mockResolvedValue({ user: mockUser });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(mockedWsClient.connect).toHaveBeenCalledWith('test_token');
  });

  it('should handle login correctly', async () => {
    mockedTokenStorage.getToken.mockReturnValue(null);
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('false'));

    mockedAuthService.login.mockResolvedValue({ token: 'new_token', user: mockUser });

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(mockedAuthService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
    expect(mockedTokenStorage.setToken).toHaveBeenCalledWith('new_token');
    expect(mockedTokenStorage.setUser).toHaveBeenCalledWith(mockUser);
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(mockedWsClient.connect).toHaveBeenCalledWith('new_token');
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  it('should handle logout correctly', async () => {
    // Start with a logged-in user
    mockedTokenStorage.getToken.mockReturnValue('test_token');
    mockedTokenStorage.getUser.mockReturnValue(mockUser);
    mockedAuthService.getCurrentUser.mockResolvedValue({ user: mockUser });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true'));

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(mockedTokenStorage.clear).toHaveBeenCalled();
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.queryByTestId('user-name')).toBeNull();
    expect(mockedWsClient.disconnect).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/?auth=login');
  });
});
