'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { Notification, NotificationsResponse } from '@/types';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters, type NotificationFilter } from './NotificationFilters';
import { NotificationsSkeleton } from './NotificationsSkeleton';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { notificationsService } from '@/lib/notifications';
import { useNotifications } from '@/contexts/NotificationsContext';
import { wsClient } from '@/lib/websocket';
import { tokenStorage } from '@/lib/auth';
import { toast } from 'sonner';
import {
  startOfToday,
  startOfYesterday,
  startOfWeek,
  startOfMonth,
  isAfter,
  isBefore,
} from 'date-fns';

interface NotificationsListProps {
  initialData: NotificationsResponse;
  userId: number;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  thisMonth: Notification[];
  older: Notification[];
}

/**
 * NotificationsList Component
 *
 * Main client component for notifications with:
 * - Initial server-rendered data
 * - Real-time WebSocket updates
 * - Filtering (All/Unread/Mentions)
 * - Grouping by time period
 * - Optimistic UI updates
 * - Pagination with "Load More"
 * - Mark as read (individual & all)
 *
 * Architecture:
 * - Receives initial data from Server Component
 * - Manages client-side state and mutations
 * - Subscribes to WebSocket for real-time updates
 * - Uses optimistic updates for instant feedback
 */
export function NotificationsList({ initialData, userId }: NotificationsListProps) {
  // State
  const [notifications, setNotifications] = useState<Notification[]>(initialData.notifications);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialData.meta.current_page < initialData.meta.total_pages
  );
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [isLoadingMore, startLoadingMore] = useTransition();
  const [optimisticReadIds, setOptimisticReadIds] = useState<Set<number>>(new Set());

  // Use shared notifications context
  const { unreadCount } = useNotifications();

  // Set up WebSocket for real-time notification list updates
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) {
      return;
    }

    // Connect WebSocket
    wsClient.connect(token);

    // Subscribe to notifications channel and store listener ID
    const listenerId = wsClient.subscribeToNotifications({
      onNewNotification: (notification: Notification) => {
        // Add new notification to the top of the list
        setNotifications((prev) => {
          // Check for duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          return [notification, ...prev];
        });
        toast.info('New notification received');
      },
      onNotificationRead: (notificationId: number) => {
        // Update notification read status in the list
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      },
      onAllNotificationsRead: () => {
        // Mark all notifications as read in the list
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      },
    });

    // Cleanup on unmount - unsubscribe this specific listener
    return () => {
      wsClient.unsubscribeFromNotifications(listenerId);
    };
  }, []);

  // Filter notifications based on active filter
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter((n) => !n.read && !optimisticReadIds.has(n.id));
      case 'mentions':
        return notifications.filter((n) => n.notification_type === 'mention');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeFilter, optimisticReadIds]);

  // Group notifications by time period
  const groupedNotifications = useMemo((): GroupedNotifications => {
    const now = new Date();
    const todayStart = startOfToday();
    const yesterdayStart = startOfYesterday();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const groups: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    filteredNotifications.forEach((notification) => {
      const createdAt = new Date(notification.created_at);

      if (isAfter(createdAt, todayStart)) {
        groups.today.push(notification);
      } else if (isAfter(createdAt, yesterdayStart)) {
        groups.yesterday.push(notification);
      } else if (isAfter(createdAt, weekStart)) {
        groups.thisWeek.push(notification);
      } else if (isAfter(createdAt, monthStart)) {
        groups.thisMonth.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // Mark notification as read with optimistic update
  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update
    setOptimisticReadIds((prev) => new Set(prev).add(notificationId));
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    try {
      await notificationsService.markAsRead(notificationId);
      // Remove from optimistic set on success
      setOptimisticReadIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      // Context will update unreadCount via WebSocket
    } catch (err: any) {
      setOptimisticReadIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setOptimisticReadIds(new Set());

    try {
      await notificationsService.markAllAsRead();
      toast.success('All notifications marked as read');
      // Context will update unreadCount via WebSocket
    } catch (err: any) {
      setNotifications(previousNotifications);
      toast.error('Failed to mark all as read');
    }
  }, [notifications]);

  // Load more notifications
  const handleLoadMore = useCallback(() => {
    startLoadingMore(async () => {
      try {
        const nextPage = currentPage + 1;
        const response = await notificationsService.getNotifications({
          page: nextPage,
          per_page: 20,
        });

        setNotifications((prev) => [...prev, ...response.notifications]);
        setCurrentPage(nextPage);
        setHasMore(response.meta.current_page < response.meta.total_pages);
      } catch (err: any) {
        toast.error('Failed to load more notifications');
      }
    });
  }, [currentPage]);

  // Render notification group
  const renderGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="space-y-3" key={title}>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      </div>
    );
  };

  // Empty state based on filter
  const renderEmptyState = () => {
    let message = 'No notifications yet';
    let description = 'When you receive notifications, they will appear here';

    if (activeFilter === 'unread') {
      message = 'No unread notifications';
      description = 'You are all caught up!';
    } else if (activeFilter === 'mentions') {
      message = 'No mentions yet';
      description = 'When someone mentions you, it will appear here';
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Bell className="h-16 w-16 text-muted-foreground/50" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  };

  const hasNotifications = filteredNotifications.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filters */}
        <div className="flex-1 max-w-md">
          <NotificationFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            unreadCount={unreadCount}
          />
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {hasNotifications ? (
        <div className="space-y-8">
          {renderGroup('Today', groupedNotifications.today)}
          {renderGroup('Yesterday', groupedNotifications.yesterday)}
          {renderGroup('This Week', groupedNotifications.thisWeek)}
          {renderGroup('This Month', groupedNotifications.thisMonth)}
          {renderGroup('Older', groupedNotifications.older)}

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        renderEmptyState()
      )}

      {/* Loading state for load more */}
      {isLoadingMore && (
        <div className="pt-4">
          <NotificationsSkeleton />
        </div>
      )}
    </div>
  );
}
