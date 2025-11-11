import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import type { Tag, PostsResponse } from '@/types';

/**
 * Server-Side API Client with Caching
 *
 * This module provides server-side API functions with Next.js 15 caching capabilities.
 * Use these functions in Server Components for optimal performance.
 *
 * FEATURES:
 * - Automatic request deduplication
 * - Configurable cache revalidation
 * - Cache tagging for targeted invalidation
 * - Built-in authentication from cookies
 *
 * USAGE:
 * - Use in Server Components only
 * - Cannot be used in Client Components (use api.ts instead)
 * - Leverage caching for frequently accessed data
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Get auth token from cookies
 *
 * Extract this separately to avoid calling cookies() inside cached functions
 */
async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('syncspace_token')?.value;
}

/**
 * Server-side fetch with authentication and caching
 *
 * @param endpoint - API endpoint (e.g., '/posts/123')
 * @param token - Optional auth token (pass undefined for unauthenticated requests)
 * @param options - Fetch options including caching configuration
 * @returns Parsed JSON response
 * @throws Error if request fails
 *
 * @example
 * ```tsx
 * // Fetch with automatic token extraction
 * const token = await getAuthToken();
 * const data = await fetchFromAPI('/posts', token, { revalidate: 30 });
 *
 * // Fetch with cache tags for invalidation
 * const post = await fetchFromAPI(`/posts/${id}`, token, {
 *   tags: [`post-${id}`],
 *   revalidate: 60,
 * });
 * ```
 */
