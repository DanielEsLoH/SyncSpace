// client/app/tags/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PostListPage } from '@/components/posts/PostListPage';
import { tagsService } from '@/lib/tags';
import { Tag } from '@/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TagPostsPage() {
  const { id } = useParams();
  const tagId = parseInt(id as string);

  const [tag, setTag] = useState<Tag | null>(null);
  const [isLoadingTag, setIsLoadingTag] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTag = async () => {
      try {
        setIsLoadingTag(true);
        const tagData = await tagsService.getTag(tagId);
        setTag(tagData);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load tag details');
        toast.error('Failed to load tag details');
      } finally {
        setIsLoadingTag(false);
      }
    };

    if (tagId) {
      fetchTag();
    }
  }, [tagId]);

  if (isLoadingTag) {
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
            <Button onClick={() => {
              setError(null);
              // Re-fetch tag
              const fetchTagAgain = async () => {
                try {
                  setIsLoadingTag(true);
                  const tagData = await tagsService.getTag(tagId);
                  setTag(tagData);
                } catch (err: any) {
                  setError(err.response?.data?.error || 'Failed to load tag details');
                  toast.error('Failed to load tag details');
                } finally {
                  setIsLoadingTag(false);
                }
              };
              fetchTagAgain();
            }} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Tag not found.</p>
      </div>
    );
  }

  return <PostListPage tagId={tagId} title={`Posts tagged with #${tag.name}`} />;
}
