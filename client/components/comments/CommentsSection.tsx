import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { CommentList } from './CommentList';
import { getCachedComments, getAuthToken } from '@/lib/api-server';
import { Comment, CommentsResponse } from '@/types';

/**
 * CommentsSection - Server Component
 *
 * Fetches comments server-side and passes them to the CommentList client component.
 * This component streams in via Suspense, allowing the post to render immediately.
 *
 * STREAMING BENEFITS:
 * - Post content loads first (fast perceived performance)
 * - Comments load independently (no blocking)
 * - User sees content immediately while comments stream in
 * - Better Core Web Vitals (FCP, LCP)
 *
 * CACHING:
 * - 30 second revalidation for fresh comments
 * - Tagged cache for invalidation on new comments
 */

interface CommentsSectionProps {
  postId: number;
  isAuthenticated: boolean;
  userId?: number;
}

export async function CommentsSection({
  postId,
  isAuthenticated,
  userId,
}: CommentsSectionProps) {
  // Extract token first (outside of cached functions)
  const token = await getAuthToken();

  // Fetch comments from server with caching
  // This happens during the streaming phase
  let comments: Comment[] = [];
  let totalCount = 0;

  try {
    const response = await getCachedComments(postId, token) as CommentsResponse;
    comments = response.comments || [];
    totalCount = comments.length;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    // Continue with empty comments array
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/*
          CommentList is a Client Component that handles:
          - Comment form submission
          - Optimistic updates
          - Delete actions
          - Reaction interactions
        */}
        <CommentList
          postId={postId}
          initialComments={comments}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      </CardContent>
    </Card>
  );
}
