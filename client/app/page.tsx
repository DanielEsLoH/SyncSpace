'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { postsService } from '@/lib/posts';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  LogIn,
  UserPlus,
  Sparkles,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

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

  // Redirect authenticated users to feed
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch popular posts for unauthenticated users
  useEffect(() => {
    if (authLoading || isAuthenticated) return;

    const fetchPopularPosts = async () => {
      try {
        setIsLoading(true);
        const response = await postsService.getPopularPosts({
          page: 1,
          per_page: 10,
        });
        setPosts(response.data || []);
        if (response.meta) {
          setHasMore(response.meta.current_page < response.meta.total_pages);
        } else {
          setHasMore(false);
        }
      } catch (err: any) {
        setError('Failed to load posts');
        console.error('Error fetching popular posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularPosts();
  }, [authLoading, isAuthenticated]);

  // Load more posts on page change
  useEffect(() => {
    if (page <= 1 || authLoading || isAuthenticated) return;

    const fetchMorePosts = async () => {
      setIsLoadingMore(true);
      try {
        const response = await postsService.getPopularPosts({
          page,
          per_page: 10,
        });

        setPosts(prev => [...prev, ...(response.data || [])]);

        if (response.meta) {
          setHasMore(response.meta.current_page < response.meta.total_pages);
        } else {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error('Error loading more posts:', err);
      } finally {
        setIsLoadingMore(false);
      }
    };

    fetchMorePosts();
  }, [page, authLoading, isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Return null while redirecting authenticated users
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                SyncSpace
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Share ideas, discuss topics, and react in real-time with a modern community platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2 px-8 h-12 text-base">
                <Link href="/register">
                  <UserPlus className="h-5 w-5" />
                  Get Started
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 px-8 h-12 text-base">
                <Link href="/login">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Trending Posts</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Community</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Real-time Chat</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Posts Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Popular Posts</h2>
                <p className="text-sm text-muted-foreground">
                  Discover what's trending in the community
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="hidden sm:flex">
              <Link href="/register">
                Join to interact
              </Link>
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading popular posts...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Posts Grid */}
          {!isLoading && !error && posts.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                {posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    variant={index === 0 ? 'featured' : 'default'}
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
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You've seen all popular posts
                    </p>
                    <Button asChild>
                      <Link href="/register">
                        Sign up to see more
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && posts.length === 0 && (
            <div className="text-center py-20">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share something with the community!
              </p>
              <Button asChild>
                <Link href="/register">
                  Create an account
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-bold">Ready to join the conversation?</h3>
            <p className="text-muted-foreground">
              Create an account to post, comment, and react to content.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/register">
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/login">
                  Already have an account? Sign in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
