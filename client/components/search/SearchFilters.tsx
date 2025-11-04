'use client';

/**
 * Search filters component with client-side controls
 * Updates URL search params for server-side filtering
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  Calendar,
  Filter,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { SearchSortBy, Tag } from '@/types';

interface SearchFiltersProps {
  currentSort?: SearchSortBy;
  currentTags?: number[];
  availableTags?: Tag[];
}

export function SearchFilters({
  currentSort = 'relevance',
  currentTags = [],
  availableTags = [],
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Update search params
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    if (!updates.page) {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    updateSearchParams({ sortBy: value as SearchSortBy });
  };

  // Handle tag filter
  const handleTagToggle = (tagId: number) => {
    const currentTagsArray = currentTags || [];
    const newTags = currentTagsArray.includes(tagId)
      ? currentTagsArray.filter((id) => id !== tagId)
      : [...currentTagsArray, tagId];

    updateSearchParams({
      tags: newTags.length > 0 ? newTags.join(',') : null,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    updateSearchParams({
      sortBy: null,
      tags: null,
      dateFrom: null,
      dateTo: null,
    });
  };

  const hasActiveFilters = currentSort !== 'relevance' || currentTags.length > 0;

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort: {currentSort.charAt(0).toUpperCase() + currentSort.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={currentSort} onValueChange={handleSortChange}>
              <DropdownMenuRadioItem value="relevance">
                Relevance
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date">
                Most Recent
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="popularity">
                Most Popular
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tag Filter Dropdown */}
        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Tags
                {currentTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {currentTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md hover:bg-accent transition-colors flex items-center gap-2 ${
                      currentTags.includes(tag.id) ? 'bg-accent' : ''
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm flex-1 truncate">{tag.name}</span>
                    {currentTags.includes(tag.id) && (
                      <div className="h-4 w-4 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {currentTags.map((tagId) => {
            const tag = availableTags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="gap-1 pr-1"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => handleTagToggle(tagId)}
                  className="hover:bg-accent rounded-full p-0.5 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact filter summary for mobile
 */
export function SearchFiltersSummary({
  resultCount,
  currentSort,
  activeFilterCount,
}: {
  resultCount: number;
  currentSort?: SearchSortBy;
  activeFilterCount: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
      <span>
        {resultCount} {resultCount === 1 ? 'result' : 'results'}
      </span>
      {activeFilterCount > 0 && (
        <span className="flex items-center gap-1">
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
        </span>
      )}
    </div>
  );
}
