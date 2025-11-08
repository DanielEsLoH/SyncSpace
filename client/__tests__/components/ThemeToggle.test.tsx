import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from 'next-themes';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeToggle', () => {
  const mockSetTheme = jest.fn();
  let user;

  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'light',
    });
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    await user.click(button);

    // The dropdown items should appear
    expect(await screen.findByText(/light/i)).toBeInTheDocument();
    expect(await screen.findByText(/dark/i)).toBeInTheDocument();
    expect(await screen.findByText(/system/i)).toBeInTheDocument();
  });

  it('calls setTheme with correct value when light is selected', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    await user.click(button);

    const lightOption = await screen.findByText(/light/i);
    await user.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with correct value when dark is selected', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    await user.click(button);

    const darkOption = await screen.findByText(/dark/i);
    await user.click(darkOption);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with correct value when system is selected', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    await user.click(button);

    const systemOption = await screen.findByText(/system/i);
    await user.click(systemOption);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
