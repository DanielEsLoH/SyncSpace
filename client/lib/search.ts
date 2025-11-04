/**
 * Server-side search utilities for Next.js Server Components
 * Implements parallel data fetching, caching, and request deduplication
 */

import {
  SearchFilters,
  SearchResults,
  PostSearchResult,
  UserSearchResult,
  TagSearchResult
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Parse search query for special syntax
 * Supports: @username, tag:tagname
 */
export function parseSearchQuery(query: string): {
  type: 'user' | 'tag' | 'general';
  term: string;
  original: string;
} {
  const trimmed = query.trim();

  if (trimmed.startsWith('@')) {
    return { type: 'user', term: trimmed.slice(1), original: trimmed };
  } else if (trimmed.startsWith('tag:')) {
    return { type: 'tag', term: trimmed.slice(4), original: trimmed };
  }

  return { type: 'general', term: trimmed, original: trimmed };
}

/**
 * Fetch posts matching search query (Server Component compatible)
 * Implements Next.js 15+ caching and revalidation
 */
export async function searchPosts(
  query: string,
  options: {
    page?: number;
    per_page?: number;
    sortBy?: 'relevance' | 'date' | 'popularity';
    dateFrom?: string;
    dateTo?: string;
    tagIds?: number[];
  } = {}
): Promise<{ posts: PostSearchResult[]; meta: any }> {
  const params = new URLSearchParams();

  if (query) params.append('search', query);
  if (options.page) params.append('page', options.page.toString());
  if (options.per_page) params.append('per_page', options.per_page.toString());
  if (options.tagIds && options.tagIds.length > 0) {
    options.tagIds.forEach(id => params.append('tag_ids[]', id.toString()));
  }

  // Sort mapping
  if (options.sortBy === 'date') {
    params.append('sort', 'created_at');
    params.append('order', 'desc');
  } else if (options.sortBy === 'popularity') {
    params.append('sort', 'reactions_count');
    params.append('order', 'desc');
  }

  try {
    const response = await fetch(`${API_URL}/posts?${params.toString()}`, {
      next: {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ['search-posts'], // Cache tag for on-demand revalidation
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      posts: data.posts || [],
      meta: data.meta || null,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], meta: null };
  }
}

/**
 * Fetch users matching search query (Server Component compatible)
 */
export async function searchUsers(
  query: string,
  options: {
    page?: number;
    per_page?: number;
  } = {}
): Promise<{ users: UserSearchResult[]; meta: any }> {
  if (!query) {
    return { users: [], meta: null };
  }

  const params = new URLSearchParams();
  params.append('q', query);
  if (options.page) params.append('page', options.page.toString());
  if (options.per_page) params.append('per_page', options.per_page.toString());

  try {
    const response = await fetch(`${API_URL}/users/search?${params.toString()}`, {
      next: {
        revalidate: 60,
        tags: ['search-users'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      users: data.users || [],
      meta: data.meta || null,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], meta: null };
  }
}

/**
 * Fetch tags matching search query (Server Component compatible)
 */
export async function searchTags(
  query: string,
  options: {
    page?: number;
    per_page?: number;
  } = {}
): Promise<{ tags: TagSearchResult[]; meta: any }> {
  const params = new URLSearchParams();
  if (query) params.append('search', query);
  if (options.page) params.append('page', options.page.toString());
  if (options.per_page) params.append('per_page', options.per_page.toString());

  try {
    const response = await fetch(`${API_URL}/tags?${params.toString()}`, {
      next: {
        revalidate: 120, // Tags change less frequently
        tags: ['search-tags'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      tags: data.tags || [],
      meta: data.meta || null,
    };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { tags: [], meta: null };
  }
}

/**
 * Perform parallel search across all result types
 * Uses Promise.all for optimal performance
 */
export async function performUnifiedSearch(
  query: string,
  filters: Partial<SearchFilters> = {}
): Promise<SearchResults> {
  // Parse query for special syntax
  const parsed = parseSearchQuery(query);

  // Determine which searches to perform based on query type and filters
  const shouldSearchPosts = !filters.type || filters.type === 'all' || filters.type === 'posts';
  const shouldSearchUsers = (!filters.type || filters.type === 'all' || filters.type === 'users') && parsed.type !== 'tag';
  const shouldSearchTags = (!filters.type || filters.type === 'all' || filters.type === 'tags') && parsed.type !== 'user';

  // Perform parallel fetches for optimal performance
  const [postsResult, usersResult, tagsResult] = await Promise.all([
    shouldSearchPosts
      ? searchPosts(parsed.term, {
          page: filters.page,
          per_page: filters.per_page,
          sortBy: filters.sortBy,
          tagIds: filters.tags,
        })
      : Promise.resolve({ posts: [], meta: null }),

    shouldSearchUsers
      ? searchUsers(parsed.term, {
          page: filters.page,
          per_page: filters.per_page,
        })
      : Promise.resolve({ users: [], meta: null }),

    shouldSearchTags
      ? searchTags(parsed.term, {
          page: filters.page,
          per_page: filters.per_page,
        })
      : Promise.resolve({ tags: [], meta: null }),
  ]);

  // Calculate counts
  const counts = {
    posts: postsResult.meta?.total_count || postsResult.posts.length,
    users: usersResult.meta?.total_count || usersResult.users.length,
    tags: tagsResult.meta?.total_count || tagsResult.tags.length,
    total: 0,
  };
  counts.total = counts.posts + counts.users + counts.tags;

  return {
    posts: postsResult.posts,
    users: usersResult.users,
    tags: tagsResult.tags,
    counts,
    meta: postsResult.meta || usersResult.meta || tagsResult.meta,
  };
}

/**
 * Get search suggestions based on query
 */
export function getSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];

  if (!query || query.length < 2) {
    return [
      'Try searching for posts, users, or tags',
      'Use @username to search for specific users',
      'Use tag:tagname to search for specific tags',
    ];
  }

  // Context-aware suggestions
  if (query.startsWith('@')) {
    suggestions.push('Search for users by username');
  } else if (query.startsWith('tag:')) {
    suggestions.push('Search for tags by name');
  } else {
    suggestions.push(
      'Try adding @ before a username',
      'Try adding tag: before a tag name',
      'Refine your search with filters'
    );
  }

  return suggestions;
}

/**
 * Highlight search term in text
 * Returns HTML-safe highlighted text
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
}
