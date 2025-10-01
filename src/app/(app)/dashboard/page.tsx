'use client';


import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { realtime } from '@/lib/realtime';
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
import SupportTicketModal from "@/components/SupportTicketModal";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { useTheme } from "@/components/theme-provider";
import { Bell, Calendar, Clock, CheckCircle, CreditCard, Download, AlertCircle } from "lucide-react";

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

interface PaymentMethod {
  id: string;
  card_type: string;
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

interface PaymentWorkflow {
  id: string;
  project_id: string;
  invoice_id: string;
  payment_status: string;
  workflow_step: string;
  payment_confirmed_at?: string;
  development_started_at?: string;
  notes?: string;
}

interface Refund {
  id: string;
  invoice_id: string;
  project_id: string;
  amount: number;
  reason: string;
  status: string;
  processed_at?: string;
  notes?: string;
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
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [isSupportTicketModalOpen, setIsSupportTicketModalOpen] = useState(false);
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: string;
  } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isProfileUpdated, setIsProfileUpdated] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentWorkflows, setPaymentWorkflows] = useState<PaymentWorkflow[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

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

      // Fetch project assets (only if projects exist)
      if (projects.length > 0) {
        const assetsResponse = await fetch(`/api/assets?projectId=${projects[0].id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          // Store assets in state if needed for dashboard display
          console.log("Assets loaded:", assetsData.assets?.length || 0);
        }
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

  // Set up real-time notification subscription
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 3;

    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Setting up real-time notification subscription for user:', session.user.id);

        const channelName = `notifications_${session.user.id}_${Date.now()}`;

        // Subscribe to real-time notifications
        const channel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true },
              presence: { key: session.user.id },
            },
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${session.user.id}` // Correct column name from database schema
          }, (payload) => {
            console.log('🔔 New notification received via real-time:', payload);
            console.log('Notification details:', payload.new);

            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification('New Notification', {
                body: payload.new?.message || 'You have a new notification',
                icon: '/logo-black.png'
              });
            }

            // Refresh notifications when a new one is received
            fetchDashboardData(session.access_token);
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${session.user.id}` // Correct column name from database schema
          }, (payload) => {
            console.log('📝 Notification updated via real-time:', payload);
            // Refresh notifications when an existing one is updated
            fetchDashboardData(session.access_token);
          })
          .subscribe((status, err) => {
            console.log('Real-time subscription status:', status, err ? `Error: ${err}` : '');

            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to real-time notifications');
              setRealtimeStatus('connected');
              retryCount = 0; // Reset retry count on successful connection
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error(`❌ Real-time subscription failed (${status}):`, err);
              setRealtimeStatus('disconnected');

              // Implement retry logic
              if (retryCount < maxRetries) {
                retryCount++;
                const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10 seconds
                console.log(`🔄 Retrying real-time connection in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);

                retryTimeout = setTimeout(() => {
                  setupRealtimeSubscription();
                }, retryDelay);
              } else {
                console.error('❌ Max retry attempts reached for real-time subscription');
              }
            }
          });

        return () => {
          console.log('Cleaning up real-time subscription');
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
          supabase.removeChannel(channel);
        };
      } else {
        console.log('No session found, skipping real-time subscription');
        setRealtimeStatus('disconnected');
      }
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [fetchDashboardData]);

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

  // Check if client can create a new project (business rule: only one active project at a time)
  const hasActiveProject = projects.some(p => 
    p.status === "in_progress" || p.status === "pending"
  );

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

  // Timeline helper functions
  const getProjectProgress = (project: Project): number => {
    switch (project.status) {
      case "completed":
        return 100;
      case "in_progress":
        return 65;
      case "pending":
        return 25;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const generateProjectMilestones = (project: Project): Array<{
    name: string;
    completed: boolean;
    current: boolean;
  }> => {
    const baseMilestones = [
      { name: "Discovery", completed: true, current: false },
      { name: "Design", completed: project.status !== "pending", current: project.status === "pending" },
      { name: "Development", completed: project.status === "completed", current: project.status === "in_progress" },
      { name: "Testing", completed: project.status === "completed", current: false },
      { name: "Launch", completed: project.status === "completed", current: false },
    ];

    return baseMilestones;
  };

  const getTotalDuration = (): number => {
    if (projects.length === 0) return 0;
    
    const sortedProjects = [...projects].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstProject = sortedProjects[0];
    const lastProject = sortedProjects[sortedProjects.length - 1];
    
    const startDate = new Date(firstProject.created_at);
    const endDate = new Date(lastProject.updated_at);
    
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Support ticket modal handlers
  const handleOpenSupportTicketModal = () => {
    setIsSupportTicketModalOpen(true);
  };

  const handleCloseSupportTicketModal = () => {
    setIsSupportTicketModalOpen(false);
  };

  const handleSupportTicketSuccess = async () => {
    // Refresh support tickets data
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const ticketsResponse = await fetch("/api/support", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setSupportTickets(ticketsData.tickets || []);
      }
    }
  };

  // Fetch user profile data
  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setUserData(profileData.user);
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  }, []);

  // Update user profile
  const handleProfileUpdate = async (formData: FormData) => {
    setIsProfileLoading(true);
    setProfileError("");
    setIsProfileUpdated(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProfileError("Not authenticated");
        return;
      }

      const name = formData.get("name") as string;
      const phone = formData.get("phone") as string;

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUserData(updatedData.user);
        setIsProfileUpdated(true);
      } else {
        const errorData = await response.json();
        setProfileError(errorData.error || "Failed to update profile");
      }
    } catch (err) {
      setProfileError("An error occurred while updating profile");
      console.error("Profile update error:", err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (formData: FormData) => {
    setIsPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPasswordError("Not authenticated");
        return;
      }

      const currentPassword = formData.get("current-password") as string;
      const newPassword = formData.get("new-password") as string;
      const confirmPassword = formData.get("confirm-password") as string;

      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match");
        return;
      }

      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setPasswordSuccess("Password updated successfully");
        // Clear password fields
        const currentPasswordField = document.getElementById("current-password") as HTMLInputElement;
        const newPasswordField = document.getElementById("new-password") as HTMLInputElement;
        const confirmPasswordField = document.getElementById("confirm-password") as HTMLInputElement;
        if (currentPasswordField) currentPasswordField.value = "";
        if (newPasswordField) newPasswordField.value = "";
        if (confirmPasswordField) confirmPasswordField.value = "";
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.error || "Failed to update password");
      }
    } catch (err) {
      setPasswordError("An error occurred while changing password");
      console.error("Password change error:", err);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle invoice payment
  const handlePayInvoice = async (invoiceId: string) => {
    setIsPaymentLoading(true);
    setPaymentError("");
    setPaymentSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPaymentError("Not authenticated");
        return;
      }

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (response.ok) {
        const sessionData = await response.json();
        // Redirect to Stripe checkout
        if (sessionData.session?.url) {
          window.location.href = sessionData.session.url;
        } else {
          setPaymentError("Failed to create payment session");
        }
      } else {
        const errorData = await response.json();
        setPaymentError(errorData.message || "Failed to initiate payment");
      }
    } catch (err) {
      setPaymentError("An error occurred while initiating payment");
      console.error("Payment initiation error:", err);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Fetch user profile when component mounts and when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchUserProfile(session.access_token);
      }
    });

    // Fetch user profile if already authenticated
    const fetchInitialProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchUserProfile(session.access_token);
      }
    };
    fetchInitialProfile();

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

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
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
                    <p className="text-muted-foreground">
                      Manage your projects and invoices
                    </p>
                  </div>
                  {/* Real-time Connection Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      realtimeStatus === 'connected' ? 'bg-green-500' : 
                      realtimeStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-muted-foreground">
                      {realtimeStatus === 'connected' ? 'Real-time connected' : 
                       realtimeStatus === 'connecting' ? 'Connecting...' : 'Real-time disconnected'}
                    </span>
                  </div>
                </div>
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
                        <Button 
                          disabled={hasActiveProject}
                          title={hasActiveProject ? "You can only have one active project at a time" : ""}
                          onClick={() => {
                            if (hasActiveProject) {
                              alert("You can only have one active project at a time. Please complete or cancel your current project before starting a new one.");
                            } else {
                              router.push("/onboarding");
                            }
                          }}
                        >
                          New Project
                          {hasActiveProject && (
                            <span className="ml-2 text-xs">(Project in progress)</span>
                          )}
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
                                <th className="text-left py-3 px-4" scope="col">Owner</th>
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
                                    <div className="flex items-center space-x-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback>{userData?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                      </Avatar>
                                      <span>{userData?.name || 'Unknown User'}</span>
                                    </div>
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
                        <Button onClick={handleOpenSupportTicketModal}>New Ticket</Button>
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
                                    <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>View Details</Button>
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
                        <form action={handleProfileUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Email Address</Label>
                              <Input
                                id="email"
                                type="email"
                                defaultValue={userData?.email || ""}
                                disabled
                                aria-describedby="email-help"
                              />
                              <p id="email-help" className="text-xs text-muted-foreground">Contact support to change your email</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input 
                                id="name" 
                                name="name"
                                type="text" 
                                defaultValue={userData?.name || ""} 
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input 
                                id="phone" 
                                name="phone"
                                type="tel" 
                                defaultValue={userData?.phone || ""} 
                              />
                            </div>
                          </div>
                          
                          {profileError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                              {profileError}
                            </div>
                          )}
                          
                          {isProfileUpdated && (
                            <div className="p-3 bg-green-100 border border-green-200 rounded-md text-green-800 text-sm">
                              Profile updated successfully!
                            </div>
                          )}
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isProfileLoading}>
                              {isProfileLoading ? "Updating..." : "Update Profile"}
                            </Button>
                          </div>
                        </form>
                      </div>
                      
                      <Separator />
                      
                      {/* Password Management */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Password Management</h3>
                        <form action={handlePasswordChange} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                              id="current-password"
                              name="current-password"
                              type="password"
                              required
                              aria-describedby="current-password-help"
                            />
                            <p id="current-password-help" className="text-xs text-muted-foreground">Enter your current password to change it</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                name="new-password"
                                type="password"
                                required
                                minLength={8}
                                aria-describedby="new-password-help"
                              />
                              <p id="new-password-help" className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">Confirm New Password</Label>
                              <Input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                minLength={8}
                                aria-describedby="confirm-password-help"
                              />
                              <p id="confirm-password-help" className="text-xs text-muted-foreground">Re-enter your new password</p>
                            </div>
                          </div>
                          
                          {passwordError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                              {passwordError}
                            </div>
                          )}
                          
                          {passwordSuccess && (
                            <div className="p-3 bg-green-100 border border-green-200 rounded-md text-green-800 text-sm">
                              {passwordSuccess}
                            </div>
                          )}
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isPasswordLoading}>
                              {isPasswordLoading ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    {/* Payment Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
                          <div className="w-4 h-4 text-muted-foreground">📄</div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{invoiceStats.pending}</div>
                          <p className="text-xs text-muted-foreground">
                            Awaiting payment
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                          <div className="w-4 h-4 text-muted-foreground">💰</div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{invoiceStats.paid}</div>
                          <p className="text-xs text-muted-foreground">
                            Invoices paid
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
                          <div className="w-4 h-4 text-muted-foreground">💳</div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{paymentMethods.length}</div>
                          <p className="text-xs text-muted-foreground">
                            Saved methods
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Refunds</CardTitle>
                          <div className="w-4 h-4 text-muted-foreground">↩️</div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{refunds.filter(r => r.status === 'pending').length}</div>
                          <p className="text-xs text-muted-foreground">
                            In progress
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Outstanding Invoices Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Outstanding Invoices</CardTitle>
                        <CardDescription>
                          Pay these invoices to start your project development
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {invoices.filter(i => i.status === 'pending_payment').length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                            <p className="text-muted-foreground">No outstanding invoices. All payments are up to date!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {invoices.filter(i => i.status === 'pending_payment').map((invoice) => {
                              const project = projects.find(p => p.id === invoice.project_id);
                              return (
                                <div key={invoice.id} className="border border-input rounded-lg p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium">Invoice #{invoice.id}</h4>
                                        <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                          Pending Payment
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Project: {project?.name || "Unknown Project"}
                                      </p>
                                      <p className="text-lg font-semibold">{formatCurrency(invoice.amount)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Created: {formatDate(invoice.created_at)}
                                      </p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button 
                                        onClick={() => handlePayInvoice(invoice.id)}
                                        disabled={isPaymentLoading}
                                      >
                                        {isPaymentLoading ? "Processing..." : "Pay Now"}
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setSelectedInvoice(invoice)}
                                      >
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Methods Section */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>Saved Payment Methods</CardTitle>
                            <CardDescription>
                              Manage your saved payment methods for faster checkout
                            </CardDescription>
                          </div>
                          <Button>Add Payment Method</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {paymentMethods.length === 0 ? (
                          <div className="text-center py-8">
                            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">No saved payment methods yet.</p>
                            <Button>Add Your First Payment Method</Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {paymentMethods.map((method) => (
                              <div key={method.id} className="border border-input rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <CreditCard className="h-4 w-4" />
                                      <span className="font-medium capitalize">{method.card_type}</span>
                                      {method.is_default && (
                                        <Badge variant="outline" className="text-xs">Default</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      •••• •••• •••• {method.last_four}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Expires {method.expiry_month}/{method.expiry_year}
                                    </p>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button variant="outline" size="sm">Edit</Button>
                                    <Button variant="outline" size="sm">Remove</Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment History Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>
                          View all your past payments and transactions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {invoices.filter(i => i.status === 'paid').length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No payment history available.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4">Date</th>
                                  <th className="text-left py-3 px-4">Invoice</th>
                                  <th className="text-left py-3 px-4">Project</th>
                                  <th className="text-left py-3 px-4">Amount</th>
                                  <th className="text-left py-3 px-4">Status</th>
                                  <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoices.filter(i => i.status === 'paid').map((invoice) => {
                                  const project = projects.find(p => p.id === invoice.project_id);
                                  return (
                                    <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                                      <td className="py-3 px-4">{formatDate(invoice.updated_at)}</td>
                                      <td className="py-3 px-4 font-medium">#{invoice.id}</td>
                                      <td className="py-3 px-4">{project?.name || "Unknown Project"}</td>
                                      <td className="py-3 px-4 font-medium">{formatCurrency(invoice.amount)}</td>
                                      <td className="py-3 px-4">
                                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                          Paid
                                        </Badge>
                                      </td>
                                      <td className="py-3 px-4">
                                        <Button variant="outline" size="sm">
                                          <Download className="h-3 w-3 mr-1" />
                                          Receipt
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

                    {/* Refunds Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Refunds</CardTitle>
                        <CardDescription>
                          Track the status of your refund requests
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {refunds.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No refund requests found.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {refunds.map((refund) => {
                              const invoice = invoices.find(i => i.id === refund.invoice_id);
                              const project = projects.find(p => p.id === refund.project_id);
                              return (
                                    <div key={refund.id} className="border border-input rounded-lg p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <h4 className="font-medium">Refund #{refund.id}</h4>
                                            <Badge variant="outline" className={
                                              refund.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                              refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                              refund.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                            }>
                                              {refund.status}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground mb-1">
                                            Invoice: #{invoice?.id} | Project: {project?.name}
                                          </p>
                                          <p className="font-semibold">{formatCurrency(refund.amount)}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Reason: {refund.reason}
                                          </p>
                                          {refund.processed_at && (
                                            <p className="text-xs text-muted-foreground">
                                              Processed: {formatDate(refund.processed_at)}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex space-x-2">
                                          <Button variant="outline" size="sm">View Details</Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Status Messages */}
                    {paymentError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>{paymentError}</span>
                        </div>
                      </div>
                    )}
                    
                    {paymentSuccess && (
                      <div className="p-4 bg-green-100 border border-green-200 rounded-md text-green-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>{paymentSuccess}</span>
                        </div>
                      </div>
                    )}
                  </div>
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
                    </CardContent>
                  </Card>
                )}
                
                {activeTab === 'invoices' && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Your Invoices</CardTitle>
                          <CardDescription>
                            View and manage all your invoices
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {invoiceStats.pending} pending payment
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {invoices.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">You don't have any invoices yet.</p>
                            <p className="text-sm text-muted-foreground mt-2">Invoices will be created when your projects are approved.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full" aria-label="Invoices table">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4" scope="col">Invoice ID</th>
                                  <th className="text-left py-3 px-4" scope="col">Project</th>
                                  <th className="text-left py-3 px-4" scope="col">Amount</th>
                                  <th className="text-left py-3 px-4" scope="col">Status</th>
                                  <th className="text-left py-3 px-4" scope="col">Created</th>
                                  <th className="text-left py-3 px-4" scope="col">Due Date</th>
                                  <th className="text-left py-3 px-4" scope="col">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoices.map((invoice) => {
                                  const project = projects.find(p => p.id === invoice.project_id);
                                  return (
                                    <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                                      <td className="py-3 px-4 font-medium">#{invoice.id}</td>
                                      <td className="py-3 px-4">
                                        <div>
                                          <div className="font-medium">{project?.name || "Unknown Project"}</div>
                                          <div className="text-sm text-muted-foreground">{project?.description || "No description"}</div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 font-medium">{formatCurrency(invoice.amount)}</td>
                                      <td className="py-3 px-4">
                                        <Badge variant="outline" className={getStatusColor(invoice.status)}>
                                          {invoice.status.replace("_", " ")}
                                        </Badge>
                                      </td>
                                      <td className="py-3 px-4">{formatDate(invoice.created_at)}</td>
                                      <td className="py-3 px-4">
                                        {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex space-x-2">
                                          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                                            View Details
                                          </Button>
                                          {invoice.status === "pending_payment" && (
                                            <Button 
                                              size="sm" 
                                              onClick={() => handlePayInvoice(invoice.id)}
                                              disabled={isPaymentLoading}
                                            >
                                              {isPaymentLoading ? "Processing..." : "Pay Now"}
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
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
                  <p className="font-medium">{userData?.name || 'Client Name'}</p>
                  <p className="text-sm text-muted-foreground">{userData?.email || 'client@example.com'}</p>
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

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={isSupportTicketModalOpen}
        onClose={handleCloseSupportTicketModal}
        projects={projects}
        onSuccess={handleSupportTicketSuccess}
      />

      {/* Support Ticket Detail Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-modal-title"
          aria-describedby="ticket-detail-modal-description"
        >
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle id="ticket-detail-modal-title">Support Ticket: {selectedTicket.subject}</CardTitle>
                  <CardDescription id="ticket-detail-modal-description">
                    Detailed ticket information and conversation history
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTicket(null)}
                  aria-label="Close ticket details"
                >
                  &times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ticket Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Ticket Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge
                        variant="outline"
                        className={
                          selectedTicket.priority === "high" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                          selectedTicket.priority === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                          selectedTicket.priority === "urgent" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }
                      >
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(selectedTicket.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{formatDate(selectedTicket.updated_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Related Project</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    {(() => {
                      // Note: The SupportTicket interface doesn't include project_id
                      // This is a placeholder for future functionality
                      // For now, we'll show a message that no project is associated
                      const project = projects.length > 0 ? projects[0] : null;
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
                        <p className="text-muted-foreground">No specific project associated</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Question and Answer */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Question & Answer</h3>
                <div className="space-y-6">
                  {/* Original Question */}
                  <div className="border border-input rounded-md p-4 bg-muted/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>Y</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Your Question</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(selectedTicket.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm">{selectedTicket.replies && selectedTicket.replies.length > 0 ? selectedTicket.replies[0].message : "No description provided"}</p>
                    </div>
                  </div>

                  {/* Support Answer */}
                  {selectedTicket.replies && selectedTicket.replies.length > 1 ? (
                    <div className="border border-input rounded-md p-4 bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Support Team</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(selectedTicket.replies[1].created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm">{selectedTicket.replies[1].message}</p>
                      </div>
                    </div>
                  ) : (
                            <div className="text-center py-8 text-muted-foreground border border-input rounded-md">
                              <p>Awaiting response from our support team.</p>
                              <p className="text-sm mt-2">We'll get back to you as soon as possible.</p>
                            </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-input">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
                <div className="space-x-2">
                  {selectedTicket.status === "resolved" && (
                    <Button onClick={() => {
                      setSelectedTicket(null);
                      setIsSupportTicketModalOpen(true);
                    }}>
                      Create New Ticket
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
