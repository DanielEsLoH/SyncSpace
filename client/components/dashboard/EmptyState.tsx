'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  showCreatePost?: boolean;
}

export function EmptyState({
  title = "No posts yet",
  description = "Start creating amazing content and share it with the world!",
  actionLabel = "Create Your First Post",
  actionHref = "/posts/create",
  onAction,
  showCreatePost = true,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 p-6 rounded-full">
            <FileText className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 max-w-md">
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Action Button */}
        {showCreatePost && (
          <div className="flex flex-col sm:flex-row gap-3">
            {actionHref ? (
              <Link href={actionHref}>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <PlusCircle className="h-5 w-5" />
                  {actionLabel}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={onAction}
                size="lg"
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <PlusCircle className="h-5 w-5" />
                {actionLabel}
              </Button>
            )}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 pt-8 border-t w-full max-w-md">
          <div className="flex items-start gap-3 text-left">
            <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Pro Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Add engaging images to increase visibility</li>
                <li>• Use relevant tags to reach your audience</li>
                <li>• Write clear, compelling descriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptySearchState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center space-y-4">
        <div className="bg-muted p-4 rounded-full">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-semibold">No posts found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or create a new post to get started.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
