import { PostFeedSkeleton } from '@/components/posts/PostFeedSkeleton';
import { TagsSkeleton } from '@/components/tags/TagsSkeleton';

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
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-8 space-y-6">
            <PostFeedSkeleton count={3} />
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-6">
            <TagsSkeleton />
          </aside>
        </div>
      </main>
    </div>
  );
}
