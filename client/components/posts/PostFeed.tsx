'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Post } from '@/types';
import { postsService } from '@/lib/posts';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  LayoutGrid,
  List,
  Sparkles,
  FileText,
  ArrowUp,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

type ViewMode = 'grid' | 'list';

/**
 * PostFeed Component - Agency-Quality Redesign
 *
 * Premium feed layout with:
 * - Grid/List view toggle
 * - Masonry-style grid for desktop
 * - Featured first post treatment
 * - Smooth infinite scroll
 * - Empty state with personality
 * - Search and filter bar
 */
export function PostFeed({
  posts,
  addPost,
  addPosts,
  deletePost,
  initialPage = 1,
  initialHasMore = true,
  onEdit,
}: PostFeedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(initialPage);

  // New posts banner state
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [isAtTop, setIsAtTop] = useState(true);
  const feedTopRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll observer
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

  // Fetch more posts on page change
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
      } finally {
        setIsLoadingMore(false);
      }
    };

    fetchMorePosts();
  }, [page, initialPage, addPosts]);

  // Track scroll position to determine if user is at top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const threshold = 100; // Consider "at top" if within 100px of top
      setIsAtTop(scrollTop <= threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Listen for new posts from WebSocket
  useEffect(() => {
    const handleNewPost = (event: CustomEvent<{ post: Post }>) => {
      const newPost = event.detail.post;

      // Check if post already exists to avoid duplicates
      const postExists = posts.some(p => p.id === newPost.id) ||
                         pendingPosts.some(p => p.id === newPost.id);

      if (postExists) return;

      if (isAtTop) {
        // User is at top, insert immediately
        addPost(newPost);
      } else {
        // User is scrolled down, add to pending queue
        setPendingPosts(prev => [newPost, ...prev]);
      }
    };

    window.addEventListener('ws:post:new' as any, handleNewPost);

    return () => {
      window.removeEventListener('ws:post:new' as any, handleNewPost);
    };
  }, [isAtTop, posts, pendingPosts, addPost]);

  // Load pending posts when user clicks the banner
  const loadPendingPosts = useCallback(() => {
    if (pendingPosts.length === 0) return;

    // Add all pending posts to the feed
    pendingPosts.forEach(post => addPost(post));
    setPendingPosts([]);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pendingPosts, addPost]);

  // Deduplicate posts
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
    <div className="space-y-6">
      {/* New Posts Available Banner */}
      {pendingPosts.length > 0 && (
        <div className="sticky top-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <Button
            onClick={loadPendingPosts}
            className={cn(
              "w-full gap-2 shadow-lg",
              "bg-primary hover:bg-primary/90",
              "border border-primary-foreground/10"
            )}
            size="lg"
          >
            <Bell className="h-4 w-4 animate-bounce" />
            <span className="font-semibold">
              {pendingPosts.length} new {pendingPosts.length === 1 ? 'post' : 'posts'} available
            </span>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Feed Top Reference */}
      <div ref={feedTopRef} />

      {/* View Controls - Hidden on mobile since grid/list look the same */}
      <div className="hidden md:flex items-center justify-end">
        <div className="flex items-center rounded-lg border bg-muted/30 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn(
              "h-8 px-3 rounded-md transition-all",
              viewMode === 'grid'
                ? "bg-background shadow-sm"
                : "hover:bg-transparent"
            )}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              "h-8 px-3 rounded-md transition-all",
              viewMode === 'list'
                ? "bg-background shadow-sm"
                : "hover:bg-transparent"
            )}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {uniquePosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 animate-in fade-in-50 duration-500">
          <div className="relative">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
              <FileText className="h-12 w-12 text-primary/50" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              No posts yet
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Be the first to create a post! Use the "New Post" button to get started.
            </p>
          </div>
        </div>
      )}

      {/* Posts Grid/List */}
      {uniquePosts.length > 0 && (
        <>
          <div
            className={cn(
              viewMode === 'grid'
                ? "grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2"
                : "flex flex-col gap-6"
            )}
          >
            {uniquePosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={onEdit}
                onDelete={handleDelete}
                variant={viewMode === 'grid' && index === 0 ? 'featured' : 'default'}
                index={index}
              />
            ))}
          </div>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-8">
            {isLoadingMore && (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading more posts...</p>
              </div>
            )}
            {!hasMore && uniquePosts.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  You've reached the end of the feed
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
