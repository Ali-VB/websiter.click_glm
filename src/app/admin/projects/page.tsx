"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: "submitted" | "awaiting_invoice" | "approved" | "in_progress" | "completed" | "on_hold";
  type: "business" | "portfolio" | "landing" | "booking" | "ecommerce" | "custom";
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  requirements: {
    basePackage: string;
    addons: string[];
    designStyle: string;
    colorScheme: string;
    layoutPreference: string;
    domain: string;
    hosting: string;
    maintenance: string;
  };
  assets: {
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
  }[];
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Mock data for development
  const mockProjects: Project[] = [
    {
      id: "1",
      name: "Business Website for ABC Corp",
      description: "Professional website for ABC Corp with homepage, about page, services, and contact form.",
      clientName: "John Smith",
      clientEmail: "john@abccorp.com",
      status: "in_progress",
      type: "business",
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-06-20T14:45:00Z",
      deadline: "2023-07-30T23:59:59Z",
      requirements: {
        basePackage: "Business Website",
        addons: ["Contact Form / Extra Forms", "SEO Starter Pack"],
        designStyle: "Corporate",
        colorScheme: "Blue and white",
        layoutPreference: "Multi-section",
        domain: "abccorp.com",
        hosting: "Basic Hosting",
        maintenance: "Basic Plan"
      },
      assets: [
        { id: "1", name: "logo.png", type: "image", uploadedAt: "2023-05-20T09:15:00Z" },
        { id: "2", name: "content.txt", type: "document", uploadedAt: "2023-05-22T11:30:00Z" }
      ]
    },
    {
      id: "2",
      name: "Portfolio for Jane Doe",
      description: "Personal portfolio website for Jane Doe to showcase her design work.",
      clientName: "Jane Doe",
      clientEmail: "jane@janedoe.com",
      status: "awaiting_invoice",
      type: "portfolio",
      createdAt: "2023-06-10T14:20:00Z",
      updatedAt: "2023-06-15T16:30:00Z",
      requirements: {
        basePackage: "Portfolio / Blog Website",
        addons: ["Photo Gallery / Portfolio Grid", "Blog System Add-on"],
        designStyle: "Creative",
        colorScheme: "Pink and gray",
        layoutPreference: "Grid-based",
        domain: "janedoe.com",
        hosting: "Basic Hosting",
        maintenance: "Basic Plan"
      },
      assets: [
        { id: "3", name: "portfolio-images.zip", type: "archive", uploadedAt: "2023-06-12T10:45:00Z" }
      ]
    },
    {
      id: "3",
      name: "E-commerce for XYZ Store",
      description: "Online store for XYZ Store with product catalog and shopping cart.",
      clientName: "Mike Johnson",
      clientEmail: "mike@xyzstore.com",
      status: "submitted",
      type: "ecommerce",
      createdAt: "2023-06-25T09:15:00Z",
      updatedAt: "2023-06-25T09:15:00Z",
      requirements: {
        basePackage: "E-commerce Website",
        addons: ["E-commerce Expansion (add 50 products)", "Analytics & Reports"],
        designStyle: "Modern",
        colorScheme: "Black and orange",
        layoutPreference: "Multi-section",
        domain: "xyzstore.com",
        hosting: "E-commerce Hosting",
        maintenance: "Growth Plan"
      },
      assets: []
    }
  ];

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      // Try to fetch from API first
      try {
        const response = await fetch("/api/admin/projects", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProjects(data.projects || []);
            setFilteredProjects(data.projects || []);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.log("API endpoint not available, using mock data");
      }

      // If API fails, use mock data (for development)
      setTimeout(() => {
        setProjects(mockProjects);
        setFilteredProjects(mockProjects);
        setIsLoading(false);
      }, 500);
      
    } catch (err) {
      setError("An error occurred while loading projects");
      console.error("Admin projects error:", err);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    // Apply filters
    let result = projects;
    
    if (statusFilter !== "all") {
      result = result.filter(project => project.status === statusFilter);
    }
    
    if (typeFilter !== "all") {
      result = result.filter(project => project.type === typeFilter);
    }
    
    if (clientFilter) {
      result = result.filter(project => 
        project.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
        project.clientEmail.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }
    
    setFilteredProjects(result);
  }, [projects, statusFilter, typeFilter, clientFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "awaiting_invoice":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "on_hold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "business":
        return "bg-blue-100 text-blue-800";
      case "portfolio":
        return "bg-purple-100 text-purple-800";
      case "landing":
        return "bg-green-100 text-green-800";
      case "booking":
        return "bg-yellow-100 text-yellow-800";
      case "ecommerce":
        return "bg-red-100 text-red-800";
      case "custom":
        return "bg-indigo-100 text-indigo-800";
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

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

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
          <Link href="/admin" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Dashboard
          </Link>
          <Link href="/admin/projects" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
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
            <h1 className="text-2xl font-bold">Project Management</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchProjects} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Projects Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Manage client projects, track progress, and view project details
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="statusFilter">Filter by Status</Label>
                <select
                  id="statusFilter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="awaiting_invoice">Awaiting Invoice</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="typeFilter">Filter by Type</Label>
                <select
                  id="typeFilter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="business">Business Website</option>
                  <option value="portfolio">Portfolio / Blog</option>
                  <option value="landing">Landing Page</option>
                  <option value="booking">Booking / Appointment</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="custom">Custom Website</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="clientFilter">Filter by Client</Label>
                <Input
                  id="clientFilter"
                  placeholder="Search by name or email"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Project List */}
              <Card className="p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Projects</h2>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredProjects.length} of {projects.length} projects
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No projects found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Project Name</th>
                          <th className="text-left py-3 px-4">Client</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Created</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => (
                          <tr key={project.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{project.name}</td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{project.clientName}</div>
                                <div className="text-sm text-muted-foreground">{project.clientEmail}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(project.type)}`}>
                                {project.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">{formatDate(project.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProject(project)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Project Detail View */}
              {selectedProject && (
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedProject.name}</h2>
                      <p className="text-muted-foreground">{selectedProject.description}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedProject(null)}>
                      Close
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Project Information</h3>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Client:</span>
                          <span>{selectedProject.clientName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Email:</span>
                          <span>{selectedProject.clientEmail}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Type:</span>
                          <Badge className={getTypeColor(selectedProject.type).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedProject.type}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(selectedProject.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedProject.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Created:</span>
                          <span>{formatDate(selectedProject.createdAt)}</span>
                        </div>
                        {selectedProject.deadline && (
                          <div className="flex">
                            <span className="w-32 text-muted-foreground">Deadline:</span>
                            <span>{formatDate(selectedProject.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Base Package:</span>
                          <span>{selectedProject.requirements.basePackage}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Add-ons:</span>
                          <span>{selectedProject.requirements.addons.join(', ')}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Design Style:</span>
                          <span>{selectedProject.requirements.designStyle}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Color Scheme:</span>
                          <span>{selectedProject.requirements.colorScheme}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Layout:</span>
                          <span>{selectedProject.requirements.layoutPreference}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Domain:</span>
                          <span>{selectedProject.requirements.domain}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Hosting:</span>
                          <span>{selectedProject.requirements.hosting}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Maintenance:</span>
                          <span>{selectedProject.requirements.maintenance}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Project Assets</h3>
                    {selectedProject.assets.length === 0 ? (
                      <p className="text-muted-foreground">No assets uploaded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Name</th>
                              <th className="text-left py-3 px-4">Type</th>
                              <th className="text-left py-3 px-4">Uploaded</th>
                              <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProject.assets.map((asset) => (
                              <tr key={asset.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{asset.name}</td>
                                <td className="py-3 px-4">{asset.type}</td>
                                <td className="py-3 px-4">{formatDate(asset.uploadedAt)}</td>
                                <td className="py-3 px-4">
                                  <Button variant="outline" size="sm">
                                    Download
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
