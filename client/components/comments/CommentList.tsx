'use client';

import { useState, useOptimistic, useEffect, startTransition } from 'react';
import { Comment } from '@/types';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { commentsService } from '@/lib/comments';
import { wsClient } from '@/lib/websocket';
import { tokenStorage } from '@/lib/auth';
import { toast } from 'sonner';

/**
 * CommentList - Client Component
 *
 * Handles all interactive comment functionality:
 * - Form submission with optimistic updates
 * - Comment deletion
 * - Comment reactions
 * - Real-time UI updates
 *
 * OPTIMISTIC UI:
 * - New comments appear instantly
 * - Smooth UX without waiting for server
 * - Automatic rollback on errors
 *
 * PERFORMANCE:
 * - Only this component and its children hydrate
 * - Parent components remain static HTML
 * - Minimal JavaScript bundle
 */

interface CommentListProps {
  postId: number;
  initialComments: Comment[];
  isAuthenticated: boolean;
  userId?: number;
}

export function CommentList({
  postId,
  initialComments,
  isAuthenticated,
  userId,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Optimistic updates for instant feedback
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => [...state, newComment]
  );

  // Load comments on mount if not provided
  useEffect(() => {
    const loadComments = async () => {
      if (initialComments.length === 0) {
        setIsLoading(true);
        try {
          const response = await commentsService.getPostComments(postId);
          // Backend returns { comments: [...] }
          setComments(response.comments || []);
        } catch (error) {
          console.error('Failed to load comments:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadComments();
  }, [postId, initialComments.length]);

  // Set up WebSocket for real-time comment updates
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return;

    // Connect WebSocket
    wsClient.connect(token);

    // Subscribe to comments channel with callbacks
    wsClient.subscribeToComments({
      onNewComment: (comment: Comment) => {
        // Only add if it's for this post and not already present
        if (comment.commentable_id === postId && comment.commentable_type === 'Post') {
          setComments((prev) => {
            if (prev.some(c => c.id === comment.id)) {
              return prev;
            }
            return [...prev, comment];
          });
        }
      },
      onUpdateComment: (comment: Comment) => {
        if (comment.commentable_id === postId && comment.commentable_type === 'Post') {
          setComments((prev) =>
            prev.map((c) => (c.id === comment.id ? comment : c))
          );
        }
      },
      onDeleteComment: (commentId: number) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      },
    });

    // Follow this specific post's comments
    wsClient.followPostComments(postId);

    // Cleanup
    return () => {
      wsClient.unfollowPostComments(postId);
      wsClient.unsubscribe('comments');
    };
  }, [postId]);

  /**
   * Handle comment submission with optimistic update
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }

    // Create optimistic comment for instant UI feedback
    const optimisticComment: Comment = {
      id: Date.now(), // Temporary ID
      description: commentText,
      commentable_type: 'Post',
      commentable_id: postId,
      user: {
        id: userId || 0,
        name: 'You',
        profile_picture: '',
      },
      reactions_count: 0,
      replies_count: 0,
      user_reaction: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optimistically (must be wrapped in startTransition)
    startTransition(() => {
      addOptimisticComment(optimisticComment);
    });
    const previousText = commentText;
    setCommentText('');
    setIsSubmitting(true);

    try {
      // Submit to server
      const response = await commentsService.createComment(postId, {
        comment: {
          description: previousText,
        },
      });

      // Replace optimistic comment with real one from server response
      setComments((prev) => [...prev, response.comment]);
      toast.success('Comment added!');
    } catch (error: any) {
      // Rollback on error
      setCommentText(previousText);
      console.error('Failed to add comment:', error);
      toast.error(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle comment deletion
   */
  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    // Optimistically remove comment
    const previousComments = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      await commentsService.deleteComment(commentId);
      toast.success('Comment deleted!');
    } catch (error: any) {
      // Rollback on error
      setComments(previousComments);
      console.error('Failed to delete comment:', error);
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    }
  };

  /**
   * Handle comment reactions
   */
  const handleReact = async (
    commentId: number,
    reactionType: 'like' | 'love' | 'dislike'
  ) => {
    if (!isAuthenticated) {
      toast.error('Please log in to react to comments');
      return;
    }

    try {
      const response = await commentsService.reactToComment(commentId, reactionType);

      // Update reaction count in local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, reactions_count: response.reactions_count }
            : c
        )
      );

      if (response.action === 'removed') {
        toast.success('Reaction removed');
      } else if (response.action === 'changed') {
        toast.success(`Changed to ${reactionType}`);
      } else {
        toast.success(`Reacted with ${reactionType}`);
      }
    } catch (error: any) {
      console.error('Failed to react to comment:', error);
      toast.error(error.response?.data?.error || 'Failed to react');
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="resize-none"
            aria-label="Comment text"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">Log in to add a comment</p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : optimisticComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Comments">
          {optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
