'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/errors/ErrorFallback';
import { useTranslations } from 'next-intl';

/**
 * Root-Level Error Boundary
 *
 * This catches all errors within the [locale] layout.
 * It provides a user-friendly error page with options to retry or go home.
 *
 * Next.js automatically wraps this in an error boundary.
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Log to console in development
    console.error('Application error:', error);

    // In production, send to error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title={t('generic_title')}
      message={t('generic_message')}
      showHome={true}
    />
  );
}
