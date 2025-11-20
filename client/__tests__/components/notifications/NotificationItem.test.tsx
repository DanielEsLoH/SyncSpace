import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Notification } from '@/types';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock notification factory
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 1,
  notification_type: 'comment_on_post',
  read: false,
  actor: {
    id: 2,
    name: 'John Doe',
    profile_picture: 'https://example.com/avatar.jpg',
  },
  notifiable: {
    type: 'Comment',
    id: 1,
    post_id: 100,
    description: 'This is a test comment',
    user_id: 2,
  },
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('NotificationItem', () => {
  const mockOnMarkAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders actor name and action correctly', () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('commented on your post')).toBeInTheDocument();
    });

    it('displays avatar with initials fallback', () => {
      const notification = createMockNotification({
        actor: { id: 2, name: 'Jane Smith', profile_picture: undefined },
      });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('shows preview text for comments', () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      // Preview text includes quotes around the content
      expect(screen.getByText(/This is a test comment/)).toBeInTheDocument();
    });

    it('shows reaction emoji for reaction notifications', () => {
      const notification = createMockNotification({
        notification_type: 'reaction_on_post',
        notifiable: {
          type: 'Reaction',
          id: 1,
          reaction_type: 'love',
          reactionable_type: 'Post',
          reactionable_id: 100,
          user_id: 2,
        },
      });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    it('shows deleted content message when notifiable is null', () => {
      const notification = createMockNotification({
        notifiable: null,
      });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('This content is no longer available')).toBeInTheDocument();
    });
  });

  describe('Unread/Read Visual Differentiation', () => {
    it('shows unread indicator for unread notifications', () => {
      const notification = createMockNotification({ read: false });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByLabelText('Unread')).toBeInTheDocument();
    });

    it('does not show unread indicator for read notifications', () => {
      const notification = createMockNotification({ read: true });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Long Content', () => {
    it('shows expand button for long content', () => {
      const longComment = 'A'.repeat(150);
      const notification = createMockNotification({
        notifiable: {
          type: 'Comment',
          id: 1,
          post_id: 100,
          description: longComment,
          user_id: 2,
        },
      });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('toggles between expanded and collapsed states', () => {
      const longComment = 'A'.repeat(150);
      const notification = createMockNotification({
        notifiable: {
          type: 'Comment',
          id: 1,
          post_id: 100,
          description: longComment,
          user_id: 2,
        },
      });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      // Initially collapsed
      expect(screen.getByText('Show more')).toBeInTheDocument();

      // Expand
      fireEvent.click(screen.getByText('Show more'));
      expect(screen.getByText('Show less')).toBeInTheDocument();

      // Collapse again
      fireEvent.click(screen.getByText('Show less'));
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('does not show expand button for short content', () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.queryByText('Show more')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onMarkAsRead and navigates on click for unread notification', () => {
      const notification = createMockNotification({ read: false });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      // Get the main notification item (has aria-label)
      const item = screen.getByLabelText(/John Doe commented on your post/);
      fireEvent.click(item);

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(1);
      expect(mockPush).toHaveBeenCalledWith('/posts/100');
    });

    it('only navigates on click for read notification', () => {
      const notification = createMockNotification({ read: true });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const item = screen.getByLabelText(/John Doe commented on your post/);
      fireEvent.click(item);

      expect(mockOnMarkAsRead).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/posts/100');
    });

    it('supports keyboard navigation with Enter key', () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const item = screen.getByLabelText(/John Doe commented on your post/);
      fireEvent.keyDown(item, { key: 'Enter' });

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(1);
      expect(mockPush).toHaveBeenCalled();
    });

    it('supports keyboard navigation with Space key', () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const item = screen.getByLabelText(/John Doe commented on your post/);
      fireEvent.keyDown(item, { key: ' ' });

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(1);
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA label', () => {
      const notification = createMockNotification({ read: false });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(
        screen.getByLabelText('John Doe commented on your post. Unread')
      ).toBeInTheDocument();
    });

    it('has correct ARIA label for read notifications', () => {
      const notification = createMockNotification({ read: true });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(
        screen.getByLabelText('John Doe commented on your post. Read')
      ).toBeInTheDocument();
    });

    it('is focusable with tabIndex', () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const item = screen.getByLabelText(/John Doe commented on your post/);
      expect(item).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Notification Types', () => {
    const testCases = [
      { type: 'comment_on_post', expectedAction: 'commented on your post' },
      { type: 'reply_to_comment', expectedAction: 'replied to your comment' },
      { type: 'mention', expectedAction: 'mentioned you' },
      { type: 'reaction_on_post', expectedAction: 'reacted to your post' },
      { type: 'reaction_on_comment', expectedAction: 'reacted to your comment' },
    ] as const;

    testCases.forEach(({ type, expectedAction }) => {
      it(`renders correct message for ${type}`, () => {
        const notification = createMockNotification({
          notification_type: type,
          notifiable: type.includes('reaction')
            ? {
                type: 'Reaction',
                id: 1,
                reaction_type: 'like',
                reactionable_type: 'Post',
                reactionable_id: 100,
                user_id: 2,
              }
            : {
                type: 'Comment',
                id: 1,
                post_id: 100,
                description: 'Test',
                user_id: 2,
              },
        });
        render(
          <NotificationItem
            notification={notification}
            onMarkAsRead={mockOnMarkAsRead}
          />
        );

        expect(screen.getByText(expectedAction)).toBeInTheDocument();
      });
    });
  });
});
