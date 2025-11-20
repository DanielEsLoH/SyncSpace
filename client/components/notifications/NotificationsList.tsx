'use client';

import { useState, useMemo, useCallback } from 'react';
import { Notification } from '@/types';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters, type NotificationFilter } from './NotificationFilters';
import { NotificationsSkeleton } from './NotificationsSkeleton';
import { Button } from '@/components/ui/button';
import { Bell, Sparkles } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { globalWebSocket } from '@/lib/globalWebSocket';
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

/**
 * NotificationsList Component - Spectacular Redesign
 *
 * Modern notifications list with:
 * - Pill-style filter tabs
 * - Date grouping with styled dividers
 * - Animated empty states
 * - Smooth transitions
 * - Load more functionality
 */
export function NotificationsList() {
  // All data comes from the centralized context
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    loadMoreNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  // Filter notifications based on active filter
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

  // Group notifications by date
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

  // Mark notification as read via WebSocket
  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    globalWebSocket.markNotificationAsRead(notificationId);
  }, []);

  // Render a group of notifications with styled header
  const renderGroup = (title: string, groupNotifications: Notification[]) => {
    if (groupNotifications.length === 0) return null;

    return (
      <div className="space-y-3" key={title}>
        {/* Styled Group Header with Divider */}
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Notification Items */}
        <div className="space-y-3">
          {groupNotifications.map((notification, idx) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              index={idx}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render animated empty state
  const renderEmptyState = () => {
    let title = 'No notifications yet';
    let description = 'When you receive notifications, they will appear here';
    let icon = <Bell className="h-16 w-16 text-muted-foreground/30" />;

    if (activeFilter === 'unread') {
      title = 'All caught up!';
      description = 'You have no unread notifications';
      icon = <Sparkles className="h-16 w-16 text-primary/30" />;
    } else if (activeFilter === 'mentions') {
      title = 'No mentions yet';
      description = 'When someone mentions you, it will appear here';
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in fade-in-50 duration-500">
        <div className="p-6 rounded-full bg-muted/50">
          {icon}
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        </div>
      </div>
    );
  };

  // Show skeleton while loading initial data
  if (isLoading && notifications.length === 0) {
    return <NotificationsSkeleton count={8} />;
  }

  const hasVisibleNotifications = filteredNotifications.length > 0;

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <NotificationFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        unreadCount={unreadCount}
      />

      {/* Notifications List */}
      {hasVisibleNotifications ? (
        <div className="space-y-6">
          {renderGroup('Today', groupedNotifications.today)}
          {renderGroup('Yesterday', groupedNotifications.yesterday)}
          {renderGroup('This Week', groupedNotifications.thisWeek)}
          {renderGroup('This Month', groupedNotifications.thisMonth)}
          {renderGroup('Older', groupedNotifications.older)}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMoreNotifications}
                disabled={isLoading}
                className="min-w-[140px]"
              >
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
