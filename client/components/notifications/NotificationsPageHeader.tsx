'use client';

import { Bell } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationsContext';

/**
 * NotificationsPageHeader Component
 *
 * Client component that displays the notifications page title with dynamic unread count.
 * Uses NotificationsContext for real-time count updates.
 */
export function NotificationsPageHeader() {
  const { unreadCount } = useNotifications();

  return (
    <CardTitle className="text-2xl font-bold flex items-center gap-2">
      <Bell className="h-6 w-6" />
      Notifications
      {unreadCount > 0 && (
        <span className="ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </CardTitle>
  );
}
