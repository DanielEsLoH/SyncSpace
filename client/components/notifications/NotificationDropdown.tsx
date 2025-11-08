'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationsContext';
import { globalWebSocket } from '@/lib/globalWebSocket';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function NotificationDropdown() {
  const { notifications, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = (notificationId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Optimistically update UI while waiting for WebSocket echo
    // The context will handle the final state from the event
    globalWebSocket.markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    globalWebSocket.markAllNotificationsAsRead();
    toast.success('All notifications marked as read');
  };

  const getNotificationMessage = (notification: Notification) => {
    const actorName = notification.actor?.name || 'A user';

    switch (notification.notification_type) {
      case 'comment_on_post':
        return `${actorName} commented on your post`;
      case 'reply_to_comment':
        return `${actorName} replied to your comment`;
      case 'mention':
        return `${actorName} mentioned you`;
      case 'reaction_on_post':
        return `${actorName} reacted to your post`;
      case 'reaction_on_comment':
        return `${actorName} reacted to your comment`;
      default:
        return `${actorName} interacted with your content`;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (!notification.notifiable) return '/notifications';
    if (notification.notifiable.type === 'Comment') return `/posts/${notification.notifiable.post_id}`;
    if (notification.notifiable.type === 'Reaction' && notification.notifiable.reactionable_type === 'Post') {
      return `/posts/${notification.notifiable.reactionable_id}`;
    }
    return '/notifications';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs hover:bg-transparent"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  href={getNotificationLink(notification)}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <p className="text-sm font-medium flex-1">
                      {getNotificationMessage(notification)}
                    </p>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="h-6 w-6 flex-shrink-0"
                        aria-label="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="w-full text-center text-sm font-medium cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
