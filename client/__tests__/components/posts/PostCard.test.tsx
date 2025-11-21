import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from '@/components/posts/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { Post, User } from '@/types';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/components/comments/CommentList', () => ({
  CommentList: () => <div data-testid="comment-list">Comment List</div>,
}));
jest.mock('@/components/posts/PostReactions', () => ({
  PostReactions: () => <div data-testid="post-reactions">Reactions</div>,
}));

const mockedUseAuth = useAuth as jest.Mock;

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return <img {...props} />;
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe('PostCard', () => {
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    profile_picture: 'https://example.com/avatar.jpg',
  };

  const mockPost: Post = {
    id: 1,
    title: 'Test Post Title',
    description: 'This is a test post description.',
    created_at: '2025-01-15T10:30:00Z',
    user: mockUser,
    tags: [
      { id: 1, name: 'react', color: '#61dafb' },
    ],
    comments_count: 5,
    reactions_count: 10,
    user_reaction: null,
    last_three_comments: [
      {
        id: 1,
        description: 'Great post!',
        user: { id: 2, name: 'Commenter', profile_picture: undefined },
        created_at: '2025-01-15T11:00:00Z',
      },
    ],
  };

  const defaultProps = {
    post: mockPost,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockConfirm.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('renders post title', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders post description', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByText(/This is a test post description/)).toBeInTheDocument();
    });

    it('renders author name', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders tags', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByText('#react')).toBeInTheDocument();
    });

    it('renders comments count button', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders reactions component', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByTestId('post-reactions')).toBeInTheDocument();
    });
  });

  describe('Long Description', () => {
    it('shows read more button for long descriptions', () => {
      const longDescription = 'A'.repeat(250);
      const postWithLongDesc = {
        ...mockPost,
        description: longDescription,
      };
      render(<PostCard post={postWithLongDesc} />);
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    it('toggles description expansion', async () => {
      const user = userEvent.setup();
      const longDescription = 'A'.repeat(250);
      const postWithLongDesc = {
        ...mockPost,
        description: longDescription,
      };
      render(<PostCard post={postWithLongDesc} />);

      await user.click(screen.getByText('Read more'));
      expect(screen.getByText('Show less')).toBeInTheDocument();

      await user.click(screen.getByText('Show less'));
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });
  });

  describe('Owner Actions', () => {
    it('shows options menu for post owner', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByLabelText('Post options')).toBeInTheDocument();
    });

    it('hides options menu for non-owners', () => {
      mockedUseAuth.mockReturnValue({ user: { id: 999, name: 'Other User' } });
      render(<PostCard {...defaultProps} />);
      expect(screen.queryByLabelText('Post options')).not.toBeInTheDocument();
    });

    it('calls onEdit when edit is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      render(<PostCard {...defaultProps} onEdit={onEdit} />);

      await user.click(screen.getByLabelText('Post options'));
      await user.click(screen.getByText('Edit post'));

      expect(onEdit).toHaveBeenCalledWith(mockPost);
    });

    it('calls onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      mockConfirm.mockReturnValue(true);

      render(<PostCard {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByLabelText('Post options'));
      await user.click(screen.getByText('Delete post'));

      expect(mockConfirm).toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it('does not delete when cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      mockConfirm.mockReturnValue(false);

      render(<PostCard {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByLabelText('Post options'));
      await user.click(screen.getByText('Delete post'));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('Comments Section', () => {
    it('shows view all comments button', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByText('View all 5 comments')).toBeInTheDocument();
    });

    it('shows comment list when expanded', async () => {
      const user = userEvent.setup();
      render(<PostCard {...defaultProps} />);

      await user.click(screen.getByText('View all 5 comments'));
      expect(screen.getByTestId('comment-list')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('links post title to detail page', () => {
      render(<PostCard {...defaultProps} />);
      const titleLink = screen.getByText('Test Post Title').closest('a');
      expect(titleLink).toHaveAttribute('href', '/posts/1');
    });

    it('links author name to profile', () => {
      render(<PostCard {...defaultProps} />);
      const authorLink = screen.getByText('Test User').closest('a');
      expect(authorLink).toHaveAttribute('href', '/users/1');
    });

    it('links tags to tag pages', () => {
      render(<PostCard {...defaultProps} />);
      const tagLink = screen.getByText('#react').closest('a');
      expect(tagLink).toHaveAttribute('href', '/tags/1');
    });
  });

  describe('Accessibility', () => {
    it('has accessible save and share buttons', () => {
      render(<PostCard {...defaultProps} />);
      expect(screen.getByLabelText('Save post')).toBeInTheDocument();
      expect(screen.getByLabelText('Share post')).toBeInTheDocument();
    });
  });
});
