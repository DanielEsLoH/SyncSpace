'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DialogProvider, useDialogContext } from '@/contexts/DialogContext';
import { Navigation } from '@/components/layout/Navigation';

/**
 * Protected Layout Content - Inner component that uses DialogContext
 */
function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { openCreatePostDialog } = useDialogContext();

  return (
    <>
      {/* Navigation - Rendered once for all protected routes */}
      <Navigation onCreatePost={openCreatePostDialog} notificationCount={0} />

      {/* Page Content */}
      {children}
    </>
  );
}

/**
 * Protected Layout - Wraps all authenticated pages
 *
 * This layout provides:
 * - Consistent Navigation component across all protected routes
 * - Authentication guard (redirects to login if not authenticated)
 * - Loading state while checking authentication
 * - Global dialog management (Create Post, etc.)
 *
 * Route Structure:
 * - /app/(protected)/* - All pages requiring authentication
 * - /app/(auth)/* - Authentication pages (login, register, etc.)
 *
 * Benefits over per-page Navigation:
 * - Single source of truth for navigation rendering
 * - Consistent behavior across all protected routes
 * - No code duplication
 * - Proper loading states during auth checks
 * - Better UX with persistent navigation during page transitions
 * - Global dialog state management
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DialogProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </DialogProvider>
  );
}
