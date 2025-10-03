'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { useTheme } from "@/components/theme-provider";
import { FolderOpen, Plus, Eye } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
      setError("An error occurred while loading your projects");
      console.error("Projects error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Check if client can create a new project
  const hasActiveProject = projects.some(p => 
    p.status === "in_progress" || p.status === "pending"
  );

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
        invoicesCount={0}
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

          {isLoading ? (
            <div className="flex justify-center py-12" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" aria-label="Loading projects"></div>
              <span className="sr-only">Loading projects</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
                  <p className="text-muted-foreground">
                    View and manage all your website projects
                  </p>
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
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                  {hasActiveProject && (
                    <span className="ml-2 text-xs">(Project in progress)</span>
                  )}
                </Button>
              </div>

              {/* Projects List */}
              <Card>
                <CardContent className="p-0">
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
                    <div className="overflow-x-auto">
                      <table className="w-full" aria-label="Projects table">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-4 px-6 font-medium" scope="col">Project Name</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Owner</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Status</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Created</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Updated</th>
                            <th className="text-left py-4 px-6 font-medium" scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.map((project) => (
                            <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-4 px-6">
                                <div>
                                  <div className="font-medium">{project.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">{project.description}</div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback>{userData?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{userData?.name || 'Unknown User'}</div>
                                    <div className="text-sm text-muted-foreground">{userData?.email || ''}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="outline" className={getStatusColor(project.status)}>
                                  {project.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-muted-foreground">
                                {formatDate(project.created_at)}
                              </td>
                              <td className="py-4 px-6 text-muted-foreground">
                                {formatDate(project.updated_at)}
                              </td>
                              <td className="py-4 px-6">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/projects/${project.id}`} aria-label={`View details for project ${project.name}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </Link>
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

              {/* Project Statistics */}
              {projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                          <p className="text-2xl font-bold">{projects.length}</p>
                        </div>
                        <FolderOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                          <p className="text-2xl font-bold">{projects.filter(p => p.status === "in_progress").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center">
                          →
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold">{projects.filter(p => p.status === "pending").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full flex items-center justify-center">
                          !
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{projects.filter(p => p.status === "completed").length}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full flex items-center justify-center">
                          ✓
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
