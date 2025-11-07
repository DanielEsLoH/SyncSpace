import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { NotificationsPageHeader } from '@/components/notifications/NotificationsPageHeader';
import { getCachedNotifications, getAuthToken } from '@/lib/api-server';
import { requireAuth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { NotificationsSkeleton } from '@/components/notifications/NotificationsSkeleton';
import type { NotificationsResponse } from '@/types';

/**
 * Notifications Page - Server Component
 *
 * Architecture:
 * - Server Component for initial data fetching
 * - Server-side authentication check
 * - Cached notifications data (15s revalidation)
 * - Pass initial data to Client Component
 * - Client Component handles real-time updates
 *
 * Benefits:
 * - Faster initial page load (server-rendered)
 * - SEO-friendly (though notifications are private)
 * - Reduced client-side JavaScript
 * - Better UX with immediate content
 *
 * Data Flow:
 * 1. Server: Check authentication
 * 2. Server: Fetch initial notifications (cached)
 * 3. Server: Render page with data
 * 4. Client: Hydrate and connect WebSocket
 * 5. Client: Handle real-time updates
 */
export default async function NotificationsPage() {
  // Require authentication (throws error if not authenticated)
  // This will be caught by the error boundary
  let auth;
  try {
    auth = await requireAuth();
  } catch (error) {
    // Not authenticated - redirect to login
    redirect('/login');
  }

  // Type guard to ensure auth.user exists
  if (!auth.user) {
    redirect('/login');
  }

  // Extract token first (outside of cached functions)
  const token = await getAuthToken();

  // Fetch initial notifications with caching
  // Cache: 15 seconds (notifications should be relatively fresh)
  let notificationsData: NotificationsResponse;
  try {
    notificationsData = await getCachedNotifications(auth.user.id, 1, token);
  } catch (error) {
    // Return empty state - client component will show error UI
    notificationsData = {
      notifications: [],
      unread_count: 0,
      meta: {
        current_page: 1,
        per_page: 50,
        total_count: 0,
        total_pages: 0,
      },
    };
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="pb-6">
              <NotificationsPageHeader />
            </CardHeader>

            <CardContent>
              {/*
                NotificationsList is a Client Component that:
                - Receives initial server-rendered data
                - Manages real-time WebSocket updates
                - Handles filtering, grouping, and pagination
                - Provides optimistic UI updates
              */}
              <NotificationsList
                initialData={notificationsData}
                userId={auth.user.id}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

/**
 * Metadata for the notifications page
 */
export const metadata = {
  title: 'Notifications | SyncSpace',
  description: 'View and manage your notifications',
};

/**
 * Runtime configuration
 * - Uses edge runtime for faster cold starts (optional)
 * - Can be removed if edge runtime causes issues
 */
// export const runtime = 'edge'; // Uncomment for edge runtime
