'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { notificationsService } from '@/lib/notifications';
import { Notification } from '@/types';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await notificationsService.getNotifications({
        page: 1,
        per_page: 20,
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
      setHasMore(response.meta.current_page < response.meta.total_pages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadMoreNotifications = useCallback(async () => {
    if (isLoading || !hasMore || !isAuthenticated) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await notificationsService.getNotifications({
        page: nextPage,
        per_page: 20,
      });
      setNotifications((prev) => [...prev, ...response.notifications]);
      setUnreadCount(response.unread_count); // Always update with the latest count
      setHasMore(response.meta.current_page < response.meta.total_pages);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, hasMore, isLoading, isAuthenticated]);

  const handleNewNotification = useCallback((event: CustomEvent) => {
    const newNotification = event.detail.notification as Notification;
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  const handleNotificationRead = useCallback((event: CustomEvent) => {
    const { notificationId } = event.detail;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();

      window.addEventListener(
        'ws:notification:new',
        handleNewNotification as EventListener
      );
      window.addEventListener(
        'ws:notification:read',
        handleNotificationRead as EventListener
      );
      window.addEventListener(
        'ws:notification:all-read',
        handleAllNotificationsRead as EventListener
      );

      return () => {
        window.removeEventListener(
          'ws:notification:new',
          handleNewNotification as EventListener
        );
        window.removeEventListener(
          'ws:notification:read',
          handleNotificationRead as EventListener
        );
        window.removeEventListener(
          'ws:notification:all-read',
          handleAllNotificationsRead as EventListener
        );
      };
    }
  }, [
    isAuthenticated,
    refreshNotifications,
    handleNewNotification,
    handleNotificationRead,
    handleAllNotificationsRead,
  ]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasMore,
        isLoading,
        refreshNotifications,
        loadMoreNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
}
