import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import { DeletePostButton } from './DeletePostButton';

/**
 * PostContent - Server Component
 *
 * Displays static post information without client-side interactivity.
 * This component can be fully rendered on the server for optimal performance.
 *
 * BENEFITS:
 * - Zero JavaScript shipped for static content
 * - SEO-friendly with proper semantic HTML
 * - Fast initial render
 * - No hydration overhead
 *
 * INTERACTIVE PARTS (delegated to Client Components):
 * - Edit/delete actions -> DeletePostButton
 * - Reactions -> PostReactions
 */

interface PostContentProps {
  post: Post;
  isOwner: boolean;
}

/**
 * Helper function to validate if a string is a valid image URL
 */
function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('#<') || url.includes('ActionDispatch')) return false;

  try {
    if (url.startsWith('/')) return true;
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get user initials for avatar fallback
 */
function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function PostContent({ post, isOwner }: PostContentProps) {
  // Defensive check: Ensure user data exists and extract for type safety
  const user = post.user;
  const hasUserData = user && user.id && user.name;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* User Info with defensive checks */}
          {hasUserData && user ? (
            <Link
              href={`/users/${user.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={user.profile_picture}
                  alt={user.name}
                />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-base">{user.name}</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={post.created_at}>
                    {formatDistanceToNow(post.created_at)}
                  </time>
                </div>
              </div>
            </Link>
          ) : (
            // Fallback UI when user data is missing
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>??</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-base text-muted-foreground">
                  Unknown User
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={post.created_at}>
                    {formatDistanceToNow(post.created_at)}
                  </time>
                </div>
              </div>
            </div>
          )}

          {/* Actions Menu (Client Component for Interactivity) */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Post options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="flex items-center cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </Link>
                </DropdownMenuItem>
                <DeletePostButton postId={post.id} />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Title */}
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          {post.title}
        </h1>

        {/* Post Description */}
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {post.description}
          </p>
        </div>

        {/* Post Image */}
        {isValidImageUrl(post.picture) && (
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-muted">
            {post.picture.includes('localhost') ? (
              // Use regular img for localhost to bypass Next.js private IP restrictions
              <img
                src={post.picture}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={post.picture}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.id}`}
                aria-label={`View posts tagged with ${tag.name}`}
              >
                <Badge
                  variant="secondary"
                  className="hover:opacity-80 transition-opacity cursor-pointer text-sm"
                  style={
                    tag.color
                      ? {
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color,
                        }
                      : undefined
                  }
                >
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Post Metadata */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{post.reactions_count}</span>
            <span>reactions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{post.comments_count}</span>
            <span>comments</span>
          </div>
          {post.updated_at !== post.created_at && (
            <div className="flex items-center gap-1.5">
              <span>Edited</span>
              <time dateTime={post.updated_at}>
                {formatDistanceToNow(post.updated_at)}
              </time>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
