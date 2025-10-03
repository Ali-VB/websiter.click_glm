'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { useTheme } from "@/components/theme-provider";
import AssetUpload from "@/components/AssetUpload";
import { FolderOpen, Upload, File, Image, FileText, X } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  project_id: string;
  created_at: string;
  project?: {
    name: string;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function AssetsPage() {
  const router = useRouter();
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchAssetsData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Fetch assets
      const assetsResponse = await fetch("/api/assets", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        setAssets(assetsData.assets || []);
      }

      // Fetch projects for upload modal
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
      setError("An error occurred while loading your assets");
      console.error("Assets error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        fetchAssetsData(session.access_token);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, fetchAssetsData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const getFileIcon = (type?: string) => {
    if (!type) {
      return <File className="h-8 w-8 text-gray-600" />;
    }
    if (type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-green-600" />;
    } else if (type.includes('pdf') || type.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else {
      return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleAssetUploaded = async () => {
    // Refresh assets after uploading
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetchAssetsData(session.access_token);
    }
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

        {/* Assets Content */}
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" aria-label="Loading assets"></div>
              <span className="sr-only">Loading assets</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Assets</h1>
                  <p className="text-muted-foreground">
                    Manage your project files, images, and documents
                  </p>
                </div>
              </div>

              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Assets</CardTitle>
                  <CardDescription>
                    Upload files to your projects. Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AssetUpload projects={projects} />
                </CardContent>
              </Card>

              {/* Assets Grid */}
              {assets.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No assets yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't uploaded any files yet. Upload your first asset to get started.
                    </p>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Use the upload form above to add your first asset.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {assets.map((asset) => (
                    <Card key={asset.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-4">
                            {getFileIcon(asset.type)}
                          </div>
                          <h3 className="font-medium mb-2 truncate w-full" title={asset.name}>
                            {asset.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            {formatFileSize(asset.size)}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            {asset.project?.name || 'No project'}
                          </p>
                          <div className="flex space-x-2">
                            {asset.url && (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={asset.url} target="_blank" rel="noopener noreferrer">
                                    View
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={asset.url} download={asset.name}>
                                    Download
                                  </Link>
                                </Button>
                              </>
                            )}
                            {!asset.url && (
                              <span className="text-sm text-muted-foreground">No URL available</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Asset Statistics */}
              {assets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                          <p className="text-2xl font-bold">{assets.length}</p>
                        </div>
                        <FolderOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Images</p>
                          <p className="text-2xl font-bold">{assets.filter(a => a.type && a.type.startsWith('image/')).length}</p>
                        </div>
                        <Image className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Documents</p>
                          <p className="text-2xl font-bold">{assets.filter(a => a.type && (a.type.includes('pdf') || a.type.includes('document'))).length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                          <p className="text-2xl font-bold">
                            {formatFileSize(assets.reduce((sum, asset) => sum + asset.size, 0))}
                          </p>
                        </div>
                        <File className="h-8 w-8 text-gray-600" />
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
