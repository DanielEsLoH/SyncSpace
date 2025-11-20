import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Post Detail Loading State
 *
 * This file provides instant visual feedback while the post page loads.
 * It's automatically shown by Next.js during the server-side data fetching.
 *
 * BENEFITS:
 * - Instant page transition (no white screen)
 * - Matches final layout structure
 * - Reduces perceived loading time
 * - Improves Core Web Vitals (CLS)
 *
 * Note: Navigation is rendered by the (protected) layout,
 * not in individual loading states.
 */
export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button Skeleton */}
          <Button
            variant="ghost"
            className="gap-2"
            disabled
            aria-label="Loading back button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>

          {/* Post Card Skeleton */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                {/* User Info Skeleton */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>

                {/* Actions Menu Skeleton */}
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Post Title Skeleton */}
              <Skeleton className="h-7 w-3/4" />

              {/* Post Description Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Post Image Skeleton */}
              <Skeleton className="w-full h-64 md:h-80 rounded-lg" />

              {/* Tags Skeleton */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Reactions Skeleton */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
              </div>
            </CardContent>
          </Card>

          {/* Comments Section Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Form Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-9 w-32" />
              </div>

              {/* Comment Items Skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-4 mt-2">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
