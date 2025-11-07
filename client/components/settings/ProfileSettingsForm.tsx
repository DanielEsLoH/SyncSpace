'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@/types';
import { profileSchema, type ProfileFormData } from '@/lib/validations/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ProfileSettingsFormProps {
  user: User;
  onUpdate?: (user: User) => void;
}

/**
 * ProfileSettingsForm Component
 *
 * Client Component for editing user profile with:
 * - Comprehensive form validation using react-hook-form + Zod
 * - Real-time validation feedback
 * - Profile picture preview
 * - Character counter for bio
 * - Unsaved changes detection
 * - Optimistic UI updates
 * - Accessible form controls
 */
export function ProfileSettingsForm({ user, onUpdate }: ProfileSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [bioLength, setBioLength] = useState(user.bio?.length || 0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || '',
      profile_picture: user.profile_picture || '',
    },
  });

  // Watch for changes to enable unsaved changes warning
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  // Watch bio field for character count
  const bioValue = watch('bio');
  useEffect(() => {
    setBioLength(bioValue?.length || 0);
  }, [bioValue]);

  // Watch profile picture for preview
  const profilePictureUrl = watch('profile_picture');

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    try {
      const response = await api.put('/users/profile', {
        user: {
          name: data.name,
          bio: data.bio || null,
          profile_picture: data.profile_picture || null,
        },
      });

      // Update parent component with new user data
      if (onUpdate && response.data.user) {
        onUpdate(response.data.user);
      }

      // Reset form state to new values
      reset({
        name: data.name,
        bio: data.bio,
        profile_picture: data.profile_picture,
      });

      setHasUnsavedChanges(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          <CardTitle>Profile Settings</CardTitle>
        </div>
        <CardDescription>
          Update your profile information and customize your public appearance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={profilePictureUrl || user.profile_picture}
                alt={user.name}
              />
              <AvatarFallback className="text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">Profile Picture Preview</p>
              <p className="text-xs text-muted-foreground">
                Enter a valid image URL to see it here
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              disabled={isSubmitting}
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This is your display name visible to other users
            </p>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span
                className={`text-xs ${
                  bioLength > 500
                    ? 'text-red-500'
                    : bioLength > 450
                    ? 'text-yellow-500'
                    : 'text-muted-foreground'
                }`}
              >
                {bioLength}/500
              </span>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              rows={4}
              disabled={isSubmitting}
              {...register('bio')}
              className={errors.bio ? 'border-red-500' : ''}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Brief description for your profile. Markdown is supported.
            </p>
          </div>

          {/* Profile Picture Field */}
          <div className="space-y-2">
            <Label htmlFor="profile_picture">Profile Picture URL</Label>
            <Input
              id="profile_picture"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              disabled={isSubmitting}
              {...register('profile_picture')}
              className={errors.profile_picture ? 'border-red-500' : ''}
            />
            {errors.profile_picture && (
              <p className="text-sm text-red-500">
                {errors.profile_picture.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              URL to your profile picture. Leave empty for default avatar.
            </p>
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setHasUnsavedChanges(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}

            {hasUnsavedChanges && (
              <p className="text-sm text-yellow-600">You have unsaved changes</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
