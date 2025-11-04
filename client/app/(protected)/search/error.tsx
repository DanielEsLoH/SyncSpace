'use client';

/**
 * Error boundary for search page
 * Catches and handles errors in Server Components
 */

import { SearchError } from '@/components/search/SearchError';

export default function SearchPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <SearchError error={error} reset={reset} />
        </div>
      </main>
    </div>
  );
}
