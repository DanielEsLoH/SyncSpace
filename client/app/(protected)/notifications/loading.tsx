import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsSkeleton } from '@/components/notifications/NotificationsSkeleton';

/**
 * Notifications Page Loading State
 *
 * Displayed while the Server Component fetches initial notification data.
 * Provides immediate visual feedback with skeleton placeholders.
 *
 * Features:
 * - Full page skeleton matching final layout
 * - Filter tabs skeleton
 * - Notification list skeleton
 *
 * Note: Navigation is rendered by the (protected) layout,
 * not in individual loading states.
 */
export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              {/* Title skeleton */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-8 w-48" />
              </div>
              {/* Action button skeleton */}
              <Skeleton className="h-9 w-40" />
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Filter tabs skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>

              {/* Notifications skeleton */}
              <NotificationsSkeleton />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
