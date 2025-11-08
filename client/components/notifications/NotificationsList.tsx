'use client';

import { useState, useMemo, useCallback } from 'react';
import { Notification } from '@/types';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters, type NotificationFilter } from './NotificationFilters';
import { NotificationsSkeleton } from './NotificationsSkeleton';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { globalWebSocket } from '@/lib/globalWebSocket';
import { toast } from 'sonner';
import {
  startOfToday,
  startOfYesterday,
  startOfWeek,
  startOfMonth,
  isAfter,
} from 'date-fns';

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  thisMonth: Notification[];
  older: Notification[];
}

export function NotificationsList() {
  // --- STATE ---
  // All data now comes from the centralized context
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    loadMoreNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  // --- DERIVED STATE ---
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'mentions':
        return notifications.filter((n) => n.notification_type === 'mention');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const groupedNotifications = useMemo((): GroupedNotifications => {
    const now = new Date();
    const todayStart = startOfToday();
    const yesterdayStart = startOfYesterday();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const groups: GroupedNotifications = {
      today: [], yesterday: [], thisWeek: [], thisMonth: [], older: [],
    };

    filteredNotifications.forEach((notification) => {
      const createdAt = new Date(notification.created_at);
      if (isAfter(createdAt, todayStart)) groups.today.push(notification);
      else if (isAfter(createdAt, yesterdayStart)) groups.yesterday.push(notification);
      else if (isAfter(createdAt, weekStart)) groups.thisWeek.push(notification);
      else if (isAfter(createdAt, monthStart)) groups.thisMonth.push(notification);
      else groups.older.push(notification);
    });
    return groups;
  }, [filteredNotifications]);


  // --- ACTIONS ---
  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    // Action is sent via WebSocket, UI will update via context's event listener
    globalWebSocket.markNotificationAsRead(notificationId);
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    // Action is sent via WebSocket, UI will update via context's event listener
    globalWebSocket.markAllNotificationsAsRead();
    toast.success('All notifications marked as read');
  }, []);


  // --- RENDER LOGIC ---
  const renderGroup = (title: string, groupNotifications: Notification[]) => {
    if (groupNotifications.length === 0) return null;
    return (
      <div className="space-y-3" key={title}>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="space-y-2">
          {groupNotifications.map((notification) => (
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

  if (isLoading && notifications.length === 0) {
    return <NotificationsSkeleton count={10} />;
  }

  const hasVisibleNotifications = filteredNotifications.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <NotificationFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            unreadCount={unreadCount}
          />
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {hasVisibleNotifications ? (
        <div className="space-y-8">
          {renderGroup('Today', groupedNotifications.today)}
          {renderGroup('Yesterday', groupedNotifications.yesterday)}
          {renderGroup('This Week', groupedNotifications.thisWeek)}
          {renderGroup('This Month', groupedNotifications.thisMonth)}
          {renderGroup('Older', groupedNotifications.older)}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMoreNotifications} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
