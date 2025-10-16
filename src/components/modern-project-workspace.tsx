"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CustomInvoiceModal from "@/components/CustomInvoiceModal";
import { Upload, MessageSquare, Ticket, FileText, ArrowLeft, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectDetails } from "@/components/project-details";
import {
  ProjectStage,
  getStageColor,
  getStageProgress,
  getNextStage,
  canTransitionTo,
  getAllStages,
  getStageInfo,
  adminStageInfo
} from "@/lib/project-stages";

// Types
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "draft" | "pending_payment" | "paid" | "cancelled";
  totalAmount: number;
  dueDate: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: "project_update" | "asset_upload" | "communication" | "milestone" | "invoice";
  description: string;
  timestamp: string;
  user: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: ProjectStage;
  type: "business" | "portfolio" | "landing" | "booking" | "ecommerce" | "custom";
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  progressPercentage: number;
  lastActivityAt: string;
  isApproved: boolean;
  teamMembers: TeamMember[];
  milestones: ProjectMilestone[];
  assets: ProjectAsset[];
  communications: Communication[];
  invoices: Invoice[];
  requirements: {
    basePackage: string;
    addons: string[];
    designStyle: string;
    referenceWebsites: string;
    colorScheme: string;
    layoutPreference: string;
    domain: string;
    hosting: string;
    maintenance: string;
  };
  domain_info?: {
    domainOption?: string;
    hostingOption?: string;
    domain?: string;
    hosting?: string;
  };
}

interface ModernProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onProjectUpdate: (project: Project) => void;
}

