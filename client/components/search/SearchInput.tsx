'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  initialQuery?: string;
}

/**
 * SearchInput Component
 *
 * Provides a search input field for the search page
 * - Allows users to enter and submit search queries
 * - Supports query modification
 * - Updates URL with new search parameters
 * - Provides visual feedback for search state
 */
export function SearchInput({ initialQuery = '' }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    // Build new search params
    const params = new URLSearchParams(searchParams.toString());
    params.set('query', query.trim());

    // Reset to first page when searching
    params.delete('page');

    // Navigate to search results
    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery('');
    // Navigate to empty search page
    router.push('/search');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for posts, users, tags... (try @username or tag:name)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={!query.trim()}>
          Search
        </Button>
      </div>

      {/* Search Tips */}
      <div className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium">Tips:</span> Use <code className="px-1 py-0.5 bg-muted rounded">@username</code> to search users, or <code className="px-1 py-0.5 bg-muted rounded">tag:name</code> to search tags
      </div>
    </form>
  );
}
