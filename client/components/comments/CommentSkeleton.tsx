import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';

/**
 * CommentSkeleton - Loading State Component
 *
 * Displayed while comments are being fetched via streaming.
 * Matches the structure of the actual comments section for smooth transition.
 *
 * BENEFITS:
 * - Prevents layout shift (good CLS score)
 * - Provides visual feedback during streaming
 * - Matches final layout structure
 */

interface CommentSkeletonProps {
  count?: number;
  showForm?: boolean;
}

export function CommentSkeleton({ count = 3, showForm = true }: CommentSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form Skeleton */}
        {showForm && (
          <div className="space-y-3" aria-label="Loading comment form">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-9 w-32" />
          </div>
        )}

        {/* Comment Items Skeleton */}
        <div className="space-y-4" aria-label="Loading comments">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex items-start space-x-3 p-3 rounded-lg"
            >
              {/* Avatar Skeleton */}
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

              {/* Content Skeleton */}
              <div className="flex-1 space-y-2">
                {/* User name and timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>

                {/* Comment text */}
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-4 mt-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Loading comments...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
