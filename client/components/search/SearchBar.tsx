'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Hash, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

interface SearchResult {
  type: 'user' | 'tag' | 'post';
  id: number;
  name: string;
  description?: string;
  profile_picture?: string;
  color?: string;
}

/**
 * SearchBar Component
 *
 * Advanced search with support for:
 * - @username syntax for user search
 * - tag:tagname syntax for tag search
 * - Regular text for post search
 * - Real-time suggestions
 */
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Parse search query to detect special syntax
  const parseQuery = (q: string) => {
    if (q.startsWith('@')) {
      return { type: 'user', term: q.slice(1) };
    } else if (q.startsWith('tag:')) {
      return { type: 'tag', term: q.slice(4) };
    } else {
      return { type: 'post', term: q };
    }
  };

  // Search API call with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { type, term } = parseQuery(query);

        let searchResults: SearchResult[] = [];

        if (type === 'user') {
          const response = await api.get('/users/search', {
            params: { q: term },
          });
          searchResults = response.data.users.map((user: any) => ({
            type: 'user',
            id: user.id,
            name: user.name,
            description: user.email,
            profile_picture: user.profile_picture,
          }));
        } else if (type === 'tag') {
          const response = await api.get('/tags', {
            params: { search: term },
          });
          searchResults = response.data.tags.map((tag: any) => ({
            type: 'tag',
            id: tag.id,
            name: tag.name,
            color: tag.color,
          }));
        } else {
          const response = await api.get('/posts', {
            params: { search: term, per_page: 5 },
          });
          searchResults = response.data.posts.map((post: any) => ({
            type: 'post',
            id: post.id,
            name: post.title,
            description: post.description,
          }));
        }

        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'user') {
      router.push(`/users/${result.id}`);
    } else if (result.type === 'tag') {
      router.push(`/tags/${result.id}`);
    } else if (result.type === 'post') {
      router.push(`/posts/${result.id}`);
    }
    setQuery('');
    setIsOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  // Handle "Enter" key to navigate to full search page
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      router.push(`/search?query=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search posts, @users, tag:name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto">
          <div className="p-2">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-3"
              >
                {result.type === 'user' && (
                  <>
                    <div className="flex-shrink-0">
                      {result.profile_picture ? (
                        <img
                          src={result.profile_picture}
                          alt={result.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </p>
                    </div>
                  </>
                )}

                {result.type === 'tag' && (
                  <>
                    <Hash className="h-4 w-4 flex-shrink-0" style={{ color: result.color }} />
                    <p className="font-medium text-sm">{result.name}</p>
                  </>
                )}

                {result.type === 'post' && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    {result.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </p>
                    )}
                  </div>
                )}
              </button>
            ))}
            {/* View All Results Link */}
            <div className="border-t mt-2 pt-2 px-3">
              <button
                onClick={() => {
                  router.push(`/search?query=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-primary hover:underline py-2"
              >
                View all results
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && isOpen && (
        <Card className="absolute z-50 w-full mt-2 p-4">
          <p className="text-sm text-muted-foreground text-center">Searching...</p>
        </Card>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <Card className="absolute z-50 w-full mt-2 p-4">
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </Card>
      )}
    </div>
  );
}
