import { Skeleton } from '@/components/ui/skeleton';

interface NotificationsSkeletonProps {
  count?: number;
}

/**
 * NotificationsSkeleton Component
 *
 * Modern skeleton loading state for notifications list.
 * Matches the redesigned NotificationItem layout with:
 * - Avatar placeholder
 * - Icon badge overlay
 * - Content area with multiple lines
 * - Timestamp
 * - Staggered animation delays
 *
 * @param {number} [count=5] - The number of skeleton items to display.
 */
export function NotificationsSkeleton({ count = 5 }: NotificationsSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 rounded-lg border bg-card"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Avatar with Icon Badge Skeleton */}
          <div className="relative flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background" />
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 space-y-2">
            {/* Main message skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Preview text skeleton - varies by index */}
            {i % 3 !== 0 && (
              <Skeleton className="h-3 w-full max-w-[280px]" />
            )}

            {/* Timestamp skeleton */}
            <Skeleton className="h-3 w-24" />
          </div>

          {/* Unread indicator skeleton - appears on some items */}
          {i % 3 === 0 && (
            <Skeleton className="h-2 w-2 rounded-full flex-shrink-0 mt-2" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * NotificationGroupSkeleton Component
 *
 * Displays skeleton for a group of notifications with header.
 */
export function NotificationGroupSkeleton() {
  return (
    <div className="space-y-4">
      {/* Group header skeleton */}
      <Skeleton className="h-4 w-24" />
      <NotificationsSkeleton count={3} />
    </div>
  );
}
