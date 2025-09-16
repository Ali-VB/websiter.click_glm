"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to view the dashboard");
        router.push("/login");
        return;
      }

      // Fetch projects
      const projectsResponse = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
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
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (err) {
      setError("An error occurred while loading your dashboard");
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
      }
    }, [router]);
  
    useEffect(() => {
      fetchDashboardData();
    }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_payment":
        return "bg-orange-100 text-orange-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const handleLogout = () => {
    localStorage.removeItem("supabase.auth.token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="font-bold text-xl">websiter.click</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your projects and invoices
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Projects Section */}
            <div className="bg-background p-6 rounded-lg border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Projects</h2>
                <Button asChild>
                  <Link href="/onboarding">New Project</Link>
                </Button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You don&apos;t have any projects yet.</p>
                  <Button asChild>
                    <Link href="/onboarding">Create Your First Project</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Project Name</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Created</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{project.name}</td>
                          <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                            {project.description}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                project.status
                              )}`}
                            >
                              {project.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatDate(project.created_at)}</td>
                          <td className="py-3 px-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/projects/${project.id}`}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Invoices Section */}
            <div className="bg-background p-6 rounded-lg border">
              <h2 className="text-2xl font-bold mb-6">Your Invoices</h2>

              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You don&apos;t have any invoices yet.</p>
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
                          <tr key={invoice.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">#{invoice.id}</td>
                            <td className="py-3 px-4">{project?.name || "Unknown Project"}</td>
                            <td className="py-3 px-4">{formatCurrency(invoice.amount)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  invoice.status
                                )}`}
                              >
                                {invoice.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4">{formatDate(invoice.created_at)}</td>
                            <td className="py-3 px-4">
                              {invoice.status === "pending_payment" && (
                                <Button size="sm">Pay Now</Button>
                              )}
                              <Button variant="outline" size="sm" className="ml-2">
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}