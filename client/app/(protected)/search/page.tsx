/**
 * Advanced Search Page - Server Component with Streaming
 *
 * Features:
 * - Server-side data fetching with parallel requests
 * - Streaming with Suspense boundaries
 * - URL-based state management
 * - Advanced filtering and sorting
 * - Tabbed results interface
 *
 * Next.js 15+ Best Practices:
 * - Uses Server Components by default
 * - Implements proper caching strategies
 * - Parallel data fetching to minimize waterfalls
 * - Client components only where interactivity is needed
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { performUnifiedSearch, getSearchSuggestions, searchTags } from '@/lib/search';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters, SearchFiltersSummary } from '@/components/search/SearchFilters';
import { SearchLoading, SearchResultsSkeleton } from '@/components/search/SearchLoading';
import { SearchEmptyState } from '@/components/search/SearchError';
import { SearchResultType, SearchSortBy, Tag } from '@/types';
import { Search } from 'lucide-react';
import { SearchInput } from '@/components/search/SearchInput';

// Opt into dynamic rendering for this page since it depends on searchParams
export const dynamic = 'force-dynamic';

// Metadata generation
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { query?: string };
}): Promise<Metadata> {
  const query = searchParams.query || '';

  return {
    title: query ? `Search: ${query} - SyncSpace` : 'Search - SyncSpace',
    description: query
      ? `Search results for "${query}" on SyncSpace`
      : 'Search for posts, users, and tags on SyncSpace',
  };
}

interface SearchPageProps {
  searchParams: {
    query?: string;
    type?: SearchResultType;
    sortBy?: SearchSortBy;
    tags?: string;
    page?: string;
    per_page?: string;
  };
}

/**
 * Server Component for fetching and displaying search results
 * Separated for Suspense boundary
 */
async function SearchResultsContainer({
  query,
  type = 'all',
  sortBy = 'relevance',
  tags,
  page = '1',
  per_page = '10',
}: {
  query: string;
  type?: SearchResultType;
  sortBy?: SearchSortBy;
  tags?: string;
  page?: string;
  per_page?: string;
}) {
  // Parse tags from comma-separated string
  const tagIds = tags
    ? tags.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
    : undefined;

  // Fetch search results with parallel data fetching
  const results = await performUnifiedSearch(query, {
    query,
    type,
    sortBy,
    tags: tagIds,
    page: parseInt(page, 10),
    per_page: parseInt(per_page, 10),
  });

  // Show empty state if no query
  if (!query || query.trim().length === 0) {
    return (
      <SearchEmptyState
        query=""
        suggestions={getSearchSuggestions('')}
      />
    );
  }

  return (
    <>
      {/* Results Summary */}
      <SearchFiltersSummary
        resultCount={results.counts.total}
        currentSort={sortBy}
        activeFilterCount={(tagIds?.length || 0) + (sortBy !== 'relevance' ? 1 : 0)}
      />

      {/* Tabbed Results */}
      <SearchResults
        results={results}
        query={query}
        currentTab={type}
      />
    </>
  );
}

/**
 * Server Component for fetching available tags for filtering
 * Separated for independent Suspense boundary
 */
async function SearchFiltersContainer({
  sortBy = 'relevance',
  tags,
}: {
  sortBy?: SearchSortBy;
  tags?: string;
}) {
  // Fetch all tags for filter dropdown (cached for 2 minutes)
  const { tags: availableTags } = await searchTags('', { per_page: 100 });

  const currentTags = tags
    ? tags.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
    : [];

  return (
    <SearchFilters
      currentSort={sortBy}
      currentTags={currentTags}
      availableTags={availableTags}
    />
  );
}

/**
 * Main Search Page Component (Server Component)
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    query = '',
    type = 'all',
    sortBy = 'relevance',
    tags,
    page = '1',
    per_page = '10',
  } = searchParams;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Search className="h-8 w-8" />
              Search
            </h1>

            {/* Search Input */}
            <SearchInput initialQuery={query} />

            {query && (
              <p className="text-muted-foreground">
                Showing results for <span className="font-semibold">&quot;{query}&quot;</span>
              </p>
            )}
          </div>

          {/* Search Filters - Independent Suspense boundary */}
          {query && (
            <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded-md" />}>
              <SearchFiltersContainer sortBy={sortBy} tags={tags} />
            </Suspense>
          )}

          {/* Search Results - Streaming with Suspense */}
          {query ? (
            <Suspense
              key={`${query}-${type}-${sortBy}-${tags}-${page}`}
              fallback={<SearchResultsSkeleton count={5} />}
            >
              <SearchResultsContainer
                query={query}
                type={type}
                sortBy={sortBy}
                tags={tags}
                page={page}
                per_page={per_page}
              />
            </Suspense>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start searching</h3>
              <p className="text-muted-foreground">
                Enter a search query above to find posts, users, and tags
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
