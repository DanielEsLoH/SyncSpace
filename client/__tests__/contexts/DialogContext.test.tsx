
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { DialogProvider, useDialogContext } from '@/contexts/DialogContext';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { Post } from '@/types';

// Mock the CreatePostDialog component
jest.mock('@/components/posts/CreatePostDialog', () => ({
  CreatePostDialog: jest.fn(({ open, onOpenChange, onPostCreated }) => (
    <div data-testid="create-post-dialog">
      <div data-testid="dialog-open-state">{open.toString()}</div>
      <button onClick={() => onOpenChange(false)}>Close</button>
      <button onClick={() => onPostCreated({ id: 1, title: 'New Post', description: 'New Desc', author: {id: 1, name: 'author'}, created_at: 'now', _count: {likes: 0, comments: 0} })}>Create Post</button>
    </div>
  )),
}));

const mockedCreatePostDialog = CreatePostDialog as jest.Mock;

// A test component to consume the context
const DialogConsumer = () => {
  const { openCreatePostDialog } = useDialogContext();
  return (
    <div>
      <button onClick={openCreatePostDialog}>Open Dialog</button>
    </div>
  );
};

describe('DialogProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children and the dialog (initially closed)', () => {
    render(
      <DialogProvider>
        <div>Child Content</div>
      </DialogProvider>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.getByTestId('create-post-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('false');
  });

  it('should open the dialog when openCreatePostDialog is called', () => {
    render(
      <DialogProvider>
        <DialogConsumer />
      </DialogProvider>
    );

    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('false');

    act(() => {
      screen.getByText('Open Dialog').click();
    });

    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('true');
  });

  it('should close the dialog when onOpenChange is called with false', () => {
    render(
      <DialogProvider>
        <DialogConsumer />
      </DialogProvider>
    );

    // Open the dialog first
    act(() => {
      screen.getByText('Open Dialog').click();
    });
    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('true');

    // Simulate closing from the dialog
    act(() => {
      screen.getByText('Close').click();
    });
    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('false');
  });

  it('should close the dialog and dispatch event when a post is created', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    render(
      <DialogProvider>
        <DialogConsumer />
      </DialogProvider>
    );

    // Open the dialog
    act(() => {
      screen.getByText('Open Dialog').click();
    });
    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('true');

    // Simulate post creation
    act(() => {
      screen.getByText('Create Post').click();
    });

    // Dialog should close
    expect(screen.getByTestId('dialog-open-state')).toHaveTextContent('false');

    // Event should be dispatched
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('post-created-optimistic');
    expect(event.detail.post.id).toBe(1);
    expect(event.detail.source).toBe('navigation');
  });
});
