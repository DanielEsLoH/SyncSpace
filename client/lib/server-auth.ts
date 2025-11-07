import { cookies } from 'next/headers';
import { User } from '@/types';

/**
 * Server-Side Authentication Utilities
 *
 * These functions enable Server Components to access authentication state.
 * They read cookies from the request and optionally verify tokens with the backend.
 *
 * USAGE:
 * - Use in Server Components (app directory)
 * - async/await required
 * - Cannot be used in Client Components
 *
 * SECURITY:
 * - Tokens are read from cookies (not accessible via XSS)
 * - Optional backend verification for sensitive operations
 * - Proper error handling prevents crashes
 */

/**
 * Get authentication state from cookies
 *
 * This is a lightweight check that reads cookies without backend verification.
 * Use for non-sensitive operations like showing/hiding UI elements.
 *
 * @returns Authentication state with user data from cookies
 */
export async function getServerAuth(): Promise<{
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get('syncspace_token')?.value || null;
  const userCookie = cookieStore.get('syncspace_user')?.value;

  if (!token || !userCookie) {
    return { isAuthenticated: false, user: null, token: null };
  }

  try {
    const user = JSON.parse(userCookie) as User;
    return { isAuthenticated: true, user, token };
  } catch (error) {
    return { isAuthenticated: false, user: null, token: null };
  }
}

/**
 * Get authentication state with backend verification
 *
 * This makes a request to the backend to verify the token is still valid.
 * Use for sensitive operations or when you need fresh user data.
 *
 * @returns Authentication state with verified user data from backend
 */
export async function getVerifiedServerAuth(): Promise<{
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get('syncspace_token')?.value || null;

  if (!token) {
    return { isAuthenticated: false, user: null, token: null };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Always get fresh data
      }
    );

    if (!response.ok) {
      return { isAuthenticated: false, user: null, token: null };
    }

    const data = await response.json();
    return { isAuthenticated: true, user: data.user, token };
  } catch (error) {
    return { isAuthenticated: false, user: null, token: null };
  }
}

/**
 * Require authentication (throws error if not authenticated)
 *
 * Use in Server Components that absolutely require authentication.
 * Will throw an error that can be caught by error boundaries.
 *
 * @param verify - Whether to verify token with backend (default: false)
 * @returns Authentication state (guaranteed to be authenticated)
 * @throws Error if not authenticated
 *
 * @example
 * ```tsx
 * export default async function ProfilePage() {
 *   const auth = await requireAuth();
 *   // auth.user is guaranteed to exist here
 *   return <div>Hello {auth.user.name}</div>;
 * }
 * ```
 */
export async function requireAuth(verify = false) {
  const auth = verify ? await getVerifiedServerAuth() : await getServerAuth();

  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Authentication required');
  }

  return auth;
}

/**
 * Check if user is the owner of a resource
 *
 * Convenience function to check resource ownership in Server Components.
 *
 * @param resourceUserId - The user ID of the resource owner
 * @returns True if current user owns the resource
 *
 * @example
 * ```tsx
 * const post = await getPost(id);
 * const isOwner = await isResourceOwner(post.user.id);
 * ```
 */
export async function isResourceOwner(resourceUserId: number): Promise<boolean> {
  const auth = await getServerAuth();
  return auth.user?.id === resourceUserId;
}
