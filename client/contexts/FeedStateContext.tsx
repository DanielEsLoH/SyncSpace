'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Post, Reaction } from '@/types';

interface FeedStateContextType {
  posts: Post[];
  initializePosts: (initialPosts: Post[]) => void;
  addPost: (newPost: Post) => void;
  addPosts: (newPosts: Post[]) => void;
  updatePost: (updatedPost: Post) => void;
  deletePost: (postId: number) => void;
  updatePostReaction: (postId: number, reaction: Reaction | null) => void;
}

const FeedStateContext = createContext<FeedStateContextType | undefined>(undefined);

export function useFeedState() {
  const context = useContext(FeedStateContext);
  if (!context) {
    throw new Error('useFeedState must be used within a FeedStateProvider');
  }
  return context;
}

interface FeedStateProviderProps {
  children: ReactNode;
  initialPosts?: Post[];
}

export function FeedStateProvider({ children, initialPosts = [] }: FeedStateProviderProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isInitialized, setIsInitialized] = useState(initialPosts.length > 0);

  const initializePosts = useCallback((initialPosts: Post[]) => {
    if (!isInitialized && initialPosts.length > 0) {
      setPosts(initialPosts);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const addPost = (newPost: Post) => {
    setPosts((prev) => {
      if (prev.some(p => p.id === newPost.id)) {
        return prev.map(p => p.id === newPost.id ? newPost : p);
      }
      return [newPost, ...prev];
    });
  };

  const updatePost = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => {
      if (post.id === updatedPost.id) {
        // Preserve the current user's reaction state if the update doesn't include it
        // This prevents WebSocket broadcasts from wiping out user-specific data
        return {
          ...updatedPost,
          user_reaction: updatedPost.user_reaction !== undefined ? updatedPost.user_reaction : post.user_reaction
        };
      }
      return post;
    }));
  };

  const deletePost = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const addPosts = (newPosts: Post[]) => {
    setPosts((prev) => {
      // Filter out posts that already exist
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
      return [...prev, ...uniqueNewPosts];
    });
  };

  const updatePostReaction = (postId: number, reaction: Reaction | null) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, user_reaction: reaction } : post
      )
    );
  };

  // Listen to global WebSocket events
  useEffect(() => {
    const handleNewPost = (event: CustomEvent) => {
      const { post } = event.detail;
      addPost(post);
    };

    const handleUpdatePost = (event: CustomEvent) => {
      const { post } = event.detail;
      updatePost(post);
    };

    const handleDeletePost = (event: CustomEvent) => {
      const { postId } = event.detail;
      deletePost(postId);
    };

    const handleReactionUpdate = (event: CustomEvent) => {
      const { post } = event.detail;
      // The broadcast post object doesn't include user_reaction (it's user-agnostic)
      // updatePost will preserve the current user's reaction state
      updatePost(post);
    };

    // Listen to user's own reaction updates (from any view)
    const handleUserReactionUpdate = (event: CustomEvent) => {
      const { postId, userReaction, reactionsCount } = event.detail;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, user_reaction: userReaction, reactions_count: reactionsCount }
            : post
        )
      );
    };

    window.addEventListener('ws:post:new', handleNewPost as EventListener);
    window.addEventListener('ws:post:update', handleUpdatePost as EventListener);
    window.addEventListener('ws:post:delete', handleDeletePost as EventListener);
    window.addEventListener('ws:post:reaction', handleReactionUpdate as EventListener);
    window.addEventListener('user-reaction-update', handleUserReactionUpdate as EventListener);

    return () => {
      window.removeEventListener('ws:post:new', handleNewPost as EventListener);
      window.removeEventListener('ws:post:update', handleUpdatePost as EventListener);
      window.removeEventListener('ws:post:delete', handleDeletePost as EventListener);
      window.removeEventListener('ws:post:reaction', handleReactionUpdate as EventListener);
      window.removeEventListener('user-reaction-update', handleUserReactionUpdate as EventListener);
    };
  }, [addPost, updatePost, deletePost]);

  const contextValue = {
    posts,
    initializePosts,
    addPost,
    addPosts,
    updatePost,
    deletePost,
    updatePostReaction,
  };

  return (
    <FeedStateContext.Provider value={contextValue}>
      {children}
    </FeedStateContext.Provider>
  );
}