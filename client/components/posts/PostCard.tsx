"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  MoreVertical,
  Edit,
  Trash2,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, getInitials, cn } from "@/lib/utils";
import { CommentList } from "@/components/comments/CommentList";
import { PostReactions } from "@/components/posts/PostReactions";

import { User, UserBasic } from "@/types";

/**
 * Helper function to validate if a string is a valid image URL
 */
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

interface PostCardProps {
  post: Post;
  author?: User | UserBasic;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  variant?: 'default' | 'compact' | 'featured';
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (postId: number, selected: boolean) => void;
  index?: number;
}

/**
 * PostCard Component - Agency-Quality Redesign
 *
 * Premium post card with:
 * - Minimal luxury aesthetic with generous whitespace
 * - Bold typography contrasts
 * - Layered elevations with soft shadows
 * - Smooth micro-interactions (hover lift, scale)
 * - Three variants: default, compact, featured
 * - Optional selection mode for bulk actions
 */
export function PostCard({
  post,
  author,
  onEdit,
  onDelete,
  variant = 'default',
  selectable = false,
  selected = false,
  onSelect,
  index = 0,
}: PostCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const postAuthor = author || post.user;
  const isOwner = user?.id === postAuthor?.id;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await onDelete?.(post.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const handleSelect = () => {
    onSelect?.(post.id, !selected);
  };

  // Loading state
  if (!postAuthor) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-24 rounded bg-muted"></div>
              <div className="h-3 w-16 rounded bg-muted"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-6 w-3/4 rounded bg-muted"></div>
          <div className="h-4 w-full rounded bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  const isLongDescription = post.description && post.description.length > 200;
  const hasImage = post.picture && isValidImageUrl(post.picture);

  return (
    <Card
      className={cn(
        "group relative w-full overflow-hidden",
        "transition-all duration-300 ease-out",
        "border border-border/50",
        // Hover effects
        "hover:shadow-xl hover:shadow-black/5",
        "hover:-translate-y-1",
        isHovered && "border-border",
        // Selected state
        selected && "ring-2 ring-primary ring-offset-2",
        // Staggered animation
        "animate-in fade-in-0 slide-in-from-bottom-4",
        // Variant styles
        variant === 'featured' && "md:col-span-2 lg:col-span-2",
        variant === 'compact' && "shadow-sm"
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection checkbox overlay */}
      {selectable && (
        <div
          className={cn(
            "absolute top-4 left-4 z-10 transition-opacity duration-200",
            isHovered || selected ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={handleSelect}
            className={cn(
              "h-5 w-5 rounded border-2 flex items-center justify-center",
              "bg-background/90 backdrop-blur-sm transition-colors",
              selected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/50 hover:border-primary"
            )}
            aria-label={`Select post: ${post.title}`}
            aria-pressed={selected}
          >
            {selected && (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* User Info */}
          <Link
            href={`/users/${postAuthor.id}`}
            className="flex items-center gap-3 group/author"
          >
            <Avatar className={cn(
              "ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
              isHovered ? "ring-primary/30" : "ring-transparent",
              variant === 'featured' ? "h-12 w-12" : "h-10 w-10"
            )}>
              <AvatarImage
                src={postAuthor.profile_picture}
                alt={postAuthor.name}
              />
              <AvatarFallback className="font-medium bg-primary/10 text-primary">
                {getInitials(postAuthor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className={cn(
                "font-semibold tracking-tight group-hover/author:text-primary transition-colors",
                variant === 'featured' ? "text-base" : "text-sm"
              )}>
                {postAuthor.name}
              </span>
              <span className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(post.created_at)}
              </span>
            </div>
          </Link>

          {/* Actions Menu */}
          <div className="flex items-center gap-1">
            {/* Quick actions on hover */}
            <div className={cn(
              "flex items-center gap-1 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Save post"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Share post"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Post options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit?.(post)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Title */}
        <Link
          href={`/posts/${post.id}`}
          className="block group/title"
        >
          <h3 className={cn(
            "font-bold tracking-tight leading-tight line-clamp-2",
            "group-hover/title:text-primary transition-colors duration-200",
            variant === 'featured' ? "text-2xl md:text-3xl" : "text-xl"
          )}>
            {post.title}
          </h3>
        </Link>

        {/* Post Description */}
        <div className="relative">
          <p className={cn(
            "text-muted-foreground leading-relaxed",
            !isDescriptionExpanded && isLongDescription && "line-clamp-3",
            variant === 'compact' && "text-sm"
          )}>
            {post.description}
          </p>
          {isLongDescription && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              aria-expanded={isDescriptionExpanded}
              aria-label={isDescriptionExpanded ? "Show less of post description" : "Show more of post description"}
            >
              {isDescriptionExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Read more
                </>
              )}
            </button>
          )}
        </div>

        {/* Post Image */}
        {hasImage && post.picture && (
          <Link href={`/posts/${post.id}`} className="block">
            <div className={cn(
              "relative w-full overflow-hidden rounded-xl bg-muted",
              "transition-transform duration-500 ease-out",
              variant === 'featured' ? "h-80 md:h-96" : "h-64 md:h-72"
            )}>
              {post.picture.includes('localhost') ? (
                <img
                  src={post.picture}
                  alt={`Image for post: ${post.title}`}
                  className={cn(
                    "w-full h-full object-cover",
                    "transition-transform duration-500 ease-out",
                    isHovered && "scale-105"
                  )}
                  loading="lazy"
                />
              ) : (
                <Image
                  src={post.picture}
                  alt={`Image for post: ${post.title}`}
                  fill
                  className={cn(
                    "object-cover",
                    "transition-transform duration-500 ease-out",
                    isHovered && "scale-105"
                  )}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              )}
              {/* Gradient overlay on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/20 to-transparent",
                "opacity-0 transition-opacity duration-300",
                isHovered && "opacity-100"
              )} />
            </div>
          </Link>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-medium transition-all duration-200",
                    "hover:scale-105 hover:shadow-sm cursor-pointer",
                    "bg-secondary/50 hover:bg-secondary"
                  )}
                  style={
                    tag.color
                      ? {
                          backgroundColor: `${tag.color}15`,
                          color: tag.color,
                          borderColor: `${tag.color}30`,
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

        {/* Comments Preview */}
        {!showAllComments &&
          post.last_three_comments &&
          post.last_three_comments.length > 0 &&
          variant !== 'compact' && (
            <div className="space-y-3 pt-4 border-t border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Recent Comments
              </p>
              <div className="space-y-2.5">
                {post.last_three_comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2.5 text-sm group/comment"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage
                        src={comment.user.profile_picture}
                        alt={comment.user.name}
                      />
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials(comment.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{comment.user.name}</span>
                      <span className="text-muted-foreground ml-1.5 line-clamp-1">
                        {comment.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {post.comments_count > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowAllComments(true)}
                  className="text-xs font-medium text-primary p-0 h-auto hover:no-underline"
                >
                  View all {post.comments_count} comments
                </Button>
              )}
            </div>
          )}

        {/* Full Comment List */}
        {showAllComments && (
          <div className="pt-4 border-t border-border/50">
            <CommentList
              postId={post.id}
              initialComments={[]}
              isAuthenticated={!!user}
              userId={user?.id}
            />
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowAllComments(false)}
              className="text-xs font-medium text-primary p-0 h-auto mt-3 hover:no-underline"
            >
              Hide comments
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0 pb-4">
        {/* Reactions */}
        <PostReactions
          postId={post.id}
          initialReactionsCount={post.reactions_count || 0}
          initialUserReaction={post.user_reaction}
          isAuthenticated={!!user}
        />

        {/* Comments Count */}
        <div className="flex items-center justify-between w-full pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllComments(!showAllComments)}
            className="flex items-center gap-2 h-8 px-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {post.comments_count || 0}
            </span>
          </Button>

          {/* View post link - appears on hover */}
          <Link
            href={`/posts/${post.id}`}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium text-primary",
              "opacity-0 transition-opacity duration-200",
              isHovered && "opacity-100"
            )}
          >
            View post
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
