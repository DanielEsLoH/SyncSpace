import api from './api';
import {
  Notification,
  NotificationsResponse,
  NotificationReadResponse,
  NotificationsFilterParams,
} from '@/types';

/**
 * Notifications API Service
 *
 * Handles all notification-related API calls.
 */
export const notificationsService = {
  /**
   * Get user's notifications
   */
  async getNotifications(
    params?: NotificationsFilterParams
  ): Promise<NotificationsResponse> {
    const response = await api.get<NotificationsResponse>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number): Promise<NotificationReadResponse> {
    const response = await api.patch<NotificationReadResponse>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(
      '/notifications/mark_all_read'
    );
    return response.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>(
      '/notifications/unread_count'
    );
    return response.data;
  },
};
