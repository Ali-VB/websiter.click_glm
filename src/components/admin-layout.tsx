"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { createServerClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  Folder,
  Users,
  FileText,
  MessageSquare,
  Mail,
  Bell,
  Settings,
  Database,
  CreditCard
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface AdminCounts {
  projects: number;
  clients: number;
  invoices: number;
  supportTickets: number;
  contacts: number;
  notifications: number;
  assets: number;
  payments: number;
}

export function AdminLayout({
  children,
  title,
  showRefresh = false,
  onRefresh,
  isLoading = false
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState<AdminCounts>({
    projects: 0,
    clients: 0,
    invoices: 0,
    supportTickets: 0,
    contacts: 0,
    notifications: 0,
    assets: 0,
    payments: 0
  });

  // Fetch admin counts
  const fetchAdminCounts = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;

      const headers = {
        "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        "Content-Type": "application/json"
      };

      // Fetch all counts in parallel
      const [
        projectsRes,
        clientsRes,
        invoicesRes,
        supportRes,
        contactsRes,
        notificationsRes,
        assetsRes,
        paymentsRes
      ] = await Promise.all([
        fetch("/api/admin/projects", { headers }),
        fetch("/api/admin/clients", { headers }),
        fetch("/api/admin/invoices", { headers }),
        fetch("/api/admin/support", { headers }),
        fetch("/api/admin/contacts", { headers }),
        fetch("/api/admin/notifications", { headers }),
        fetch("/api/admin/assets", { headers }),
        fetch("/api/admin/payments", { headers })
      ]);

      const newCounts: AdminCounts = {
        projects: projectsRes.ok ? (await projectsRes.json()).projects?.length || 0 : 0,
        clients: clientsRes.ok ? (await clientsRes.json()).clients?.length || 0 : 0,
        invoices: invoicesRes.ok ? (await invoicesRes.json()).invoices?.length || 0 : 0,
        supportTickets: supportRes.ok ? (await supportRes.json()).tickets?.length || 0 : 0,
        contacts: contactsRes.ok ? (await contactsRes.json()).contacts?.length || 0 : 0,
        notifications: notificationsRes.ok ? (await notificationsRes.json()).notifications?.length || 0 : 0,
        assets: assetsRes.ok ? (await assetsRes.json()).assets?.length || 0 : 0,
        payments: paymentsRes.ok ? (await paymentsRes.json()).payments?.length || 0 : 0
      };

      setCounts(newCounts);
    } catch (error) {
      console.error("Error fetching admin counts:", error);
    }
  };

  useEffect(() => {
    fetchAdminCounts();
    // Refresh counts every 30 seconds for live updates
    const interval = setInterval(fetchAdminCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper to check if a route is active
  const isActive = (route: string) => {
    if (route === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname === route || pathname.startsWith(route + "/");
  };

  const handleLogout = () => {
    localStorage.removeItem("supabase.auth.token");
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-card border-r min-h-screen p-4">
        <div className="flex items-center space-x-2 mb-8">
          <Logo size={32} showText={true} />
        </div>
        
        <div className="mb-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">Admin Portal</p>
        </div>
        
        <nav className="space-y-1">
          <Link
            href="/admin"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </Link>

          <Link
            href="/admin/projects"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/projects")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Folder className="h-4 w-4" />
              <span>Projects</span>
            </div>
            {counts.projects > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {counts.projects}
              </span>
            )}
          </Link>

          <Link
            href="/admin/clients"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/clients")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </div>
            {counts.clients > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {counts.clients}
              </span>
            )}
          </Link>

          <Link
            href="/admin/invoices"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/invoices")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4" />
              <span>Invoices</span>
            </div>
            {counts.invoices > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {counts.invoices}
              </span>
            )}
          </Link>

          <Link
            href="/admin/support"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/support")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-4 w-4" />
              <span>Support</span>
            </div>
            {counts.supportTickets > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {counts.supportTickets}
              </span>
            )}
          </Link>

          <Link
            href="/admin/contacts"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/contacts")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4" />
              <span>Contacts</span>
            </div>
            {counts.contacts > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {counts.contacts}
              </span>
            )}
          </Link>

          <Link
            href="/admin/notifications"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/notifications")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            {counts.notifications > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {counts.notifications}
              </span>
            )}
          </Link>

          <Link
            href="/admin/system"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/system")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-4 w-4" />
              <span>System</span>
            </div>
          </Link>

          <Separator className="my-4" />

          <Link
            href="/admin/assets"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/assets")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Database className="h-4 w-4" />
              <span>Assets</span>
            </div>
            {counts.assets > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {counts.assets}
              </span>
            )}
          </Link>

          <Link
            href="/admin/payments"
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/admin/payments")
                ? "bg-accent text-accent-foreground font-semibold"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </div>
            {counts.payments > 0 && (
              <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
                {counts.payments}
              </span>
            )}
          </Link>
        </nav>
        
        <Separator className="my-6" />
        
        <div className="space-y-1">
          <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-background border-b p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, Admin</span>
              <Button
                onClick={fetchAdminCounts}
                variant="outline"
                size="sm"
                title="Refresh counts (updates every 30s)"
              >
                ↻
              </Button>
              {showRefresh && onRefresh && (
                <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm">
                  {isLoading ? "Loading..." : "Refresh"}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
