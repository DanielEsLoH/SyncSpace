// client/components/posts/PostListPage.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Post } from "@/types";
import { postsService } from "@/lib/posts";
import { PostCard } from "./PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PostListPageProps {
  searchQuery?: string;
  tagId?: number;
  title: string; // Title for the page, e.g., "Search Results" or "Posts by Tag"
}

export function PostListPage({ searchQuery, tagId, title }: PostListPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

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
          tag_id?: number;
        } = {
          page: pageNum,
          per_page: 10,
        };

        if (searchQuery) {
          params.search = searchQuery;
        }
        if (tagId) {
          params.tag_id = tagId;
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
        console.error("Failed to fetch posts:", err);
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
    setPage(1); // Reset page when search query or tagId changes
    setPosts([]); // Clear posts
    setHasMore(true); // Reset hasMore
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

  // Placeholder for edit/delete actions, as these pages are primarily for viewing
  const handleEdit = (post: Post) => {
    toast.info("Editing posts is not available on this page.");
  };

  const handleDelete = async (postId: number) => {
    toast.info("Deleting posts is not available on this page.");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold mb-6">{title}</h1>

          {isLoading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-destructive text-center">{error}</p>
                <Button onClick={() => fetchPosts(1)} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground text-center">
                  No posts found {searchQuery && `for "${searchQuery}"`}
                  {tagId && `for this tag`}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
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
                    You've reached the end of the posts!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
