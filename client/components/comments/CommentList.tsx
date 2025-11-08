'use client';

import { useState, useOptimistic, useEffect, startTransition, useCallback } from 'react';
import { Comment } from '@/types';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { commentsService } from '@/lib/comments';
import { globalWebSocket } from '@/lib/globalWebSocket';
import { toast } from 'sonner';

// Helper to identify optimistic comments (which use a temporary timestamp ID)
const isOptimistic = (comment: Comment) => comment.id > 1_000_000_000;

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
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => [newComment, ...state]
  );

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadComments = async () => {
      if (initialComments.length === 0) {
        setIsLoading(true);
        try {
          const response = await commentsService.getPostComments(postId);
          setComments(response.comments || []);
        } catch (error) {
          toast.error('Failed to load comments.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadComments();
  }, [postId, initialComments.length]);

  // --- REAL-TIME EVENT HANDLERS ---
  const handleNewComment = useCallback((newComment: Comment) => {
    // Only process comments relevant to this post
    const isTopLevel = newComment.commentable_id === postId && newComment.commentable_type === 'Post';
    const isReply = newComment.commentable_type === 'Comment';

    if (!isTopLevel && !isReply) return;

    setComments(prev => {
      // If it's a reply, find the parent and add it
      if (isReply) {
        return prev.map(parentComment => {
          if (parentComment.id === newComment.commentable_id) {
            const existingReplies = parentComment.replies || [];
            if (existingReplies.some(r => r.id === newComment.id)) return parentComment; // Already exists
            return {
              ...parentComment,
              replies: [newComment, ...existingReplies],
              replies_count: (parentComment.replies_count || 0) + 1,
            };
          }
          return parentComment;
        });
      }

      // If it's a top-level comment, handle optimistic replacement
      const optimisticIndex = prev.findIndex(isOptimistic);
      if (optimisticIndex > -1) {
        // Replace optimistic comment with the real one
        const newComments = [...prev];
        newComments[optimisticIndex] = newComment;
        return newComments;
      } else if (!prev.some(c => c.id === newComment.id)) {
        // Add if it doesn't exist
        return [newComment, ...prev];
      }
      return prev; // No change
    });
  }, [postId]);

  const handleUpdateComment = useCallback((updatedComment: Comment) => {
    setComments(prev =>
      prev.map(c => (c.id === updatedComment.id ? updatedComment : c))
    );
  }, []);

  const handleDeleteComment = useCallback((commentId: number) => {
    setComments(prev => {
      const newComments = prev.filter(c => c.id !== commentId);
      if (newComments.length < prev.length) return newComments;

      // If not found at top level, check replies
      return prev.map(parent => {
        if (!parent.replies?.some(r => r.id === commentId)) return parent;
        return {
          ...parent,
          replies: parent.replies.filter(r => r.id !== commentId),
          replies_count: Math.max(0, (parent.replies_count || 0) - 1),
        };
      });
    });
  }, []);


  // --- WEB SOCKET LIFECYCLE & EVENT LISTENERS ---
  useEffect(() => {
    // Tell the global manager we are interested in this post's comments
    globalWebSocket.followPostComments(postId);

    // The cleanup function tells the manager we are no longer interested
    return () => {
      globalWebSocket.unfollowPostComments(postId);
    };
  }, [postId]);

  useEffect(() => {
    const newCommentListener = (event: CustomEvent) => handleNewComment(event.detail.comment);
    const updateCommentListener = (event: CustomEvent) => handleUpdateComment(event.detail.comment);
    const deleteCommentListener = (event: CustomEvent) => handleDeleteComment(event.detail.commentId);

    window.addEventListener('ws:comment:new', newCommentListener as EventListener);
    window.addEventListener('ws:comment:update', updateCommentListener as EventListener);
    window.addEventListener('ws:comment:delete', deleteCommentListener as EventListener);

    return () => {
      window.removeEventListener('ws:comment:new', newCommentListener as EventListener);
      window.removeEventListener('ws:comment:update', updateCommentListener as EventListener);
      window.removeEventListener('ws:comment:delete', deleteCommentListener as EventListener);
    };
  }, [handleNewComment, handleUpdateComment, handleDeleteComment]);


  // --- USER ACTIONS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return toast.error('Comment cannot be empty');
    if (!isAuthenticated) return toast.error('Please log in to comment');

    const optimisticComment: Comment = {
      id: Date.now(),
      description: commentText,
      commentable_type: replyingTo ? 'Comment' : 'Post',
      commentable_id: replyingTo ? replyingTo.id : postId,
      user: { id: userId || 0, name: 'You', profile_picture: '' },
      reactions_count: 0, replies_count: 0, user_reaction: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };

    startTransition(() => {
      addOptimisticComment(optimisticComment);
    });

    const previousText = commentText;
    setCommentText('');
    setIsSubmitting(true);

    try {
      const payload = { comment: { description: previousText } };
      replyingTo
        ? await commentsService.createReply(replyingTo.id, payload)
        : await commentsService.createComment(postId, payload);

      // SUCCESS: The WebSocket 'ws:comment:new' event will handle replacing the optimistic comment.
      // No manual state update is needed here, preventing race conditions.
      if (replyingTo) setReplyingTo(null);

    } catch (error: any) {
      // ERROR: Rollback optimistic update
      toast.error(error.response?.data?.error || 'Failed to add comment');
      setCommentText(previousText); // Restore text
      // The optimistic comment is removed automatically by React on error
      // but we need to trigger a re-render of the original state.
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const previousComments = comments;
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await commentsService.deleteComment(commentId);
      toast.success('Comment deleted!');
    } catch (error: any) {
      setComments(previousComments);
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    }
  };

  const handleReply = (comment: Comment) => {
    if (!isAuthenticated) return toast.error('Please log in to reply');
    setReplyingTo(comment);
    document.querySelector('form[data-comment-form]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleReact = async (commentId: number, reactionType: 'like' | 'love' | 'dislike') => {
    if (!isAuthenticated) return toast.error('Please log in to react');
    try {
      const response = await commentsService.reactToComment(commentId, reactionType);
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, reactions_count: response.reactions_count, user_reaction: response.user_reaction } : c
        )
      );
      if (response.action === 'removed') toast.success('Reaction removed');
      else if (response.action === 'changed') toast.success(`Changed to ${reactionType}`);
      else toast.success(`Reacted with ${reactionType}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to react');
    }
  };

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="space-y-3" data-comment-form>
          {replyingTo && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">
                Replying to <span className="font-semibold">{replyingTo.user.name}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 px-2 text-xs">
                Cancel
              </Button>
            </div>
          )}
          <Textarea
            placeholder={replyingTo ? "Write your reply..." : "Add a comment..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="resize-none"
            aria-label="Comment text"
          />
          <Button type="submit" disabled={isSubmitting || !commentText.trim()} className="gap-2">
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
          </Button>
        </form>
      )}
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
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
