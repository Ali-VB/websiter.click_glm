'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { useTheme } from "@/components/theme-provider";
import { Bell, BellRing, Check, CheckCircle, Clock, Info, AlertCircle, X } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchNotificationsData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Fetch notifications
      const notificationsResponse = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        // Filter out invalid notifications and normalize data
        const validNotifications = (notificationsData.notifications || [])
          .filter((n: any) => n && n.id && n.message)
          .map((n: any) => ({
            id: n.id,
            message: n.message || 'No message',
            is_read: Boolean(n.is_read),
            created_at: n.created_at || new Date().toISOString(),
            expires_at: n.expires_at
          }));
        setNotifications(validNotifications);
        const unreadCount = validNotifications.filter((n: Notification) => !n.is_read).length;
        setUnreadNotifications(unreadCount);
      } else {
        const errorData = await notificationsResponse.json();
        setError(errorData.message || 'Failed to load notifications');
      }

      // Fetch user profile
      const profileResponse = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserData(profileData.user);
      }

    } catch (err) {
      setError("An error occurred while loading your notifications");
      console.error("Notifications error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        fetchNotificationsData(session.access_token);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, fetchNotificationsData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
          );
          setUnreadNotifications(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch("/api/notifications/mark-all-read", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setNotifications(prev => 
            prev.map(n => ({ ...n, is_read: true }))
          );
          setUnreadNotifications(0);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to mark all as read');
        }
      }
    } catch (err) {
      setError("Failed to mark all notifications as read");
      console.error("Error marking all as read:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const notification = notifications.find(n => n.id === notificationId);
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          if (notification && !notification.is_read) {
            setUnreadNotifications(prev => Math.max(0, prev - 1));
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to delete notification');
        }
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const deleteAllNotifications = async () => {
    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch("/api/notifications/delete-all", {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setNotifications([]);
          setUnreadNotifications(0);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to delete all notifications");
        }
      }
    } catch (err) {
      setError("Failed to delete all notifications");
      console.error("Error deleting all notifications:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNotificationIcon = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('urgent') || lowerMessage.includes('important')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (lowerMessage.includes('admin')) {
      return <Info className="h-5 w-5 text-blue-500" />;
    } else {
      return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const unreadNotificationsList = notifications.filter(n => !n.is_read);
  const readNotificationsList = notifications.filter(n => n.is_read);

  return (
    <div className="min-h-screen bg-background">
      <ClientSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isDarkMode={isDark}
        onThemeToggle={handleThemeToggle}
        unreadNotifications={unreadNotifications}
        projectsCount={0}
        invoicesCount={0}
      />

      <div className="lg:pl-64">
        <ClientHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDark}
          onThemeToggle={handleThemeToggle}
          unreadNotifications={unreadNotifications}
          onLogout={handleLogout}
        />

        <main className="p-6">
          {error && (
            <div
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" aria-label="Loading notifications"></div>
              <span className="sr-only">Loading notifications</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                  <p className="text-muted-foreground">
                    Stay updated with your latest notifications and announcements
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifications > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={markAllAsRead}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Marking...' : 'Mark All as Read'}
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button 
                      variant="destructive" 
                      onClick={deleteAllNotifications}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Deleting...' : 'Delete All'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Notification Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                        <p className="text-2xl font-bold">{notifications.length}</p>
                      </div>
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Unread</p>
                        <p className="text-2xl font-bold text-blue-600">{unreadNotifications}</p>
                      </div>
                      <BellRing className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Read</p>
                        <p className="text-2xl font-bold text-green-600">{readNotificationsList.length}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Unread Notifications */}
              {unreadNotificationsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BellRing className="mr-2 h-5 w-5 text-blue-600" />
                      Unread Notifications ({unreadNotificationsList.length})
                    </CardTitle>
                    <CardDescription>
                      New notifications that require your attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {unreadNotificationsList.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="flex items-start space-x-3 p-4 border rounded-lg bg-blue-50 border-blue-200"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.message)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Read Notifications */}
              {readNotificationsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      Read Notifications ({readNotificationsList.length})
                    </CardTitle>
                    <CardDescription>
                      Previously viewed notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {readNotificationsList.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.message)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {notifications.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You're all caught up! New notifications will appear here.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}