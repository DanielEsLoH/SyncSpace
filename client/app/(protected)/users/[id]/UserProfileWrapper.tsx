'use client';

import { ReactNode } from 'react';
import { FeedStateProvider } from '@/contexts/FeedStateContext';
import { Post } from '@/types';

interface UserProfileWrapperProps {
  children: ReactNode;
  initialPosts: Post[];
  userId: number;
}

export function UserProfileWrapper({ children, initialPosts, userId }: UserProfileWrapperProps) {
  return (
    <FeedStateProvider initialPosts={initialPosts} userId={userId}>
      {children}
    </FeedStateProvider>
  );
}
