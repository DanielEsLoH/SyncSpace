'use client';

import { Bell, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationsContext';
import { globalWebSocket } from '@/lib/globalWebSocket';
import { toast } from 'sonner';

/**
 * NotificationsPageHeader Component
 *
 * Spectacular header with:
 * - Animated bell icon with multi-layer ping effect
 * - Gradient badge for unread count with glow
 * - Mark all as read action with hover effect
 * - Responsive layout
 *
 * Uses NotificationsContext for real-time count updates.
 */
export function NotificationsPageHeader() {
  const { unreadCount } = useNotifications();

  const handleMarkAllAsRead = () => {
    globalWebSocket.markAllNotificationsAsRead();
    toast.success('All notifications marked as read', {
      icon: <Sparkles className="h-4 w-4" />,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Animated Bell Icon Container */}
        <div className="relative">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
            <Bell className="h-7 w-7 text-primary" />
          </div>
          {/* Multi-layer ping animation for unread */}
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background"></span>
              </span>
            </>
          )}
        </div>

        {/* Title and Badge */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>

          {/* Unread Badge with Gradient and Glow */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="relative inline-flex">
                <span className="px-3 py-1 text-sm font-semibold bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground rounded-full shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount} unread
                </span>
                {/* Subtle glow effect */}
                <span className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10"></span>
              </span>
            </div>
          )}

          {unreadCount === 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              All caught up!
            </p>
          )}
        </div>
      </div>

      {/* Mark All as Read Button */}
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          className="gap-2 group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
        >
          <Check className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Mark all as read</span>
          <span className="sm:hidden">Mark all</span>
        </Button>
      )}
    </div>
  );
}
