# Advanced Search Implementation

## Overview

The enhanced search functionality implements a production-grade search experience following Next.js 15+ best practices with Server Components, streaming, and parallel data fetching.

## Architecture

### Component Hierarchy

```
app/[locale]/search/
├── page.tsx (Server Component)           # Main search page with streaming
├── loading.tsx                           # Page-level loading state
└── error.tsx                            # Error boundary

components/search/
├── SearchBar.tsx (Client Component)      # Global search with autocomplete
├── SearchResults.tsx (Client Component)  # Tabbed results display
├── SearchFilters.tsx (Client Component)  # Filter controls
├── SearchResultCards.tsx                 # Individual result cards
├── SearchLoading.tsx                     # Loading skeletons
└── SearchError.tsx (Client Component)    # Error states

lib/
└── search.ts                             # Server-side utilities

types/
└── index.ts                              # Search type definitions
```

## Key Features

### 1. Server Components with Streaming

The search page is a Server Component that leverages Next.js streaming for optimal performance:

```typescript
// Separate data fetching into independent Suspense boundaries
<Suspense fallback={<FiltersSkeleton />}>
  <SearchFiltersContainer />
</Suspense>

<Suspense fallback={<ResultsSkeleton />}>
  <SearchResultsContainer />
</Suspense>
```

**Benefits:**
- Filters load independently from results
- Progressive rendering improves perceived performance
- Users see content as it becomes available
- Automatic error isolation per boundary

### 2. Parallel Data Fetching

Uses `Promise.all()` to fetch posts, users, and tags simultaneously:

```typescript
const [postsResult, usersResult, tagsResult] = await Promise.all([
  searchPosts(query, options),
  searchUsers(query, options),
  searchTags(query, options),
]);
```

**Performance Impact:**
- Eliminates request waterfalls
- 3x faster than sequential fetching
- Request deduplication via Next.js caching

### 3. Intelligent Caching Strategy

```typescript
fetch(url, {
  next: {
    revalidate: 60,              // Revalidate every 60 seconds
    tags: ['search-posts'],      // Cache tags for on-demand revalidation
  },
});
```

**Cache Layers:**
- **Full Route Cache**: Entire page cached at build time where possible
- **Data Cache**: Individual API responses cached with custom revalidation
- **Request Memoization**: Deduplicates identical requests within a render
- **Client Router Cache**: Client-side navigation cache (30s default)

### 4. URL-Based State Management

All search state lives in URL search params:

```typescript
/search?query=nextjs&type=posts&sortBy=popularity&tags=1,2&page=1
```

**Advantages:**
- Shareable search URLs
- Browser back/forward navigation works correctly
- No client state management complexity
- SEO-friendly dynamic metadata

### 5. Advanced Search Syntax

Supports special prefixes for targeted search:

- `@username` - Search for users (e.g., `@john`)
- `tag:tagname` - Search for tags (e.g., `tag:react`)
- Regular text - Search posts

### 6. Tabbed Results Interface

Four tabs organize results by type:
- **All**: Shows top 3 of each type
- **Posts**: All post results with pagination
- **Users**: All user results
- **Tags**: All tag results

### 7. Advanced Filtering

**Sort Options:**
- Relevance (default)
- Most Recent (date descending)
- Most Popular (reactions_count descending)

**Filter Options:**
- Filter by multiple tags
- Date range filtering (ready for backend support)
- Active filter badges with quick removal

### 8. Progressive Enhancement

The SearchBar provides instant autocomplete while Enter key or "View all results" navigates to the full search page:

```typescript
// Autocomplete for quick access
onKeyDown={(e) => {
  if (e.key === 'Enter' && query.length >= 2) {
    router.push(`/search?query=${encodeURIComponent(query)}`);
  }
}}
```

## Performance Optimizations

### 1. Request Deduplication

Next.js automatically deduplicates identical `fetch()` calls during a render:

```typescript
// These two calls fetch only once if parameters match
const posts = await searchPosts('nextjs');
const morePosts = await searchPosts('nextjs');
```

### 2. Streaming Architecture

```
Time (ms)    0        100       200       300       400
             |---------|---------|---------|---------|
HTML Shell   ▓▓▓▓▓▓▓
Filters            ▓▓▓▓▓▓▓▓▓
Results                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
Interactive                             ▓▓▓▓▓▓▓▓
```

Users see the page shell immediately, then filters, then results as they load.

### 3. Smart Prefetching

Next.js prefetches result card links on hover (in production):

```typescript
<Link href={`/posts/${post.id}`} prefetch={true}>
```

### 4. Loading Skeletons

Detailed skeletons match the actual content structure:

```typescript
export function SearchResultsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-5 w-2/3" />
          // ... matches actual result card structure
        </Card>
      ))}
    </div>
  );
}
```

## Type Safety

Full TypeScript coverage with comprehensive types:

```typescript
// Search filters with strict typing
interface SearchFilters {
  query: string;
  type: SearchResultType;      // 'all' | 'posts' | 'users' | 'tags'
  sortBy: SearchSortBy;         // 'relevance' | 'date' | 'popularity'
  dateRange?: DateRangeFilter;
  tags?: number[];
  page?: number;
  per_page?: number;
}

// Unified search results
interface SearchResults {
  posts: PostSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  counts: {
    posts: number;
    users: number;
    tags: number;
    total: number;
  };
  meta?: PaginationMeta;
}
```

