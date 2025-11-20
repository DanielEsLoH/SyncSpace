import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';

describe('NotificationFilters', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter tabs', () => {
    render(
      <NotificationFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        unreadCount={0}
      />
    );

    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /mentions/i })).toBeInTheDocument();
  });

  it('shows unread count badge when count > 0', () => {
    render(
      <NotificationFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        unreadCount={5}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows 99+ for counts over 99', () => {
    render(
      <NotificationFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        unreadCount={150}
      />
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not show badge when count is 0', () => {
    render(
      <NotificationFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        unreadCount={0}
      />
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onFilterChange when tab is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NotificationFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        unreadCount={5}
      />
    );

    await user.click(screen.getByRole('tab', { name: /unread/i }));
    expect(mockOnFilterChange).toHaveBeenCalledWith('unread');

    await user.click(screen.getByRole('tab', { name: /mentions/i }));
    expect(mockOnFilterChange).toHaveBeenCalledWith('mentions');
  });

  it('highlights active filter tab', () => {
    const { rerender } = render(
      <NotificationFilters
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        unreadCount={0}
      />
    );

    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    rerender(
      <NotificationFilters
        activeFilter="unread"
        onFilterChange={mockOnFilterChange}
        unreadCount={0}
      />
    );

    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
