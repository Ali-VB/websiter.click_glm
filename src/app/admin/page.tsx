"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading admin data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    // Clear any stored auth tokens
    localStorage.removeItem("supabase.auth.token");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-card border-r min-h-screen p-4">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="font-bold text-xl">websiter.click</span>
        </div>
        
        <div className="mb-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">Admin Portal</p>
        </div>
        
        <nav className="space-y-1">
          <Link href="/admin" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
            Dashboard
          </Link>
          <Link href="/admin/projects" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Project Management
          </Link>
          <Link href="/admin/clients" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Client Management
          </Link>
          <Link href="/admin/invoices" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Invoice Management
          </Link>
          <Link href="/admin/support" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Support Tickets
          </Link>
          <Link href="/admin/contacts" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Contact Submissions
          </Link>
          <Link href="/admin/notifications" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Broadcast Notifications
          </Link>
          <Link href="/admin/system" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            System Administration
          </Link>
        </nav>
        
        <Separator className="my-6" />
        
        <div className="space-y-1">
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href="/dashboard">Client Dashboard</Link>
          </Button>
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
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, Admin</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Overview of your websiter.click administration panel
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">👥</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">🚀</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Invoices</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">📄</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Support Tickets</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">🎫</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-20 flex-col">
                <Link href="/admin/clients">
                  <span className="text-lg mb-1">👥</span>
                  <span>Manage Clients</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/projects">
                  <span className="text-lg mb-1">🚀</span>
                  <span>View Projects</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/invoices">
                  <span className="text-lg mb-1">📄</span>
                  <span>Invoices</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/support">
                  <span className="text-lg mb-1">🎫</span>
                  <span>Support</span>
                </Link>
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">New client registered</p>
                    <p className="text-xs text-muted-foreground">John Doe - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Project completed</p>
                    <p className="text-xs text-muted-foreground">Business Website - 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Invoice sent</p>
                    <p className="text-xs text-muted-foreground">Jane Smith - 1 day ago</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">System Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">API Services</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Email Service</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
