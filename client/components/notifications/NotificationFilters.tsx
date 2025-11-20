'use client';

import { Bell, BellDot, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationFilter = 'all' | 'unread' | 'mentions';

interface NotificationFiltersProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  unreadCount: number;
}

/**
 * NotificationFilters Component
 *
 * Modern pill-style filter tabs for notifications:
 * - All: Show all notifications
 * - Unread: Show only unread notifications (with count badge)
 * - Mentions: Show only mention notifications
 *
 * Features:
 * - Pill-style buttons with smooth transitions
 * - Visual feedback on hover and active states
 * - Badge for unread count
 * - Keyboard accessible
 * - Responsive design
 */
export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount,
}: NotificationFiltersProps) {
  const filters: { value: NotificationFilter; label: string; icon: typeof Bell }[] = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'unread', label: 'Unread', icon: BellDot },
    { value: 'mentions', label: 'Mentions', icon: AtSign },
  ];

  return (
    <div className="flex gap-2" role="tablist" aria-label="Filter notifications">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;
        const showBadge = filter.value === 'unread' && unreadCount > 0;

        return (
          <button
            key={filter.value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${filter.value}-notifications`}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{filter.label}</span>
            {showBadge && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary text-primary-foreground'
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
