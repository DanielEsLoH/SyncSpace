'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Reusable Error Fallback Component
 *
 * A user-friendly error display component that can be used in error boundaries
 * or as a fallback UI for failed operations.
 *
 * @param error - The error object
 * @param reset - Optional reset function to retry the operation
 * @param showHome - Whether to show a "Go Home" button
 */

interface ErrorFallbackProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  showHome?: boolean;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  reset,
  showHome = true,
  title = 'Something went wrong',
  message,
}: ErrorFallbackProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development' && error) {
      console.error('Error caught by fallback:', error);
    }

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error);
  }, [error]);

  const displayMessage =
    message ||
    error?.message ||
    'An unexpected error occurred. Please try again.';

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Error Icon */}
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>

          {/* Error Message */}
          <p className="text-muted-foreground">{displayMessage}</p>

          {/* Error ID (if available) */}
          {error?.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-4">
            {reset && (
              <Button onClick={reset} variant="default" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {showHome && (
              <Button
                onClick={() => (window.location.href = '/')}
                variant={reset ? 'outline' : 'default'}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          {/* Development Info */}
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="w-full mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View error details (dev only)
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-48 text-left">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Compact version for inline errors
 */
export function InlineError({
  message = 'Failed to load content',
  retry,
}: {
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-4 border border-destructive/50 rounded-lg bg-destructive/5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive">{message}</p>
        {retry && (
          <Button onClick={retry} size="sm" variant="ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
