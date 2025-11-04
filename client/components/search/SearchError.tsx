'use client';

/**
 * Error boundary component for search failures
 * Displays user-friendly error messages with retry options
 */

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SearchErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function SearchError({ error, reset }: SearchErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Search error:', error);
  }, [error]);

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Search Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {error.message || 'An error occurred while searching. Please try again.'}
        </p>
        <div className="flex gap-2">
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="sm"
          >
            Reload Page
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SearchEmptyState({
  query,
  suggestions = [],
}: {
  query: string;
  suggestions?: string[];
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No results found</h3>
          <p className="text-sm text-muted-foreground">
            {query ? (
              <>
                No results for <span className="font-medium">&quot;{query}&quot;</span>
              </>
            ) : (
              'Try entering a search query'
            )}
          </p>
        </div>

        {suggestions.length > 0 && (
          <div className="w-full max-w-md space-y-2">
            <p className="text-sm font-medium">Suggestions:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
