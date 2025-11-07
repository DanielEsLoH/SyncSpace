'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { PostContent } from './PostContent';
import { PostReactions } from './PostReactions';

interface PostDetailClientProps {
  initialPost: Post;
  isOwner: boolean;
  isAuthenticated: boolean;
}

/**
 * PostDetailClient - Client Component Wrapper
 *
 * Manages real-time updates for a single post via WebSocket.
 * Wraps server-rendered post content with real-time synchronization.
 *
 * REAL-TIME FEATURES:
 * - Post content updates (title, description, tags)
 * - Reaction count updates
 * - Post deletion notifications
 * - Synced across all views (feed, my posts, detail page)
 */
export function PostDetailClient({
  initialPost,
  isOwner,
  isAuthenticated,
}: PostDetailClientProps) {
  const [post, setPost] = useState<Post>(initialPost);

  // Listen to global WebSocket events for real-time post updates
  useEffect(() => {
    const handleUpdatePost = (event: CustomEvent) => {
      const { post: updatedPost } = event.detail;
      // Update if this is the current post
      if (updatedPost.id === post.id) {
        setPost((currentPost) => ({
          ...updatedPost,
          // Preserve user_reaction since WebSocket updates don't include it
          user_reaction: updatedPost.user_reaction !== undefined ? updatedPost.user_reaction : currentPost.user_reaction
        }));
      }
    };

    const handleDeletePost = (event: CustomEvent) => {
      const { postId } = event.detail;
      // Redirect to feed if this post is deleted
      if (postId === post.id) {
        window.location.href = '/feed';
      }
    };

    const handleReactionUpdate = (event: CustomEvent) => {
      const { post: updatedPost } = event.detail;
      // WebSocket broadcasts don't include user_reaction (it's user-agnostic)
      // Preserve the current user's reaction state while updating counts
      if (updatedPost && updatedPost.id === post.id) {
        setPost((currentPost) => ({
          ...updatedPost,
          // Preserve user_reaction if the broadcast doesn't include it
          user_reaction: updatedPost.user_reaction !== undefined ? updatedPost.user_reaction : currentPost.user_reaction
        }));
      }
    };

    // Listen to user's own reaction updates (from any view)
    const handleUserReactionUpdate = (event: CustomEvent) => {
      const { postId, userReaction, reactionsCount } = event.detail;
      if (postId === post.id) {
        setPost((currentPost) => ({
          ...currentPost,
          user_reaction: userReaction,
          reactions_count: reactionsCount
        }));
      }
    };

    window.addEventListener('ws:post:update', handleUpdatePost as EventListener);
    window.addEventListener('ws:post:delete', handleDeletePost as EventListener);
    window.addEventListener('ws:post:reaction', handleReactionUpdate as EventListener);
    window.addEventListener('user-reaction-update', handleUserReactionUpdate as EventListener);

    return () => {
      window.removeEventListener('ws:post:update', handleUpdatePost as EventListener);
      window.removeEventListener('ws:post:delete', handleDeletePost as EventListener);
      window.removeEventListener('ws:post:reaction', handleReactionUpdate as EventListener);
      window.removeEventListener('user-reaction-update', handleUserReactionUpdate as EventListener);
    };
  }, [post.id]);

  return (
    <>
      {/* Post Content */}
      <PostContent post={post} isOwner={isOwner} />

      {/* Post Reactions with real-time updates */}
      <PostReactions
        postId={post.id}
        initialReactionsCount={post.reactions_count || 0}
        initialUserReaction={post.user_reaction}
        isAuthenticated={isAuthenticated}
        onReaction={(reaction, reactionsCount) => {
          // Update post state with new reaction and count
          setPost((currentPost) => ({
            ...currentPost,
            user_reaction: reaction,
            reactions_count: reactionsCount !== undefined ? reactionsCount : currentPost.reactions_count
          }));
        }}
      />
    </>
  );
}
