'use client';

import { Post } from '@/types';
import { PostFeed } from '@/components/posts/PostFeed';
import { useFeedContext } from './FeedClientWrapper';

interface PostFeedWithContextProps {
  initialPosts: Post[];
  initialPage: number;
  initialHasMore: boolean;
}

/**
 * Wrapper component that connects PostFeed to FeedContext
 * Allows PostFeed to trigger edit dialogs via context
 */
export function PostFeedWithContext({
  initialPosts,
  initialPage,
  initialHasMore,
}: PostFeedWithContextProps) {
  const { openEditDialog } = useFeedContext();

  return (
    <PostFeed
      initialPosts={initialPosts}
      initialPage={initialPage}
      initialHasMore={initialHasMore}
      onEdit={openEditDialog}
    />
  );
}
