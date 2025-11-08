'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

/**
 * Post Not Found Page
 *
 * This page is automatically shown when:
 * - Post ID is invalid
 * - Post doesn't exist
 * - User doesn't have access to the post
 *
 * Triggered by calling notFound() from the page component.
 *
 * Note: Navigation is rendered by the (protected) layout,
 * not in individual error pages.
 */
export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
              {/* Icon */}
              <div className="rounded-full bg-muted p-6">
                <FileQuestion className="h-16 w-16 text-muted-foreground" />
              </div>

              {/* Message */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Post Not Found</h1>
                <p className="text-muted-foreground max-w-md">
                  The post you're looking for doesn't exist or has been removed.
                  It may have been deleted by the author.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/feed">
                  <Button className="gap-2 w-full sm:w-auto">
                    <Home className="h-4 w-4" />
                    Go to Feed
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </div>

              {/* Additional Help */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Looking for something else?</p>
                <Link
                  href="/feed"
                  className="text-primary hover:underline font-medium"
                >
                  Browse all posts
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}