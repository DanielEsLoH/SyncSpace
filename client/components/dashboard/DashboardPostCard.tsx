'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post, User, UserBasic } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from '@/lib/utils';
import { cn } from '@/lib/utils';

function isValidImageUrl(url: string): boolean {
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

interface DashboardPostCardProps {
  post: Post;
  author?: User | UserBasic;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  showActions?: boolean;
}

export function DashboardPostCard({
  post,
  author,
  onEdit,
  onDelete,
  showActions = true,
}: DashboardPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const postAuthor = author || post.user;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await onDelete?.(post.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalEngagement = (post.reactions_count || 0) + (post.comments_count || 0);
  const isHighEngagement = totalEngagement > 10;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
      {/* High Engagement Badge */}
      {isHighEngagement && (
        <div className="absolute top-4 right-4 z-10">
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Post Title and Meta */}
          <div className="flex-1 min-w-0 space-y-2">
            <Link
              href={`/posts/${post.id}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <time>{formatDistanceToNow(post.created_at)}</time>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>View post</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(post)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {post.description}
        </p>

        {/* Image */}
        {post.picture && isValidImageUrl(post.picture) && (
          <Link href={`/posts/${post.id}`} className="block">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <Image
                src={post.picture}
                alt={post.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </Link>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge
                  variant="secondary"
                  className="hover:opacity-80 transition-opacity cursor-pointer text-xs"
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
            {post.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/30 pt-4">
        <div className="flex items-center justify-between w-full">
          {/* Engagement Stats */}
          <div className="flex items-center gap-6">
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                post.reactions_count && post.reactions_count > 0
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <Heart
                className={cn(
                  'h-4 w-4',
                  post.reactions_count && post.reactions_count > 0 && 'fill-current'
                )}
              />
              <span>{post.reactions_count || 0}</span>
            </div>
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                post.comments_count && post.comments_count > 0
                  ? 'text-green-600 dark:text-green-400 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count || 0}</span>
            </div>
          </div>

          {/* Total Engagement */}
          <div className="text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal">
              {totalEngagement} total engagement
            </Badge>
          </div>
        </div>
      </CardFooter>

      {/* Animated border on hover */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </Card>
  );
}
