'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  Calendar,
  Heart,
  MessageCircle,
  TrendingUp,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'recent' | 'popular' | 'most-commented' | 'oldest';

interface PostsFilterSortProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  className?: string;
}

const sortOptions = [
  {
    value: 'recent' as SortOption,
    label: 'Most Recent',
    icon: Calendar,
    description: 'Newest posts first',
  },
  {
    value: 'popular' as SortOption,
    label: 'Most Popular',
    icon: TrendingUp,
    description: 'By total engagement',
  },
  {
    value: 'most-commented' as SortOption,
    label: 'Most Commented',
    icon: MessageCircle,
    description: 'By comment count',
  },
  {
    value: 'oldest' as SortOption,
    label: 'Oldest First',
    icon: Calendar,
    description: 'Oldest posts first',
  },
];

export function PostsFilterSort({
  sortBy,
  onSortChange,
  totalCount,
  className,
}: PostsFilterSortProps) {
  const currentSort = sortOptions.find((option) => option.value === sortBy);

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'post' : 'posts'}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">Sort:</span>
            {currentSort && <currentSort.icon className="h-4 w-4" />}
            <span className="hidden md:inline">{currentSort?.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Sort Posts By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = sortBy === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  'cursor-pointer',
                  isSelected && 'bg-accent'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
