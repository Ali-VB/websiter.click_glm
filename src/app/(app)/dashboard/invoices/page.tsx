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
import { FileText, Download, ExternalLink } from "lucide-react";

interface Invoice {
  id: string;
  project_id: string;
  amount: number;
  status: "draft" | "pending_payment" | "paid" | "cancelled";
  created_at: string;
  due_date?: string;
  project?: {
    name: string;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchInvoicesData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError("");

    try {
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
      setError("An error occurred while loading your invoices");
      console.error("Invoices error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        fetchInvoicesData(session.access_token);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, fetchInvoicesData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "pending_payment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
        invoicesCount={invoices.length}
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

        {/* Invoices Content */}
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" aria-label="Loading invoices"></div>
              <span className="sr-only">Loading invoices</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Invoices</h1>
                <p className="text-muted-foreground">
                  View and manage all your project invoices and payments
                </p>
              </div>

              {/* Invoices List */}
              <Card>
                <CardContent className="p-0">
                  {invoices.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                      <p className="text-muted-foreground mb-6">
                        You don't have any invoices yet. Invoices will appear here when projects are created.
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/projects">View Projects</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full" aria-label="Invoices table">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-4 px-6 font-medium" scope="col">Invoice ID</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Project</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Amount</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Status</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Due Date</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Created</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-medium">#{invoice.id.slice(0, 8).toUpperCase()}</div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-medium">{invoice.project?.name || 'Unknown Project'}</div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="outline" className={getStatusColor(invoice.status)}>
                                  {invoice.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className={isOverdue(invoice.due_date) ? "text-destructive font-medium" : ""}>
                                  {invoice.due_date ? formatDate(invoice.due_date) : "No due date"}
                                  {isOverdue(invoice.due_date) && " (Overdue)"}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-muted-foreground">
                                {formatDate(invoice.created_at)}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/invoices/${invoice.id}`} aria-label={`View details for invoice ${invoice.id}`}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View
                                    </Link>
                                  </Button>
                                  {invoice.status === "pending_payment" && (
                                    <Button size="sm" asChild>
                                      <Link href={`/invoices/${invoice.id}/pay`}>
                                        Pay Now
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Statistics */}
              {invoices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                          <p className="text-2xl font-bold">{invoices.length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                          <p className="text-2xl font-bold">{invoices.filter(i => i.status === "pending_payment").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full flex items-center justify-center">
                          !
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Paid</p>
                          <p className="text-2xl font-bold">{invoices.filter(i => i.status === "paid").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                          <p className="text-2xl font-bold">{formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.amount, 0))}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center">
                          $
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
    </div>
  );
}
