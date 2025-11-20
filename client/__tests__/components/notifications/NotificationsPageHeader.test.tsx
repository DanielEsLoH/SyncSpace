import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationsPageHeader } from '@/components/notifications/NotificationsPageHeader';
import { useNotifications } from '@/contexts/NotificationsContext';

// Mock the NotificationsContext
jest.mock('@/contexts/NotificationsContext');
const mockUseNotifications = useNotifications as jest.Mock;

describe('NotificationsPageHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 0 });
    render(<NotificationsPageHeader />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows unread badge when there are unread notifications', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 5 });
    render(<NotificationsPageHeader />);

    expect(screen.getByText('5 unread')).toBeInTheDocument();
  });

  it('shows 99+ for counts over 99', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 150 });
    render(<NotificationsPageHeader />);

    expect(screen.getByText('99+ unread')).toBeInTheDocument();
  });

  it('does not show badge when count is 0', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 0 });
    render(<NotificationsPageHeader />);

    expect(screen.queryByText(/unread/)).not.toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 0 });
    render(<NotificationsPageHeader />);

    expect(
      screen.getByText('Stay updated with your latest activity')
    ).toBeInTheDocument();
  });
});
