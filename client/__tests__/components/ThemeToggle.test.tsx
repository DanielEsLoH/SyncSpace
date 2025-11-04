import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from 'next-themes';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeToggle', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue({
      setTheme: mockSetTheme,
      theme: 'light',
    });
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

  it('opens dropdown menu when clicked', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // The dropdown items should appear
    expect(screen.getByText(/light/i)).toBeInTheDocument();
    expect(screen.getByText(/dark/i)).toBeInTheDocument();
    expect(screen.getByText(/system/i)).toBeInTheDocument();
  });

  it('calls setTheme with correct value when light is selected', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const lightOption = screen.getByText(/light/i);
    fireEvent.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with correct value when dark is selected', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const darkOption = screen.getByText(/dark/i);
    fireEvent.click(darkOption);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with correct value when system is selected', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const systemOption = screen.getByText(/system/i);
    fireEvent.click(systemOption);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