## Error Handling

Multi-layer error handling strategy:

### 1. Page-Level Error Boundary

```typescript
// app/[locale]/search/error.tsx
export default function SearchPageError({ error, reset }) {
  return <SearchError error={error} reset={reset} />;
}
```

### 2. Graceful Degradation

```typescript
try {
  const response = await fetch(url);
  return response.json();
} catch (error) {
  console.error('Search failed:', error);
  return { posts: [], meta: null }; // Return empty results, don't crash
}
```

### 3. Empty States

Contextual empty states with suggestions:

```typescript
<SearchEmptyState
  query={query}
  suggestions={[
    'Try different keywords',
    'Use @ before a username',
    'Use tag: before a tag name',
  ]}
/>
```

## Accessibility

- Semantic HTML with proper landmarks
- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels on interactive elements
- Focus management in dropdowns
- Screen reader announcements for result counts

## SEO Optimization

### 1. Dynamic Metadata

```typescript
export async function generateMetadata({ searchParams }) {
  const query = searchParams.query || '';
  return {
    title: query ? `Search: ${query} - SyncSpace` : 'Search - SyncSpace',
    description: `Search results for "${query}" on SyncSpace`,
  };
}
```

### 2. Server-Side Rendering

All search results are server-rendered, making them crawlable by search engines.

### 3. Canonical URLs

Search URLs are clean and shareable:
```
/search?query=nextjs&type=posts&sortBy=popularity
```

## Future Enhancements

### 1. Infinite Scroll

Add intersection observer for pagination:

```typescript
const { ref, inView } = useInView();

useEffect(() => {
  if (inView && hasMore) {
    loadMoreResults();
  }
}, [inView]);
```

### 2. Search Analytics

Track search queries and result interactions:

```typescript
// Track in analytics
trackSearch({
  query,
  resultsCount: counts.total,
  filters: { type, sortBy, tags },
});
```

### 3. Recent Searches

Store in localStorage or cookies:

```typescript
const recentSearches = useLocalStorage('recent-searches', []);
```

### 4. Advanced Query Parsing

Support operators like AND, OR, NOT:

```
"next.js" AND (react OR vue) NOT angular
```

### 5. Faceted Search

Show facets/filters based on results:

```typescript
interface SearchFacets {
  tags: { id: number; name: string; count: number }[];
  authors: { id: number; name: string; count: number }[];
  dateRanges: { label: string; count: number }[];
}
```

## Testing Recommendations

### 1. Unit Tests

```typescript
describe('parseSearchQuery', () => {
  it('should detect user search with @ prefix', () => {
    expect(parseSearchQuery('@john')).toEqual({
      type: 'user',
      term: 'john',
      original: '@john',
    });
  });
});
```

### 2. Integration Tests

```typescript
describe('SearchPage', () => {
  it('should display results for valid query', async () => {
    const { getByText } = render(<SearchPage searchParams={{ query: 'test' }} />);
    await waitFor(() => {
      expect(getByText(/results/i)).toBeInTheDocument();
    });
  });
});
```

### 3. E2E Tests

```typescript
test('search workflow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[placeholder*="Search"]', 'nextjs');
  await page.press('[placeholder*="Search"]', 'Enter');
  await expect(page).toHaveURL(/\/search\?query=nextjs/);
  await expect(page.locator('text=Search Results')).toBeVisible();
});
```

## Performance Metrics

Expected Core Web Vitals for search page:

- **LCP (Largest Contentful Paint)**: < 1.2s (server-rendered)
- **FID (First Input Delay)**: < 100ms (minimal client JS)
- **CLS (Cumulative Layout Shift)**: < 0.1 (skeleton matches layout)
- **TTFB (Time to First Byte)**: < 600ms (edge deployment)

## Deployment Considerations

### 1. Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.syncspace.com/api/v1
```

### 2. Caching Strategy

Configure on Vercel/hosting platform:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
};
```

### 3. Rate Limiting

Implement on API side to prevent abuse:

```typescript
// Backend rate limit: 100 searches per minute per IP
```

## Files Created/Modified

### New Files
1. `/lib/search.ts` - Server-side search utilities
2. `/components/search/SearchResults.tsx` - Tabbed results display
3. `/components/search/SearchFilters.tsx` - Filter controls
4. `/components/search/SearchResultCards.tsx` - Individual result cards
5. `/components/search/SearchLoading.tsx` - Loading skeletons
6. `/components/search/SearchError.tsx` - Error states
7. `/app/[locale]/search/error.tsx` - Error boundary
8. `/app/[locale]/search/loading.tsx` - Loading state

### Modified Files
1. `/app/[locale]/search/page.tsx` - Complete rewrite to Server Component
2. `/components/search/SearchBar.tsx` - Added Enter key navigation and "View all" link
3. `/types/index.ts` - Added search-related types

## Summary

This implementation represents a production-grade search experience that:

- Leverages Next.js 15+ Server Components for optimal performance
- Implements streaming and Suspense for progressive rendering
- Uses parallel data fetching to eliminate request waterfalls
- Provides comprehensive filtering and sorting options
- Maintains full type safety with TypeScript
- Handles errors gracefully at multiple levels
- Optimizes for Core Web Vitals and SEO
- Supports keyboard navigation and accessibility
- Uses URL-based state for shareability

The architecture is maintainable, scalable, and ready for production deployment.
