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
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-muted">
        <CardHeader className="space-y-3 pb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ring-8 ring-primary/5">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-center text-base">
            No worries! Enter your email and we'll send you reset instructions
          </CardDescription>
        </CardHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  We'll send password reset instructions to this email
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full gap-2 h-11 text-base font-medium"
                disabled={isLoading}
              >
                <Mail className="h-5 w-5" />
                {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
              </Button>
              <Link
                href="/login"
                className="text-sm text-primary hover:underline flex items-center gap-1.5 mx-auto transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardContent className="space-y-6 pb-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center ring-8 ring-green-100/50 dark:ring-green-900/20">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Check Your Email</h3>
                  <p className="text-muted-foreground">
                    We've sent password reset instructions to
                  </p>
                  <p className="text-foreground font-medium">{email}</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                  <p>• Check your inbox and spam folder</p>
                  <p>• Click the reset link in the email</p>
                  <p>• The link expires in 1 hour</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-0">
              <Button asChild className="w-full h-11" variant="outline">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Login
                </Link>
              </Button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Didn't receive the email? Try again
              </button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
