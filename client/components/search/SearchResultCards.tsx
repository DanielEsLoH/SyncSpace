/**
 * Individual result card components for search results
 * Displays posts, users, and tags with highlighting
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Hash,
  User as UserIcon,
  FileText,
  Calendar,
} from 'lucide-react';
import { PostSearchResult, UserSearchResult, TagSearchResult } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PostResultCardProps {
  post: PostSearchResult;
  searchTerm?: string;
}

export function PostResultCard({ post, searchTerm }: PostResultCardProps) {
  // Defensive check for user data - extract user for type safety
  const user = post.user;
  const hasUserData = user && user.name;
  const userName = hasUserData ? user.name : 'Unknown User';
  const userInitials = hasUserData && user
    ? user.name.substring(0, 2).toUpperCase()
    : '??';

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Post Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={user?.profile_picture}
                    alt={userName}
                  />
                  <AvatarFallback>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {post.description}
              </p>
            </div>

            {/* Post Image */}
            {post.picture && (
              <div className="relative w-full h-48 rounded-md overflow-hidden bg-muted">
                <img
                  src={post.picture}
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Post Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.reactions_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface UserResultCardProps {
  user: UserSearchResult;
  searchTerm?: string;
}

export function UserResultCard({ user, searchTerm }: UserResultCardProps) {
  return (
    <Link href={`/users/${user.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={user.profile_picture} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {user.name}
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {user.posts_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{user.posts_count} posts</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface TagResultCardProps {
  tag: TagSearchResult;
  searchTerm?: string;
}

export function TagResultCard({ tag, searchTerm }: TagResultCardProps) {
  return (
    <Link href={`/tags/${tag.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${tag.color}20` }}
            >
              <Hash className="h-6 w-6" style={{ color: tag.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg" style={{ color: tag.color }}>
                #{tag.name}
              </h3>
              {tag.posts_count !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {tag.posts_count} {tag.posts_count === 1 ? 'post' : 'posts'}
                </p>
              )}
            </div>

            <Badge variant="secondary" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
              Tag
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Wrapper component for rendering different result types
 */
interface SearchResultCardProps {
  result: PostSearchResult | UserSearchResult | TagSearchResult;
  type: 'post' | 'user' | 'tag';
  searchTerm?: string;
}

export function SearchResultCard({ result, type, searchTerm }: SearchResultCardProps) {
  switch (type) {
    case 'post':
      return <PostResultCard post={result as PostSearchResult} searchTerm={searchTerm} />;
    case 'user':
      return <UserResultCard user={result as UserSearchResult} searchTerm={searchTerm} />;
    case 'tag':
      return <TagResultCard tag={result as TagSearchResult} searchTerm={searchTerm} />;
    default:
      return null;
  }
}
