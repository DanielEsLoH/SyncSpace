
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/(auth)/register/page';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

jest.setTimeout(10000);

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('RegisterPage', () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    pushMock = jest.fn();
    mockedUseRouter.mockReturnValue({ push: pushMock });
    mockedUseAuth.mockReturnValue({
      register: jest.fn(),
      isAuthenticated: false,
    });
    jest.clearAllMocks();
  });

  it('renders the registration form', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Register', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('updates form data on user input', async () => {
    render(<RegisterPage />);
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'john@example.com');

    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
  });

  it('shows an error if passwords do not match', async () => {
    render(<RegisterPage />);
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'john@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password456');
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Passwords do not match');
    });
  });

  it('handles successful registration', async () => {
    const registerMock = jest.fn().mockResolvedValue({ message: 'Success!' });
    mockedUseAuth.mockReturnValue({
      register: registerMock,
      isAuthenticated: false,
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          password_confirmation: 'password123',
          bio: '',
        },
      });
      expect(mockedToast.success).toHaveBeenCalledWith('Success!');
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('handles registration failure with array of errors', async () => {
    const error = {
      response: {
        data: {
          errors: ['Email has already been taken', 'Password is too short'],
        },
      },
    };
    const registerMock = jest.fn().mockRejectedValue(error);
    mockedUseAuth.mockReturnValue({
      register: registerMock,
      isAuthenticated: false,
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Email has already been taken');
      expect(mockedToast.error).toHaveBeenCalledWith('Password is too short');
    });
  });

  it('handles registration failure with a single error message', async () => {
    const error = {
      response: {
        data: {
          error: 'Something went wrong',
        },
      },
    };
    const registerMock = jest.fn().mockRejectedValue(error);
    mockedUseAuth.mockReturnValue({
      register: registerMock,
      isAuthenticated: false,
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  it('disables the form and shows loading text during submission', async () => {
    const registerMock = jest.fn(() => new Promise(() => {})); // Promise that never resolves
    mockedUseAuth.mockReturnValue({
      register: registerMock,
      isAuthenticated: false,
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await userEvent.click(registerButton);

    expect(registerButton).toBeDisabled();
    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
  });

  it('redirects authenticated user to home page', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
    });
    render(<RegisterPage />);
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
