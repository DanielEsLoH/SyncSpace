'use client';

import { NotificationsList } from '@/components/notifications/NotificationsList';
import { NotificationsPageHeader } from '@/components/notifications/NotificationsPageHeader';

/**
 * Notifications Page - Client Component
 *
 * This page now acts as a simple layout wrapper.
 * All data fetching, state management, and real-time updates
 * are handled by the centralized `NotificationsContext` and
 * consumed by the `NotificationsList` component.
 *
 * Design: Modern, card-free layout with gradient background
 * matching the feed page design language.
 */
export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <NotificationsPageHeader />
          <NotificationsList />
        </div>
      </main>
    </div>
  );
}
