'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, User as UserIcon, Hash, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'post' | 'user' | 'tag';
  id: number;
  name: string;
  description?: string;
  profile_picture?: string;
  color?: string;
  posts_count?: number;
}

interface FeedSearchProps {
  onResultClick?: () => void;
}

export function FeedSearch({ onResultClick }: FeedSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Parse search query to detect special syntax
  const parseQuery = (q: string) => {
    if (q.startsWith('@')) {
      return { type: 'user', term: q.slice(1) };
    } else if (q.startsWith('#')) {
      return { type: 'tag', term: q.slice(1) };
    } else {
      return { type: 'all', term: q };
    }
  };

  // Debounced search
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const { type, term } = parseQuery(query);
        let searchResults: SearchResult[] = [];

        if (type === 'user' || type === 'all') {
          // Search users
          try {
            const response = await api.get('/users/search', {
              params: { q: type === 'user' ? term : query },
            });
            const userResults = response.data.users.slice(0, 3).map((user: any) => ({
              type: 'user' as const,
              id: user.id,
              name: user.name,
              description: user.email,
              profile_picture: user.profile_picture,
            }));
            searchResults = [...searchResults, ...userResults];
          } catch (err) {
            console.error('User search failed:', err);
          }
        }

        if (type === 'tag' || type === 'all') {
          // Search tags
          try {
            const response = await api.get('/tags', {
              params: { search: type === 'tag' ? term : query },
            });
            const tagResults = response.data.tags.slice(0, 3).map((tag: any) => ({
              type: 'tag' as const,
              id: tag.id,
              name: tag.name,
              color: tag.color,
              posts_count: tag.posts_count,
            }));
            searchResults = [...searchResults, ...tagResults];
          } catch (err) {
            console.error('Tag search failed:', err);
          }
        }

        if (type === 'all') {
          // Search posts
          try {
            const response = await api.get('/search', {
              params: { q: query, per_page: 5 },
            });
            const postResults = response.data.posts.slice(0, 5).map((post: any) => ({
              type: 'post' as const,
              id: post.id,
              name: post.title,
              description: post.description,
            }));
            searchResults = [...searchResults, ...postResults];
          } catch (err) {
            console.error('Post search failed:', err);
          }
        }

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
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
    onResultClick?.();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search posts, @users, #tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10 h-11 text-base"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-[500px] overflow-y-auto shadow-lg">
          <CardContent className="p-2">
            {/* Posts Section */}
            {groupedResults.post && groupedResults.post.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  POSTS
                </div>
                {groupedResults.post.map((result) => (
                  <button
                    key={`post-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    {result.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {result.description.slice(0, 80)}...
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Users Section */}
            {groupedResults.user && groupedResults.user.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-3 w-3" />
                  USERS
                </div>
                {groupedResults.user.map((result) => (
                  <button
                    key={`user-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {result.profile_picture ? (
                        <AvatarImage src={result.profile_picture} alt={result.name} />
                      ) : (
                        <AvatarFallback>
                          <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.name}</p>
                      {result.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tags Section */}
            {groupedResults.tag && groupedResults.tag.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  TAGS
                </div>
                {groupedResults.tag.map((result) => (
                  <button
                    key={`tag-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        style={
                          result.color
                            ? {
                                backgroundColor: `${result.color}20`,
                                color: result.color,
                                borderColor: result.color,
                              }
                            : undefined
                        }
                      >
                        #{result.name}
                      </Badge>
                    </div>
                    {result.posts_count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {result.posts_count} posts
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <Card className="absolute z-50 w-full mt-2 shadow-lg">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              No results found for &quot;{query}&quot;
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Try using @ for users or # for tags
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Tips:</span> Use{' '}
          <code className="px-1 py-0.5 bg-muted rounded">@username</code> to search users, or{' '}
          <code className="px-1 py-0.5 bg-muted rounded">#tag</code> to search tags
        </div>
      )}
    </div>
  );
}
