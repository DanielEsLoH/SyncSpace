'use client';

/**
 * Tabbed search results display component
 * Shows results organized by type (All, Posts, Users, Tags)
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchResults as SearchResultsType, SearchResultType } from '@/types';
import { PostResultCard, UserResultCard, TagResultCard } from './SearchResultCards';
import { SearchEmptyState } from './SearchError';
import { FileText, Users, Hash, Grid3x3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SearchResultsProps {
  results: SearchResultsType;
  query: string;
  currentTab?: SearchResultType;
}

export function SearchResults({
  results,
  query,
  currentTab = 'all',
}: SearchResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SearchResultType>(currentTab);

  // Sync active tab with URL
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as SearchResultType;
    setActiveTab(newTab);

    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'all') {
      params.delete('type');
    } else {
      params.set('type', newTab);
    }
    params.delete('page'); // Reset pagination

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { posts, users, tags, counts } = results;
  const hasResults = counts.total > 0;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="all" className="gap-2">
          <Grid3x3 className="h-4 w-4" />
          All
          {counts.total > 0 && (
            <Badge variant="secondary" className="ml-1">
              {counts.total}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="posts" className="gap-2">
          <FileText className="h-4 w-4" />
          Posts
          {counts.posts > 0 && (
            <Badge variant="secondary" className="ml-1">
              {counts.posts}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-2">
          <Users className="h-4 w-4" />
          Users
          {counts.users > 0 && (
            <Badge variant="secondary" className="ml-1">
              {counts.users}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="tags" className="gap-2">
          <Hash className="h-4 w-4" />
          Tags
          {counts.tags > 0 && (
            <Badge variant="secondary" className="ml-1">
              {counts.tags}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* All Results Tab */}
      <TabsContent value="all" className="space-y-4">
        {!hasResults ? (
          <SearchEmptyState
            query={query}
            suggestions={[
              'Try different keywords',
              'Use @ before a username to search for users',
              'Use tag: before a tag name to search for tags',
            ]}
          />
        ) : (
          <div className="space-y-6">
            {/* Posts Section */}
            {posts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Posts
                    <Badge variant="secondary">{counts.posts}</Badge>
                  </h2>
                </div>
                <div className="space-y-3">
                  {posts.slice(0, 3).map((post) => (
                    <PostResultCard key={post.id} post={post} searchTerm={query} />
                  ))}
                  {posts.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      And {posts.length - 3} more posts...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Users Section */}
            {users.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users
                    <Badge variant="secondary">{counts.users}</Badge>
                  </h2>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 3).map((user) => (
                    <UserResultCard key={user.id} user={user} searchTerm={query} />
                  ))}
                  {users.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      And {users.length - 3} more users...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {tags.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Tags
                    <Badge variant="secondary">{counts.tags}</Badge>
                  </h2>
                </div>
                <div className="space-y-3">
                  {tags.slice(0, 3).map((tag) => (
                    <TagResultCard key={tag.id} tag={tag} searchTerm={query} />
                  ))}
                  {tags.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      And {tags.length - 3} more tags...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      {/* Posts Only Tab */}
      <TabsContent value="posts" className="space-y-4">
        {posts.length === 0 ? (
          <SearchEmptyState
            query={query}
            suggestions={[
              'Try different keywords',
              'Check your spelling',
              'Use more general terms',
            ]}
          />
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostResultCard key={post.id} post={post} searchTerm={query} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Users Only Tab */}
      <TabsContent value="users" className="space-y-4">
        {users.length === 0 ? (
          <SearchEmptyState
            query={query}
            suggestions={[
              'Try searching with @ prefix (e.g., @username)',
              'Check the spelling of the username',
              'Try partial names',
            ]}
          />
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserResultCard key={user.id} user={user} searchTerm={query} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tags Only Tab */}
      <TabsContent value="tags" className="space-y-4">
        {tags.length === 0 ? (
          <SearchEmptyState
            query={query}
            suggestions={[
              'Try searching with tag: prefix (e.g., tag:technology)',
              'Check the spelling of the tag name',
              'Browse all tags to find what you need',
            ]}
          />
        ) : (
          <div className="space-y-3">
            {tags.map((tag) => (
              <TagResultCard key={tag.id} tag={tag} searchTerm={query} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
