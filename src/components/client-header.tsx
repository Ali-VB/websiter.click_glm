"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Menu,
  Bell,
  BellRing,
  Search,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Check,
  X,
  RotateCcw,
  CheckCheck,
  Circle,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/logo";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  sent_at: string;
}

interface ClientHeaderProps {
  onMenuToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  unreadNotifications: number;
  onLogout: () => void;
  onNavigateToNotifications?: () => void;
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
  onLogout,
  onNavigateToNotifications
}: ClientHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    if (loadingNotifications) return;

    setLoadingNotifications(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [loadingNotifications]);

  // Handle notification dropdown toggle
  const handleNotificationToggle = useCallback(() => {
    const newState = !showNotifications;
    setShowNotifications(newState);

    if (newState && notifications.length === 0) {
      fetchNotifications();
    }
  }, [showNotifications, notifications.length, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
          );
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark notification as unread
  const markAsUnread = useCallback(async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`/api/notifications/${id}/unread`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: false } : n)
          );
        }
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`/api/notifications/${id}/dismiss`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      console.log('Header: Marking all notifications as read...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/notifications/read-all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Header: Mark all as read response:', data);

          // Refresh notifications from server to ensure persistence
          const notificationsResponse = await fetch('/api/notifications', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            console.log('Header: Refreshed notifications:', notificationsData.notifications);
            setNotifications(notificationsData.notifications || []);
          }
        }
      }
    } catch (error) {
      console.error('Header: Error marking all notifications as read:', error);
    }
  }, []);

  // Mark all as unread
  const markAllAsUnread = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/notifications/unread-all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setNotifications(prev =>
            prev.map(n => ({ ...n, read: false }))
          );
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as unread:', error);
    }
  }, []);

  // Dismiss all notifications
  const dismissAllNotifications = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await Promise.all(
          unreadNotifications.map(notification =>
            fetch(`/api/notifications/${notification.id}/dismiss`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            })
          )
        );

        setNotifications(prev => prev.filter(n => n.read));
      }
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }, [notifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format notification time
  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Bell className="h-4 w-4" />;
      case 'project':
        return <CheckCheck className="h-4 w-4" />;
      case 'invoice':
        return <Circle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

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
              className="pl-10 asana-card border-0 bg-muted/50 focus:bg-background transition-all duration-200"
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
          <div className="relative" ref={notificationDropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotificationToggle}
              className="relative"
            >
              {unreadNotifications > 0 ? (
                <BellRing className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
            {unreadNotifications > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground animate-pulse"
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 max-h-[500px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <div className="flex gap-1">
                    {notifications.some(n => !n.read) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-8 px-2"
                      >
                        <Check className="h-3 w-3" />
                        <span className="sr-only">Mark all read</span>
                      </Button>
                    )}
                    {notifications.some(n => n.read) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsUnread}
                        className="h-8 px-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span className="sr-only">Mark all unread</span>
                      </Button>
                    )}
                    {notifications.filter(n => !n.read).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={dismissAllNotifications}
                        className="h-8 px-2 text-destructive"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Dismiss all</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center">
                      <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-muted/30' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Notification Icon */}
                            <div className={`mt-1 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`}>
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} truncate`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatNotificationTime(notification.sent_at)}
                                </span>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>

                                                      </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && onNavigateToNotifications && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigateToNotifications();
                      }}
                      className="w-full"
                    >
                      View All Notifications
                    </Button>
                  </div>
                )}
              </div>
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
