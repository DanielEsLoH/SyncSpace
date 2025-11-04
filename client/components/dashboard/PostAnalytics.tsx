'use client';

import { Post } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostAnalyticsProps {
  posts: Post[];
  isLoading?: boolean;
}

export function PostAnalytics({ posts, isLoading }: PostAnalyticsProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  // Calculate analytics
  const totalEngagement = posts.reduce(
    (sum, post) => sum + (post.reactions_count || 0) + (post.comments_count || 0),
    0
  );

  const averageEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;

  const mostPopularPost = posts.reduce((prev, current) => {
    const prevScore = (prev.reactions_count || 0) + (prev.comments_count || 0);
    const currentScore = (current.reactions_count || 0) + (current.comments_count || 0);
    return currentScore > prevScore ? current : prev;
  }, posts[0]);

  const mostReactedPost = posts.reduce((prev, current) =>
    (current.reactions_count || 0) > (prev.reactions_count || 0) ? current : prev
  , posts[0]);

  const mostCommentedPost = posts.reduce((prev, current) =>
    (current.comments_count || 0) > (prev.comments_count || 0) ? current : prev
  , posts[0]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Average Engagement */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Average Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {averageEngagement.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              per post
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Across {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </CardContent>
      </Card>

      {/* Most Popular Post */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Most Popular Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium line-clamp-2 text-sm">
            {mostPopularPost.title}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 fill-current text-red-500" />
              <span>{mostPopularPost.reactions_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{mostPopularPost.comments_count || 0}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {(mostPopularPost.reactions_count || 0) + (mostPopularPost.comments_count || 0)}{' '}
              total
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Most Reacted */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
            Most Reactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium line-clamp-2 text-sm">
            {mostReactedPost.title}
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              )}
            >
              {mostReactedPost.reactions_count || 0} reactions
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Most Commented */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            Most Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium line-clamp-2 text-sm">
            {mostCommentedPost.title}
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              )}
            >
              {mostCommentedPost.comments_count || 0} comments
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
