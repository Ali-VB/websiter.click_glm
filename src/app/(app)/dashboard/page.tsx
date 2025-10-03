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
import { 
  FolderOpen, 
  FileText, 
  HelpCircle, 
  Upload, 
  CreditCard, 
  Bell,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Star
} from "lucide-react";

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
  due_date?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
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
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

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
        const unreadCount = notificationsData.notifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unreadCount);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Calculate statistics
  const projectStats = {
    total: projects.length,
    pending: projects.filter(p => p.status === "pending").length,
    inProgress: projects.filter(p => p.status === "in_progress").length,
    completed: projects.filter(p => p.status === "completed").length,
  };

  const invoiceStats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "pending_payment").length,
    paid: invoices.filter(i => i.status === "paid").length,
    totalAmount: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
  };

  const ticketStats = {
    open: supportTickets.filter(t => t.status === "open").length,
    inProgress: supportTickets.filter(t => t.status === "in_progress").length,
    resolved: supportTickets.filter(t => t.status === "resolved").length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

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
      case "pending_payment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // Check if client can create a new project
  const hasActiveProject = projects.some(p => 
    p.status === "in_progress" || p.status === "pending"
  );

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
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {userData?.name || 'Client'}!</h1>
                <p className="text-muted-foreground text-lg">
                  Here's what's happening with your website projects.
                </p>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => router.push('/dashboard/projects')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {projectStats.completed} completed
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => router.push('/dashboard/invoices')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{invoiceStats.pending}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(invoiceStats.totalAmount)} total
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => router.push('/dashboard/support')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ticketStats.open + ticketStats.inProgress}</div>
                    <p className="text-xs text-muted-foreground">
                      {ticketStats.resolved} resolved
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => router.push('/dashboard/notifications')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{unreadCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {notifications.length} total
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Getting Started Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Getting Started Guide
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to get your website project up and running
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Create Your Project</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Start by telling us about your website requirements and goals.
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => router.push('/onboarding')}
                          disabled={hasActiveProject}
                        >
                          {hasActiveProject ? 'Project in Progress' : 'Create Project'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        projectStats.total > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {projectStats.total > 0 ? <CheckCircle className="h-4 w-4" /> : '2'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Review & Approval</h3>
                        <p className="text-sm text-muted-foreground">
                          Our team reviews your requirements and creates a project plan.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        invoiceStats.total > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {invoiceStats.total > 0 ? <CheckCircle className="h-4 w-4" /> : '3'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Payment & Invoice</h3>
                        <p className="text-sm text-muted-foreground">
                          Review and pay the project invoice to begin development.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        projectStats.inProgress > 0 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {projectStats.inProgress > 0 ? <Clock className="h-4 w-4" /> : '4'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Development</h3>
                        <p className="text-sm text-muted-foreground">
                          Our team builds your website with regular updates and communication.
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        projectStats.completed > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {projectStats.completed > 0 ? <CheckCircle className="h-4 w-4" /> : '5'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Launch & Support</h3>
                        <p className="text-sm text-muted-foreground">
                          Your website goes live! We provide ongoing support and maintenance.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                    <CardDescription>
                      Get support from our team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => router.push('/dashboard/support')}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Create Support Ticket
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">Upload Files</CardTitle>
                    <CardDescription>
                      Share assets and content for your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => router.push('/dashboard/assets')}>
                      <Upload className="mr-2 h-4 w-4" />
                      Manage Assets
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">Account Settings</CardTitle>
                    <CardDescription>
                      Manage your profile and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => router.push('/dashboard/account')}>
                      <Users className="mr-2 h-4 w-4" />
                      Update Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates on your projects and communications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated {new Date(project.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                    
                    {projects.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No projects yet. Start by creating your first project!</p>
                      </div>
                    )}
                  </div>
                  
                  {projects.length > 0 && (
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/projects')}>
                        View All Projects
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
