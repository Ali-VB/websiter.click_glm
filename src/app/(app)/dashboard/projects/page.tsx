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
  AlertCircle,
  FileEdit,
  Rocket,
  Sparkles,
  PartyPopper
} from "lucide-react";

// Stage icon mapping
const stageIcons = {
  pending: FileEdit,
  in_progress: Rocket,
  review: Sparkles,
  completed: PartyPopper
} as const;

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
        <main className="p-6 space-y-8">
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
                  {projects.map((project) => {
                    const StageIcon = stageIcons[project.status];
                    return (
                      <TabsTrigger 
                        key={project.id} 
                        value={project.id}
                        className="flex items-center gap-2 justify-start p-3 h-auto data-[state=active]:bg-muted"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <StageIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-sm font-medium">{project.name}</span>
                        </div>
                        <Badge variant="outline" className={`ml-auto flex-shrink-0 text-xs ${getStageColor(project.status, false)}`}>
                          {getStageInfo(project.status, false).title}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Project Content */}
                {projects.map((project) => {
                  const StageIcon = stageIcons[project.status];
                  return (
                  <TabsContent key={project.id} value={project.id} className="mt-6 space-y-6">
                    {/* Project Overview */}
                    <Card className="asana-card">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <StageIcon className="h-5 w-5 text-primary" />
                                  </div>
                                  {project.name}
                                </CardTitle>
                                <CardDescription className="mt-3 text-base asana-text-muted">
                                  {project.description}
                                </CardDescription>
                              </div>
                              <div className="text-right text-sm text-muted-foreground space-y-1">
                                <div>Created: {formatDate(project.created_at)}</div>
                                <div>Updated: {formatDate(project.updated_at)}</div>
                                {project.deadline && (
                                  <div>Deadline: {formatDate(project.deadline)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {project.budget && (
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-xs font-medium text-green-600">Budget</p>
                              <p className="text-lg font-semibold text-green-600">{formatCurrency(project.budget)}</p>
                            </div>
                          </div>
                        )}
                        {/* Next Steps Guidance */}
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            Your Next Steps
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.status === 'pending' && (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-900">📧 Check email for invoice</p>
                                      <p className="text-xs text-blue-700">Watch for invoice notification</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">💳 Complete payment</p>
                                      <p className="text-xs text-blue-600">Pay invoice to start development</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">📋 Save confirmation</p>
                                      <p className="text-xs text-blue-600">Keep payment receipt</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">📞 Be available</p>
                                      <p className="text-xs text-blue-600">Answer developer questions</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">📝 Prepare requirements</p>
                                      <p className="text-xs text-blue-600">Gather any additional info</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">⏳ Wait for start</p>
                                      <p className="text-xs text-blue-600">Development begins soon</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {project.status === 'in_progress' && (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-900">📧 Monitor email</p>
                                      <p className="text-xs text-yellow-700">Watch for progress updates</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-800">📱 Test preview</p>
                                      <p className="text-xs text-yellow-600">Check development preview</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-800">📝 Note concerns</p>
                                      <p className="text-xs text-yellow-600">Document any issues</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-800">🔄 Respond quickly</p>
                                      <p className="text-xs text-yellow-600">Reply to developer questions</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-800">📋 Prepare feedback</p>
                                      <p className="text-xs text-yellow-600">Get ready for review stage</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-800">⏳ Wait for review</p>
                                      <p className="text-xs text-yellow-600">Review notification coming</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {project.status === 'review' && (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-900">👀 Review website</p>
                                      <p className="text-xs text-orange-700">Check design and layout</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-800">🧪 Test features</p>
                                      <p className="text-xs text-orange-600">Try all pages and functions</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-800">📱 Check mobile</p>
                                      <p className="text-xs text-orange-600">Test on phone/tablet</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-800">💬 Give feedback</p>
                                      <p className="text-xs text-orange-600">Share specific thoughts</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-800">✏️ Request changes</p>
                                      <p className="text-xs text-orange-600">Ask for needed edits</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-800">👍 Approve final</p>
                                      <p className="text-xs text-orange-600">Give approval to launch</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {project.status === 'completed' && (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-900">🌐 Visit website</p>
                                      <p className="text-xs text-green-700">Explore your new site</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-800">📊 Monitor performance</p>
                                      <p className="text-xs text-green-600">Check site speed and uptime</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-800">🔧 Consider maintenance</p>
                                      <p className="text-xs text-green-600">Keep site updated and secure</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-800">📈 Plan improvements</p>
                                      <p className="text-xs text-green-600">Think about future features</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-800">🆘 Contact support</p>
                                      <p className="text-xs text-green-600">Get help with any issues</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-800">🎉 Share website</p>
                                      <p className="text-xs text-green-600">Tell others about your site</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {project.client_notes && (
                          <div className="p-4 rounded-lg bg-accent/50 border border-border">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Client Notes
                            </p>
                            <p className="text-sm asana-text-muted leading-relaxed">{project.client_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Main Project Info */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Project Details */}
                        <ProjectDetails project={project} />
                      </div>

                      {/* Right Column - Timeline & Guidance */}
                      <div className="space-y-6">
                        {/* Project Timeline */}
                        <Card className="asana-card">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Clock className="h-5 w-5 text-primary" />
                              </div>
                              Progress
                            </CardTitle>
                            <CardDescription className="text-sm asana-text-muted">
                              Track your project journey
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4">
                            <ProjectTimeline currentStage={project.status} />
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Invoices & Support Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Invoices */}
                      <Card className="asana-card">
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
                      <Card className="asana-card">
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
                  </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
