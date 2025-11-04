import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PostFeedSkeletonProps {
  count?: number;
}

export function PostFeedSkeleton({ count = 3 }: PostFeedSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>

            {/* Image placeholder (50% chance) */}
            {i % 2 === 0 && <Skeleton className="h-64 w-full rounded-lg" />}

            {/* Tags */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-4 border-t">
            {/* Reaction buttons */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
