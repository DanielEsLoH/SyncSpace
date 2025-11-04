'use client';

import { ErrorFallback } from '@/components/errors/ErrorFallback';
import { useTranslations } from 'next-intl';

/**
 * Notifications Page Error Boundary
 *
 * Handles errors specific to notifications, such as:
 * - Failed to load notifications
 * - WebSocket connection failures
 * - Authentication errors
 */

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title={t('notifications_error_title')}
      message={t('notifications_error_message')}
      showHome={true}
    />
  );
}
