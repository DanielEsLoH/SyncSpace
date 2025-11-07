'use client';

import { ReactNode } from 'react';
import { FeedStateProvider } from '@/contexts/FeedStateContext';
import { Post } from '@/types';

interface UserProfileWrapperProps {
  children: ReactNode;
  initialPosts: Post[];
}

export function UserProfileWrapper({ children, initialPosts }: UserProfileWrapperProps) {
  return (
    <FeedStateProvider initialPosts={initialPosts}>
      {children}
    </FeedStateProvider>
  );
}
