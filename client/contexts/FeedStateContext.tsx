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
  updatePostReaction: (postId: number, reaction: Reaction | null, reactionsCount: number) => void;
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
  userId?: number;
}

export function FeedStateProvider({ children, initialPosts = [], userId }: FeedStateProviderProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isInitialized, setIsInitialized] = useState(initialPosts.length > 0);

  const initializePosts = useCallback((initialPosts: Post[]) => {
    if (!isInitialized && initialPosts.length > 0) {
      setPosts(initialPosts);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const addPost = useCallback((newPost: Post) => {
    setPosts((prev) => {
      if (prev.some(p => p.id === newPost.id)) {
        return prev.map(p => p.id === newPost.id ? newPost : p);
      }
      return [newPost, ...prev];
    });
  }, []);

  const updatePost = useCallback((updatedPost: Post, preserveUserReaction = false) => {
    setPosts((prev) => prev.map((post) => {
      if (post.id === updatedPost.id) {
        return {
          ...updatedPost,
          // Always preserve user_reaction for broadcasts, or when explicitly requested
          user_reaction: preserveUserReaction || updatedPost.user_reaction === undefined
            ? post.user_reaction
            : updatedPost.user_reaction
        };
      }
      return post;
    }));
  }, []);

  const deletePost = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const addPosts = useCallback((newPosts: Post[]) => {
    setPosts((prev) => {
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
      return [...prev, ...uniqueNewPosts];
    });
  }, []);

  const updatePostReaction = useCallback((postId: number, reaction: Reaction | null, reactionsCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, user_reaction: reaction, reactions_count: reactionsCount }
          : post
      )
    );
  }, []);

  useEffect(() => {
    const handleNewPost = (event: CustomEvent) => {
      const newPost = event.detail.post as Post;
      if (!userId || newPost.user.id === userId) {
        addPost(newPost);
      }
    };
    const handleUpdatePost = (event: CustomEvent) => updatePost(event.detail.post);
    const handleDeletePost = (event: CustomEvent) => deletePost(event.detail.postId);
    // Broadcast reaction updates must preserve user_reaction (broadcasts don't include it)
    const handleReactionUpdate = (event: CustomEvent) => updatePost(event.detail.post, true);
    const handleUserReactionUpdate = (event: CustomEvent) => {
      const { postId, userReaction, reactionsCount } = event.detail;
      updatePostReaction(postId, userReaction, reactionsCount);
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
  }, [addPost, updatePost, deletePost, updatePostReaction, userId]);

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
