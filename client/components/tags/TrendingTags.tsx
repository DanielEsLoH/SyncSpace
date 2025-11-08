import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { getCachedTrendingTags, getAuthToken } from '@/lib/api-server';

/**
 * Server Component: TrendingTags
 *
 * Displays trending tags with server-side rendering and caching.
 * Data is fetched on the server with 10-minute cache revalidation.
 */
export async function TrendingTags() {
  try {
    // Extract token first (outside of cached functions)
    const token = await getAuthToken();
    const tags = await getCachedTrendingTags(10, token);

    if (!tags || tags.length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.id}`}
              className="flex items-center justify-between group hover:bg-accent rounded-lg p-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="group-hover:scale-105 transition-transform"
                  style={
                    tag.color
                      ? {
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color,
                        }
                      : undefined
                  }
                >
                  #{tag.name}
                </Badge>
              </div>
              {tag.posts_count !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {tag.posts_count} {tag.posts_count === 1 ? 'post' : 'posts'}
                </span>
              )}
            </Link>
          ))}
        </CardContent>
      </Card>
    );
  } catch (error) {
    // Return null on error to gracefully degrade
    return null;
  }
}
