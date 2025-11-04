// client/components/comments/CommentItem.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Comment } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "@/lib/utils";
import { toast } from "sonner";

interface CommentItemProps {
  comment: Comment;
  postId: number;
  onReply?: (comment: Comment) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  onReact?: (
    commentId: number,
    reactionType: "like" | "love" | "dislike"
  ) => void;
}

export function CommentItem({
  comment,
  postId,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: CommentItemProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = user?.id === comment.user.id;

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setIsDeleting(true);
    try {
      await onDelete?.(comment.id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Link href={`/users/${comment.user.id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={comment.user.profile_picture}
            alt={comment.user.name}
          />
          <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline space-x-1">
            <Link
              href={`/users/${comment.user.id}`}
              className="font-semibold text-sm hover:underline"
            >
              {comment.user.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(comment.created_at)}
            </span>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(comment)}>
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
        <p className="text-sm mt-1">{comment.description}</p>
        <div className="flex items-center space-x-4 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReact?.(comment.id, "like")}
            className="h-auto p-1 text-xs gap-1"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReact?.(comment.id, "love")}
            className="h-auto p-1 text-xs gap-1"
          >
            <Heart className="h-3 w-3" />
            <span>Love</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReact?.(comment.id, "dislike")}
            className="h-auto p-1 text-xs gap-1"
          >
            <ThumbsDown className="h-3 w-3" />
            <span>Dislike</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply?.(comment)}
            className="h-auto p-1 text-xs gap-1"
          >
            <MessageCircle className="h-3 w-3" />
            <span>Reply</span>
          </Button>
          {comment.reactions_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {comment.reactions_count} Reactions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
