"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
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
              
              <Card>
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
              
              <Card>
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
              
              <Card>
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

            {/* Project Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>
                  Summary of all your projects and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      <span className="text-sm">Projects awaiting approval</span>
                    </div>
                    <span className="font-medium">{projectStats.pending}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>
                      <span className="text-sm">Projects currently being developed</span>
                    </div>
                    <span className="font-medium">{projectStats.inProgress}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
                      <span className="text-sm">Projects that have been finished</span>
                    </div>
                    <span className="font-medium">{projectStats.completed}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-medium">
                      {projectStats.total > 0 
                        ? `${Math.round((projectStats.completed / projectStats.total) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                  
                  <Progress 
                    value={projectStats.total > 0 ? (projectStats.completed / projectStats.total) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Projects and Invoices Tabs */}
            <Tabs defaultValue="projects" className="space-y-4">
              <TabsList>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>
              
              <TabsContent value="projects" className="space-y-4">
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
                                  <Badge variant="outline" className={getStatusColor(project.status)}>
                                    {project.status.replace("_", " ")}
                                  </Badge>
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
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
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
                                project.status === "completed" ? "bg-green-100 text-green-800" :
                                project.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                project.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
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
                              
                              {/* Project Timeline Events */}
                              <div className="mt-4 space-y-3">
                                <div className="flex items-start">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                                  <div>
                                    <p className="text-sm font-medium">Project Created</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(project.created_at)}</p>
                                  </div>
                                </div>
                                
                                {project.status !== "pending" && (
                                  <div className="flex items-start">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3"></div>
                                    <div>
                                      <p className="text-sm font-medium">Project Approved</p>
                                      <p className="text-xs text-muted-foreground">Waiting for developer assignment</p>
                                    </div>
                                  </div>
                                )}
                                
                                {project.status === "in_progress" && (
                                  <div className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                                    <div>
                                      <p className="text-sm font-medium">In Development</p>
                                      <p className="text-xs text-muted-foreground">Currently being worked on</p>
                                    </div>
                                  </div>
                                )}
                                
                                {project.status === "completed" && (
                                  <div className="flex items-start">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                                    <div>
                                      <p className="text-sm font-medium">Project Completed</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(project.updated_at)}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {project.status === "cancelled" && (
                                  <div className="flex items-start">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3"></div>
                                    <div>
                                      <p className="text-sm font-medium">Project Cancelled</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(project.updated_at)}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-4">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/projects/${project.id}`}>View Details</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="assets" className="space-y-4">
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
                      <div className="space-y-6">
                        {/* Project Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="project-select">Select Project</Label>
                          <select
                            id="project-select"
                            className="w-full p-2 border border-input rounded-md bg-background"
                          >
                            <option value="">Choose a project...</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Asset Type Selection */}
                        <div className="space-y-2">
                          <Label>Asset Type</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col items-center p-4 border border-input rounded-md cursor-pointer hover:bg-muted/50">
                              <div className="text-2xl mb-2">🖼️</div>
                              <span className="text-sm">Images</span>
                            </div>
                            <div className="flex flex-col items-center p-4 border border-input rounded-md cursor-pointer hover:bg-muted/50">
                              <div className="text-2xl mb-2">📄</div>
                              <span className="text-sm">Documents</span>
                            </div>
                            <div className="flex flex-col items-center p-4 border border-input rounded-md cursor-pointer hover:bg-muted/50">
                              <div className="text-2xl mb-2">🎨</div>
                              <span className="text-sm">Logos</span>
                            </div>
                            <div className="flex flex-col items-center p-4 border border-input rounded-md cursor-pointer hover:bg-muted/50">
                              <div className="text-2xl mb-2">📝</div>
                              <span className="text-sm">Content</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* File Upload Area */}
                        <div className="space-y-2">
                          <Label htmlFor="file-upload">Upload Files</Label>
                          <div className="border-2 border-dashed border-input rounded-md p-8 text-center cursor-pointer hover:bg-muted/50">
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-3xl mb-2">📁</div>
                              <p className="text-lg font-medium">Drag & drop files here</p>
                              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB)
                              </p>
                            </div>
                            <Input
                              id="file-upload"
                              type="file"
                              className="hidden"
                              multiple
                            />
                          </div>
                        </div>
                        
                        {/* File Description */}
                        <div className="space-y-2">
                          <Label htmlFor="file-description">Description (Optional)</Label>
                          <textarea
                            id="file-description"
                            className="w-full p-2 border border-input rounded-md bg-background min-h-[100px]"
                            placeholder="Add a description for the files you're uploading..."
                          />
                        </div>
                        
                        {/* Upload Button */}
                        <div className="flex justify-end">
                          <Button>Upload Files</Button>
                        </div>
                        
                        {/* Uploaded Files List */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Recently Uploaded</h3>
                          <div className="border border-input rounded-md">
                            <div className="p-4 border-b border-input">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                                    <span className="text-blue-800">📄</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">company-logo.png</p>
                                    <p className="text-sm text-muted-foreground">2.4 MB • Uploaded today</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </div>
                            <div className="p-4 border-b border-input">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                                    <span className="text-green-800">📝</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">website-content.docx</p>
                                    <p className="text-sm text-muted-foreground">1.1 MB • Uploaded 2 days ago</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
                                    <span className="text-purple-800">🖼️</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">hero-image.jpg</p>
                                    <p className="text-sm text-muted-foreground">3.7 MB • Uploaded 1 week ago</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">View</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="invoices" className="space-y-4">
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
                                <tr key={invoice.id} className="border-b hover:bg-muted/50">
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
              </TabsContent>
            </Tabs>
            
            {/* Invoice Detail Modal */}
            {selectedInvoice && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Invoice #{selectedInvoice.id}</CardTitle>
                        <CardDescription>
                          Detailed invoice information
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(null)}
                      >
                        ✕
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
        )}
      </section>
    </div>
  );
}