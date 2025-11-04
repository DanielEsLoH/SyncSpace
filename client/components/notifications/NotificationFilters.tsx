'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, BellDot, AtSign } from 'lucide-react';

export type NotificationFilter = 'all' | 'unread' | 'mentions';

interface NotificationFiltersProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  unreadCount: number;
}

/**
 * NotificationFilters Component
 *
 * Provides tab-based filtering for notifications:
 * - All: Show all notifications
 * - Unread: Show only unread notifications
 * - Mentions: Show only mention notifications
 *
 * Features:
 * - Visual indicators for active filter
 * - Unread count badge
 * - Keyboard accessible
 * - Responsive design
 */
export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount,
}: NotificationFiltersProps) {
  return (
    <Tabs value={activeFilter} onValueChange={(value: string) => onFilterChange(value as NotificationFilter)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">All</span>
        </TabsTrigger>

        <TabsTrigger value="unread" className="gap-2">
          <BellDot className="h-4 w-4" />
          <span className="hidden sm:inline">Unread</span>
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </TabsTrigger>

        <TabsTrigger value="mentions" className="gap-2">
          <AtSign className="h-4 w-4" />
          <span className="hidden sm:inline">Mentions</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
