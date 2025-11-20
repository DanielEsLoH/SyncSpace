import { PostFeedSkeleton } from '@/components/posts/PostFeedSkeleton';

/**
 * Loading UI for Feed Page
 *
 * Shown during:
 * - Initial page load
 * - Navigation to feed
 * - Data revalidation
 *
 * Provides instant feedback while server components stream.
 */
export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <PostFeedSkeleton count={3} />
        </div>
      </main>
    </div>
  );
}
