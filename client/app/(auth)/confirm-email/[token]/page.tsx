'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { authService, tokenStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmEmailPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function ConfirmEmailPage({ params }: ConfirmEmailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = resolvedParams.token;

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        setIsLoading(true);
        const response = await authService.confirmEmail(token);

        // Store the token and user data
        tokenStorage.setToken(response.token);
        tokenStorage.setUser(response.user);

        setIsSuccess(true);
        setError(null);

        // Redirect to feed after 2 seconds with full page reload
        // This ensures the AuthContext picks up the stored credentials
        setTimeout(() => {
          window.location.href = '/feed';
        }, 2000);
      } catch (err: any) {
        console.error('Failed to confirm email:', err);
        setError(
          err.response?.data?.error || 'Failed to confirm email. The link may be invalid or expired.'
        );
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      confirmEmail();
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            Email Confirmation
          </CardTitle>
          <CardDescription className="text-center">
            {isLoading && 'Confirming your email...'}
            {!isLoading && isSuccess && 'Your email has been confirmed!'}
            {!isLoading && !isSuccess && 'Confirmation failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {isLoading && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Please wait while we confirm your email...
                </p>
              </div>
            )}

            {!isLoading && isSuccess && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Email confirmed successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting you to the feed...
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !isSuccess && error && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-destructive">
                    Confirmation Failed
                  </p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={() => router.push('/login')} className="mt-4">
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
