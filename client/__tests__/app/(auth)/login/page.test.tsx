
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/contexts/AuthContext');

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('LoginPage', () => {
  let mockLogin: jest.Mock;

  beforeEach(() => {
    mockLogin = jest.fn();
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
    });
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    render(<LoginPage />);
  };

  it('should render the login form', () => {
    renderComponent();
    expect(screen.getByText('Login', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should allow user to type in email and password', async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call login function on submit with form data', async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show success toast and not redirect on successful login', async () => {
    mockLogin.mockResolvedValue(undefined); // Simulate successful login
    renderComponent();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith('Login successful!');
    });
    // The redirect is handled by the AuthContext, not the page itself after login.
    // The page redirects if isAuthenticated is true on mount.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show error toast on failed login', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    renderComponent();

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('should redirect if user is already authenticated', () => {
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: true,
    });
    renderComponent();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
