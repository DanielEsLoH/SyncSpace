'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { PostContent } from './PostContent';
import { PostReactions } from './PostReactions';
import { wsClient } from '@/lib/websocket';
import { tokenStorage } from '@/lib/auth';

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

  // Set up WebSocket for real-time post updates
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return;

    // Connect WebSocket
    wsClient.connect(token);

    // Subscribe to posts channel for real-time updates and store listener ID
    const listenerId = wsClient.subscribeToPosts({
      onUpdatePost: (updatedPost: Post) => {
        // Update if this is the current post
        if (updatedPost.id === post.id) {
          setPost(updatedPost);
        }
      },
      onDeletePost: (postId: number) => {
        // Redirect to feed if this post is deleted
        if (postId === post.id) {
          window.location.href = '/feed';
        }
      },
      onReactionUpdate: (data: { post: Post; reaction_action: string }) => {
        // Update full post data (including user_reaction) in real-time
        if (data.post && data.post.id === post.id) {
          setPost(data.post);
        }
      },
    });

    // Cleanup - unsubscribe this specific listener
    return () => {
      wsClient.unsubscribeFromPosts(listenerId);
    };
  }, [post.id]);

  return (
    <>
      {/* Post Content */}
      <PostContent post={post} isOwner={isOwner} />

      {/* Post Reactions with real-time updates */}
      <PostReactions
        postId={post.id}
        initialReactionsCount={post.reactions_count}
        initialUserReaction={post.user_reaction}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
