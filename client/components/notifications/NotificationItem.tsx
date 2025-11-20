'use client';

import { useState } from 'react';
import { Notification, isCommentNotifiable, isReactionNotifiable, isPostNotifiable } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Heart, AtSign, Bell, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn, getInitials } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  index?: number; // For staggered animations
}

/**
 * NotificationItem Component - Spectacular Redesign
 *
 * Modern notification item with:
 * - Actor avatar with profile picture
 * - Colored icon badge overlaying avatar
 * - Bold actor names in message
 * - Expandable content for long comments
 * - Smooth hover animations with scale effect
 * - Strong unread/read differentiation with gradient
 * - Keyboard accessible
 * - Staggered entry animations
 */
export function NotificationItem({ notification, onMarkAsRead, index = 0 }: NotificationItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);


  // Get notification icon and color based on type
  const getNotificationIconInfo = () => {
    switch (notification.notification_type) {
      case 'comment_on_post':
      case 'reply_to_comment':
        return {
          icon: <MessageCircle className="h-3 w-3" />,
          bgColor: 'bg-blue-500',
          ringColor: 'ring-blue-500/20',
          textColor: 'text-white',
        };
      case 'reaction_on_post':
      case 'reaction_on_comment':
        return {
          icon: <Heart className="h-3 w-3" />,
          bgColor: 'bg-pink-500',
          ringColor: 'ring-pink-500/20',
          textColor: 'text-white',
        };
      case 'mention':
        return {
          icon: <AtSign className="h-3 w-3" />,
          bgColor: 'bg-purple-500',
          ringColor: 'ring-purple-500/20',
          textColor: 'text-white',
        };
      default:
        return {
          icon: <Bell className="h-3 w-3" />,
          bgColor: 'bg-muted',
          ringColor: 'ring-muted/20',
          textColor: 'text-muted-foreground',
        };
    }
  };

  // Get notification message with bold actor name
  const getNotificationContent = () => {
    const actorName = notification.actor.name;

    switch (notification.notification_type) {
      case 'comment_on_post':
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>
            <span className="text-muted-foreground"> commented on your post</span>
          </>
        );
      case 'reply_to_comment':
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>
            <span className="text-muted-foreground"> replied to your comment</span>
          </>
        );
      case 'mention':
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>
            <span className="text-muted-foreground"> mentioned you in a post</span>
          </>
        );
      case 'reaction_on_post':
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>
            <span className="text-muted-foreground"> reacted to your post</span>
          </>
        );
      case 'reaction_on_comment':
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>
            <span className="text-muted-foreground"> reacted to your comment</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold text-foreground">{actorName}</span>
            <span className="text-muted-foreground"> interacted with your content</span>
          </>
        );
    }
  };

  // Get preview text for comments
  const getPreviewText = () => {
    if (isCommentNotifiable(notification.notifiable)) {
      return notification.notifiable.description;
    }
    return null;
  };

  // Get reaction emoji
  const getReactionEmoji = () => {
    if (isReactionNotifiable(notification.notifiable)) {
      switch (notification.notifiable.reaction_type) {
        case 'like':
          return '👍';
        case 'love':
          return '❤️';
        case 'dislike':
          return '👎';
        default:
          return null;
      }
    }
    return null;
  };

  // Get navigation target based on notification type
  const getNavigationTarget = (): string => {
    const notifiable = notification.notifiable;

    if (!notifiable) {
      return '/feed';
    }

    if (isCommentNotifiable(notifiable)) {
      return `/posts/${notifiable.post_id}`;
    } else if (isReactionNotifiable(notifiable)) {
      if (notifiable.reactionable_type === 'Post') {
        return `/posts/${notifiable.reactionable_id}`;
      }
      return '/feed';
    } else if (isPostNotifiable(notifiable)) {
      return `/posts/${notifiable.id}`;
    }

    return '/feed';
  };

  // Handle notification click
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
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

  // Toggle expanded state for long content
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const iconInfo = getNotificationIconInfo();
  const previewText = getPreviewText();
  const reactionEmoji = getReactionEmoji();
  const isLongContent = previewText && previewText.length > 100;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'animate-in fade-in-0 slide-in-from-bottom-2',
        !notification.read
          ? 'bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20 shadow-sm'
          : 'bg-card hover:bg-accent/50'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Notification from ${notification.actor.name}. ${!notification.read ? 'Unread' : 'Read'}. Press Enter to view.`}
    >
      {/* Avatar with Icon Badge */}
      <div className="relative shrink-0">
        <Avatar className={cn(
          'h-11 w-11 ring-2 ring-offset-2 ring-offset-background transition-all duration-300',
          !notification.read ? iconInfo.ringColor : 'ring-transparent'
        )}>
          <AvatarImage
            src={notification.actor.profile_picture}
            alt={notification.actor.name}
          />
          <AvatarFallback className="text-sm font-medium bg-muted">
            {getInitials(notification.actor.name)}
          </AvatarFallback>
        </Avatar>
        {/* Icon Badge Overlay */}
        <div
          className={cn(
            'absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-background shadow-sm',
            'transition-transform duration-300',
            iconInfo.bgColor,
            iconInfo.textColor,
            isHovered && 'scale-110'
          )}
        >
          {iconInfo.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Main Message */}
        <p className="text-sm leading-snug">
          {getNotificationContent()}
        </p>

        {/* Deleted Content Message */}
        {!notification.notifiable && (
          <p className="text-sm text-muted-foreground/70 italic">
            This content is no longer available
          </p>
        )}

        {/* Preview Text (for comments) */}
        {previewText && (
          <div className="mt-1.5">
            <p className={cn(
              'text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border-l-2 border-muted-foreground/20',
              !isExpanded && isLongContent && 'line-clamp-2'
            )}>
              {previewText}
            </p>
            {isLongContent && (
              <button
                onClick={toggleExpanded}
                className="flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Reaction Emoji */}
        {reactionEmoji && (
          <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 bg-muted/50 rounded-md">
            <span className="text-base" aria-hidden="true">
              {reactionEmoji}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {notification.notifiable && isReactionNotifiable(notification.notifiable)
                ? notification.notifiable.reaction_type
                : 'reaction'}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
          <span className={cn(
            'opacity-0 transition-opacity duration-200 inline-flex items-center gap-0.5 text-primary',
            'group-hover:opacity-100'
          )}>
            <span className="mx-1">·</span>
            View
            <ExternalLink className="h-3 w-3" />
          </span>
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.read && (
        <div className="shrink-0 mt-2" aria-label="Unread notification">
          <div className="relative">
            <div className="h-2.5 w-2.5 bg-primary rounded-full" />
            <div className="absolute inset-0 h-2.5 w-2.5 bg-primary rounded-full animate-ping opacity-75" />
          </div>
        </div>
      )}
    </div>
  );
}
