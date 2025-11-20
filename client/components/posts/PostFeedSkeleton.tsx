import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PostFeedSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

/**
 * PostFeedSkeleton Component - Agency-Quality Design
 *
 * Premium skeleton loading state matching the redesigned PostCard:
 * - Matches card structure and spacing
 * - Staggered animation delays
 * - Supports grid and list view modes
 */
export function PostFeedSkeleton({ count = 3, viewMode = 'grid' }: PostFeedSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Cards Grid */}
      <div
        className={cn(
          viewMode === 'grid'
            ? "grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2"
            : "flex flex-col gap-6"
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Card
            key={i}
            className={cn(
              "w-full overflow-hidden border border-border/50",
              "animate-in fade-in-0 slide-in-from-bottom-4",
              // First card is featured in grid mode
              viewMode === 'grid' && i === 0 && "md:col-span-2 lg:col-span-2"
            )}
            style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'both' }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                {/* Actions */}
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Title */}
              <Skeleton className={cn(
                "w-3/4",
                viewMode === 'grid' && i === 0 ? "h-8" : "h-6"
              )} />

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              {/* Image (50% of cards) */}
              {i % 2 === 0 && (
                <Skeleton className={cn(
                  "w-full rounded-xl",
                  viewMode === 'grid' && i === 0 ? "h-80 md:h-96" : "h-64 md:h-72"
                )} />
              )}

              {/* Tags */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-0 pb-4">
              {/* Reactions */}
              <div className="flex items-center gap-2 w-full">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>

              {/* Comments count */}
              <div className="flex items-center justify-between w-full pt-3 border-t border-border/50">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
