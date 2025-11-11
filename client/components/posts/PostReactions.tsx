'use client';

import { useState, useOptimistic, startTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { postsService } from '@/lib/posts';
import { Reaction, ReactionType } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostReactionsProps {
  postId: number;
  initialReactionsCount: number;
  initialUserReaction: Reaction | null | undefined;
  isAuthenticated: boolean;
  onReaction?: (reaction: Reaction | null, reactionsCount?: number) => void;
}

export function PostReactions({
  postId,
  initialReactionsCount,
  initialUserReaction,
  isAuthenticated,
  onReaction,
}: PostReactionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reactionsCount, setReactionsCount] = useState(initialReactionsCount);
  const [userReaction, setUserReaction] = useState<Reaction | null | undefined>(initialUserReaction);
  const [originalCount, setOriginalCount] = useState(initialReactionsCount);

  const [optimisticReaction, setOptimisticReaction] = useOptimistic(
    userReaction,
    (state, newReaction: Reaction | null) => newReaction
  );

  // Sync with parent updates (from broadcasts or context changes)
  useEffect(() => {
    setUserReaction(initialUserReaction);
    setReactionsCount(initialReactionsCount);
    setOriginalCount(initialReactionsCount);
  }, [initialUserReaction, initialReactionsCount]);

  const handleReact = async (reactionType: ReactionType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to react to posts');
      return;
    }

    if (isLoading) return;

    // Store original values for rollback
    const previousReaction = userReaction;
    const previousCount = reactionsCount;

    const isSameReaction = optimisticReaction?.reaction_type === reactionType;
    const newReaction = isSameReaction ? null : { reaction_type: reactionType } as Reaction;

    // Calculate optimistic count based on current state
    let optimisticCount: number;
    if (isSameReaction) {
      // Removing reaction
      optimisticCount = reactionsCount - 1;
    } else if (optimisticReaction) {
      // Changing reaction (like → love), count stays same
      optimisticCount = reactionsCount;
    } else {
      // Adding new reaction
      optimisticCount = reactionsCount + 1;
    }

    // Apply optimistic updates
    startTransition(() => {
      setOptimisticReaction(newReaction);
      setReactionsCount(optimisticCount);
    });

    setIsLoading(true);

    try {
      const response = await postsService.reactToPost(postId, reactionType);

      // Update with server response (source of truth)
      setUserReaction(response.user_reaction);
      setReactionsCount(response.reactions_count);
      setOriginalCount(response.reactions_count);

      // Notify parent component
      if (onReaction) {
        onReaction(response.user_reaction, response.reactions_count);
      }

      // Dispatch event for cross-component sync
      window.dispatchEvent(new CustomEvent('user-reaction-update', {
        detail: {
          postId,
          userReaction: response.user_reaction,
          reactionsCount: response.reactions_count,
        },
      }));

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

      // Rollback to original state
      startTransition(() => {
        setOptimisticReaction(previousReaction || null);
        setReactionsCount(previousCount);
      });
      setUserReaction(previousReaction);
    } finally {
      setIsLoading(false);
    }
  };

  const currentReaction = optimisticReaction;

  return (
    <div className="flex items-center justify-between py-3">
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

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
        <Heart className="h-4 w-4 text-muted-foreground fill-current" />
        <span className="text-sm font-semibold text-foreground" aria-label={`${reactionsCount} total reactions`}>
          {reactionsCount}
        </span>
      </div>

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