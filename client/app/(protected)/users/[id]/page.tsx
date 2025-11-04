// client/app/users/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { User, Post } from '@/types';
import { usersService } from '@/lib/users';
import { postsService } from '@/lib/posts';
import { PostCard } from '@/components/posts/PostCard';
import { EditPostDialog } from '@/components/posts/EditPostDialog';
import { wsClient } from '@/lib/websocket';
import { tokenStorage } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  TrendingUp,
  MessageCircle,
  Heart,
  FileText,
  Calendar,
  BarChart3,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfilePage() {
  const { id } = useParams();
  const userId = parseInt(id as string);
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'commented'>('recent');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fetch user details
  const fetchUser = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const userData = await usersService.getUser(userId);
      setProfileUser(userData);
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      setError(err.response?.data?.error || 'Failed to load user profile');
      toast.error('Failed to load user profile');
    } finally {
      setIsLoadingUser(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  // Fetch user's posts
  const fetchUserPosts = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (pageNum === 1) {
          setIsLoadingPosts(true);
        } else {
          setIsLoadingMorePosts(true);
        }

        const response = await usersService.getUserPosts(userId, {
          page: pageNum,
          per_page: 10,
        });

        if (append) {
          setPosts((prev) => [...prev, ...response.posts]);
        } else {
          setPosts(response.posts);
        }

        if (response.meta) {
          setHasMorePosts(response.meta.current_page < response.meta.total_pages);
        } else {
          setHasMorePosts(false);
        }
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch user posts:', err);
        setError(err.response?.data?.error || 'Failed to load user posts');
        toast.error('Failed to load user posts');
      } finally {
        setIsLoadingPosts(false);
        setIsLoadingMorePosts(false);
      }
    },
    [userId]
  );

  // Load initial posts
  useEffect(() => {
    if (userId) {
      fetchUserPosts(1);
    }
  }, [userId, fetchUserPosts]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) return;

    // Connect WebSocket
    wsClient.connect(token);

    // Subscribe to posts channel for real-time updates
    wsClient.subscribeToPosts({
      onNewPost: (newPost: Post) => {
        // Add new post if it belongs to this user
        if (newPost.user?.id === userId) {
          setPosts((prev) => {
            // Check if post already exists to prevent duplicates
            if (prev.some(p => p.id === newPost.id)) {
              return prev;
            }
            return [newPost, ...prev];
          });
        }
      },
      onUpdatePost: (updatedPost: Post) => {
        // Update post if it's in the list
        setPosts((prev) =>
          prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
      },
      onDeletePost: (postId: number) => {
        // Remove deleted post
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      },
      onReactionUpdate: (data: { post: Post; reaction_action: string }) => {
        // Update full post data (including user_reaction) in real-time
        if (data.post) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === data.post.id ? data.post : post
            )
          );
        }
      },
    });

    // Cleanup
    return () => {
      wsClient.unsubscribe('posts');
    };
  }, [userId]);

  // Infinite scroll observer for posts
  useEffect(() => {
    if (isLoadingPosts || isLoadingMorePosts || !hasMorePosts) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !isLoadingMorePosts) {
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
  }, [isLoadingPosts, isLoadingMorePosts, hasMorePosts]);

  // Load more posts when page changes
  useEffect(() => {
    if (page > 1) {
      fetchUserPosts(page, true);
    }
  }, [page, fetchUserPosts]);


  // Handle post deletion
  const handleDelete = async (postId: number) => {
    if (currentUser?.id !== userId) return;
    try {
      await postsService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post deleted successfully');
      // Refresh user data to update stats
      fetchUser();
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      toast.error(err.response?.data?.error || 'Failed to delete post');
    }
  };

  // Handle post edit
  const handleEdit = (post: Post) => {
    if (currentUser?.id !== userId) return;
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  // Handle post updated from dialog
  const handlePostUpdated = (updatedPost: Post) => {
    setIsEditDialogOpen(false);
    setEditingPost(null);
    // Update the post in the list
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
    toast.success('Post updated successfully!');
  };

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.reactions_count || 0) - (a.reactions_count || 0);
      case 'commented':
        return (b.comments_count || 0) - (a.comments_count || 0);
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Calculate statistics
  const stats = (profileUser as any)?.stats || {
    total_posts: posts.length,
    total_reactions: posts.reduce((sum, post) => sum + (post.reactions_count || 0), 0),
    total_comments: posts.reduce((sum, post) => sum + (post.comments_count || 0), 0),
  };

  const avgEngagement =
    stats.total_posts > 0
      ? Math.round((stats.total_reactions + stats.total_comments) / stats.total_posts)
      : 0;

  const mostPopularPost = posts.length > 0
    ? posts.reduce((prev, current) =>
        (current.reactions_count || 0) > (prev.reactions_count || 0) ? current : prev
      )
    : null;

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-destructive text-center">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                fetchUser();
                fetchUserPosts(1);
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const isMyProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profileUser.profile_picture} alt={profileUser.name} />
                  <AvatarFallback className="text-4xl">
                    {getInitials(profileUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                    {isMyProfile && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{profileUser.email}</p>
                  {profileUser.bio && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                      {profileUser.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {formatDistanceToNow(new Date(profileUser.created_at))} ago
                    </span>
                  </div>
                </div>
                {isMyProfile && (
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Posts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_posts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isMyProfile ? 'Posts you\'ve published' : 'Posts published'}
                </p>
              </CardContent>
            </Card>

            {/* Total Reactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_reactions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all posts
                </p>
              </CardContent>
            </Card>

            {/* Total Comments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_comments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comments received
                </p>
              </CardContent>
            </Card>

            {/* Avg Engagement */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgEngagement}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per post
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Most Popular Post Highlight */}
          {mostPopularPost && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Most Popular Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{mostPopularPost.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {mostPopularPost.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        {mostPopularPost.reactions_count}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        {mostPopularPost.comments_count}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/posts/${mostPopularPost.id}`}>View Post</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Section with Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {isMyProfile ? 'My Posts' : `${profileUser.name}'s Posts`}
                </CardTitle>
                <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <TabsList>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                    <TabsTrigger value="popular">Popular</TabsTrigger>
                    <TabsTrigger value="commented">Most Commented</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPosts && posts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sortedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="rounded-full bg-muted p-6">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">No posts yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {isMyProfile
                        ? "You haven't created any posts yet. Start sharing your thoughts!"
                        : "This user hasn't created any posts yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      author={profileUser}
                      onEdit={isMyProfile ? handleEdit : undefined}
                      onDelete={isMyProfile ? handleDelete : undefined}
                    />
                  ))}
                  {/* Load More Trigger */}
                  <div ref={loadMoreRef} className="py-4">
                    {isLoadingMorePosts && (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!hasMorePosts && posts.length > 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        You've reached the end!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Post Dialog */}
      <EditPostDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
}
