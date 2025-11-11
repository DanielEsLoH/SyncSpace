import { createConsumer, Consumer, Subscription } from '@rails/actioncable';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/cable';

type PostsCallbacks = {
  onNewPost?: (post: any) => void;
  onUpdatePost?: (post: any) => void;
  onDeletePost?: (postId: number) => void;
  onReactionUpdate?: (data: { post: any; reaction_action: string }) => void;
};

type CommentsCallbacks = {
  onNewComment?: (comment: any) => void;
  onUpdateComment?: (comment: any) => void;
  onDeleteComment?: (commentId: number) => void;
  onCommentReactionUpdate?: (data: { comment: any; reaction_action: string }) => void;
};

type NotificationsCallbacks = {
  onNewNotification?: (notification: any) => void;
  onNotificationRead?: (notificationId: number) => void;
  onAllNotificationsRead?: () => void;
};

class WebSocketClient {
  private consumer: Consumer | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private postsListeners: Map<string, PostsCallbacks> = new Map();
  private commentsListeners: Map<string, CommentsCallbacks> = new Map();
  private notificationsListeners: Map<string, NotificationsCallbacks> = new Map();
  private listenerIdCounter = 0;

  connect(token?: string) {
    if (this.consumer) {
      return this.consumer;
    }

    // Create WebSocket consumer with token
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    this.consumer = createConsumer(url);
    return this.consumer;
  }

  disconnect() {
    if (this.consumer) {
      this.consumer.disconnect();
      this.consumer = null;
      this.subscriptions.clear();
      this.postsListeners.clear();
      this.commentsListeners.clear();
      this.notificationsListeners.clear();
    }
  }

  // Subscribe to posts channel (supports multiple subscribers)
  subscribeToPosts(callbacks: PostsCallbacks): string {
    if (!this.consumer) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique listener ID
    const listenerId = `posts-listener-${++this.listenerIdCounter}`;

    // Store callbacks for this listener
    this.postsListeners.set(listenerId, callbacks);

    // Create subscription only if it doesn't exist
    if (!this.subscriptions.has('posts')) {
      const subscription = this.consumer.subscriptions.create('PostsChannel', {
        received: (data: any) => {
          this.postsListeners.forEach((listener, listenerId) => {
            switch (data.action) {
              case 'new_post':
                listener.onNewPost?.(data.post);
                break;
              case 'update_post':
                listener.onUpdatePost?.(data.post);
                break;
              case 'delete_post':
                listener.onDeletePost?.(data.post_id);
                break;
              case 'reaction_update':
                listener.onReactionUpdate?.(data);
                break;
            }
          });
        },
      });

      this.subscriptions.set('posts', subscription);
    }

    return listenerId;
  }

  // Unsubscribe a specific listener from posts channel
  unsubscribeFromPosts(listenerId: string) {
    this.postsListeners.delete(listenerId);

    // If no more listeners, close the subscription
    if (this.postsListeners.size === 0) {
      const subscription = this.subscriptions.get('posts');
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete('posts');
      }
    }
  }

  // Follow a specific post
  followPost(postId: number) {
    const subscription = this.subscriptions.get('posts');
    if (subscription) {
      subscription.send({ action: 'follow_post', post_id: postId });
    }
  }

  // Unfollow a specific post
  unfollowPost(postId: number) {
    const subscription = this.subscriptions.get('posts');
    if (subscription) {
      subscription.send({ action: 'unfollow_post', post_id: postId });
    }
  }

  // Subscribe to comments channel (supports multiple subscribers)
  subscribeToComments(callbacks: CommentsCallbacks): string {
    if (!this.consumer) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique listener ID
    const listenerId = `comments-listener-${++this.listenerIdCounter}`;

    // Store callbacks for this listener
    this.commentsListeners.set(listenerId, callbacks);

    // Create subscription only if it doesn't exist
    if (!this.subscriptions.has('comments')) {
      const subscription = this.consumer.subscriptions.create('CommentsChannel', {
        received: (data: any) => {
          this.commentsListeners.forEach((listener) => {
            switch (data.action) {
              case 'new_comment':
                listener.onNewComment?.(data.comment);
                break;
              case 'update_comment':
                listener.onUpdateComment?.(data.comment);
                break;
              case 'delete_comment':
                listener.onDeleteComment?.(data.comment_id);
                break;
              case 'comment_reaction_update':
                listener.onCommentReactionUpdate?.({
                  comment: data.comment,
                  reaction_action: data.reaction_action
                });
                break;
            }
          });
        },
      });

      this.subscriptions.set('comments', subscription);
    }

    return listenerId;
  }

  // Unsubscribe a specific listener from comments channel
  unsubscribeFromComments(listenerId: string) {
    this.commentsListeners.delete(listenerId);

    // If no more listeners, close the subscription
    if (this.commentsListeners.size === 0) {
      const subscription = this.subscriptions.get('comments');
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete('comments');
      }
    }
  }

  // Follow comments on a post
  followPostComments(postId: number) {
    const subscription = this.subscriptions.get('comments');
    if (subscription) {
      subscription.send({ action: 'follow_post', post_id: postId });
    }
  }

  // Unfollow comments on a post
  unfollowPostComments(postId: number) {
    const subscription = this.subscriptions.get('comments');
    if (subscription) {
      subscription.send({ action: 'unfollow_post', post_id: postId });
    }
  }

  // Follow replies on a comment
  followCommentReplies(commentId: number) {
    const subscription = this.subscriptions.get('comments');
    if (subscription) {
      subscription.send({ action: 'follow_comment', comment_id: commentId });
    }
  }

  // Unfollow replies on a comment
  unfollowCommentReplies(commentId: number) {
    const subscription = this.subscriptions.get('comments');
    if (subscription) {
      subscription.send({ action: 'unfollow_comment', comment_id: commentId });
    }
  }

  // Subscribe to notifications channel (supports multiple subscribers)
  subscribeToNotifications(callbacks: NotificationsCallbacks): string {
    if (!this.consumer) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique listener ID
    const listenerId = `notifications-listener-${++this.listenerIdCounter}`;

    // Store callbacks for this listener
    this.notificationsListeners.set(listenerId, callbacks);

    // Create subscription only if it doesn't exist
    if (!this.subscriptions.has('notifications')) {
      const subscription = this.consumer.subscriptions.create('NotificationsChannel', {
        received: (data: any) => {
          this.notificationsListeners.forEach((listener) => {
            switch (data.action) {
              case 'new_notification':
                listener.onNewNotification?.(data.notification);
                break;
              case 'notification_read':
                listener.onNotificationRead?.(data.notification_id);
                break;
              case 'all_notifications_read':
                listener.onAllNotificationsRead?.();
                break;
            }
          });
        },
      });

      this.subscriptions.set('notifications', subscription);
    }

    return listenerId;
  }

  // Unsubscribe a specific listener from notifications channel
  unsubscribeFromNotifications(listenerId: string) {
    this.notificationsListeners.delete(listenerId);

    // If no more listeners, close the subscription
    if (this.notificationsListeners.size === 0) {
      const subscription = this.subscriptions.get('notifications');
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete('notifications');
      }
    }
  }

  // Mark notification as read via WebSocket
  markNotificationAsRead(notificationId: number) {
    const subscription = this.subscriptions.get('notifications');
    if (subscription) {
      subscription.send({ action: 'mark_read', notification_id: notificationId });
    }
  }

  // Mark all notifications as read via WebSocket
  markAllNotificationsAsRead() {
    const subscription = this.subscriptions.get('notifications');
    if (subscription) {
      subscription.send({ action: 'mark_all_read' });
    }
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
