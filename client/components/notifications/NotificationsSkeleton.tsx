import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * NotificationsSkeleton Component
 *
 * Displays skeleton loading state for notifications list.
 * Provides visual feedback while notifications are loading.
 */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon skeleton */}
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0 mt-1" />

              <div className="flex-1 space-y-2">
                {/* Main message skeleton */}
                <Skeleton className="h-4 w-3/4" />
                {/* Description skeleton - appears in 60% of notifications */}
                {i % 5 !== 0 && <Skeleton className="h-3 w-full" />}
                {/* Timestamp skeleton */}
                <Skeleton className="h-3 w-24" />
              </div>

              {/* Unread indicator skeleton - appears in 40% */}
              {i % 5 < 2 && <Skeleton className="h-2 w-2 rounded-full" />}
            </div>
          </CardContent>
        </Card>
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
    <div className="space-y-3">
      {/* Group header skeleton */}
      <Skeleton className="h-5 w-32" />
      <NotificationsSkeleton />
    </div>
  );
}
