"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  pendingInvoices: number;
  openSupportTickets: number;
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }>;
  systemStatus: {
    database: string;
    api: string;
    storage: string;
    email: string;
  };
}

interface RealtimeMetrics {
  activeProjectsWithCompletion: {
    count: number;
    completionRate: number;
    trend: 'up' | 'down' | 'stable';
  };
  revenueComparison: {
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  outstandingPayments: {
    count: number;
    amount: number;
    trend: 'up' | 'down' | 'stable';
  };
  supportTicketResolution: {
    total: number;
    resolved: number;
    resolutionRate: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface ActivityFeedItem {
  id: string;
  type: 'project_submission' | 'payment' | 'ticket' | 'asset_upload' | 'status_change';
  clientId: string;
  clientName: string;
  action: string;
  description: string;
  timestamp: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface ActionItem {
  id: string;
  type: 'project_approval' | 'invoice_review' | 'contact_submission' | 'urgent_ticket';
  title: string;
  description: string;
  clientId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
}

interface PerformanceData {
  projectStatusDistribution: {
    planning: number;
    in_progress: number;
    review: number;
    completed: number;
    on_hold: number;
  };
  revenueTrends: Array<{
    month: string;
    revenue: number;
  }>;
  clientAcquisition: Array<{
    month: string;
    newClients: number;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    fetchDashboardData();
    setupRealtimeUpdates();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      const [statsResponse, metricsResponse, activityResponse, actionsResponse, performanceResponse] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
        }),
        fetch("/api/admin/metrics", {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
        }),
        fetch("/api/admin/activity", {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
        }),
        fetch("/api/admin/actions", {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
        }),
        fetch("/api/admin/performance", {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) setStats(statsData.stats);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        if (metricsData.success) setMetrics(metricsData.metrics);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) setActivityFeed(activityData.activity);
      }

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        if (actionsData.success) setActionItems(actionsData.actions);
      }

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        if (performanceData.success) setPerformanceData(performanceData.data);
      }

    } catch (err) {
      setError("An error occurred while loading dashboard data");
      console.error("Admin dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    // Setup SSE connection for real-time updates
    const eventSource = new EventSource('/api/realtime/sse?userId=admin');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'project_update':
        case 'payment_success':
        case 'ticket_create':
        case 'asset_upload':
          // Refresh activity feed
          fetchActivityFeed();
          break;
        case 'new_action_item':
          // Refresh action items
          fetchActionItems();
          break;
        case 'metrics_update':
          // Refresh metrics
          fetchMetrics();
          break;
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  };

  const fetchActivityFeed = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;
      
      const response = await fetch("/api/admin/activity", {
        headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) setActivityFeed(data.activity);
      }
    } catch (err) {
      console.error("Error fetching activity feed:", err);
    }
  };

  const fetchActionItems = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;
      
      const response = await fetch("/api/admin/actions", {
        headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) setActionItems(data.actions);
      }
    } catch (err) {
      console.error("Error fetching action items:", err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      if (!token) return;
      
      const response = await fetch("/api/admin/metrics", {
        headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("supabase.auth.token");
    router.push("/");
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_submission': return '🚀';
      case 'payment': return '💳';
      case 'ticket': return '🎫';
      case 'asset_upload': return '📁';
      case 'status_change': return '📊';
      default: return '📝';
    }
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
          <Logo size={32} showText={true} />
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
          
          <Separator className="my-4" />
          
          {/* Placeholder navigation items */}
          <Link href="/admin/assets" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            📁 Assets Management
          </Link>
          <Link href="/admin/payments" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            💳 Payment Management
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
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, Admin</span>
              <Button onClick={fetchDashboardData} disabled={isLoading} variant="outline" size="sm">
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Real-time overview of your websiter.click administration panel
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{metrics?.activeProjectsWithCompletion.count || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.activeProjectsWithCompletion.completionRate || 0}% completion rate
                  </p>
                </div>
                <div className="text-2xl">
                  {getTrendIcon(metrics?.activeProjectsWithCompletion.trend || 'stable')}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue This Month</p>
                  <p className="text-2xl font-bold">
                    ${(metrics?.revenueComparison.thisMonth || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    vs ${(metrics?.revenueComparison.lastMonth || 0).toLocaleString()} last month
                  </p>
                </div>
                <div className="text-2xl">
                  {getTrendIcon(metrics?.revenueComparison.trend || 'stable')}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding Payments</p>
                  <p className="text-2xl font-bold">{metrics?.outstandingPayments.count || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(metrics?.outstandingPayments.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">
                  {getTrendIcon(metrics?.outstandingPayments.trend || 'stable')}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Support Resolution</p>
                  <p className="text-2xl font-bold">
                    {metrics?.supportTicketResolution.resolutionRate || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.supportTicketResolution.resolved || 0} of {metrics?.supportTicketResolution.total || 0} resolved
                  </p>
                </div>
                <div className="text-2xl">
                  {getTrendIcon(metrics?.supportTicketResolution.trend || 'stable')}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Real-time Activity Feed</h2>
                  <Badge variant="outline" className="animate-pulse">LIVE</Badge>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activityFeed.length > 0 ? (
                    activityFeed.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="text-lg">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{activity.clientName}</p>
                              <p className="text-sm text-muted-foreground">{activity.action}</p>
                              <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={getPriorityColor(activity.priority || 'normal')} className="text-xs">
                                {activity.priority || 'normal'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No recent activity</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Action Center */}
            <div>
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Action Center</h2>
                  <Badge variant="destructive">{actionItems.length}</Badge>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {actionItems.length > 0 ? (
                    actionItems.map((action) => (
                      <div key={action.id} className="p-3 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-medium">{action.title}</h3>
                          <Badge variant={getPriorityColor(action.priority)} className="text-xs">
                            {action.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {new Date(action.timestamp).toLocaleDateString()}
                          </p>
                          <Button size="sm" variant="outline" className="text-xs">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No action items</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Project Status Distribution</h2>
              {performanceData && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Planning</span>
                    <span className="text-sm font-medium">{performanceData.projectStatusDistribution.planning}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <span className="text-sm font-medium">{performanceData.projectStatusDistribution.in_progress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Review</span>
                    <span className="text-sm font-medium">{performanceData.projectStatusDistribution.review}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium">{performanceData.projectStatusDistribution.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On Hold</span>
                    <span className="text-sm font-medium">{performanceData.projectStatusDistribution.on_hold}</span>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Revenue Trends</h2>
              {performanceData && (
                <div className="space-y-2">
                  {performanceData.revenueTrends.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{trend.month}</span>
                      <span className="text-sm font-medium">${trend.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Client Acquisition</h2>
              {performanceData && (
                <div className="space-y-2">
                  {performanceData.clientAcquisition.map((acquisition, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{acquisition.month}</span>
                      <span className="text-sm font-medium">{acquisition.newClients} new</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
