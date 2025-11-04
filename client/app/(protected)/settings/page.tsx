'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Globe, Palette, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profile_picture: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Initialize form data with user info
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        profile_picture: user.profile_picture || '',
      });
    }
  }, [user]);

  // Handle form change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put('/users/profile', {
        user: formData,
      });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_picture">Profile Picture URL</Label>
                  <Input
                    id="profile_picture"
                    name="profile_picture"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.profile_picture}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize how SyncSpace looks for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Language</CardTitle>
              </div>
              <CardDescription>
                Select your preferred language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your language
                  </p>
                </div>
                <LanguageSelector />
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
