'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileText,
  MessageSquare,
  Download,
  Eye,
  MapPin
} from 'lucide-react';
import { 
  ProjectStage, 
  getStageColor, 
  getStageProgress, 
  getStageInfo,
  clientStageInfo,
  mapLegacyStatus
} from '@/lib/project-stages';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStage;
  website_type: string;
  design_preferences: Record<string, unknown>;
  add_ons: Record<string, unknown>;
  domain_info: Record<string, unknown>;
  maintenance_plan: string;
  created_at: string;
  updated_at: string;
  client_id: string;
}

interface Asset {
  id: string;
  file_name: string;
  file_url: string;
  asset_type: string;
  description: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  project_id: string;
  status: "draft" | "pending_payment" | "paid" | "cancelled";
  total_amount: number;
  currency: string;
  created_at: string;
  tax_amount: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  created_at: string;
  project_id?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  due_date: string;
  completed_at?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!projectResponse.ok) {
          throw new Error('Project not found');
        }

        const projectData = await projectResponse.json();
        setProject(projectData.project);

        // Fetch project assets
        const assetsResponse = await fetch(`/api/assets?projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          setAssets(assetsData.assets || []);
        }

        // Fetch project invoices
        const invoicesResponse = await fetch(`/api/invoices`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          const projectInvoices = invoicesData.invoices?.filter((inv: Invoice) => 
            inv.project_id === projectId
          ) || [];
          setInvoices(projectInvoices);
        }

        // Fetch project support tickets
        const ticketsResponse = await fetch(`/api/support`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          const projectTickets = ticketsData.tickets?.filter((ticket: SupportTicket) => 
            ticket.project_id === projectId
          ) || [];
          setTickets(projectTickets);
        }

        // Generate mock milestones based on project status
        const mockMilestones: Milestone[] = generateMilestones(projectData.project);
        setMilestones(mockMilestones);

      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, router]);

  const generateMilestones = (project: Project): Milestone[] => {
    const baseMilestones: Milestone[] = [
      {
        id: '1',
        title: 'Project Discovery',
        description: 'Initial consultation and requirements gathering',
        status: 'completed',
        due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: 'Design Phase',
        description: 'Website design and mockups creation',
        status: project.status === 'pending' ? 'pending' : 'completed',
        due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: project.status !== 'pending' ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      },
      {
        id: '3',
        title: 'Development',
        description: 'Website development and implementation',
        status: project.status === 'in_progress' ? 'in_progress' : 
                project.status === 'completed' || project.status === 'review' ? 'completed' : 'pending',
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: project.status === 'completed' ? new Date().toISOString() : undefined,
      },
      {
        id: '4',
        title: 'Testing & Review',
        description: 'Quality assurance and client review',
        status: project.status === 'completed' ? 'completed' : 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: project.status === 'completed' ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      },
      {
        id: '5',
        title: 'Launch',
        description: 'Website deployment and go-live',
        status: project.status === 'completed' ? 'completed' : 'pending',
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: project.status === 'completed' ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      },
    ];

    return baseMilestones;
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
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "pending_payment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getProgressPercentage = () => {
    if (!project) return 0;
    
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = milestones.length;
    
    return Math.round((completedMilestones / totalMilestones) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error || 'Project not found'}</p>
            <Button onClick={() => router.push('/dashboard?tab=projects')}>
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard?tab=projects">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>
                  Overall progress and milestone tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {milestones.filter(m => m.status === 'completed').length} of {milestones.length} milestones completed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Comprehensive information about your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm text-muted-foreground">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm text-muted-foreground">{formatDate(project.updated_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Website Type:</span>
                      <span className="text-sm text-muted-foreground">{project.website_type}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Maintenance:</span>
                      <Badge variant={project.maintenance_plan === 'none' || project.maintenance_plan === 'payg' || !project.maintenance_plan ? 'secondary' : 'default'} className="text-xs">
                        {project.maintenance_plan === 'none' || project.maintenance_plan === 'payg' || !project.maintenance_plan ? 'Pay-As-You-Go' : 'Active'}
                      </Badge>
                    </div>
                    {project.domain_info && typeof project.domain_info === 'object' && 'domain' in project.domain_info && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Domain:</span>
                        <span className="text-sm text-muted-foreground">
                          {String(project.domain_info.domain) || 'Not specified'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {project.design_preferences && (
                  <div>
                    <h4 className="font-medium mb-2">Design Preferences</h4>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <div className="space-y-3">
                        {typeof project.design_preferences === 'object' && project.design_preferences !== null ? (
                          Object.entries(project.design_preferences).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-sm font-medium capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                                 typeof value === 'string' ? value : 
                                 Array.isArray(value) ? value.join(', ') : 
                                 String(value)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No specific design preferences</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {project.add_ons && Object.keys(project.add_ons).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Add-ons</h4>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <div className="space-y-3">
                        {typeof project.add_ons === 'object' && project.add_ons !== null ? (
                          Object.entries(project.add_ons).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-sm font-medium capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                                 typeof value === 'string' ? value : 
                                 Array.isArray(value) ? value.join(', ') : 
                                 String(value)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No add-ons selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visual Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Visual timeline of your project progress and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Timeline Controls */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Completed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">In Progress</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Pending</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {milestones.length} milestones • {milestones.filter(m => m.status === 'completed').length} completed
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                    
                    <div className="space-y-8">
                      {milestones.map((milestone, index) => (
                        <div key={milestone.id} className="relative flex items-start">
                          {/* Timeline Node */}
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background ${
                            milestone.status === "completed" ? "bg-green-500 text-white" :
                            milestone.status === "in_progress" ? "bg-blue-500 text-white" :
                            "bg-gray-400 text-white"
                          }`}>
                            {milestone.status === "completed" ? "✓" :
                             milestone.status === "in_progress" ? "→" : "!"}
                          </div>
                          
                          {/* Timeline Content */}
                          <div className="ml-6 flex-1">
                            <Card className="transition-all hover:shadow-md">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                                    <CardDescription className="mt-1">{milestone.description}</CardDescription>
                                  </div>
                                  <Badge variant="outline" className={getStatusColor(milestone.status)}>
                                    {milestone.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {/* Progress Bar */}
                                <div className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Progress</span>
                                    <span className="text-sm text-muted-foreground">
                                      {milestone.status === "completed" ? "100%" :
                                       milestone.status === "in_progress" ? "65%" : "25%"}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={
                                      milestone.status === "completed" ? 100 :
                                      milestone.status === "in_progress" ? 65 : 25
                                    } 
                                    className="h-2" 
                                  />
                                </div>
                                
                                {/* Timeline Events */}
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Due: {formatDate(milestone.due_date)}</span>
                                  </div>
                                  {milestone.completed_at && (
                                    <div className="flex items-center text-sm text-green-600">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      <span>Completed: {formatDate(milestone.completed_at)}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Timeline Summary */}
                  <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Timeline Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Duration:</span>
                        <span className="ml-2 font-medium">
                          {Math.ceil((new Date(milestones[milestones.length - 1]?.due_date || Date.now()).getTime() - new Date(milestones[0]?.due_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active Milestones:</span>
                        <span className="ml-2 font-medium">
                          {milestones.filter(m => m.status === 'in_progress' || m.status === 'pending').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completion Rate:</span>
                        <span className="ml-2 font-medium">
                          {Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>
                  Key milestones and deliverables for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                        milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusIcon(milestone.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={getStatusColor(milestone.status)}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Due: {formatDate(milestone.due_date)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        {milestone.completed_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed: {formatDate(milestone.completed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Related Items */}
          <div className="space-y-6">
            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Project Assets
                  <span className="text-sm font-normal text-muted-foreground">
                    {assets.length} files
                  </span>
                </CardTitle>
                <CardDescription>
                  Files and resources for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No assets uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assets.slice(0, 5).map((asset) => (
                      <div key={asset.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-800" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{asset.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.asset_type} • {formatDate(asset.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {assets.length > 5 && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/dashboard?tab=assets">
                          View All Assets
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Invoices
                  <span className="text-sm font-normal text-muted-foreground">
                    {invoices.length} invoices
                  </span>
                </CardTitle>
                <CardDescription>
                  Billing and payment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      No invoices yet
                    </p>
                    {project?.status === 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/invoices'}>
                        <FileText className="w-4 h-4 mr-2" />
                        Request Invoice
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-800" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">#{invoice.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(invoice.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(invoice.total_amount + invoice.tax_amount, invoice.currency)}
                          </p>
                          <Badge variant="outline" className={getStatusColor(invoice.status)}>
                            {invoice.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/dashboard/invoices'}>
                        <FileText className="w-4 h-4 mr-2" />
                        View All Invoices
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Support Tickets
                  <span className="text-sm font-normal text-muted-foreground">
                    {tickets.length} tickets
                  </span>
                </CardTitle>
                <CardDescription>
                  Help and support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No support tickets
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-orange-800" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.category} • {formatDate(ticket.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
