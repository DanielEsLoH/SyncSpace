'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema, type PasswordFormData } from '@/lib/validations/settings';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * PasswordChangeForm Component
 *
 * Client Component for changing user password with:
 * - Comprehensive password validation
 * - Real-time strength indicator
 * - Show/hide password toggles
 * - Separate form submission (independent of profile)
 * - Password confirmation matching
 * - Form reset on success
 * - Accessible form controls
 */
export function PasswordChangeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      password_confirmation: '',
    },
  });

  // Watch new password for strength indicator
  const newPassword = watch('new_password');

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);

    try {
      // Call password change endpoint
      await api.put('/users/password', {
        current_password: data.current_password,
        password: data.new_password,
        password_confirmation: data.password_confirmation,
      });

      // Reset form on success
      reset();
      toast.success('Password changed successfully!');
    } catch (error: any) {
      console.error('Failed to change password:', error);

      // Handle specific error messages
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Failed to change password';

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>Change Password</CardTitle>
        </div>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password">
              Current Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                disabled={isSubmitting}
                {...register('current_password')}
                className={errors.current_password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-sm text-red-500">
                {errors.current_password.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password">
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                disabled={isSubmitting}
                {...register('new_password')}
                className={errors.new_password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-sm text-red-500">
                {errors.new_password.message}
              </p>
            )}

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={newPassword || ''} />
          </div>

          {/* Password Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                disabled={isSubmitting}
                {...register('password_confirmation')}
                className={
                  errors.password_confirmation ? 'border-red-500 pr-10' : 'pr-10'
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm text-red-500">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>

            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Security Note */}
          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Security Tip:</strong> Use a strong, unique password that
              you don't use on other websites. Consider using a password manager.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
