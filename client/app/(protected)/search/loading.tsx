/**
 * Page-level loading state for search page
 * Shown during initial navigation to search page
 */

import { SearchLoading } from '@/components/search/SearchLoading';
import { Search } from 'lucide-react';

export default function SearchPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Search className="h-8 w-8" />
              Search Results
            </h1>
          </div>

          {/* Loading Content */}
          <SearchLoading />
        </div>
      </main>
    </div>
  );
}
