'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AssetUpload from "@/components/AssetUpload";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { useTheme } from "@/components/theme-provider";
import { Bell } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  project_id: string;
  amount: number;
  status: "draft" | "pending_payment" | "paid" | "cancelled";
  created_at: string;
  updated_at: string;
  due_date?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  created_at: string;
  updated_at: string;
  replies: Array<{
    id: string;
    message: string;
    created_at: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  read: boolean;
  type: "system" | "project" | "invoice" | "support";
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Get active tab from URL params on initial load
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle navigation from sidebar
  const handleSidebarNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  }, []);

  const fetchDashboardData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Fetch projects
      const projectsResponse = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }

      // Fetch invoices
      const invoicesResponse = await fetch("/api/invoices", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices || []);
      }

      // Fetch support tickets
      const ticketsResponse = await fetch("/api/support", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setSupportTickets(ticketsData.tickets || []);
      }

      // Fetch notifications
      const notificationsResponse = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
        setUnreadCount(notificationsData.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (err) {
      setError("An error occurred while loading your dashboard");
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        fetchDashboardData(session.access_token);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "pending_payment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    pending: projects.filter(p => p.status === "pending").length,
    inProgress: projects.filter(p => p.status === "in_progress").length,
    completed: projects.filter(p => p.status === "completed").length,
  };

  // Calculate invoice statistics
  const invoiceStats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "pending_payment").length,
    paid: invoices.filter(i => i.status === "paid").length,
    totalAmount: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/dismiss`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === id);
        setNotifications(notifications.filter(n => n.id !== id));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
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
        unreadNotifications={unreadCount}
        projectsCount={projectStats.total}
        invoicesCount={invoiceStats.total}
        onNavigate={handleSidebarNavigate}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <ClientHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDark}
          onThemeToggle={handleThemeToggle}
          unreadNotifications={unreadCount}
          onLogout={handleLogout}
        />

        {/* Dashboard Content */}
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" aria-label="Loading dashboard content"></div>
              <span className="sr-only">Loading dashboard content</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Page Title */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your projects and invoices
                </p>
              </div>

              {/* Dashboard Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <div className="w-4 h-4 text-muted-foreground">📁</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {projectStats.completed} completed
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <div className="w-4 h-4 text-muted-foreground">⏳</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectStats.inProgress}</div>
                    <p className="text-xs text-muted-foreground">
                      {projectStats.pending} pending
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <div className="w-4 h-4 text-muted-foreground">📄</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{invoiceStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {invoiceStats.paid} paid
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    <div className="w-4 h-4 text-muted-foreground">💰</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(invoiceStats.totalAmount)}</div>
                    <p className="text-xs text-muted-foreground">
                      {invoiceStats.pending} pending payment
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Dynamic Content Area */}
              <div className="space-y-4">
                {activeTab === 'projects' && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Your Projects</CardTitle>
                          <CardDescription>
                            View and manage all your website projects
                          </CardDescription>
                        </div>
                        <Button asChild>
                          <Link href="/onboarding">New Project</Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {projects.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">You don't have any projects yet.</p>
                          <Button asChild>
                            <Link href="/onboarding">Create Your First Project</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full" aria-label="Projects table">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4" scope="col">Project Name</th>
                                <th className="text-left py-3 px-4" scope="col">Description</th>
                                <th className="text-left py-3 px-4" scope="col">Status</th>
                                <th className="text-left py-3 px-4" scope="col">Created</th>
                                <th className="text-left py-3 px-4" scope="col">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projects.map((project) => (
                                <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                                  <td className="py-3 px-4 font-medium">{project.name}</td>
                                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                                    {project.description}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className={getStatusColor(project.status)}>
                                      {project.status.replace("_", " ")}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">{formatDate(project.created_at)}</td>
                                  <td className="py-3 px-4">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/projects/${project.id}`} aria-label={`View details for project ${project.name}`}>View</Link>
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
                )}
                
                {activeTab === 'timeline' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Timeline</CardTitle>
                      <CardDescription>
                        Track the progress and milestones of your projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {projects.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No projects to display in timeline.</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {projects.map((project, index) => (
                            <div key={project.id} className="flex">
                              <div className="flex flex-col items-center mr-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  project.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                  project.status === "in_progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                  project.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                }`}>
                                  {project.status === "completed" ? "✓" :
                                   project.status === "in_progress" ? "→" :
                                   project.status === "pending" ? "!" : "✗"}
                                </div>
                                {index < projects.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                                )}
                              </div>
                              <div className="pb-8 flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold">{project.name}</h3>
                                  <Badge variant="outline" className={getStatusColor(project.status)}>
                                    {project.status.replace("_", " ")}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground mt-1">{project.description}</p>
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <span className="font-medium">Created:</span>
                                    <span className="ml-2">{formatDate(project.created_at)}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <span className="font-medium">Last Updated:</span>
                                    <span className="ml-2">{formatDate(project.updated_at)}</span>
                                  </div>
                                </div>
                                
                                <div className="mt-4">
                                  <Button variant="outline" size="sm" asChild>
                                      <Link href={`/projects/${project.id}`} aria-label={`View details for project ${project.name}`}>View Details</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'assets' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Upload</CardTitle>
                      <CardDescription>
                        Upload files, images, and content for your projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {projects.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">You need to create a project before uploading assets.</p>
                          <Button asChild>
                            <Link href="/onboarding">Create Your First Project</Link>
                          </Button>
                        </div>
                      ) : (
                        <AssetUpload projects={projects} />
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'support' && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Support Tickets</CardTitle>
                          <CardDescription>
                            Create and track your support requests
                          </CardDescription>
                        </div>
                        <Button>New Ticket</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Ticket Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                                  <p className="text-2xl font-bold">
                                    {supportTickets.filter(t => t.status === "open").length}
                                  </p>
                                </div>
                                <div className="w-8 h-8 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full flex items-center justify-center">
                                  !
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">In Progress</p>
                                  <p className="text-2xl font-bold">
                                    {supportTickets.filter(t => t.status === "in_progress").length}
                                  </p>
                                </div>
                                <div className="w-8 h-8 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center">
                                  →
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">Resolved</p>
                                  <p className="text-2xl font-bold">
                                    {supportTickets.filter(t => t.status === "resolved").length}
                                  </p>
                                </div>
                                <div className="w-8 h-8 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full flex items-center justify-center">
                                  ✓
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {/* Tickets List */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Recent Tickets</h3>
                          
                          {supportTickets.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">You don't have any support tickets yet.</p>
                                    <Button className="mt-4" aria-label="Create your first support ticket">Create Your First Ticket</Button>
                            </div>
                          ) : (
                            supportTickets.slice(0, 3).map((ticket) => (
                              <Card key={ticket.id}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium">{ticket.subject}</h4>
                                        <Badge
                                          variant="outline"
                                          className={
                                            ticket.priority === "high" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                            ticket.priority === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          }
                                        >
                                          {ticket.priority}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className={
                                            ticket.status === "open" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                            ticket.status === "in_progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                            ticket.status === "resolved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                          }
                                        >
                                          {ticket.status.replace("_", " ")}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {ticket.replies && ticket.replies.length > 0 ? ticket.replies[0].message : "No description"}
                                      </p>
                                      <div className="flex items-center text-xs text-muted-foreground space-x-4">
                                        <span>Category: {ticket.category}</span>
                                        <span>Created: {formatDate(ticket.created_at)}</span>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">View Details</Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'account' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account preferences and security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Profile Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Profile Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              defaultValue="client@example.com"
                              disabled
                              aria-describedby="email-help"
                            />
                            <p id="email-help" className="text-xs text-muted-foreground">Contact support to change your email</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" type="text" defaultValue="John Doe" />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Password Management */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Password Management</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                              id="current-password"
                              type="password"
                              aria-describedby="current-password-help"
                            />
                            <p id="current-password-help" className="text-xs text-muted-foreground">Enter your current password to change it</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                aria-describedby="new-password-help"
                              />
                              <p id="new-password-help" className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">Confirm New Password</Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                aria-describedby="confirm-password-help"
                              />
                              <p id="confirm-password-help" className="text-xs text-muted-foreground">Re-enter your new password</p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button aria-label="Update your password">Update Password</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'invoices' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Invoices</CardTitle>
                      <CardDescription>
                        View and manage all your invoices and payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {invoices.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">You don't have any invoices yet.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4">Invoice ID</th>
                                <th className="text-left py-3 px-4">Project</th>
                                <th className="text-left py-3 px-4">Amount</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Date</th>
                                <th className="text-left py-3 px-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoices.map((invoice) => {
                                const project = projects.find(p => p.id === invoice.project_id);
                                return (
                                  <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                                    <td className="py-3 px-4 font-medium">#{invoice.id}</td>
                                    <td className="py-3 px-4">{project?.name || "Unknown Project"}</td>
                                    <td className="py-3 px-4">{formatCurrency(invoice.amount)}</td>
                                    <td className="py-3 px-4">
                                      <Badge variant="outline" className={getStatusColor(invoice.status)}>
                                        {invoice.status.replace("_", " ")}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4">{formatDate(invoice.created_at)}</td>
                                    <td className="py-3 px-4">
                                      {invoice.status === "pending_payment" && (
                                        <Button size="sm">Pay Now</Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-2"
                                        onClick={() => setSelectedInvoice(invoice)}
                                      >
                                        View Details
                                      </Button>
                                      <Button variant="outline" size="sm" className="ml-2">
                                        Download PDF
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'notifications' && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Notifications</CardTitle>
                          <CardDescription>
                            View and manage your notifications
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {unreadCount} unread
                          </span>
                          <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>Mark All as Read</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Recent Notifications</h3>
                          
                          {notifications.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">You don't have any notifications yet.</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <Card 
                                key={notification.id} 
                                className={`transition-colors ${!notification.read ? 'bg-muted/30 border-l-4 border-l-primary' : ''}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium">{notification.title}</h4>
                                        <Badge
                                          variant="outline"
                                          className={
                                            notification.type === "system" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                            notification.type === "project" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                            notification.type === "invoice" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                          }
                                        >
                                          {notification.type}
                                        </Badge>
                                        {!notification.read && (
                                          <Badge className="bg-destructive text-destructive-foreground">New</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center text-xs text-muted-foreground">
                                        <span>Sent: {formatDate(notification.sent_at)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {!notification.read && (
                                        <Button variant="outline" size="sm" onClick={() => markNotificationAsRead(notification.id)}>Mark as Read</Button>
                                      )}
                                      <Button variant="outline" size="sm" onClick={() => dismissNotification(notification.id)}>Dismiss</Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
          aria-describedby="invoice-modal-description"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle id="invoice-modal-title">Invoice #{selectedInvoice.id}</CardTitle>
                  <CardDescription id="invoice-modal-description">
                    Detailed invoice information
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                  aria-label="Close invoice details"
                >
                  &times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">websiter.click</h3>
                  <p className="text-sm text-muted-foreground">Website Development Services</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Invoice Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedInvoice.created_at)}</p>
                  {selectedInvoice.due_date && (
                    <>
                      <p className="font-medium mt-2">Due Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedInvoice.due_date)}</p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bill To */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Bill To</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="font-medium">Client Name</p>
                  <p className="text-sm text-muted-foreground">client@example.com</p>
                  <p className="text-sm text-muted-foreground">123 Client Street, City, Country</p>
                </div>
              </div>
              
              {/* Project Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Project Information</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  {(() => {
                    const project = projects.find(p => p.id === selectedInvoice.project_id);
                    return project ? (
                      <>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className={getStatusColor(project.status)}>
                            {project.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Project information not available</p>
                    );
                  })()}
                </div>
              </div>
              
              {/* Invoice Items */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Invoice Items</h3>
                <div className="border border-input rounded-md">
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-input font-medium">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-3 text-right">Qty</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-input">
                    <div className="col-span-6">Website Development</div>
                    <div className="col-span-3 text-right">1</div>
                    <div className="col-span-3 text-right">{formatCurrency(selectedInvoice.amount)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-input">
                    <div className="col-span-6">GST (5%)</div>
                    <div className="col-span-3 text-right">1</div>
                    <div className="col-span-3 text-right">{formatCurrency(selectedInvoice.amount * 0.05)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium">
                    <div className="col-span-9 text-right">Total</div>
                    <div className="col-span-3 text-right">{formatCurrency(selectedInvoice.amount * 1.05)}</div>
                  </div>
                </div>
              </div>
              
              {/* Payment Status */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Status</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status.replace("_", " ")}
                  </Badge>
                  {selectedInvoice.status === "paid" && (
                    <p className="text-sm text-muted-foreground">Paid on {formatDate(selectedInvoice.updated_at)}</p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-input">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                <div className="space-x-2">
                  {selectedInvoice.status === "pending_payment" && (
                    <Button>Pay Now</Button>
                  )}
                  <Button variant="outline">Download PDF</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
