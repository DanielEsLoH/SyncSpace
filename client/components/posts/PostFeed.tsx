'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Post } from '@/types';
import { postsService } from '@/lib/posts';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { wsClient } from '@/lib/websocket';
import { tokenStorage } from '@/lib/auth';

interface PostFeedProps {
  initialPosts: Post[];
  initialPage?: number;
  initialHasMore?: boolean;
  onEdit?: (post: Post) => void;
}

/**
 * Client Component: PostFeed
 *
 * Handles client-side features:
 * - Infinite scroll pagination
 * - Real-time WebSocket updates
 * - New posts banner
 * - Post interactions (edit, delete, react)
 *
 * Receives server-rendered initial data for instant display.
 */
export function PostFeed({
  initialPosts,
  initialPage = 1,
  initialHasMore = true,
  onEdit,
}: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(initialPage);
  const [pendingNewPosts, setPendingNewPosts] = useState<Post[]>([]);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch more posts for infinite scroll
  const fetchMorePosts = useCallback(async (pageNum: number) => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await postsService.getPosts({
        page: pageNum,
        per_page: 10,
      });

      setPosts((prev) => [...prev, ...response.posts]);

      if (response.meta) {
        setHasMore(response.meta.current_page < response.meta.total_pages);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch more posts:', err);
      toast.error('Failed to load more posts');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return;

    // Connect WebSocket
    wsClient.connect(token);

    // Subscribe to posts channel and store listener ID
    const listenerId = wsClient.subscribeToPosts({
      onNewPost: (newPost: Post) => {
        // Check if user is at the top of the page
        const isAtTop = window.scrollY < 100;

        if (isAtTop) {
          // Auto-insert at the top (check for duplicates)
          setPosts((prev) => {
            if (prev.some(p => p.id === newPost.id)) {
              return prev;
            }
            return [newPost, ...prev];
          });
        } else {
          // Show banner notification (check for duplicates)
          setPendingNewPosts((prev) => {
            if (prev.some(p => p.id === newPost.id)) {
              return prev;
            }
            return [newPost, ...prev];
          });
          setShowNewPostsBanner(true);
        }
      },
      onUpdatePost: (updatedPost: Post) => {
        setPosts((prev) =>
          prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
        // Also update pending posts
        setPendingNewPosts((prev) =>
          prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
      },
      onDeletePost: (postId: number) => {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        setPendingNewPosts((prev) => prev.filter((post) => post.id !== postId));
      },
      onReactionUpdate: (data: { post: Post; reaction_action: string }) => {
        // Update full post data (including user_reaction) in real-time
        if (data.post) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === data.post.id ? data.post : post
            )
          );
          // Also update pending posts
          setPendingNewPosts((prev) =>
            prev.map((post) =>
              post.id === data.post.id ? data.post : post
            )
          );
        }
      },
    });

    // Cleanup on unmount - unsubscribe this specific listener
    return () => {
      wsClient.unsubscribeFromPosts(listenerId);
    };
  }, []);

  // Handle showing new posts from banner
  const handleShowNewPosts = () => {
    setPosts((prev) => [...pendingNewPosts, ...prev]);
    setPendingNewPosts([]);
    setShowNewPostsBanner(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Infinite scroll observer
  useEffect(() => {
    if (isLoadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMorePosts(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoadingMore, hasMore, page, fetchMorePosts]);

  // Handle post deletion
  const handleDelete = async (postId: number) => {
    try {
      await postsService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      toast.error(err.response?.data?.error || 'Failed to delete post');
    }
  };

  return (
    <>
      {/* New Posts Banner */}
      {showNewPostsBanner && pendingNewPosts.length > 0 && (
        <div className="sticky top-16 z-40 bg-primary text-primary-foreground shadow-lg mb-6 rounded-lg">
          <div className="container mx-auto px-4 py-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto gap-2"
              onClick={handleShowNewPosts}
            >
              <ArrowUp className="h-4 w-4" />
              {pendingNewPosts.length} new {pendingNewPosts.length === 1 ? 'post' : 'posts'} available
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && (
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
      {posts.length > 0 && (
        <>
          {posts.map((post) => (
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
            {!hasMore && posts.length > 0 && (
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
