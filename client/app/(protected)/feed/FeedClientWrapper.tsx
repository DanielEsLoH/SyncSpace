'use client';

import { useState, createContext, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { EditPostDialog } from '@/components/posts/EditPostDialog';
import { Post } from '@/types';
import { revalidatePostsFeed } from '@/lib/actions';
import { useFeedState } from '@/contexts/FeedStateContext';

interface FeedContextType {
  openCreateDialog: () => void;
  openEditDialog: (post: Post) => void;
  registerPostCreatedHandler: (handler: (post: Post) => void) => void;
  registerPostUpdatedHandler: (handler: (post: Post) => void) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export function useFeedContext() {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeedContext must be used within FeedClientWrapper');
  }
  return context;
}

interface FeedClientWrapperProps {
  children: ReactNode;
}

export function FeedClientWrapper({ children }: FeedClientWrapperProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const { posts, addPost, updatePost } = useFeedState();
  const postCreatedHandlerRef = useRef<((post: Post) => void) | null>(null);
  const postUpdatedHandlerRef = useRef<((post: Post) => void) | null>(null);

  const handleCreatePost = () => {
    setIsCreateDialogOpen(true);
  };

  const handlePostCreated = async (newPost: Post) => {
    setIsCreateDialogOpen(false);
    addPost(newPost);

    // Revalidate the feed cache to ensure data is fresh on next navigation
    await revalidatePostsFeed();

    // Broadcast custom event for optimistic updates across all pages
    // Mark source as 'feed' so PostFeed can ignore it (already handled via registered handler)
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('post-created-optimistic', {
        detail: { post: newPost, source: 'feed' }
      });
      window.dispatchEvent(event);
    }
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setIsEditDialogOpen(false);
    setEditingPost(null);
    updatePost(updatedPost);
  };

  const registerPostCreatedHandler = useCallback((handler: (post: Post) => void) => {
    postCreatedHandlerRef.current = handler;
  }, []);

  const registerPostUpdatedHandler = useCallback((handler: (post: Post) => void) => {
    postUpdatedHandlerRef.current = handler;
  }, []);

  const contextValue: FeedContextType = {
    openCreateDialog: handleCreatePost,
    openEditDialog,
    registerPostCreatedHandler,
    registerPostUpdatedHandler,
  };

  return (
    <FeedContext.Provider value={contextValue}>
      {/* Page Content */}
      {children}

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onPostCreated={handlePostCreated}
      />

      {/* Edit Post Dialog */}
      <EditPostDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
    </FeedContext.Provider>
  );
}