'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { EditPostDialog } from '@/components/posts/EditPostDialog';
import { Post } from '@/types';

interface FeedContextType {
  openCreateDialog: () => void;
  openEditDialog: (post: Post) => void;
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

/**
 * Client Wrapper for Feed Page
 *
 * Manages client-side state for:
 * - Create/Edit post dialogs
 * - Dialog open/close state
 *
 * Provides context for child components to trigger dialogs.
 * This wrapper allows the main page to remain a Server Component
 * while still providing interactive dialog functionality.
 *
 * Note: Navigation is now handled by the (protected) layout,
 * not in individual pages. This ensures consistent navigation
 * across all protected routes.
 */
export function FeedClientWrapper({ children }: FeedClientWrapperProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const handleCreatePost = () => {
    setIsCreateDialogOpen(true);
  };

  const handlePostCreated = (newPost: Post) => {
    setIsCreateDialogOpen(false);
    // Post will be added via WebSocket, no need to refresh
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setIsEditDialogOpen(false);
    setEditingPost(null);
    // Post will be updated via WebSocket, no need to refresh
  };

  const contextValue: FeedContextType = {
    openCreateDialog: handleCreatePost,
    openEditDialog,
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
