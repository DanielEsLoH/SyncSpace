
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { postsService } from '@/lib/posts';
import { tagsService } from '@/lib/tags';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/posts');
jest.mock('@/lib/tags');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedPostsService = postsService as jest.Mocked<typeof postsService>;
const mockedTagsService = tagsService as jest.Mocked<typeof tagsService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('CreatePostDialog', () => {
  const onOpenChange = jest.fn();
  const onPostCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <CreatePostDialog
        open={true}
        onOpenChange={onOpenChange}
        onPostCreated={onPostCreated}
      />
    );
  };

  it('should render the dialog with form fields', () => {
    renderComponent();
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
  });

  it('should show validation error if title is empty', async () => {
    renderComponent();
    await userEvent.click(screen.getByText('Create Post'));
    expect(mockedToast.error).toHaveBeenCalledWith('Please enter a title');
  });

  it('should show validation error if description is too short', async () => {
    renderComponent();
    await userEvent.type(screen.getByLabelText(/title/i), 'Test Title');
    await userEvent.type(screen.getByLabelText(/description/i), 'short');
    await userEvent.click(screen.getByText('Create Post'));
    expect(mockedToast.error).toHaveBeenCalledWith('Description must be at least 10 characters long');
  });

  it('should submit the form successfully', async () => {
    mockedPostsService.createPost.mockResolvedValue({ id: 1, title: 'New Post', description: 'New Desc', author: {id: 1, name: 'author'}, created_at: 'now', _count: {likes: 0, comments: 0} });
    renderComponent();

    await userEvent.type(screen.getByLabelText(/title/i), 'This is a great post title');
    await userEvent.type(screen.getByLabelText(/description/i), 'This is a detailed and interesting post description.');
    await userEvent.click(screen.getByText('Create Post'));

    await waitFor(() => {
      expect(mockedPostsService.createPost).toHaveBeenCalledWith({
        title: 'This is a great post title',
        description: 'This is a detailed and interesting post description.',
        picture: undefined,
        tags: [],
      });
    });

    expect(mockedToast.success).toHaveBeenCalledWith('Post created successfully!');
    expect(onPostCreated).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should handle API error on submission', async () => {
    mockedPostsService.createPost.mockRejectedValue({ response: { data: { error: 'Server error' } } });
    renderComponent();

    await userEvent.type(screen.getByLabelText(/title/i), 'Error case title');
    await userEvent.type(screen.getByLabelText(/description/i), 'Error case description that is long enough');
    await userEvent.click(screen.getByText('Create Post'));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Server error');
    });
  });
});
