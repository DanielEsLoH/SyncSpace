'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { NotificationsPageHeader } from '@/components/notifications/NotificationsPageHeader';

/**
 * Notifications Page - Client Component
 *
 * This page now acts as a simple layout wrapper.
 * All data fetching, state management, and real-time updates
 * are handled by the centralized `NotificationsContext` and
 * consumed by the `NotificationsList` component.
 */
export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max_w-3xl mx-auto">
          <Card>
            <CardHeader className="pb-6">
              <NotificationsPageHeader />
            </CardHeader>
            <CardContent>
              <NotificationsList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