export default function ModernProjectWorkspace({
  project: initialProject,
  onBack,
  onProjectUpdate
}: ModernProjectWorkspaceProps) {
  const [project, setProject] = useState(initialProject);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [tempDeadline, setTempDeadline] = useState(project.deadline || "");
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    ownerName: project.clientName,
    ownerEmail: project.clientEmail,
    ownerCompany: "",
    ownerAddress: "",
    projectName: project.name,
    duration: "4 weeks",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    basePrice: 2500,
    addonsPrice: 0,
    taxRate: 0.08,
    paymentTerms: "net_30",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Update local project state when prop changes
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  // Mock real-time activity feed
  useEffect(() => {
    const mockActivity: ActivityItem[] = [
      {
        id: "1",
        type: "project_update",
        description: "Project status updated to in_progress",
        timestamp: new Date().toISOString(),
        user: "Admin"
      },
      {
        id: "2",
        type: "milestone",
        description: "Milestone 'Design Approval' completed",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: "Sarah Chen"
      },
      {
        id: "3",
        type: "communication",
        description: "New message from client regarding timeline",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: "John Smith"
      },
      {
        id: "4",
        type: "asset_upload",
        description: "New asset uploaded: logo.png",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        user: "John Smith"
      }
    ];
    setActivityFeed(mockActivity);
  }, [project.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "awaiting_invoice":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "completed":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "on_hold":
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return formatDate(dateString);
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (deadline: string) => {
    const daysUntil = getDaysUntilDeadline(deadline);
    if (!daysUntil) return "no-deadline";
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 3) return "due-soon";
    return "on-track";
  };

  const handleDeadlineUpdate = async (newDeadline: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProject: Project = {
        ...project,
        deadline: newDeadline,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      setProject(updatedProject);
      onProjectUpdate(updatedProject);

      // Add to activity feed
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: "project_update",
        description: `Project deadline updated to ${formatDate(newDeadline)}`,
        timestamp: new Date().toISOString(),
        user: "Admin"
      };
      setActivityFeed(prev => [newActivity, ...prev]);

    } catch (err) {
      setError("Failed to update deadline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalToggle = async (approved: boolean) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProject: Project = {
        ...project,
        isApproved: approved,
        status: approved ? "payment_pending" : "submitted",
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      setProject(updatedProject);
      onProjectUpdate(updatedProject);

      // Add to activity feed
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: "project_update",
        description: approved ? "Project approved" : "Project approval revoked",
        timestamp: new Date().toISOString(),
        user: "Admin"
      };
      setActivityFeed(prev => [newActivity, ...prev]);

    } catch (err) {
      setError("Failed to update approval status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProject = {
        ...project,
        status: newStatus as Project['status'],
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      setProject(updatedProject);
      onProjectUpdate(updatedProject);

      // Add to activity feed
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: "project_update",
        description: `Project status changed to ${newStatus.replace('_', ' ')}`,
        timestamp: new Date().toISOString(),
        user: "Admin"
      };
      setActivityFeed(prev => [newActivity, ...prev]);

    } catch (err) {
      setError("Failed to update project status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Calculate totals
      const subtotal = invoiceData.basePrice + invoiceData.addonsPrice;
      const taxAmount = Math.round(subtotal * invoiceData.taxRate);
      const totalAmount = subtotal + taxAmount;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: `INV-${Date.now()}`,
        status: "draft",
        totalAmount,
        dueDate: invoiceData.dueDate,
        createdAt: new Date().toISOString()
      };

      const updatedProject: Project = {
        ...project,
        invoices: [...(project.invoices || []), newInvoice],
        status: "invoice_sent",
        deadline: invoiceData.endDate, // Set deadline from invoice end date
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      setProject(updatedProject);
      onProjectUpdate(updatedProject);
      setShowInvoiceModal(false);

      // Add to activity feed
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: "invoice",
        description: `Invoice ${newInvoice.invoiceNumber} created`,
        timestamp: new Date().toISOString(),
        user: "Admin"
      };
      setActivityFeed(prev => [newActivity, ...prev]);

    } catch (err) {
      setError("Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToClient = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProject: Project = {
        ...project,
        status: "completed",
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };

      setProject(updatedProject);
      onProjectUpdate(updatedProject);

      // Add to activity feed
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: "project_update",
        description: "Project delivered to client dashboard",
        timestamp: new Date().toISOString(),
        user: "Admin"
      };
      setActivityFeed(prev => [newActivity, ...prev]);

    } catch (err) {
      setError("Failed to send project to client");
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project_update": return "📊";
      case "asset_upload": return "📁";
      case "communication": return "💬";
      case "milestone": return "🎯";
      case "invoice": return "💳";
      default: return "📝";
    }
  };

  const daysUntilDeadline = getDaysUntilDeadline(project.deadline);
  const subtotal = invoiceData.basePrice + invoiceData.addonsPrice;
  const taxAmount = Math.round(subtotal * invoiceData.taxRate);
  const totalAmount = subtotal + taxAmount;

  // Get primary actions based on current stage
  const getPrimaryActions = (status: string) => {
    const actions: Array<{
      icon: string;
      title: string;
      description: string;
      buttonText: string;
      handler: () => void;
    }> = [];

    switch (status) {
      case "submitted":
        actions.push({
          icon: "📋",
          title: "Review Project Requirements",
          description: "Check all project details and requirements",
          buttonText: "Review Now",
          handler: () => console.log("Review project")
        });
        actions.push({
          icon: "✅",
          title: "Approve Project",
          description: "Approve and move to payment stage",
          buttonText: "Approve",
          handler: () => handleApprovalToggle(true)
        });
        break;

      case "awaiting_confirmation":
        actions.push({
          icon: "💳",
          title: "Create Invoice",
          description: "Send invoice to client for payment",
          buttonText: "Create Invoice",
          handler: () => setShowInvoiceModal(true)
        });
        actions.push({
          icon: "📅",
          title: "Set Deadline",
          description: "Set project completion deadline",
          buttonText: "Set Deadline",
          handler: () => {
            const newDeadline = prompt("Enter deadline (YYYY-MM-DD):");
            if (newDeadline) handleDeadlineUpdate(newDeadline);
          }
        });
        break;

      case "payment_pending":
        actions.push({
          icon: "✅",
          title: "Confirm Payment",
          description: "Mark payment as received",
          buttonText: "Confirm Payment",
          handler: () => handleStatusChange("designing")
        });
        actions.push({
          icon: "📧",
          title: "Send Payment Reminder",
          description: "Send reminder to client",
          buttonText: "Send Reminder",
          handler: () => console.log("Send reminder")
        });
        break;

      case "designing":
        actions.push({
          icon: "🎨",
          title: "Review Design Deliverables",
          description: "Check all design assets and mockups",
          buttonText: "Review Design",
          handler: () => console.log("Review design")
        });
        actions.push({
          icon: "📤",
          title: "Send Design to Client",
          description: "Share design preview with client",
          buttonText: "Send to Client",
          handler: () => console.log("Send design to client")
        });
        break;

      case "developing":
        actions.push({
          icon: "🚀",
          title: "Deploy to Staging",
          description: "Deploy project to staging server",
          buttonText: "Deploy Now",
          handler: () => console.log("Deploy to staging")
        });
        actions.push({
          icon: "👀",
          title: "Client Preview",
          description: "Prepare client preview session",
          buttonText: "Setup Preview",
          handler: () => console.log("Setup preview")
        });
        break;

      case "feedback":
        actions.push({
          icon: "✅",
          title: "Mark as Completed",
          description: "Finalize project and deliver to client",
          buttonText: "Complete Project",
          handler: () => handleStatusChange("completed")
        });
        actions.push({
          icon: "🔄",
          title: "Request Changes",
          description: "Go back to design/development",
          buttonText: "Request Changes",
          handler: () => console.log("Request changes")
        });
        break;

      case "completed":
        actions.push({
          icon: "📁",
          title: "Archive Project",
          description: "Archive completed project",
          buttonText: "Archive",
          handler: () => console.log("Archive project")
        });
        break;
    }

    return actions;
  };

  // Get secondary actions based on current stage
  const getSecondaryActions = (status: string) => {
    const actions: Array<{
      icon: string;
      title: string;
      handler: () => void;
    }> = [];

    actions.push({
      icon: "💬",
      title: "Send Message",
      handler: () => console.log("Send message")
    });

    actions.push({
      icon: "📁",
      title: "Upload Assets",
      handler: () => console.log("Upload assets")
    });

    if (status !== "submitted" && status !== "completed") {
      actions.push({
        icon: "📊",
        title: "Update Progress",
        handler: () => console.log("Update progress")
      });
    }

    actions.push({
      icon: "📝",
      title: "Add Note",
      handler: () => console.log("Add note")
    });

    return actions;
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Project Header */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  🚀 {project.name}
                  <Badge className={getStatusColor(project.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </h1>
              </div>
              <p className="text-muted-foreground text-lg mb-4">{project.description}</p>

              {/* Client Info */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="font-medium">Client:</span> {project.clientName} ({project.clientEmail})
                </div>
                <div>
                  <span className="font-medium">Type:</span> {project.type}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(project.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(project.updatedAt)}
                </div>
              </div>
            </div>
          </div>


        </Card>

        {/* Project Actions */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">🎯 PROJECT ACTIONS</h3>
              <p className="text-sm text-muted-foreground">
                Current Stage: <span className="font-semibold text-primary">{project.status.replace('_', ' ').toUpperCase()}</span>
                {project.deadline && ` • Deadline: ${formatDate(project.deadline)}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-2xl font-bold text-primary">{getStageProgress(project.status)}%</div>
            </div>
          </div>

          <div className="space-y-6">
            {/* PROJECT OVERVIEW BAR */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Stage:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Progress:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                          style={{ width: `${getStageProgress(project.status)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {getStageProgress(project.status)}%
                      </span>
                    </div>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Deadline:</span>
                      <Badge variant={getDeadlineStatus(project.deadline) === "overdue" ? "destructive" :
                        getDeadlineStatus(project.deadline) === "due-soon" ? "default" : "secondary"}
                        className="text-xs">
                        {formatDate(project.deadline)} ({getDaysUntilDeadline(project.deadline)} days)
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Team:</span>
                    <div className="flex items-center space-x-1">
                      <Avatar className="h-6 w-6 -ml-2 first:ml-0 border-2 border-white dark:border-gray-900">
                        <AvatarFallback className="text-xs">
                          {project.teamMembers?.[0]?.name?.split(' ').map(n => n[0]).join('') || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      {project.teamMembers && project.teamMembers.length > 1 && (
                        <Avatar className="h-6 w-6 -ml-2 border-2 border-white dark:border-gray-900">
                          <AvatarFallback className="text-xs">
                            {project.teamMembers[1]?.name?.split(' ').map(n => n[0]).join('') || 'T'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 ml-2">
                        {project.teamMembers?.length || 0} members
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditingDeadline ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="date"
                        value={tempDeadline}
                        onChange={(e) => setTempDeadline(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-40 h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (tempDeadline) {
                            handleDeadlineUpdate(tempDeadline);
                          }
                          setIsEditingDeadline(false);
                        }}
                        disabled={!tempDeadline || isLoading}
                        className="h-8 px-3"
                      >
                        {isLoading ? "..." : "✓"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempDeadline(project.deadline || "");
                          setIsEditingDeadline(false);
                        }}
                        className="h-8 px-3"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempDeadline(project.deadline || "");
                        setIsEditingDeadline(true);
                      }}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/20"
                    >
                      📅 Edit Deadline
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    👥 Manage Team
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* Custom Invoice Modal */}
        <CustomInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoiceData={invoiceData}
          setInvoiceData={setInvoiceData}
          project={{
            ...project,
            domain_info: {
              domainOption: project.requirements.domain,
              hostingOption: project.requirements.hosting,
            },
          }}
          onCreateInvoice={handleCreateInvoice}
          isLoading={isLoading}
        />

        {/* SPLIT VIEW: Project Details (Left) + Timeline (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Project Details - Left Side (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold mb-4">📋 Project Details</h3>
              <ProjectDetails project={{
                id: project.id,
                website_type: project.type,
                design_preferences: {
                  designStyle: project.requirements.designStyle,
                  referenceWebsites: project.requirements.referenceWebsites,
                  colorScheme: project.requirements.colorScheme,
                  layoutPreferences: project.requirements.layoutPreference,
                },
                add_ons: project.requirements.addons,
                domain_info: {
                  domainOption: project.requirements.domain,
                  hostingOption: project.requirements.hosting,
                },
                maintenance_plan: project.requirements.maintenance,
              }} />
            </Card>
          </div>

          {/* Project Timeline - Right Side (1/3 width) */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">📊 Project Timeline</h3>
                <Badge variant="outline" className="animate-pulse">LIVE</Badge>
              </div>
              <ProjectTimeline
                currentStage={project.status}
                isAdmin={true}
                onStageChange={handleStatusChange}
                projectId={project.id}
              />
            </Card>
          </div>
        </div>

        {/* ADMIN ACTIONS */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">⚙️ ADMIN ACTIONS</h3>
              <p className="text-sm text-muted-foreground">
                Manage project workflow and client interactions
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Current Stage</div>
              <div className="text-lg font-semibold text-primary">{project.status.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Approve/Revoke Project - FIRST ITEM - Shows in submitted stage or when approved */}
            {(project.status === 'submitted' || project.isApproved) && (
              <Button
                onClick={() => handleApprovalToggle(!project.isApproved)}
                disabled={isLoading}
                className={project.isApproved ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
              >
                {project.isApproved ? "🔄 Revoke Approval" : "✅ Approve Project"}
              </Button>
            )}

            {/* Create Invoice - Available from initial stage */}
            <Button
              onClick={() => setShowInvoiceModal(true)}
              disabled={isLoading}
              variant="outline"
            >
              💳 Create Invoice
            </Button>

            {/* Confirm Payment - Available from initial stage */}
            <Button
              onClick={() => handleStatusChange("in_progress")}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ✅ Confirm Payment
            </Button>

            {/* Send to Client - Available in in_progress stage */}
            {project.status === 'in_progress' && (
              <Button
                variant="outline"
                onClick={handleSendToClient}
                disabled={isLoading}
              >
                📤 Send to Client
              </Button>
            )}

            {/* Stage Selector - Always available for manual overrides */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">Manual Stage Change:</span>
              <Select value={project.status} onValueChange={handleStatusChange} disabled={isLoading}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Change Stage" />
                </SelectTrigger>
                <SelectContent>
                  {getAllStages(true).map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Instructions */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">💡 Action Guide:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>• <strong>Submitted:</strong> Review client requirements and approve project</div>
              <div>• <strong>Approved:</strong> Create invoice and set project timeline</div>
              <div>• <strong>Payment Pending:</strong> Confirm payment receipt</div>
              <div>• <strong>In Progress:</strong> Develop and deliver to client</div>
            </div>
          </div>
        </Card>

        {/* PROJECT NOTES WITH RICH TEXT EDITOR */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">📝 Project Notes</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Internal Notes</Badge>
                  <span className="text-sm text-muted-foreground">Auto-saves as you type</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Note
                  </Button>
                  <Button variant="outline" size="sm">
                    📋 View History
                  </Button>
                </div>
              </div>

              {/* Simple Rich Text Editor */}
              <div className="border rounded-md p-3 bg-background">
                <div className="flex items-center space-x-2 mb-3 pb-3 border-b">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <strong>B</strong>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <em>I</em>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    • List
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    🔗 Link
                  </Button>
                </div>
                <Textarea
                  placeholder="Add your project notes here... This is a rich text editor where you can format text, add lists, and links."
                  className="min-h-[150px] border-none resize-none focus:outline-none"
                  defaultValue=""
                />
              </div>

              <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <span>Last edited: Just now by Admin</span>
                <div className="flex items-center space-x-2">
                  <span>Characters: 0</span>
                  <span>•</span>
                  <span>Saved: Auto</span>
                </div>
              </div>
            </div>

            {/* Recent Notes History */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Notes</h4>
              <div className="space-y-2">
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Initial project review completed</span>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Client requirements reviewed. All specifications look good. Ready to move to approval stage.</p>
                </div>
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Design preferences noted</span>
                    <span className="text-xs text-muted-foreground">Yesterday</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Client prefers modern, clean design with blue color scheme. Reference websites provided.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🔄 Recent Activity</h3>
            <Badge variant="outline" className="animate-pulse">LIVE</Badge>
          </div>
          <div className="space-y-4">
            {activityFeed.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.user} • {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
