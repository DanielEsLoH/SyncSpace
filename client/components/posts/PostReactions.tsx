'use client';

import { useState, useOptimistic, startTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { postsService } from '@/lib/posts';
import { Reaction, ReactionType } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * PostReactions - Client Component
 *
 * Handles interactive reaction buttons with optimistic updates.
 * Separated from PostContent to keep that component server-rendered.
 *
 * FEATURES:
 * - Optimistic UI updates (instant feedback)
 * - Proper error handling with rollback
 * - Authentication-aware
 * - Accessible button states
 *
 * PERFORMANCE:
 * - Uses useOptimistic for instant UI updates
 * - Minimal bundle size (only this component hydrates)
 * - No unnecessary re-renders
 */

import { useFeedState } from '@/contexts/FeedStateContext';

// ... (existing imports)

interface PostReactionsProps {
  postId: number;
  initialReactionsCount: number;
  initialUserReaction: Reaction | null | undefined;
  isAuthenticated: boolean;
  onReaction?: (reaction: Reaction | null, reactionsCount?: number) => void; // Optional callback for non-feed contexts
}

export function PostReactions({
  postId,
  initialReactionsCount,
  initialUserReaction,
  isAuthenticated,
  onReaction,
}: PostReactionsProps) {
  // Try to use FeedStateContext if available, otherwise fall back to callback
  let updatePostReaction: ((postId: number, reaction: Reaction | null) => void) | undefined;
  let isInFeedContext = false;
  try {
    const feedState = useFeedState();
    updatePostReaction = feedState.updatePostReaction;
    isInFeedContext = true;
  } catch {
    // FeedStateContext not available, will use callback instead
    updatePostReaction = undefined;
    isInFeedContext = false;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [reactionsCount, setReactionsCount] = useState(initialReactionsCount);
  const [userReaction, setUserReaction] = useState<Reaction | null | undefined>(initialUserReaction);
  const [optimisticReaction, setOptimisticReaction] = useOptimistic(
    userReaction,
    (state, newReaction: Reaction | null) => newReaction
  );

  // Always sync state when props change - compare by reaction type, not object reference
  useEffect(() => {
    setUserReaction(initialUserReaction);
    setReactionsCount(initialReactionsCount);
  }, [initialUserReaction?.reaction_type, initialUserReaction?.id, initialReactionsCount]);

  // Use optimistic state for feed, regular state for post detail
  const currentReaction = isInFeedContext ? optimisticReaction : userReaction;

  const handleReact = async (reactionType: ReactionType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to react to posts');
      return;
    }

    if (isLoading) return;

    const isSameReaction = currentReaction?.reaction_type === reactionType;
    const newReaction = isSameReaction ? null : { reaction_type: reactionType } as Reaction;

    // Apply optimistic update for instant UI feedback
    setUserReaction(newReaction);
    if (isInFeedContext) {
      startTransition(() => {
        setOptimisticReaction(newReaction);
      });
    }

    setIsLoading(true);

    try {
      const response = await postsService.reactToPost(postId, reactionType);

      // Update state with server's authoritative response
      const serverReaction = response.user_reaction || null;

      // Update local state immediately
      setUserReaction(serverReaction);
      setReactionsCount(response.reactions_count);

      // Broadcast user's own reaction to all views via custom event
      // This is separate from WebSocket broadcasts which don't include user_reaction
      window.dispatchEvent(new CustomEvent('user-reaction-update', {
        detail: {
          postId,
          userReaction: serverReaction,
          reactionsCount: response.reactions_count
        }
      }));

      if (updatePostReaction) {
        // Using FeedStateContext
        updatePostReaction(postId, serverReaction);
      } else if (onReaction) {
        // Using callback for non-feed contexts
        // Pass both reaction and count to parent
        onReaction(serverReaction, response.reactions_count);
      }

      // Update optimistic state for feed context
      if (isInFeedContext) {
        startTransition(() => {
          setOptimisticReaction(serverReaction);
        });
      }

      // User feedback
      if (response.action === 'removed') {
        toast.success('Reaction removed');
      } else if (response.action === 'changed') {
        toast.success(`Changed to ${reactionType}`);
      } else {
        toast.success(`Reacted with ${reactionType}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to react to post');

      // Rollback update on error
      setUserReaction(initialUserReaction);
      setReactionsCount(initialReactionsCount);
      if (isInFeedContext) {
        startTransition(() => {
          setOptimisticReaction(initialUserReaction || null);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      {/* Reaction Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReact('like')}
          disabled={isLoading || !isAuthenticated}
          className={cn(
            'h-9 px-3 gap-2 rounded-full transition-all hover:scale-105',
            currentReaction?.reaction_type === 'like'
              ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950'
          )}
          aria-label="Like this post"
          aria-pressed={currentReaction?.reaction_type === 'like'}
        >
          <ThumbsUp
            className={cn(
              'h-4 w-4 transition-transform',
              currentReaction?.reaction_type === 'like' && 'fill-current scale-110'
            )}
          />
          <span className="text-sm font-medium">Like</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReact('love')}
          disabled={isLoading || !isAuthenticated}
          className={cn(
            'h-9 px-3 gap-2 rounded-full transition-all hover:scale-105',
            currentReaction?.reaction_type === 'love'
              ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              : 'hover:bg-red-50 dark:hover:bg-red-950'
          )}
          aria-label="Love this post"
          aria-pressed={currentReaction?.reaction_type === 'love'}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform',
              currentReaction?.reaction_type === 'love' && 'fill-current scale-110'
            )}
          />
          <span className="text-sm font-medium">Love</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReact('dislike')}
          disabled={isLoading || !isAuthenticated}
          className={cn(
            'h-9 px-3 gap-2 rounded-full transition-all hover:scale-105',
            currentReaction?.reaction_type === 'dislike'
              ? 'bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
              : 'hover:bg-gray-50 dark:hover:bg-gray-900'
          )}
          aria-label="Dislike this post"
          aria-pressed={currentReaction?.reaction_type === 'dislike'}
        >
          <ThumbsDown
            className={cn(
              'h-4 w-4 transition-transform',
              currentReaction?.reaction_type === 'dislike' && 'fill-current scale-110'
            )}
          />
          <span className="text-sm font-medium">Dislike</span>
        </Button>
      </div>

      {/* Reactions Count */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
        <Heart className="h-4 w-4 text-muted-foreground fill-current" />
        <span className="text-sm font-semibold text-foreground" aria-label={`${reactionsCount} total reactions`}>
          {reactionsCount}
        </span>
      </div>

      {/* Authentication Prompt */}
      {!isAuthenticated && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <p className="text-sm text-muted-foreground font-medium">
            Log in to react to this post
          </p>
        </div>
      )}
    </div>
  );
}
