'use client';

import { useEffect } from 'react';
import { useFeedState } from '@/contexts/FeedStateContext';
import { Post } from '@/types';

export function FeedInitializer({ posts }: { posts: Post[] }) {
  const { initializePosts } = useFeedState();

  useEffect(() => {
    initializePosts(posts);
  }, [initializePosts, posts]);

  return null;
}
