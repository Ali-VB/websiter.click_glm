"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Menu, 
  Bell, 
  Search, 
  Sun, 
  Moon,
  ChevronDown,
  LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/logo";

interface ClientHeaderProps {
  onMenuToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  unreadNotifications: number;
  onLogout: () => void;
}

interface UserProfile {
  full_name?: string;
  email?: string;
}

export function ClientHeader({
  onMenuToggle,
  isDarkMode,
  onThemeToggle,
  unreadNotifications,
  onLogout
}: ClientHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user profile from metadata or fetch from profiles table
          const profile = user.user_metadata || {};
          setUserProfile({
            full_name: profile.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="mr-2 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo removed from header - already present in sidebar */}

        {/* Search bar */}
        <div className="flex flex-1 items-center space-x-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, invoices, support..."
              className="pl-10"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onThemeToggle}
            className="hidden sm:flex"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            {unreadNotifications > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {loading ? '...' : getInitials(userProfile.full_name || 'User')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-block text-sm">
                {loading ? 'Loading...' : userProfile.full_name || 'User'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover shadow-lg">
                <div className="p-2">
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar>
                      <AvatarFallback>
                        {loading ? '...' : getInitials(userProfile.full_name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {loading ? 'Loading...' : userProfile.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loading ? 'Loading...' : userProfile.email || ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t my-2" />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onThemeToggle}
                    className="w-full justify-start sm:hidden"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="w-full justify-start"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
