'use client';

import { Post } from '@/types';
import { PostFeed } from '@/components/posts/PostFeed';
import { useFeedState } from '@/contexts/FeedStateContext';
import { useFeedContext } from './FeedClientWrapper';
import { FeedSearch } from '@/components/feed/FeedSearch';

interface PostFeedWithContextProps {
  initialPage: number;
  initialHasMore: boolean;
}

export function PostFeedWithContext({
  initialPage,
  initialHasMore,
}: PostFeedWithContextProps) {
  const { posts, addPost, addPosts, updatePost, deletePost } = useFeedState();
  const { openEditDialog } = useFeedContext();

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <FeedSearch />
      </div>

      {/* Post Feed */}
      <PostFeed
        posts={posts}
        addPost={addPost}
        addPosts={addPosts}
        updatePost={updatePost}
        deletePost={deletePost}
        initialPage={initialPage}
        initialHasMore={initialHasMore}
        onEdit={openEditDialog}
      />
    </>
  );
}
