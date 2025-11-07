import { wsClient } from './websocket';
import { tokenStorage } from './auth';
import { Post } from '@/types';

/**
 * Global WebSocket Manager
 *
 * Maintains a persistent WebSocket connection across page navigations
 * and broadcasts updates to all views via custom browser events.
 */

class GlobalWebSocketManager {
  private listenerId: string | null = null;
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

    // Subscribe to posts channel with a persistent listener
    this.listenerId = wsClient.subscribeToPosts({
      onNewPost: (post: Post) => {
        // Broadcast to all views via custom event
        window.dispatchEvent(new CustomEvent('ws:post:new', { detail: { post } }));
      },
      onUpdatePost: (post: Post) => {
        // Broadcast to all views via custom event
        window.dispatchEvent(new CustomEvent('ws:post:update', { detail: { post } }));
      },
      onDeletePost: (postId: number) => {
        // Broadcast to all views via custom event
        window.dispatchEvent(new CustomEvent('ws:post:delete', { detail: { postId } }));
      },
      onReactionUpdate: (data: { post: Post; reaction_action: string }) => {
        // Broadcast to all views via custom event
        window.dispatchEvent(new CustomEvent('ws:post:reaction', { detail: data }));
      },
    });

    this.isInitialized = true;
  }

  /**
   * Cleanup global subscriptions
   * Should only be called on app shutdown/logout
   */
  cleanup() {
    if (this.listenerId) {
      wsClient.unsubscribeFromPosts(this.listenerId);
      this.listenerId = null;
    }
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
