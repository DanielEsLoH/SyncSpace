'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DialogProvider, useDialogContext } from '@/contexts/DialogContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { FeedStateProvider } from '@/contexts/FeedStateContext';
import { Navigation } from '@/components/layout/Navigation';
import { globalWebSocket } from '@/lib/globalWebSocket';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { openCreatePostDialog } = useDialogContext();

  return (
    <>
      {/* Navigation - Rendered once for all protected routes */}
      <Navigation onCreatePost={openCreatePostDialog} />

      {/* Page Content */}
      {children}
    </>
  );
}

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

  // Initialize global WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      globalWebSocket.initialize();
    }

    return () => {
      // Cleanup on unmount (e.g., logout)
      if (!isAuthenticated) {
        globalWebSocket.cleanup();
      }
    };
  }, [isAuthenticated]);

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
    <NotificationsProvider>
      <DialogProvider>
        <FeedStateProvider>
          <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
        </FeedStateProvider>
      </DialogProvider>
    </NotificationsProvider>
  );
}
