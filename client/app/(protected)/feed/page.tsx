import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/server-auth';
import { getCachedPostsFeed, getAuthToken } from '@/lib/api-server';
import { PostFeedWithContext } from './PostFeedWithContext';
import { FeedClientWrapper } from './FeedClientWrapper';
import { FeedInitializer } from './FeedInitializer';
import type { PostsResponse } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

async function getInitialData() {
  const token = await getAuthToken();
  const [auth, postsData] = await Promise.all([
    getServerAuth(),
    getCachedPostsFeed(1, 10, token),
  ]);
  return { auth, postsData };
}

export default async function FeedPage() {
  const { auth, postsData } = await getInitialData();

  if (!auth.isAuthenticated) {
    redirect('/login');
  }

  const hasMore = postsData.meta
    ? postsData.meta.current_page < postsData.meta.total_pages
    : false;

  return (
    <FeedClientWrapper>
      <FeedInitializer posts={postsData.posts} />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <PostFeedWithContext
              initialPage={1}
              initialHasMore={hasMore}
            />
          </div>
        </main>
      </div>
    </FeedClientWrapper>
  );
}

export const metadata = {
  title: 'Feed | SyncSpace',
  description: 'Discover and share posts with the SyncSpace community',
};

