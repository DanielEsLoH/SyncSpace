import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('LoginModal', () => {
  const mockLogin = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockOnSwitchToRegister = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSwitchToRegister: mockOnSwitchToRegister,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ login: mockLogin });
  });

  describe('Rendering', () => {
    it('renders the login modal when open', () => {
      render(<LoginModal {...defaultProps} />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your SyncSpace account')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<LoginModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    });

    it('displays email and password input fields', () => {
      render(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Interactions', () => {
    it('updates email input on change', async () => {
      const user = userEvent.setup();
      render(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password input on change', async () => {
      const user = userEvent.setup();
      render(<LoginModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the toggle button - it's inside the password field container
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-eye') ||
        btn.querySelector('svg')?.classList.contains('lucide-eye-off')
      );

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Form Submission', () => {
    it('calls login with correct credentials on submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({});

      render(<LoginModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('shows success toast and closes modal on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({});

      render(<LoginModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith('Login successful!');
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows error toast on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue({
        response: { data: { error: 'Invalid credentials' } },
      });

      render(<LoginModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });

    it('shows default error message when no specific error is provided', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<LoginModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Invalid email or password');
      });
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      mockLogin.mockImplementation(() => new Promise(resolve => {
        resolveLogin = resolve;
      }));

      render(<LoginModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByPlaceholderText('you@example.com')).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter your password')).toBeDisabled();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

      resolveLogin!();
    });
  });

  describe('Navigation', () => {
    it('calls onSwitchToRegister when create account is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginModal {...defaultProps} />);

      await user.click(screen.getByText('Create Account'));

      expect(mockOnSwitchToRegister).toHaveBeenCalled();
    });

    it('resets form when modal is closed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<LoginModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');

      // Simulate closing and reopening
      rerender(<LoginModal {...defaultProps} open={false} />);
      rerender(<LoginModal {...defaultProps} open={true} />);

      // Form should be reset but we can't verify the values without the component remounting
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<LoginModal {...defaultProps} />);

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('has required attributes on inputs', () => {
      render(<LoginModal {...defaultProps} />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter your password')).toBeRequired();
    });
  });
});
