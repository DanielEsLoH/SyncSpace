'use client';

import { useEffect, useState, useRef } from 'react';
import { User } from '@/types';
import { usersService } from '@/lib/users';
import { useFeedState } from '@/contexts/FeedStateContext';
import { UserProfileClient } from './UserProfileClient';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserProfileInitializerProps {
  userId: number;
}

export function UserProfileInitializer({ userId }: UserProfileInitializerProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializePosts } = useFeedState();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (hasInitialized.current) return;

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch user and their posts in parallel
        const [user, postsResponse] = await Promise.all([
          usersService.getUser(userId),
          usersService.getUserPosts(userId, { page: 1, per_page: 10 }),
        ]);

        setProfileUser(user);
        initializePosts(postsResponse.posts);
        hasInitialized.current = true;
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load user profile');
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchInitialData();
    }
  }, [userId, initializePosts]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-destructive text-center">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return <UserProfileClient userId={userId} profileUser={profileUser} />;
}
