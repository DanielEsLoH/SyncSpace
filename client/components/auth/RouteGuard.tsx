'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * RouteGuard Component
 *
 * Client-side route protection that works with the AuthContext.
 * Use this to wrap protected pages or layouts.
 *
 * @param requireAuth - If true, redirects to login if not authenticated
 * @param redirectTo - Custom redirect path (defaults to /login or / depending on requireAuth)
 */
export function RouteGuard({
  children,
  requireAuth = true,
  redirectTo,
}: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // User must be authenticated but isn't - redirect to landing page with auth modal
      const redirect = redirectTo || `/?auth=login&redirect=${encodeURIComponent(pathname)}`;
      router.push(redirect);
    } else if (!requireAuth && isAuthenticated) {
      // User is authenticated but shouldn't be - redirect to feed
      const redirect = redirectTo || '/feed';
      router.push(redirect);
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth state doesn't match requirements
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
