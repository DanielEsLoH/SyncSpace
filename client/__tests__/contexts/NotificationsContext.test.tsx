
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsService } from '@/lib/notifications';
import { Notification, NotificationsResponse } from '@/types';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/notifications');

const mockedUseAuth = useAuth as jest.Mock;
const mockedNotificationsService = notificationsService as jest.Mocked<typeof notificationsService>;

const mockNotification: Notification = {
  id: 1,
  message: 'Test Notification',
  read: false,
  created_at: '2025-01-01T00:00:00Z',
  user_id: 1,
  actor: { id: 2, name: 'Actor' },
  post: { id: 1, title: 'Post Title' },
};

// A test component to consume the context
const NotificationsConsumer = () => {
  const { notifications, unreadCount, isLoading, hasMore, refreshNotifications, loadMoreNotifications } = useNotifications();
  return (
    <div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="has-more">{hasMore.toString()}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <button onClick={refreshNotifications}>Refresh</button>
      <button onClick={loadMoreNotifications}>Load More</button>
    </div>
  );
};

describe('NotificationsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch notifications if user is not authenticated', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <NotificationsProvider>
        <NotificationsConsumer />
      </NotificationsProvider>
    );

    expect(mockedNotificationsService.getNotifications).not.toHaveBeenCalled();
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true'); // Initial state
  });

  it('should fetch notifications when user is authenticated', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    const mockResponse: NotificationsResponse = {
      notifications: [mockNotification],
      unread_count: 1,
      meta: { current_page: 1, total_pages: 1, per_page: 20, total_count: 1 },
    };
    mockedNotificationsService.getNotifications.mockResolvedValue(mockResponse);

    render(
      <NotificationsProvider>
        <NotificationsConsumer />
      </NotificationsProvider>
    );

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('false'));
    
    expect(mockedNotificationsService.getNotifications).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.getByTestId('has-more')).toHaveTextContent('false');
  });

  it('should handle loading more notifications', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    const initialResponse: NotificationsResponse = {
      notifications: [mockNotification],
      unread_count: 2,
      meta: { current_page: 1, total_pages: 2, per_page: 1, total_count: 2 },
    };
    mockedNotificationsService.getNotifications.mockResolvedValue(initialResponse);

    render(
      <NotificationsProvider>
        <NotificationsConsumer />
      </NotificationsProvider>
    );

    await waitFor(() => expect(screen.getByTestId('notifications-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('has-more')).toHaveTextContent('true');

    const nextPageResponse: NotificationsResponse = {
      notifications: [{ ...mockNotification, id: 2 }],
      unread_count: 2,
      meta: { current_page: 2, total_pages: 2, per_page: 1, total_count: 2 },
    };
    mockedNotificationsService.getNotifications.mockResolvedValue(nextPageResponse);

    await act(async () => {
      screen.getByText('Load More').click();
    });

    await waitFor(() => expect(screen.getByTestId('notifications-count')).toHaveTextContent('2'));
    expect(screen.getByTestId('has-more')).toHaveTextContent('false');
  });

  it('should handle new notification events', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    mockedNotificationsService.getNotifications.mockResolvedValue({
        notifications: [],
        unread_count: 0,
        meta: { current_page: 1, total_pages: 1, per_page: 20, total_count: 0 },
    });

    render(<NotificationsProvider><NotificationsConsumer /></NotificationsProvider>);
    await waitFor(() => expect(screen.getByTestId('notifications-count')).toHaveTextContent('0'));

    act(() => {
      const event = new CustomEvent('ws:notification:new', { detail: { notification: mockNotification } });
      window.dispatchEvent(event);
    });

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
  });
});
