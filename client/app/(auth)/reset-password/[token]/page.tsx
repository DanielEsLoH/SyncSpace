'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
import { Lock, Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';

interface ResetPasswordPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });

  const token = resolvedParams.token;

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const strength = {
      hasMinLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };

    const score = Object.values(strength).filter(Boolean).length;
    return { ...strength, score };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.password_confirmation && formData.password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword({
        token,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      // Backend returns tokens, so store them and log the user in
      if (response.token && response.user) {
        const { tokenStorage } = await import('@/lib/auth');
        tokenStorage.setToken(response.token);
        tokenStorage.setUser(response.user);

        toast.success('Password reset successfully! Redirecting...');

        // Use full page reload to ensure AuthContext picks up the credentials
        setTimeout(() => {
          window.location.href = '/feed';
        }, 1000);
      } else {
        toast.success('Password reset successfully!');
        router.push('/login');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-muted">
        <CardHeader className="space-y-3 pb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ring-8 ring-primary/5">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center text-base">
            Choose a strong password to secure your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-md border border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Password Requirements:
                  </div>
                  <div className="space-y-1.5">
                    <PasswordRequirement
                      met={passwordStrength.hasMinLength}
                      text="At least 6 characters"
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasUpperCase}
                      text="One uppercase letter"
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasLowerCase}
                      text="One lowercase letter"
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasNumber}
                      text="One number"
                    />
                  </div>
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          level <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? 'bg-red-500'
                              : passwordStrength.score === 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password match indicator */}
              {formData.password_confirmation && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  {passwordsMatch ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-500">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-500">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full gap-2 h-11 text-base font-medium"
              disabled={isLoading || !passwordStrength.hasMinLength || !passwordsMatch}
            >
              <Lock className="h-5 w-5" />
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className={met ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );
}
