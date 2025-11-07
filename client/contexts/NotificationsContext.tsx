'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationsService } from '@/lib/notifications';
import { wsClient } from '@/lib/websocket';
import { tokenStorage } from '@/lib/auth';
import { Notification } from '@/types';

interface NotificationsContextType {
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

/**
 * NotificationsProvider
 *
 * Provides centralized notification state management for the entire application.
 *
 * Features:
 * - Fetches initial unread count on mount
 * - Subscribes to WebSocket for real-time updates
 * - Provides methods to update the count from any component
 * - Automatically syncs state across all components using this context
 *
 * Usage:
 * - Wrap your app with this provider (typically in layout)
 * - Use useNotifications() hook in any component to access the state
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count and set up WebSocket
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsService.getUnreadCount();
        setUnreadCount(response.count);
      } catch (error) {
      }
    };

    fetchUnreadCount();

    // Connect WebSocket
    wsClient.connect(token);

    // Subscribe to notifications channel for real-time updates and store listener ID
    const listenerId = wsClient.subscribeToNotifications({
      onNewNotification: (notification: Notification) => {
        setUnreadCount((prev) => prev + 1);
      },
      onNotificationRead: (notificationId: number) => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      },
      onAllNotificationsRead: () => {
        setUnreadCount(0);
      },
    });

    // Cleanup on unmount - unsubscribe this specific listener
    return () => {
      wsClient.unsubscribeFromNotifications(listenerId);
    };
  }, []);

  // Helper function to decrement count
  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Helper function to reset count
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  // Helper function to refresh count from server
  const refreshUnreadCount = async () => {
    try {
      const response = await notificationsService.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        decrementUnreadCount,
        resetUnreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

/**
 * useNotifications Hook
 *
 * Access notification state and methods from any component.
 *
 * @returns {NotificationsContextType} Notification context value
 * @throws {Error} If used outside NotificationsProvider
 *
 * @example
 * const { unreadCount, decrementUnreadCount } = useNotifications();
 */
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
