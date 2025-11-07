'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';
import { postsService } from '@/lib/posts';
import { toast } from 'sonner';

/**
 * DeletePostButton - Client Component
 *
 * Isolated client component for post deletion.
 * Keeps the parent PostContent as a Server Component.
 */

interface DeletePostButtonProps {
  postId: number;
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await postsService.deletePost(postId);
      toast.success('Post deleted successfully');
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete post');
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive focus:text-destructive cursor-pointer"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isDeleting ? 'Deleting...' : 'Delete Post'}
    </DropdownMenuItem>
  );
}
