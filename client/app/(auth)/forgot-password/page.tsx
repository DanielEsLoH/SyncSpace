'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });
      setIsSuccess(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to send reset instructions';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive password reset instructions
          </CardDescription>
        </CardHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                <Mail className="h-4 w-4" />
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
              <Link
                href="/login"
                className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you will receive
                password reset instructions shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Check your email and follow the link to reset your password.
              </p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
