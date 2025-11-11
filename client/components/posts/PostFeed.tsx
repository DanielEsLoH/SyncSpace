'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Post } from '@/types';
import { postsService } from '@/lib/posts';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowUp, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface PostFeedProps {
  posts: Post[];
  addPost: (post: Post) => void;
  addPosts: (posts: Post[]) => void;
  updatePost: (post: Post) => void;
  deletePost: (postId: number) => void;
  initialPage?: number;
  initialHasMore?: boolean;
  onEdit?: (post: Post) => void;
}

export function PostFeed({
  posts,
  addPost,
  addPosts,
  updatePost,
  deletePost,
  initialPage = 1,
  initialHasMore = true,
  onEdit,
}: PostFeedProps) {

  // Handle optimistic post creation (for the author)
  const handleOptimisticCreate = useCallback((newPost: Post) => {
    addPost(newPost);
    // Scroll to top to show the new post
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [addPost]);

  // Handle optimistic post updates (for the author)
  const handleOptimisticUpdate = useCallback((updatedPost: Post) => {
    updatePost(updatedPost);
  }, [updatePost]);

  // Handle post deletion
  const handleDelete = async (postId: number) => {
    try {
      await postsService.deletePost(postId);
      deletePost(postId);
      toast.success('Post deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete post');
    }
  };

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(initialPage);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    if (page <= initialPage) return;

    const fetchMorePosts = async () => {
      setIsLoadingMore(true);
      try {
        const response = await postsService.getPosts({
          page: page,
          per_page: 10,
        });

        addPosts(response.posts);

        if (response.meta) {
          setHasMore(response.meta.current_page < response.meta.total_pages);
        } else {
          setHasMore(false);
        }
      } catch (err: any) {
        toast.error('Failed to load more posts');
      }
      finally {
        setIsLoadingMore(false);
      }
    };

    fetchMorePosts();
  }, [page, initialPage, addPosts]);

  const uniquePosts = useMemo(() => {
    const postMap = new Map();
    posts.forEach(post => {
      if (post && post.id != null) {
        postMap.set(post.id, post);
      }
    });
    return Array.from(postMap.values());
  }, [posts]);

  return (
    <>
      {/* Empty State */}
      {uniquePosts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-muted-foreground text-center">
              No posts yet. Be the first to create one!
            </p>
            <p className="text-sm text-muted-foreground">
              Use the "New Post" button in the navigation to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {uniquePosts.length > 0 && (
        <>
          {uniquePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-4">
            {isLoadingMore && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!hasMore && uniquePosts.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                You've reached the end!
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
