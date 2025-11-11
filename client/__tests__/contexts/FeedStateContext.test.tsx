
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { FeedStateProvider, useFeedState } from '@/contexts/FeedStateContext';
import { Post } from '@/types';

const mockPost1: Post = { id: 1, title: 'Post 1', description: 'Desc 1', author: { id: 1, name: 'User 1' }, created_at: 'now', _count: { likes: 0, comments: 0 } };
const mockPost2: Post = { id: 2, title: 'Post 2', description: 'Desc 2', author: { id: 2, name: 'User 2' }, created_at: 'now', _count: { likes: 0, comments: 0 } };

// A test component to consume the context
const FeedStateConsumer = () => {
  const { posts, addPost, updatePost, deletePost } = useFeedState();
  return (
    <div>
      <div data-testid="posts-count">{posts.length}</div>
      {posts.map(p => <div key={p.id} data-testid={`post-title-${p.id}`}>{p.title}</div>)}
      <button onClick={() => addPost(mockPost2)}>Add Post</button>
      <button onClick={() => updatePost({ ...mockPost1, title: 'Updated Post 1' })}>Update Post</button>
      <button onClick={() => deletePost(1)}>Delete Post</button>
    </div>
  );
};

describe('FeedStateProvider', () => {
  it('should initialize with initialPosts', () => {
    render(
      <FeedStateProvider initialPosts={[mockPost1]}>
        <FeedStateConsumer />
      </FeedStateProvider>
    );
    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
    expect(screen.getByTestId('post-title-1')).toHaveTextContent('Post 1');
  });

  it('should add a post', () => {
    render(
      <FeedStateProvider initialPosts={[mockPost1]}>
        <FeedStateConsumer />
      </FeedStateProvider>
    );
    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');

    act(() => {
      screen.getByText('Add Post').click();
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('2');
    expect(screen.getByTestId('post-title-2')).toHaveTextContent('Post 2');
  });

  it('should update a post', () => {
    render(
      <FeedStateProvider initialPosts={[mockPost1]}>
        <FeedStateConsumer />
      </FeedStateProvider>
    );
    expect(screen.getByTestId('post-title-1')).toHaveTextContent('Post 1');

    act(() => {
      screen.getByText('Update Post').click();
    });

    expect(screen.getByTestId('post-title-1')).toHaveTextContent('Updated Post 1');
  });

  it('should delete a post', () => {
    render(
      <FeedStateProvider initialPosts={[mockPost1]}>
        <FeedStateConsumer />
      </FeedStateProvider>
    );
    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');

    act(() => {
      screen.getByText('Delete Post').click();
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('0');
  });

  it('should handle new post websocket event', () => {
    render(
      <FeedStateProvider initialPosts={[]}>
        <FeedStateConsumer />
      </FeedStateProvider>
    );
    expect(screen.getByTestId('posts-count')).toHaveTextContent('0');

    act(() => {
      const event = new CustomEvent('ws:post:new', { detail: { post: mockPost1 } });
      window.dispatchEvent(event);
    });

    expect(screen.getByTestId('posts-count')).toHaveTextContent('1');
  });
});
