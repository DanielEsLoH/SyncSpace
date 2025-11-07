'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { Post } from '@/types';

interface DialogContextType {
  openCreatePostDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialogContext must be used within DialogProvider');
  }
  return context;
}

interface DialogProviderProps {
  children: ReactNode;
}

/**
 * Global Dialog Provider
 *
 * Provides application-wide dialog functionality that can be triggered
 * from anywhere in the app (e.g., Navigation component).
 *
 * Currently manages:
 * - Create Post Dialog (triggered from Navigation)
 *
 * Benefits:
 * - Dialogs can be triggered from any component
 * - State management is centralized
 * - No prop drilling needed
 * - Clean separation of concerns
 */
export function DialogProvider({ children }: DialogProviderProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const openCreatePostDialog = () => {
    setIsCreatePostOpen(true);
  };

  const handlePostCreated = (post: Post) => {
    setIsCreatePostOpen(false);

    // Broadcast custom event for optimistic updates across all pages
    // Mark source as 'navigation' so all pages process it
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('post-created-optimistic', {
        detail: { post, source: 'navigation' }
      });
      window.dispatchEvent(event);
    }

    // Post will also appear via WebSocket for other users
  };

  return (
    <DialogContext.Provider value={{ openCreatePostDialog }}>
      {children}

      {/* Global Dialogs */}
      <CreatePostDialog
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
        onPostCreated={handlePostCreated}
      />
    </DialogContext.Provider>
  );
}
