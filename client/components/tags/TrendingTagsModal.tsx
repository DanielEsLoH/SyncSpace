"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tagsService } from '@/lib/tags';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import type { Tag } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TrendingTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrendingTagsModal({ isOpen, onClose }: TrendingTagsModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTrendingTags();
    }
  }, [isOpen]);

  const loadTrendingTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tagsService.getPopularTags(15);
      setTags(data);
    } catch (err) {
      console.error('Failed to load trending tags:', err);
      setError('Failed to load trending tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Tags
          </DialogTitle>
          <DialogDescription>
            Discover popular topics and find posts by tag
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trending tags found
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between group hover:bg-accent rounded-lg p-3 transition-colors border"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="group-hover:scale-105 transition-transform"
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
                  </div>
                  {tag.posts_count !== undefined && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {tag.posts_count} {tag.posts_count === 1 ? 'post' : 'posts'}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
