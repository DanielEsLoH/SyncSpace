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
