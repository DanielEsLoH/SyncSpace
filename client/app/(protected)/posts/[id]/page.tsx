import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PostDetailClient } from '@/components/posts/PostDetailClient';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { CommentSkeleton } from '@/components/comments/CommentSkeleton';
import { getCachedPost, getAuthToken } from '@/lib/api-server';
import { getServerAuth } from '@/lib/server-auth';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Post Detail Page - Next.js 15 Server Component Implementation
 *
 * ARCHITECTURE:
 * - Main page is a Server Component (no 'use client')
 * - Post data fetched server-side with caching
 * - Comments section streams in separately via Suspense
 * - Interactive elements isolated in Client Components
 *
 * PERFORMANCE:
 * - Parallel data fetching (post + auth)
 * - Static metadata generation for SEO
 * - Streaming UI with instant post display
 * - Comments load progressively without blocking
 *
 * CACHING:
 * - Post data: 60s revalidation with cache tags
 * - Comments: 30s revalidation via streaming component
 */

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Generate static metadata for SEO and social sharing
 *
 * This function runs at build time for static pages and
 * on-demand for dynamic pages. It fetches the post data
 * independently to populate Open Graph tags.
 */
export async function generateMetadata(
  { params }: PostDetailPageProps
): Promise<Metadata> {
  const resolvedParams = await params;
  const postId = parseInt(resolvedParams.id);

  if (isNaN(postId)) {
    return {
      title: 'Post Not Found',
    };
  }

  try {
    // Extract token first (outside of cached functions)
    const token = await getAuthToken();

    // Fetch post data for metadata
    // This uses the same cache as the page, so no duplicate requests
    const post = await getCachedPost(postId, token) as Post;

    return {
      title: `${post.title} | SyncSpace`,
      description: post.description.slice(0, 160),
      openGraph: {
        title: post.title,
        description: post.description.slice(0, 160),
        type: 'article',
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        authors: post.user?.name ? [post.user.name] : ['Unknown Author'],
        images: post.picture ? [
          {
            url: post.picture,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ] : undefined,
        tags: post.tags?.map(tag => tag.name) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.description.slice(0, 160),
        images: post.picture ? [post.picture] : undefined,
      },
    };
  } catch (error) {
    // If post not found, return default metadata
    return {
      title: 'Post Not Found | SyncSpace',
    };
  }
}

/**
 * Main Post Detail Page Component
 *
 * This is a Server Component that:
 * 1. Fetches post data server-side with caching
 * 2. Checks authentication state
 * 3. Renders post content immediately
 * 4. Streams comments section with Suspense
 */
export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = await params;
  const postId = parseInt(resolvedParams.id);

  // Validate post ID
  if (isNaN(postId)) {
    notFound();
  }

  // Extract token first (outside of cached functions)
  const token = await getAuthToken();

  // Parallel data fetching: post + auth
  // Both requests run simultaneously for optimal performance
  const [postData, auth] = await Promise.all([
    getCachedPost(postId, token).catch(() => null),
    getServerAuth(),
  ]);

  // If post not found, trigger Next.js not-found page
  if (!postData) {
    notFound();
  }

  // Type assertion after null check
  const post = postData as Post;

  // Defensive check: Log warning if user data is missing
  if (!post.user || !post.user.id) {
    console.warn(`Post ${postId} is missing user data:`, post);
  }

  // Determine if current user is post owner
  // Use optional chaining to handle missing user data gracefully
  const isOwner = auth.user?.id && post.user?.id
    ? auth.user.id === post.user.id
    : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/feed">
            <Button
              variant="ghost"
              className="gap-2"
              aria-label="Go back to feed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </Link>

          {/* Post Content and Reactions with Real-Time Updates */}
          <PostDetailClient
            initialPost={post}
            isOwner={isOwner}
            isAuthenticated={auth.isAuthenticated}
          />

          {/* Comments Section with Streaming */}
          {/*
            Suspense boundary allows comments to load independently
            Post content appears immediately while comments stream in
            This dramatically improves perceived performance
          */}
          <Suspense
            fallback={
              <CommentSkeleton
                count={3}
                showForm={auth.isAuthenticated}
              />
            }
          >
            <CommentsSection
              postId={postId}
              isAuthenticated={auth.isAuthenticated}
              userId={auth.user?.id}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
