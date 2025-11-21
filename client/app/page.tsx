'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  LogIn,
  UserPlus,
  Zap,
  MessageSquare,
  Heart,
  Bell,
  Users,
  Globe,
  Shield,
  Rocket,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal, openRegisterModal } = useAuthModal();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle auth query parameter to auto-open modals
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login') {
      openLoginModal();
      // Clean up the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    } else if (authParam === 'register') {
      openRegisterModal();
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, openLoginModal, openRegisterModal]);

  // Redirect authenticated users to feed
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Return null while redirecting authenticated users
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Rocket className="h-4 w-4" />
              Welcome to the future of social
            </div>

            {/* Logo/Brand */}
            <div className="flex items-center justify-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Zap className="h-12 w-12 text-primary-foreground" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                SyncSpace
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect, share, and engage with a community that moves at the speed of your ideas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="gap-2 px-8 h-14 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={openRegisterModal}
              >
                <UserPlus className="h-5 w-5" />
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-8 h-14 text-base font-semibold"
                onClick={openLoginModal}
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Free to use
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No ads
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Real-time sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Everything you need to connect
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help you share ideas, build relationships, and stay in sync.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Rich Discussions</h3>
                  <p className="text-muted-foreground">
                    Engage in meaningful conversations with nested comments and threaded replies.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Expressive Reactions</h3>
                  <p className="text-muted-foreground">
                    Show your appreciation with multiple reaction types on posts and comments.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Real-time Updates</h3>
                  <p className="text-muted-foreground">
                    Stay informed with instant notifications and live feed updates.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">User Profiles</h3>
                  <p className="text-muted-foreground">
                    Customize your profile, track your activity, and build your presence.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Tag Discovery</h3>
                  <p className="text-muted-foreground">
                    Find content that matters with organized tags and powerful search.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Secure Platform</h3>
                  <p className="text-muted-foreground">
                    Your data is protected with modern authentication and security practices.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Get started in minutes
              </h2>
              <p className="text-lg text-muted-foreground">
                Join the community in three simple steps
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-lg font-semibold">Create Account</h3>
                <p className="text-muted-foreground text-sm">
                  Sign up with your email and set up your profile in seconds.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-lg font-semibold">Share Content</h3>
                <p className="text-muted-foreground text-sm">
                  Create posts, add images, and tag your content for discovery.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-lg font-semibold">Engage & Connect</h3>
                <p className="text-muted-foreground text-sm">
                  React, comment, and build relationships with the community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 md:p-12 text-center space-y-6 relative">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">
                  Ready to join the conversation?
                </h3>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Create your free account today and start connecting with a community that values meaningful interactions.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button
                    size="lg"
                    className="gap-2 px-8 h-12 font-semibold"
                    onClick={openRegisterModal}
                  >
                    <UserPlus className="h-5 w-5" />
                    Create Free Account
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 h-12"
                    onClick={openLoginModal}
                  >
                    Already a member? Sign in
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold">SyncSpace</span>
            </div>
            <p>© {new Date().getFullYear()} SyncSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
