"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminLayout } from "@/components/admin-layout";
import AssetUpload from "@/components/AssetUpload";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  completedAt?: string;
}

interface ProjectAsset {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  url?: string;
}

interface Communication {
  id: string;
  type: "internal" | "client";
  message: string;
  sender: string;
  timestamp: string;
  isInternal: boolean;
}

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
  progressPercentage: number;
  lastActivityAt: string;
  teamMembers: TeamMember[];
  milestones: ProjectMilestone[];
  assets: ProjectAsset[];
  communications: Communication[];
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
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("overview");
  const [newInternalNote, setNewInternalNote] = useState("");
  const [newClientMessage, setNewClientMessage] = useState("");

  // Enhanced mock data with new fields
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
      progressPercentage: 65,
      lastActivityAt: "2023-06-20T14:45:00Z",
      teamMembers: [
        { id: "1", name: "Alex Johnson", email: "alex@websiter.click", role: "Project Manager", avatar: "/avatars/alex.jpg" },
        { id: "2", name: "Sarah Chen", email: "sarah@websiter.click", role: "Developer", avatar: "/avatars/sarah.jpg" },
        { id: "3", name: "Mike Wilson", email: "mike@websiter.click", role: "Designer", avatar: "/avatars/mike.jpg" }
      ],
      milestones: [
        { id: "1", title: "Design Approval", description: "Client approves design mockups", dueDate: "2023-06-15", status: "completed", completedAt: "2023-06-14T10:30:00Z" },
        { id: "2", title: "Development Phase 1", description: "Core functionality implementation", dueDate: "2023-06-25", status: "in_progress" },
        { id: "3", title: "Content Integration", description: "Client content upload and integration", dueDate: "2023-07-05", status: "pending" },
        { id: "4", title: "Testing & Launch", description: "Final testing and website launch", dueDate: "2023-07-30", status: "pending" }
      ],
      assets: [
        { id: "1", name: "logo.png", type: "image", uploadedAt: "2023-05-20T09:15:00Z", uploadedBy: "John Smith", size: 245760 },
        { id: "2", name: "content.txt", type: "document", uploadedAt: "2023-05-22T11:30:00Z", uploadedBy: "John Smith", size: 15360 },
        { id: "3", name: "design-mockup.pdf", type: "document", uploadedAt: "2023-06-10T14:20:00Z", uploadedBy: "Mike Wilson", size: 1048576 }
      ],
      communications: [
        { id: "1", type: "internal", message: "Client prefers blue color scheme. Needs the website live by end of Q3.", sender: "Alex Johnson", timestamp: "2023-05-20T09:15:00Z", isInternal: true },
        { id: "2", type: "client", message: "Looking forward to seeing the progress. Can we add a contact form?", sender: "John Smith", timestamp: "2023-05-22T11:30:00Z", isInternal: false },
        { id: "3", type: "internal", message: "Added contact form requirement to scope. Will increase timeline by 3 days.", sender: "Alex Johnson", timestamp: "2023-05-22T14:45:00Z", isInternal: true }
      ],
      requirements: {
        basePackage: "Business Website",
        addons: ["Contact Form / Extra Forms", "SEO Starter Pack"],
        designStyle: "Corporate",
        colorScheme: "Blue and white",
        layoutPreference: "Multi-section",
        domain: "abccorp.com",
        hosting: "Basic Hosting",
        maintenance: "Basic Plan"
      }
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
      deadline: "2023-07-15T23:59:59Z",
      progressPercentage: 85,
      lastActivityAt: "2023-06-15T16:30:00Z",
      teamMembers: [
        { id: "2", name: "Sarah Chen", email: "sarah@websiter.click", role: "Developer", avatar: "/avatars/sarah.jpg" },
        { id: "4", name: "Emma Davis", email: "emma@websiter.click", role: "UI/UX Designer", avatar: "/avatars/emma.jpg" }
      ],
      milestones: [
        { id: "5", title: "Design System", description: "Create design system and components", dueDate: "2023-06-12", status: "completed", completedAt: "2023-06-11T15:30:00Z" },
        { id: "6", title: "Portfolio Implementation", description: "Build portfolio gallery and pages", dueDate: "2023-06-20", status: "completed", completedAt: "2023-06-18T12:00:00Z" },
        { id: "7", title: "Content Upload", description: "Upload portfolio items and descriptions", dueDate: "2023-06-25", status: "in_progress" }
      ],
      assets: [
        { id: "3", name: "portfolio-images.zip", type: "archive", uploadedAt: "2023-06-12T10:45:00Z", uploadedBy: "Jane Doe", size: 5242880 },
        { id: "4", name: "style-guide.pdf", type: "document", uploadedAt: "2023-06-11T15:30:00Z", uploadedBy: "Emma Davis", size: 786432 }
      ],
      communications: [
        { id: "4", type: "client", message: "I love the design! Can we add a blog section later?", sender: "Jane Doe", timestamp: "2023-06-12T10:45:00Z", isInternal: false },
        { id: "5", type: "internal", message: "Client happy with progress. Blog can be phase 2.", sender: "Sarah Chen", timestamp: "2023-06-12T11:00:00Z", isInternal: true }
      ],
      requirements: {
        basePackage: "Portfolio / Blog Website",
        addons: ["Photo Gallery / Portfolio Grid", "Blog System Add-on"],
        designStyle: "Creative",
        colorScheme: "Pink and gray",
        layoutPreference: "Grid-based",
        domain: "janedoe.com",
        hosting: "Basic Hosting",
        maintenance: "Basic Plan"
      }
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
      deadline: "2023-08-30T23:59:59Z",
      progressPercentage: 10,
      lastActivityAt: "2023-06-25T09:15:00Z",
      teamMembers: [
        { id: "1", name: "Alex Johnson", email: "alex@websiter.click", role: "Project Manager", avatar: "/avatars/alex.jpg" },
        { id: "5", name: "David Brown", email: "david@websiter.click", role: "E-commerce Developer", avatar: "/avatars/david.jpg" }
      ],
      milestones: [
        { id: "8", title: "Requirements Gathering", description: "Collect product catalog and requirements", dueDate: "2023-07-05", status: "pending" },
        { id: "9", title: "Platform Setup", description: "Configure e-commerce platform", dueDate: "2023-07-15", status: "pending" }
      ],
      assets: [],
      communications: [
        { id: "6", type: "client", message: "Need online store with 50+ products and payment integration.", sender: "Mike Johnson", timestamp: "2023-06-25T09:15:00Z", isInternal: false }
      ],
      requirements: {
        basePackage: "E-commerce Website",
        addons: ["E-commerce Expansion (add 50 products)", "Analytics & Reports"],
        designStyle: "Modern",
        colorScheme: "Black and orange",
        layoutPreference: "Multi-section",
        domain: "xyzstore.com",
        hosting: "E-commerce Hosting",
        maintenance: "Growth Plan"
      }
    }
  ];

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

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
    let result = projects;
    
    if (statusFilter !== "all") {
      result = result.filter(project => project.status === statusFilter);
    }
    
    if (clientFilter) {
      result = result.filter(project => 
        project.clientName.toLowerCase().includes(clientFilter.toLowerCase()) ||
        project.clientEmail.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }
    
    setFilteredProjects(result);
  }, [projects, statusFilter, clientFilter]);

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

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleWorkOnProject = (project: Project) => {
    setSelectedProject(project);
    setActiveWorkspaceTab("overview");
  };

  const handleAddInternalNote = async () => {
    if (!selectedProject || !newInternalNote.trim()) return;
    
    try {
      const newNote: Communication = {
        id: Date.now().toString(),
        type: "internal",
        message: newInternalNote,
        sender: "Admin",
        timestamp: new Date().toISOString(),
        isInternal: true
      };
      
      setSelectedProject({
        ...selectedProject,
        communications: [...selectedProject.communications, newNote],
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setNewInternalNote("");
    } catch (err) {
      setError("An error occurred while adding the note");
      console.error("Add note error:", err);
    }
  };

  const handleSendClientMessage = async () => {
    if (!selectedProject || !newClientMessage.trim()) return;
    
    try {
      const newMessage: Communication = {
        id: Date.now().toString(),
        type: "client",
        message: newClientMessage,
        sender: "Admin",
        timestamp: new Date().toISOString(),
        isInternal: false
      };
      
      setSelectedProject({
        ...selectedProject,
        communications: [...selectedProject.communications, newMessage],
        lastActivityAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setNewClientMessage("");
    } catch (err) {
      setError("An error occurred while sending the message");
      console.error("Send message error:", err);
    }
  };

  const handleAssetUpload = (asset: ProjectAsset) => {
    if (!selectedProject) return;
    
    setSelectedProject({
      ...selectedProject,
      assets: [...selectedProject.assets, asset],
      lastActivityAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  return (
    <AdminLayout 
      title="Project Management" 
      showRefresh={true}
      onRefresh={fetchProjects}
      isLoading={isLoading}
    >
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Manage client projects, track progress, and collaborate with team members
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {!selectedProject && (
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
                          <th className="text-left py-3 px-4">Progress</th>
                          <th className="text-left py-3 px-4">Days Until Deadline</th>
                          <th className="text-left py-3 px-4">Last Activity</th>
                          <th className="text-left py-3 px-4">Team Members</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => {
                          const daysUntilDeadline = getDaysUntilDeadline(project.deadline);
                          return (
                            <tr key={project.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4 font-medium">{project.name}</td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium">{project.clientName}</div>
                                  <div className="text-sm text-muted-foreground">{project.clientEmail}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="w-24">
                                  <Progress value={project.progressPercentage} className="h-2" />
                                  <div className="text-xs text-muted-foreground mt-1">{project.progressPercentage}%</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {daysUntilDeadline !== null ? (
                                  <span className={`text-sm font-medium ${
                                    daysUntilDeadline < 0 ? 'text-red-600' :
                                    daysUntilDeadline <= 7 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)} days overdue` : `${daysUntilDeadline} days`}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">No deadline</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  {formatDateTime(project.lastActivityAt)}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex -space-x-2">
                                  {project.teamMembers && project.teamMembers.slice(0, 3).map((member) => (
                                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                      <AvatarImage src={member.avatar} alt={member.name} />
                                      <AvatarFallback className="text-xs">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {project.teamMembers && project.teamMembers.length > 3 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                      <span className="text-xs font-medium">+{project.teamMembers.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                  {project.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleWorkOnProject(project)}
                                >
                                  Work on Project
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* Project Workspace */}
            {selectedProject && (
              <div className="space-y-6">
                {/* Workspace Header */}
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedProject.name}</h2>
                      <p className="text-muted-foreground">{selectedProject.description}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedProject(null)}>
                      Back to Projects
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-primary">{selectedProject.progressPercentage}%</div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {getDaysUntilDeadline(selectedProject.deadline) ?? 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Days Until Deadline</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{selectedProject.teamMembers?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Team Members</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{selectedProject.assets.length}</div>
                      <div className="text-sm text-muted-foreground">Assets</div>
                    </div>
                  </div>
                </Card>

                {/* Workspace Tabs */}
                <Tabs value={activeWorkspaceTab} onValueChange={setActiveWorkspaceTab}>
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Client:</span>
                            <span>{selectedProject.clientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{selectedProject.clientEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge className={getStatusColor(selectedProject.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                              {selectedProject.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(selectedProject.createdAt)}</span>
                          </div>
                          {selectedProject.deadline && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Deadline:</span>
                              <span>{formatDate(selectedProject.deadline)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Activity:</span>
                            <span>{formatDateTime(selectedProject.lastActivityAt)}</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Requirements</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Package:</span>
                            <span>{selectedProject.requirements.basePackage}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Add-ons:</span>
                            <div className="mt-1">
                              {selectedProject.requirements.addons.map((addon, index) => (
                                <Badge key={index} variant="outline" className="mr-1 mb-1">
                                  {addon}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Design Style:</span>
                            <span>{selectedProject.requirements.designStyle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Color Scheme:</span>
                            <span>{selectedProject.requirements.colorScheme}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Domain:</span>
                            <span>{selectedProject.requirements.domain}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Progress Tab */}
                  <TabsContent value="progress" className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Project Completion</span>
                            <span className="text-sm text-muted-foreground">{selectedProject.progressPercentage}%</span>
                          </div>
                          <Progress value={selectedProject.progressPercentage} className="h-3" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Milestones</h3>
                      <div className="space-y-4">
                        {selectedProject.milestones?.map((milestone) => (
                          <div key={milestone.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{milestone.title}</h4>
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              </div>
                              <Badge className={getMilestoneStatusColor(milestone.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                                {milestone.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Due: {formatDate(milestone.dueDate)}</span>
                              {milestone.completedAt && (
                                <span>Completed: {formatDate(milestone.completedAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Team Tab */}
                  <TabsContent value="team" className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedProject.teamMembers?.map((member) => (
                          <div key={member.id} className="border rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{member.name}</h4>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Assets Tab */}
                  <TabsContent value="assets" className="space-y-6">
                    <Card className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Project Assets</h3>
                        <div className="border-2 border-dashed border-input rounded-md p-8 text-center">
                          <div className="text-3xl mb-2">📁</div>
                          <p className="text-lg font-medium mb-2">Upload Project Assets</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Drag & drop files here or click to browse
                          </p>
                          <Button>Choose Files</Button>
                        </div>
                      </div>
                      
                      {selectedProject.assets.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No assets uploaded yet.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Type</th>
                                <th className="text-left py-3 px-4">Size</th>
                                <th className="text-left py-3 px-4">Uploaded By</th>
                                <th className="text-left py-3 px-4">Uploaded</th>
                                <th className="text-left py-3 px-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProject.assets.map((asset) => (
                                <tr key={asset.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">{asset.name}</td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline">{asset.type}</Badge>
                                  </td>
                                  <td className="py-3 px-4">{formatFileSize(asset.size)}</td>
                                  <td className="py-3 px-4">{asset.uploadedBy}</td>
                                  <td className="py-3 px-4">{formatDateTime(asset.uploadedAt)}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex space-x-2">
                                      <Button variant="outline" size="sm">
                                        Download
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        View
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Communication Tab */}
                  <TabsContent value="communication" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
                        <div className="space-y-4 mb-4">
                          {selectedProject.communications?.filter(comm => comm.isInternal)
                            .map((comm) => (
                              <div key={comm.id} className="border rounded p-3">
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                  <span>{comm.sender}</span>
                                  <span>{formatDateTime(comm.timestamp)}</span>
                                </div>
                                <p>{comm.message}</p>
                              </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add internal note..."
                            value={newInternalNote}
                            onChange={(e) => setNewInternalNote(e.target.value)}
                            rows={3}
                          />
                          <Button onClick={handleAddInternalNote} disabled={!newInternalNote.trim()}>
                            Add Note
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Client Communication</h3>
                        <div className="space-y-4 mb-4">
                          {selectedProject.communications?.filter(comm => !comm.isInternal)
                            .map((comm) => (
                              <div key={comm.id} className="border rounded p-3">
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                  <span>{comm.sender}</span>
                                  <span>{formatDateTime(comm.timestamp)}</span>
                                </div>
                                <p>{comm.message}</p>
                              </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Send message to client..."
                            value={newClientMessage}
                            onChange={(e) => setNewClientMessage(e.target.value)}
                            rows={3}
                          />
                          <Button onClick={handleSendClientMessage} disabled={!newClientMessage.trim()}>
                            Send Message
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Invoices Tab */}
                  <TabsContent value="invoices" className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Invoice Management</h3>
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No invoices created for this project yet.</p>
                        <Button>Create Invoice</Button>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Time Tracking</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">0h</div>
                          <div className="text-sm text-muted-foreground">Time Spent</div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Budget Utilization</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">0%</div>
                          <div className="text-sm text-muted-foreground">Budget Used</div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Team Productivity</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">100%</div>
                          <div className="text-sm text-muted-foreground">Efficiency Rate</div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  );
}