export async function fetchFromAPI<T>(
  endpoint: string,
  token?: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    revalidate?: number | false;
    tags?: string[];
    headers?: Record<string, string>;
  }
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    next: {
      revalidate: options?.revalidate,
      tags: options?.tags,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API Error [${response.status}]: ${errorText || response.statusText}`
    );
  }

  return response.json();
}

// Export getAuthToken for use in Server Components
export { getAuthToken };

/**
 * Cached version of fetchFromAPI using unstable_cache
 *
 * This provides more granular control over caching behavior.
 * Use for expensive operations that benefit from longer cache times.
 *
 * IMPORTANT: Token must be extracted outside this function using getAuthToken()
 * and passed as a parameter to avoid cookies() access inside cached functions.
 *
 * @param endpoint - API endpoint
 * @param token - Auth token (extract using getAuthToken() before calling)
 * @param cacheKey - Unique cache key identifier (should include user identifier)
 * @param options - Cache options
 * @returns Cached API response
 */
export function createCachedFetch<T>(
  endpoint: string,
  token: string | undefined,
  cacheKey: string[],
  options?: {
    revalidate?: number | false;
    tags?: string[];
  }
) {
  return unstable_cache(
    async () => fetchFromAPI<T>(endpoint, token),
    cacheKey,
    {
      revalidate: options?.revalidate ?? 60, // Default 1 minute
      tags: options?.tags,
    }
  );
}

// ============================================================================
// COMMONLY USED CACHED FETCHERS
// ============================================================================

/**
 * Get user by ID with caching
 *
 * @param userId - User ID
 * @param token - Auth token (from getAuthToken())
 * @returns User data
 *
 * Cache: 5 minutes, tag: 'user-{id}'
 */
export const getCachedUser = (userId: number, token?: string) => {
  return createCachedFetch(
    `/users/${userId}`,
    token,
    ['user', userId.toString(), token || 'anonymous'],
    { revalidate: 300, tags: [`user-${userId}`] }
  )();
};

/**
 * Get post by ID with caching
 *
 * @param postId - Post ID
 * @param token - Auth token (from getAuthToken())
 * @returns Post data
 *
 * Cache: 1 minute, tag: 'post-{id}'
 */
export const getCachedPost = async (postId: number, token?: string) => {
  const response = await createCachedFetch<{ post: import('@/types').Post }>(
    `/posts/${postId}`,
    token,
    ['post', postId.toString(), token || 'anonymous'],
    { revalidate: 60, tags: [`post-${postId}`] }
  )();

  // Backend returns { post: {...} }, extract the post object
  return response.post;
};

/**
 * Get posts feed with caching
 *
 * @param page - Page number
 * @param perPage - Posts per page
 * @param token - Auth token (from getAuthToken())
 * @returns Paginated posts
 *
 * Cache: 5 seconds, tag: 'posts-feed'
 */
export const getCachedPostsFeed = (page = 1, perPage = 10, token?: string) => {
  return createCachedFetch<PostsResponse>(
    `/posts?page=${page}&per_page=${perPage}`,
    token,
    ['posts-feed', page.toString(), perPage.toString(), token || 'anonymous'],
    { revalidate: 5, tags: ['posts-feed'] }  // Reduced to 5 seconds for reactions to show on reload
  )();
};

/**
 * Get trending tags with caching
 *
 * @param limit - Number of tags to return (default: 10)
 * @param token - Auth token (from getAuthToken())
 * @returns Popular tags
 *
 * Cache: 10 minutes, tag: 'tags'
 *
 * Note: Backend returns all tags sorted by popularity.
 * We limit on the frontend to the requested number.
 */
export const getCachedTrendingTags = async (limit = 10, token?: string) => {
  const response = await createCachedFetch<{ tags: Tag[] }>(
    `/tags?sort=popular`,
    token,
    ['tags', 'trending', limit.toString(), token || 'anonymous'],
    { revalidate: 600, tags: ['tags'] }
  )();

  // Limit results on the frontend since backend doesn't support limit parameter
  return response.tags.slice(0, limit);
};

/**
 * Get user's notifications with caching
 *
 * @param userId - User ID
 * @param page - Page number
 * @param token - Auth token (from getAuthToken())
 * @returns Paginated notifications
 *
 * Cache: 15 seconds (notifications need to be fresh)
 */
export const getCachedNotifications = (userId: number, page = 1, token?: string) => {
  return createCachedFetch<import('@/types').NotificationsResponse>(
    `/notifications?page=${page}`,
    token,
    ['notifications', userId.toString(), page.toString(), token || 'anonymous'],
    { revalidate: 15, tags: [`notifications-${userId}`] }
  )();
};

/**
 * Get comments for a post with caching
 *
 * @param postId - Post ID
 * @param token - Auth token (from getAuthToken())
 * @returns Post comments
 *
 * Cache: 30 seconds, tag: 'comments-{postId}'
 */
export const getCachedComments = (postId: number, token?: string) => {
  return createCachedFetch(
    `/posts/${postId}/comments`,
    token,
    ['comments', postId.toString(), token || 'anonymous'],
    { revalidate: 30, tags: [`comments-${postId}`] }
  )();
};

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * IMPORTANT NOTE ON CACHE INVALIDATION:
 *
 * Cache invalidation from client-side actions requires Server Actions.
 * Use revalidateTag() and revalidatePath() in Server Actions.
 *
 * Example Server Action:
 * ```tsx
 * 'use server'
 * import { revalidateTag } from 'next/cache';
 *
 * export async function createPost(formData) {
 *   // Create post via API
 *   // ...
 *   revalidateTag('posts-feed'); // Invalidate feed cache
 *   revalidateTag(`user-${userId}`); // Invalidate user cache
 * }
 * ```
 *
 * Common cache invalidation patterns:
 * - After creating post: revalidateTag('posts-feed')
 * - After updating post: revalidateTag(`post-${id}`)
 * - After adding comment: revalidateTag(`comments-${postId}`)
 * - After updating user: revalidateTag(`user-${userId}`)
 */

/**
 * Get cache tag for a resource
 *
 * Helper to maintain consistent cache tag naming.
 */
export const cacheTags = {
  post: (id: number) => `post-${id}`,
  user: (id: number) => `user-${id}`,
  comments: (postId: number) => `comments-${postId}`,
  notifications: (userId: number) => `notifications-${userId}`,
  postsFeed: 'posts-feed',
  tags: 'tags',
} as const;
