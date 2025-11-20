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
 * - Header with animated elements
 * - Filter tabs skeleton
 * - Notification list skeleton with staggered animations
 *
 * Note: Navigation is rendered by the (protected) layout,
 * not in individual loading states.
 */
export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="h-9 w-36" />
          </div>

          {/* Filters Skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>

          {/* Notifications skeleton */}
          <NotificationsSkeleton count={8} />
        </div>
      </main>
    </div>
  );
}
