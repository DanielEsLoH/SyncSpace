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

interface PostReactionsProps {
  postId: number;
  initialReactionsCount: number;
  initialUserReaction: Reaction | null | undefined;
  isAuthenticated: boolean;
}

export function PostReactions({
  postId,
  initialReactionsCount,
  initialUserReaction,
  isAuthenticated,
}: PostReactionsProps) {
  const [reactionsCount, setReactionsCount] = useState(initialReactionsCount);
  const [userReaction, setUserReaction] = useState<Reaction | null>(
    initialUserReaction || null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Optimistic state for instant UI feedback
  const [optimisticReaction, setOptimisticReaction] = useOptimistic(
    userReaction,
    (state, newReaction: Reaction | null) => newReaction
  );

  // Sync with prop changes (for real-time updates from WebSocket)
  useEffect(() => {
    setReactionsCount(initialReactionsCount);
  }, [initialReactionsCount]);

  useEffect(() => {
    setUserReaction(initialUserReaction || null);
  }, [initialUserReaction]);

  const handleReact = async (reactionType: ReactionType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to react to posts');
      return;
    }

    if (isLoading) return;

    // Store previous state for rollback
    const previousReaction = userReaction;
    const previousCount = reactionsCount;

    // Determine if we're adding or removing a reaction
    const isSameReaction = userReaction?.reaction_type === reactionType;
    const newReaction = isSameReaction ? null : { reaction_type: reactionType } as Reaction;
    const countDelta = isSameReaction ? -1 : (userReaction ? 0 : 1);

    // Optimistic update wrapped in startTransition
    startTransition(() => {
      setOptimisticReaction(newReaction);
    });
    setUserReaction(newReaction);
    setReactionsCount(reactionsCount + countDelta);
    setIsLoading(true);

    try {
      // Make API call
      const response = await postsService.reactToPost(postId, reactionType);

      // Update count with actual server response
      setReactionsCount(response.reactions_count);

      // Success feedback
      if (response.action === 'removed') {
        toast.success('Reaction removed');
      } else if (response.action === 'changed') {
        toast.success(`Changed to ${reactionType}`);
      } else {
        toast.success(`Reacted with ${reactionType}`);
      }
    } catch (error: any) {
      // Rollback on error
      startTransition(() => {
        setOptimisticReaction(previousReaction);
      });
      setUserReaction(previousReaction);
      setReactionsCount(previousCount);
      console.error('Failed to react:', error);
      toast.error(error.response?.data?.error || 'Failed to react to post');
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
            optimisticReaction?.reaction_type === 'like'
              ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950'
          )}
          aria-label="Like this post"
          aria-pressed={optimisticReaction?.reaction_type === 'like'}
        >
          <ThumbsUp
            className={cn(
              'h-4 w-4 transition-transform',
              optimisticReaction?.reaction_type === 'like' && 'fill-current scale-110'
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
            optimisticReaction?.reaction_type === 'love'
              ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              : 'hover:bg-red-50 dark:hover:bg-red-950'
          )}
          aria-label="Love this post"
          aria-pressed={optimisticReaction?.reaction_type === 'love'}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform',
              optimisticReaction?.reaction_type === 'love' && 'fill-current scale-110'
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
            optimisticReaction?.reaction_type === 'dislike'
              ? 'bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
              : 'hover:bg-gray-50 dark:hover:bg-gray-900'
          )}
          aria-label="Dislike this post"
          aria-pressed={optimisticReaction?.reaction_type === 'dislike'}
        >
          <ThumbsDown
            className={cn(
              'h-4 w-4 transition-transform',
              optimisticReaction?.reaction_type === 'dislike' && 'fill-current scale-110'
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
