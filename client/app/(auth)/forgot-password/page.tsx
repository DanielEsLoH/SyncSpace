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
import { ArrowLeft, Mail, KeyRound, CheckCircle2, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-muted overflow-hidden">
        {/* Animated gradient overlay - only visible on success */}
        {isSuccess && (
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none animate-in fade-in duration-700" />
        )}

        <CardHeader className="space-y-3 pb-6 relative">
          {!isSuccess ? (
            <>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ring-8 ring-primary/5 transition-all duration-300 hover:ring-primary/10 hover:scale-105">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-center bg-linear-to-br from-foreground to-foreground/70 bg-clip-text">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-center text-base">
                No worries! Enter your email and we'll send you reset instructions
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto w-20 h-20 bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center ring-8 ring-green-100/50 dark:ring-green-900/20 animate-in zoom-in duration-500 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 animate-in zoom-in duration-700 delay-100" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-center text-base animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                We've sent you password reset instructions
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 transition-all duration-200 focus:pl-11"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-all duration-200 group-focus-within:left-3.5 group-focus-within:text-primary" />
                </div>
                <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-muted/30 border border-muted">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We'll send password reset instructions to this email address. The link will be valid for 1 hour.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full gap-2 h-11 text-base font-medium relative overflow-hidden group"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Mail className="h-5 w-5 relative z-10" />
                <span className="relative z-10">
                  {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
                </span>
              </Button>
              <Link
                href="/?auth=login"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1.5 mx-auto transition-all duration-200 hover:gap-2 group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardContent className="space-y-6 pb-6 relative">
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    We've sent password reset instructions to
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="text-foreground font-medium">{email}</p>
                  </div>
                </div>

                <div className="mt-6 bg-linear-to-br from-muted/50 to-muted/30 border border-border/50 rounded-xl p-5 text-left space-y-3 shadow-sm">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">1</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Check your inbox and spam folder for an email from SyncSpace
                    </p>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">2</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Click the secure reset link in the email
                    </p>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">3</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Create a new password (link expires in 1 hour)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-0 relative">
              <Button
                asChild
                className="w-full h-11 gap-2 group relative overflow-hidden"
                variant="outline"
              >
                <Link href="/?auth=login">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>Return to Login</span>
                </Link>
              </Button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 py-1"
              >
                Didn't receive the email? <span className="font-medium underline underline-offset-2">Try again</span>
              </button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
