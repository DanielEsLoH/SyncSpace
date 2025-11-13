'use client';

import { useState, useOptimistic } from 'react';
import { Comment } from '@/types';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { commentsService } from '@/lib/comments';
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

  // Optimistic updates for instant feedback
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => [...state, newComment]
  );

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
      // Submit to server (either comment or reply)
      const response = replyingTo
        ? await commentsService.createReply(replyingTo.id, {
            comment: {
              description: previousText,
            },
          })
        : await commentsService.createComment(postId, {
            comment: {
              description: previousText,
            },
          });

      // Replace optimistic comment with real one from server response
      setComments((prev) => {
        // Remove optimistic comment (has temp Date.now() ID) and add real comment
        const withoutOptimistic = prev.filter((c) => c.id !== optimisticComment.id);
        // Check if real comment already exists (from WebSocket)
        if (withoutOptimistic.some((c) => c.id === response.comment.id)) {
          return withoutOptimistic;
        }
        // Prepend new comment to show at the top
        return [response.comment, ...withoutOptimistic];
      });

      if (replyingTo) {
        toast.success('Reply added!');
        setReplyingTo(null);
      } else {
        toast.success('Comment added!');
      }
    } catch (error: any) {
      // Rollback on error - remove optimistic comment
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      setCommentText(previousText);
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
      await commentsService.deleteComment(postId, commentId);
      toast.success('Comment deleted!');
    } catch (error: any) {
      setComments(previousComments);
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
      await commentsService.reactToComment(postId, commentId, reactionType);
      toast.success(`Reacted with ${reactionType}!`);

      // Update local state to reflect reaction
      // In a production app, you might want to refetch or use optimistic updates
      // For now, we'll just show the toast
    } catch (error: any) {
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
      {optimisticComments.length === 0 ? (
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
