'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { useTheme } from "@/components/theme-provider";
import SupportTicketModal from "@/components/SupportTicketModal";
import { HelpCircle, Plus, MessageSquare, Clock } from "lucide-react";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  replies?: Array<{
    id: string;
    message: string;
    created_at: string;
    is_admin: boolean;
  }>;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const fetchSupportData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Fetch support tickets
      const ticketsResponse = await fetch("/api/support", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets || []);
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

      // Fetch notifications for header
      const notificationsResponse = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const unreadCount = notificationsData.notifications.filter((n: { read: boolean }) => !n.read).length;
        setUnreadNotifications(unreadCount);
      }

    } catch (err) {
      setError("An error occurred while loading your support tickets");
      console.error("Support error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        fetchSupportData(session.access_token);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, fetchSupportData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTicketCreated = async () => {
    setShowTicketModal(false);
    // Refresh tickets after creating a new one
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetchSupportData(session.access_token);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <ClientSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isDarkMode={isDark}
        onThemeToggle={handleThemeToggle}
        unreadNotifications={unreadNotifications}
        projectsCount={0}
        invoicesCount={0}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <ClientHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDark}
          onThemeToggle={handleThemeToggle}
          unreadNotifications={unreadNotifications}
          onLogout={handleLogout}
        />

        {/* Support Content */}
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" aria-label="Loading support tickets"></div>
              <span className="sr-only">Loading support tickets</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
                  <p className="text-muted-foreground">
                    Get help from our support team and track your requests
                  </p>
                </div>
                <Button onClick={() => setShowTicketModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </div>

              {/* Support Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    How to Get Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        1
                      </div>
                      <h3 className="font-medium mb-2">Create a Ticket</h3>
                      <p className="text-sm text-muted-foreground">
                        Describe your issue in detail and provide relevant information
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        2
                      </div>
                      <h3 className="font-medium mb-2">We Review</h3>
                      <p className="text-sm text-muted-foreground">
                        Our support team reviews your ticket and responds within 24 hours
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        3
                      </div>
                      <h3 className="font-medium mb-2">Get Resolution</h3>
                      <p className="text-sm text-muted-foreground">
                        Work with our team to resolve your issue and mark as complete
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets List */}
              <Card>
                <CardContent className="p-0">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No support tickets yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Need help? Create your first support ticket and our team will assist you.
                      </p>
                      <Button onClick={() => setShowTicketModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Ticket
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full" aria-label="Support tickets table">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-4 px-6 font-medium" scope="col">Ticket ID</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Subject</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Status</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Priority</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Last Updated</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket) => (
                            <tr key={ticket.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-medium">#{ticket.id.slice(0, 8).toUpperCase()}</div>
                              </td>
                              <td className="py-4 px-6">
                                <div>
                                  <div className="font-medium">{ticket.subject}</div>
                                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {ticket.message}
                                  </div>
                                  {ticket.replies && ticket.replies.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                  {ticket.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(ticket.updated_at)}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/support/${ticket.id}`} aria-label={`View details for ticket ${ticket.id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ticket Statistics */}
              {tickets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                          <p className="text-2xl font-bold">{tickets.length}</p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Open</p>
                          <p className="text-2xl font-bold">{tickets.filter(t => t.status === "open").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center">
                          !
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                          <p className="text-2xl font-bold">{tickets.filter(t => t.status === "in_progress").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full flex items-center justify-center">
                          →
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                          <p className="text-2xl font-bold">{tickets.filter(t => t.status === "resolved").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSuccess={handleTicketCreated}
          projects={[]}
        />
      )}
    </div>
  );
}
