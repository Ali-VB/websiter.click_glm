'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectDetails } from "@/components/project-details";
import { useTheme } from "@/components/theme-provider";
import { ProjectStage, mapLegacyStatus, getStageColor, getStageInfo } from "@/lib/project-stages";
import { 
  FolderOpen, 
  Plus, 
  Eye, 
  Calendar,
  DollarSign,
  MessageSquare,
  HelpCircle,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStage;
  created_at: string;
  updated_at: string;
  deadline?: string;
  budget?: number;
  client_notes?: string;
  website_type: string;
  design_preferences?: {
    designStyle?: string;
    referenceWebsites?: string;
    colorScheme?: string;
    layoutPreferences?: string;
  };
  add_ons?: string[];
  domain_info?: {
    domainOption?: string;
    hostingOption?: string;
  };
  maintenance_plan?: string;
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
  project_id?: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
}

interface Asset {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const fetchProjectsData = useCallback(async (token: string) => {
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
        
        // Set selected project from URL or first project
        const urlProjectId = searchParams.get('project');
        if (urlProjectId && projectsData.projects?.find((p: Project) => p.id === urlProjectId)) {
          setSelectedProjectId(urlProjectId);
        } else if (projectsData.projects?.length > 0) {
          setSelectedProjectId(projectsData.projects[0].id);
        }
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

    } catch (err) {
      setError("An error occurred while loading your projects");
      console.error("Projects error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        fetchProjectsData(session.access_token);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, fetchProjectsData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const url = new URL(window.location.href);
    if (projectId) {
      url.searchParams.set('project', projectId);
    } else {
      url.searchParams.delete('project');
    }
    window.history.replaceState({}, '', url.toString());
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

  // Invoice status color function
  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Support ticket status color function
  const getSupportTicketStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectInvoices = invoices.filter(i => i.project_id === selectedProjectId);
  const projectTickets = supportTickets.filter(t => t.project_id === selectedProjectId);
  const projectAssets = assets.filter(a => a.project_id === selectedProjectId);

  // Check if client can create a new project
  const hasActiveProject = projects.some(p => 
    p.status !== "completed"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClientSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDark}
          onThemeToggle={handleThemeToggle}
          unreadNotifications={0}
          projectsCount={0}
          invoicesCount={0}
        />
        <div className="lg:pl-64">
          <ClientHeader
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            isDarkMode={isDark}
            onThemeToggle={handleThemeToggle}
            unreadNotifications={0}
            onLogout={handleLogout}
          />
          <main className="p-6">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <ClientSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isDarkMode={isDark}
        onThemeToggle={handleThemeToggle}
        unreadNotifications={unreadNotifications}
        projectsCount={projects.length}
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

        {/* Projects Content */}
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

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any projects yet. Create your first website project to get started.
              </p>
              <Button asChild>
                <Link href="/onboarding">Create Your First Project</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
                  <p className="text-muted-foreground">
                    Manage all your website projects in one place
                  </p>
                </div>
                <Button 
                  disabled={hasActiveProject}
                  title={hasActiveProject ? "You can only have one active project at a time" : ""}
                  onClick={() => {
                    if (hasActiveProject) {
                      alert("You can only have one active project at a time. Please complete your current project before starting a new one.");
                    } else {
                      router.push("/onboarding");
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                  {hasActiveProject && (
                    <span className="ml-2 text-xs">(Project in progress)</span>
                  )}
                </Button>
              </div>

              {/* Horizontal Project Tabs */}
              <Tabs value={selectedProjectId} onValueChange={handleProjectChange} className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-max">
                  {projects.map((project) => (
                    <TabsTrigger 
                      key={project.id} 
                      value={project.id}
                      className="flex items-center gap-2 justify-start p-3 h-auto data-[state=active]:bg-muted"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getStageInfo(project.status, false).icon}
                        <span className="truncate text-sm font-medium">{project.name}</span>
                      </div>
                      <Badge variant="outline" className={`ml-auto flex-shrink-0 text-xs ${getStageColor(project.status, false)}`}>
                        {getStageInfo(project.status, false).title}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Project Content */}
                {projects.map((project) => (
                  <TabsContent key={project.id} value={project.id} className="mt-6 space-y-6">
                    {/* Project Overview */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {getStageInfo(project.status, false).icon}
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {project.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={getStageColor(project.status, false)}>
                            {getStageInfo(project.status, false).title}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Created: {formatDate(project.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Updated: {formatDate(project.updated_at)}</span>
                          </div>
                          {project.deadline && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Deadline: {formatDate(project.deadline)}</span>
                            </div>
                          )}
                        </div>
                        {project.budget && (
                          <div className="mt-4 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Budget: {formatCurrency(project.budget)}</span>
                          </div>
                        )}
                        {project.client_notes && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Client Notes:</p>
                            <p className="text-sm text-muted-foreground">{project.client_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Project Timeline */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Timeline</CardTitle>
                        <CardDescription>
                          Track your project progress through each stage
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProjectTimeline currentStage={project.status} />
                      </CardContent>
                    </Card>

                    {/* Project Details */}
                    <ProjectDetails project={project} />

                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Invoices */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Invoices
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {projectInvoices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No invoices yet</p>
                          ) : (
                            <div className="space-y-3">
                              {projectInvoices.map((invoice) => (
                                <div key={invoice.id} className="flex justify-between items-center p-3 border rounded-lg">
                                  <div>
                                    <p className="font-medium text-sm">Invoice #{invoice.id.slice(-8)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(invoice.created_at)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                                    <Badge variant="outline" className={`text-xs ${getInvoiceStatusColor(invoice.status)}`}>
                                      {invoice.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Support Tickets */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            Support Tickets
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {projectTickets.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No support tickets</p>
                          ) : (
                            <div className="space-y-3">
                              {projectTickets.map((ticket) => (
                                <div key={ticket.id} className="flex justify-between items-center p-3 border rounded-lg">
                                  <div>
                                    <p className="font-medium text-sm">{ticket.subject}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(ticket.created_at)}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className={`text-xs ${getSupportTicketStatusColor(ticket.status)}`}>
                                    {ticket.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                          Common actions for your project
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button variant="outline" className="justify-start">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Files
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Get Support
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
