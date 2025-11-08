import { wsClient } from './websocket';
import { tokenStorage } from './auth';
import { Post, Comment, Notification } from '@/types';

/**
 * Global WebSocket Manager
 *
 * Maintains a persistent WebSocket connection across page navigations
 * and broadcasts updates to all views via custom browser events.
 */

class GlobalWebSocketManager {
  private postsListenerId: string | null = null;
  private commentsListenerId: string | null = null;
  private notificationsListenerId: string | null = null;
  private isInitialized = false;

  /**
   * Initialize global WebSocket subscriptions
   * This should be called once at app startup
   */
  initialize() {
    if (this.isInitialized) return;

    const token = tokenStorage.getToken();
    if (!token) return;

    // Connect to WebSocket
    wsClient.connect(token);

    // Subscribe to posts channel
    this.postsListenerId = wsClient.subscribeToPosts({
      onNewPost: (post: Post) => {
        window.dispatchEvent(new CustomEvent('ws:post:new', { detail: { post } }));
      },
      onUpdatePost: (post: Post) => {
        window.dispatchEvent(new CustomEvent('ws:post:update', { detail: { post } }));
      },
      onDeletePost: (postId: number) => {
        window.dispatchEvent(new CustomEvent('ws:post:delete', { detail: { postId } }));
      },
      onReactionUpdate: (data: { post: Post; reaction_action: string }) => {
        window.dispatchEvent(new CustomEvent('ws:post:reaction', { detail: data }));
      },
    });

    // Subscribe to comments channel
    this.commentsListenerId = wsClient.subscribeToComments({
      onNewComment: (comment: Comment) => {
        window.dispatchEvent(new CustomEvent('ws:comment:new', { detail: { comment } }));
      },
      onUpdateComment: (comment: Comment) => {
        window.dispatchEvent(new CustomEvent('ws:comment:update', { detail: { comment } }));
      },
      onDeleteComment: (commentId: number) => {
        window.dispatchEvent(new CustomEvent('ws:comment:delete', { detail: { commentId } }));
      },
    });

    // Subscribe to notifications channel
    this.notificationsListenerId = wsClient.subscribeToNotifications({
      onNewNotification: (notification: Notification) => {
        window.dispatchEvent(new CustomEvent('ws:notification:new', { detail: { notification } }));
      },
      onNotificationRead: (notificationId: number) => {
        window.dispatchEvent(new CustomEvent('ws:notification:read', { detail: { notificationId } }));
      },
      onAllNotificationsRead: () => {
        window.dispatchEvent(new CustomEvent('ws:notification:all-read'));
      },
    });

    this.isInitialized = true;
  }

  /**
   * Tell the server we are interested in updates for a specific post's comments
   */
  followPostComments(postId: number) {
    if (!this.isInitialized) return;
    wsClient.followPostComments(postId);
  }

  /**
   * Tell the server we are no longer interested in a specific post's comments
   */
  unfollowPostComments(postId: number) {
    if (!this.isInitialized) return;
    wsClient.unfollowPostComments(postId);
  }

  /**
   * Mark a single notification as read via WebSocket
   */
  markNotificationAsRead(notificationId: number) {
    if (!this.isInitialized) return;
    wsClient.markNotificationAsRead(notificationId);
  }

  /**
   * Mark all notifications as read via WebSocket
   */
  markAllNotificationsAsRead() {
    if (!this.isInitialized) return;
    wsClient.markAllNotificationsAsRead();
  }

  /**
   * Cleanup global subscriptions
   * Should only be called on app shutdown/logout
   */
  cleanup() {
    if (this.postsListenerId) {
      wsClient.unsubscribeFromPosts(this.postsListenerId);
      this.postsListenerId = null;
    }
    if (this.commentsListenerId) {
      wsClient.unsubscribeFromComments(this.commentsListenerId);
      this.commentsListenerId = null;
    }
    if (this.notificationsListenerId) {
      wsClient.unsubscribeFromNotifications(this.notificationsListenerId);
      this.notificationsListenerId = null;
    }
    wsClient.disconnect(); // Disconnect entirely
    this.isInitialized = false;
  }

  /**
   * Reinitialize after login
   */
  reinitialize() {
    this.cleanup();
    this.initialize();
  }
}

export const globalWebSocket = new GlobalWebSocketManager();

// Auto-initialize when the module loads (client-side only)
if (typeof window !== 'undefined') {
  globalWebSocket.initialize();
}
