'use client';

import { ErrorFallback } from '@/components/errors/ErrorFallback';
import { useTranslations } from 'next-intl';

/**
 * Post Detail Error Boundary
 *
 * Handles errors specific to post pages, such as:
 * - Post not found (404)
 * - Failed to load post data
 * - Failed to load comments
 */

export default function PostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  // Determine if it's a 404 or other error
  const isNotFound = error.message.includes('404') || error.message.includes('not found');

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title={isNotFound ? t('post_not_found') : t('post_error_title')}
      message={
        isNotFound
          ? t('post_not_found_message')
          : t('post_error_message')
      }
      showHome={true}
    />
  );
}
