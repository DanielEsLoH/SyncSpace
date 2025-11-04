"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Search,
  Bell,
  Plus,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  onCreatePost?: () => void;
  notificationCount?: number;
}

export function Navigation({
  onCreatePost,
  notificationCount = 0,
}: NavigationProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { href: "/feed", label: "Feed", icon: Home },
    // Conditionally render 'My Posts' link to point to user's profile
    ...(user
      ? [{ href: `/users/${user.id}`, label: "My Posts", icon: FileText }]
      : []),
    { href: "/search", label: "Search", icon: Search },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: notificationCount,
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                S
              </span>
            </div>
            <span className="text-xl font-bold hidden sm:inline">
              SyncSpace
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 relative",
                      isActive && "font-semibold"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                    {link.badge && link.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {link.badge > 99 ? "99+" : link.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Create Post Button */}
            <Button size="sm" onClick={onCreatePost} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">New Post</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profile_picture} alt={user?.name} />
                    <AvatarFallback>
                      {user ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture} alt={user?.name} />
                    <AvatarFallback>
                      {user ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {/* Removed redundant Profile link, 'My Posts' now serves this */}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button size="sm" onClick={onCreatePost} className="h-9 w-9 p-0">
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9 p-0"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 relative",
                      isActive && "font-semibold"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                    {link.badge && link.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {link.badge > 99 ? "99+" : link.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}

            <div className="pt-2 border-t space-y-2">
              {/* Removed redundant Profile link, 'My Posts' now serves this */}
              <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* User Info in Mobile Menu */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profile_picture} alt={user?.name} />
                  <AvatarFallback>
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
