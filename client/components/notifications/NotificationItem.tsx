'use client';

import { Notification, isCommentNotifiable, isReactionNotifiable, isPostNotifiable } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Heart, AtSign, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

/**
 * NotificationItem Component
 *
 * Displays a single notification with:
 * - Appropriate icon based on notification type
 * - Actor information
 * - Notification message
 * - Preview text for comments
 * - Relative timestamp
 * - Unread indicator
 * - Click handler to navigate to target
 *
 * Features:
 * - Optimistic UI for read status
 * - Hover states
 * - Keyboard accessible
 * - Semantic HTML
 */
export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();

  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case 'comment_on_post':
      case 'reply_to_comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'reaction_on_post':
      case 'reaction_on_comment':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get notification message
  const getNotificationMessage = () => {
    const actorName = notification.actor.name;

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

  // Get navigation target based on notification type
  const getNavigationTarget = (): string => {
    const notifiable = notification.notifiable;

    // If content was deleted, just go to feed
    if (!notifiable) {
      return '/feed';
    }

    if (isCommentNotifiable(notifiable)) {
      // Navigate to the post (comment will be visible there)
      return `/posts/${notifiable.post_id}`;
    } else if (isReactionNotifiable(notifiable)) {
      // Navigate based on reactionable type
      if (notifiable.reactionable_type === 'Post') {
        return `/posts/${notifiable.reactionable_id}`;
      }
      // For reactions on comments, we need to navigate to the post
      // This would require additional data, so for now navigate to feed
      return '/feed';
    } else if (isPostNotifiable(notifiable)) {
      // Navigate to the post (for mentions in posts)
      return `/posts/${notifiable.id}`;
    }

    return '/feed';
  };

  // Handle notification click
  const handleClick = () => {
    // Mark as read if unread
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate to target
    const target = getNavigationTarget();
    router.push(target);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        'border cursor-pointer transition-colors hover:bg-accent',
        !notification.read && 'bg-muted/50 border-primary/20'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${getNotificationMessage()}. ${!notification.read ? 'Unread' : 'Read'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Notification Icon */}
          <div className="flex-shrink-0 mt-1" aria-hidden="true">
            {getNotificationIcon()}
          </div>

          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            {/* Main Message */}
            <p className="text-sm font-medium text-foreground">
              {getNotificationMessage()}
            </p>

            {/* Deleted Content Message */}
            {!notification.notifiable && (
              <p className="text-sm text-muted-foreground mt-1 italic">
                This content is no longer available
              </p>
            )}

            {/* Preview Text (for comments) */}
            {isCommentNotifiable(notification.notifiable) && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                "{notification.notifiable.description}"
              </p>
            )}

            {/* Reaction Type (for reactions) */}
            {isReactionNotifiable(notification.notifiable) && (
              <p className="text-sm text-muted-foreground mt-1">
                {notification.notifiable.reaction_type === 'like' && '👍 Liked'}
                {notification.notifiable.reaction_type === 'love' && '❤️ Loved'}
                {notification.notifiable.reaction_type === 'dislike' && '👎 Disliked'}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          {/* Unread Indicator */}
          {!notification.read && (
            <div className="flex-shrink-0" aria-label="Unread">
              <div className="h-2 w-2 bg-primary rounded-full" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
