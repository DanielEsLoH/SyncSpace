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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "@/lib/utils";
import { CommentList } from "@/components/comments/CommentList";
import { PostReactions } from "@/components/posts/PostReactions";

import { User, UserBasic } from "@/types";

/**
 * Helper function to validate if a string is a valid image URL
 * Filters out Rails object representations and invalid URLs
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Filter out Rails object representations
  if (url.startsWith('#<') || url.includes('ActionDispatch')) return false;

  // Check if it's a valid URL (starts with http/https or is a relative path starting with /)
  try {
    if (url.startsWith('/')) return true; // Valid relative path
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface PostCardProps {
  post: Post;
  author?: User | UserBasic; // Allow passing an author override
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
}

export function PostCard({
  post,
  author,
  onEdit,
  onDelete,
}: PostCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  // Determine the author, prioritizing the override, then the post's user
  const postAuthor = author || post.user;
  const isOwner = user?.id === postAuthor?.id;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await onDelete?.(post.id);
    } catch (error) {
      console.error("Failed to delete post:", error);
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // If the author information is not available, render a placeholder or nothing
  if (!postAuthor) {
    // You can return a loading state or a simplified card
    return (
      <Card className="w-full hover:shadow-lg transition-shadow animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 rounded bg-muted"></div>
              <div className="h-3 w-16 rounded bg-muted"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-6 w-3/4 rounded bg-muted"></div>
          <div className="h-4 w-full rounded bg-muted"></div>
          <div className="h-4 w-5/6 rounded bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* User Info */}
          <Link
            href={`/users/${postAuthor.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={postAuthor.profile_picture}
                alt={postAuthor.name}
              />
              <AvatarFallback>{getInitials(postAuthor.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{postAuthor.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.created_at)}
              </span>
            </div>
          </Link>

          {/* Actions Menu */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Title */}
        <Link
          href={`/posts/${post.id}`}
          className="block hover:opacity-80 transition-opacity"
        >
          <h3 className="text-xl font-bold line-clamp-2">{post.title}</h3>
        </Link>

        {/* Post Description */}
        <p className="text-muted-foreground line-clamp-3">{post.description}</p>

        {/* Post Image */}
        {post.picture && isValidImageUrl(post.picture) && (
          <Link href={`/posts/${post.id}`} className="block">
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-muted">
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
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge
                  variant="secondary"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
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

        {/* Last 3 Comments Preview */}
        {!showAllComments &&
          post.last_three_comments &&
          post.last_three_comments.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground">
                Recent Comments:
              </p>
              {post.last_three_comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={comment.user.profile_picture}
                      alt={comment.user.name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{comment.user.name}:</span>{" "}
                    <span className="text-muted-foreground line-clamp-1">
                      {comment.description}
                    </span>
                  </div>
                </div>
              ))}
              {post.comments_count > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowAllComments(true)}
                  className="text-sm text-primary hover:underline block p-0 h-auto"
                >
                  View all {post.comments_count} comments
                </Button>
              )}
            </div>
          )}

        {/* Full Comment List */}
        {showAllComments && (
          <div className="pt-2 border-t">
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
              className="text-sm text-primary hover:underline block p-0 h-auto mt-2"
            >
              Hide comments
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0 pb-4">
        {/* Reaction Buttons with Visual Feedback */}
        <PostReactions
          postId={post.id}
          initialReactionsCount={post.reactions_count || 0}
          initialUserReaction={post.user_reaction}
          isAuthenticated={!!user}
        />

        {/* Comments Count */}
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllComments(!showAllComments)}
            className="flex items-center gap-2 h-8 px-3 rounded-full hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {post.comments_count || 0} {post.comments_count === 1 ? 'comment' : 'comments'}
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
