// client/components/posts/PostListPage.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Post } from "@/types";
import { postsService } from "@/lib/posts";
import { PostCard } from "./PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  LayoutGrid,
  List,
  Sparkles,
  Hash,
  Search,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostListPageProps {
  searchQuery?: string;
  tagId?: number;
  tagName?: string;
  tagColor?: string;
  title: string;
}

type ViewMode = 'grid' | 'list';

export function PostListPage({ searchQuery, tagId, tagName, tagColor, title }: PostListPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (pageNum === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params: {
          page: number;
          per_page: number;
          search?: string;
          tag_ids?: number[];
        } = {
          page: pageNum,
          per_page: 10,
        };

        if (searchQuery) {
          params.search = searchQuery;
        }
        if (tagId) {
          params.tag_ids = [tagId];
        }

        const response = await postsService.getPosts(params);

        if (append) {
          setPosts((prev) => [...prev, ...response.posts]);
        } else {
          setPosts(response.posts);
        }

        if (response.meta) {
          setHasMore(response.meta.current_page < response.meta.total_pages);
        } else {
          setHasMore(false);
        }
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load posts");
        toast.error("Failed to load posts");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, tagId]
  );

  useEffect(() => {
    setPage(1);
    setPosts([]);
    setHasMore(true);
    fetchPosts(1);
  }, [searchQuery, tagId, fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setPage((prev) => prev + 1);
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
  }, [isLoading, isLoadingMore, hasMore]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, true);
    }
  }, [page, fetchPosts]);

  // Placeholder for edit/delete actions
  const handleEdit = (post: Post) => {
    toast.info("Editing posts is not available on this page.");
  };

  const handleDelete = async (postId: number) => {
    toast.info("Deleting posts is not available on this page.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {tagId ? (
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: tagColor ? `${tagColor}20` : 'hsl(var(--primary) / 0.1)'
                  }}
                >
                  <Hash
                    className="h-6 w-6"
                    style={{ color: tagColor || 'hsl(var(--primary))' }}
                  />
                </div>
              ) : searchQuery ? (
                <div className="p-3 rounded-xl bg-primary/10">
                  <Search className="h-6 w-6 text-primary" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {tagName ? (
                    <>
                      <span className="text-muted-foreground">#</span>
                      {tagName}
                    </>
                  ) : (
                    title
                  )}
                </h1>
                {posts.length > 0 && !isLoading && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
                  </p>
                )}
              </div>
            </div>

            {/* View Controls - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
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
          </div>

          {/* Loading State */}
          {isLoading && posts.length === 0 ? (
            <div
              className={cn(
                viewMode === 'grid'
                  ? "grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2"
                  : "flex flex-col gap-6"
              )}
            >
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'both' }}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <Card className="border-destructive/50">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <RefreshCw className="h-8 w-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Failed to load posts</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
                </div>
                <Button onClick={() => fetchPosts(1)} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-4 animate-in fade-in-50 duration-500">
              <div className="relative">
                <div
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5"
                  style={tagColor ? {
                    background: `linear-gradient(to bottom right, ${tagColor}20, ${tagColor}10)`
                  } : undefined}
                >
                  {tagId ? (
                    <Hash
                      className="h-12 w-12"
                      style={{ color: tagColor ? `${tagColor}80` : 'hsl(var(--primary) / 0.5)' }}
                    />
                  ) : searchQuery ? (
                    <Search className="h-12 w-12 text-primary/50" />
                  ) : (
                    <FileText className="h-12 w-12 text-primary/50" />
                  )}
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>

              <div className="mt-6 text-center space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">
                  {searchQuery
                    ? 'No results found'
                    : tagId
                      ? 'No posts with this tag yet'
                      : 'No posts found'
                  }
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery
                    ? `No posts match "${searchQuery}". Try a different search term.`
                    : tagId
                      ? 'Be the first to create a post with this tag!'
                      : 'No posts are available at the moment.'
                  }
                </p>
              </div>
            </div>
          ) : (
            /* Posts Grid/List */
            <>
              <div
                className={cn(
                  viewMode === 'grid'
                    ? "grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2"
                    : "flex flex-col gap-6"
                )}
              >
                {posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={handleEdit}
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
                {!hasMore && posts.length > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      You've reached the end of the posts
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
