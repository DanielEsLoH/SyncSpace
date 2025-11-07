"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { postsService } from "@/lib/posts";
import { tagsService } from "@/lib/tags";
import { Post, Tag } from "@/types";
import { toast } from "sonner";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onPostUpdated?: (post: Post) => void;
}

export function EditPostDialog({
  open,
  onOpenChange,
  post,
  onPostUpdated,
}: EditPostDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with post data
  useEffect(() => {
    if (post && open) {
      setTitle(post.title);
      setDescription(post.description);
      setSelectedTags(post.tags || []);
      setImagePreview(post.picture || null);
      setImageFile(null);
    }
  }, [post, open]);

  // Search tags with debounce
  const searchTags = async (query: string) => {
    if (query.length < 2) {
      setAvailableTags([]);
      return;
    }

    setIsLoadingTags(true);
    try {
      const tags = await tagsService.getTags(query);
      const filteredTags = tags.filter(
        (tag) => !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
      );
      setAvailableTags(filteredTags);
    } catch (error) {
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleTagSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagSearch(value);
    searchTags(value);
  };

  const addTag = (tag: Tag) => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      setTagSearch("");
      setAvailableTags([]);
    }
  };

  const removeTag = (tagId: number) => {
    setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!post) return;

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPost = await postsService.updatePost(post.id, {
        title: title.trim(),
        description: description.trim(),
        picture: imageFile || undefined,
        tags: selectedTags.map((tag) => tag.name),
      });

      toast.success("Post updated successfully!");
      onPostUpdated?.(updatedPost);
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update post";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedTags([]);
    setTagSearch("");
    setAvailableTags([]);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{title.length}/200</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="What's on your mind?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/2000
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Image (optional)</Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Choose Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                  {/* Use regular img tag for preview since imagePreview can be a blob URL */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  disabled={isSubmitting}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="relative">
              <Input
                id="tags"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={handleTagSearchChange}
                disabled={isSubmitting}
              />
              {isLoadingTags && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {availableTags.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <Badge
                        variant="secondary"
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
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1"
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
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="ml-1 hover:text-destructive"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Post"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
