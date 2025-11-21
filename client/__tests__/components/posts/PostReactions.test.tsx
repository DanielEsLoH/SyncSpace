import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostReactions } from '@/components/posts/PostReactions';
import { postsService } from '@/lib/posts';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/posts', () => ({
  postsService: {
    reactToPost: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedPostsService = postsService as jest.Mocked<typeof postsService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('PostReactions', () => {
  const defaultProps = {
    postId: 1,
    initialReactionsCount: 5,
    initialUserReaction: null,
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all reaction buttons', () => {
      render(<PostReactions {...defaultProps} />);

      expect(screen.getByLabelText('Like this post')).toBeInTheDocument();
      expect(screen.getByLabelText('Love this post')).toBeInTheDocument();
      expect(screen.getByLabelText('Dislike this post')).toBeInTheDocument();
    });

    it('displays the initial reactions count', () => {
      render(<PostReactions {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows active state for current user reaction', () => {
      render(
        <PostReactions
          {...defaultProps}
          initialUserReaction={{ id: 1, user_id: 1, reaction_type: 'like' }}
        />
      );

      const likeButton = screen.getByLabelText('Like this post');
      expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows inactive state when no user reaction', () => {
      render(<PostReactions {...defaultProps} />);

      const likeButton = screen.getByLabelText('Like this post');
      expect(likeButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Unauthenticated User', () => {
    it('disables reaction buttons when not authenticated', () => {
      render(<PostReactions {...defaultProps} isAuthenticated={false} />);

      expect(screen.getByLabelText('Like this post')).toBeDisabled();
      expect(screen.getByLabelText('Love this post')).toBeDisabled();
      expect(screen.getByLabelText('Dislike this post')).toBeDisabled();
    });

    it('does not call API when button is disabled', async () => {
      const user = userEvent.setup();
      render(<PostReactions {...defaultProps} isAuthenticated={false} />);

      // Clicking disabled button shouldn't trigger API call
      await user.click(screen.getByLabelText('Like this post'));

      expect(mockedPostsService.reactToPost).not.toHaveBeenCalled();
    });
  });

  describe('Reaction Actions', () => {
    it('adds a like reaction successfully', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockResolvedValue({
        action: 'created',
        user_reaction: { id: 1, user_id: 1, reaction_type: 'like' },
        reactions_count: 6,
      });

      render(<PostReactions {...defaultProps} />);

      await user.click(screen.getByLabelText('Like this post'));

      await waitFor(() => {
        expect(mockedPostsService.reactToPost).toHaveBeenCalledWith(1, 'like');
        expect(mockedToast.success).toHaveBeenCalledWith('Reacted with like');
      });
    });

    it('adds a love reaction successfully', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockResolvedValue({
        action: 'created',
        user_reaction: { id: 1, user_id: 1, reaction_type: 'love' },
        reactions_count: 6,
      });

      render(<PostReactions {...defaultProps} />);

      await user.click(screen.getByLabelText('Love this post'));

      await waitFor(() => {
        expect(mockedPostsService.reactToPost).toHaveBeenCalledWith(1, 'love');
      });
    });

    it('removes reaction when clicking same reaction type', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockResolvedValue({
        action: 'removed',
        user_reaction: null,
        reactions_count: 4,
      });

      render(
        <PostReactions
          {...defaultProps}
          initialUserReaction={{ id: 1, user_id: 1, reaction_type: 'like' }}
        />
      );

      await user.click(screen.getByLabelText('Like this post'));

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith('Reaction removed');
      });
    });

    it('changes reaction type successfully', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockResolvedValue({
        action: 'changed',
        user_reaction: { id: 1, user_id: 1, reaction_type: 'love' },
        reactions_count: 5,
      });

      render(
        <PostReactions
          {...defaultProps}
          initialUserReaction={{ id: 1, user_id: 1, reaction_type: 'like' }}
        />
      );

      await user.click(screen.getByLabelText('Love this post'));

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith('Changed to love');
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockRejectedValue({
        response: { data: { error: 'Something went wrong' } },
      });

      render(<PostReactions {...defaultProps} />);

      await user.click(screen.getByLabelText('Like this post'));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });

    it('shows default error message when no specific error', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockRejectedValue(new Error('Network error'));

      render(<PostReactions {...defaultProps} />);

      await user.click(screen.getByLabelText('Like this post'));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith('Failed to react to post');
      });
    });
  });

  describe('Optimistic Updates', () => {
    it('rolls back on API error', async () => {
      const user = userEvent.setup();
      mockedPostsService.reactToPost.mockRejectedValue(new Error('Failed'));

      render(<PostReactions {...defaultProps} />);

      await user.click(screen.getByLabelText('Like this post'));

      // Wait for rollback
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Callback Integration', () => {
    it('calls onReaction callback with updated state', async () => {
      const user = userEvent.setup();
      const onReaction = jest.fn();
      mockedPostsService.reactToPost.mockResolvedValue({
        action: 'created',
        user_reaction: { id: 1, user_id: 1, reaction_type: 'like' },
        reactions_count: 6,
      });

      render(<PostReactions {...defaultProps} onReaction={onReaction} />);

      await user.click(screen.getByLabelText('Like this post'));

      await waitFor(() => {
        expect(onReaction).toHaveBeenCalledWith(
          { id: 1, user_id: 1, reaction_type: 'like' },
          6
        );
      });
    });
  });

  describe('Props Updates', () => {
    it('syncs with parent updates', () => {
      const { rerender } = render(<PostReactions {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();

      // Simulate parent update
      rerender(
        <PostReactions
          {...defaultProps}
          initialReactionsCount={10}
          initialUserReaction={{ id: 1, user_id: 1, reaction_type: 'love' }}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all buttons', () => {
      render(<PostReactions {...defaultProps} />);

      expect(screen.getByLabelText('Like this post')).toBeInTheDocument();
      expect(screen.getByLabelText('Love this post')).toBeInTheDocument();
      expect(screen.getByLabelText('Dislike this post')).toBeInTheDocument();
    });

    it('has proper aria-pressed states', () => {
      render(
        <PostReactions
          {...defaultProps}
          initialUserReaction={{ id: 1, user_id: 1, reaction_type: 'love' }}
        />
      );

      expect(screen.getByLabelText('Like this post')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByLabelText('Love this post')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Dislike this post')).toHaveAttribute('aria-pressed', 'false');
    });

    it('has accessible reactions count', () => {
      render(<PostReactions {...defaultProps} />);

      expect(screen.getByLabelText('5 total reactions')).toBeInTheDocument();
    });
  });
});
