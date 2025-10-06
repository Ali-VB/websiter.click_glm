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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, MessageSquare, Ticket, FileText, ArrowLeft, ToggleLeft, ToggleRight, Plus } from "lucide-react";

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
  status: "submitted" | "awaiting_invoice" | "approved" | "in_progress" | "completed" | "on_hold";
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
        status: approved ? "approved" : "submitted",
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
        status: "awaiting_invoice",
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

          {/* Project Details - Modern Card Design */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Main Project Info Card */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-1">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🚀</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Project Overview</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Core requirements & specifications</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(project.status)} border-0`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Complete Project Summary - All Required Data */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-6">
                      {/* Website Purpose + Cost */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-xl">🎯</span>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Website Purpose & Cost</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">
                              <strong>• Website Type:</strong> {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Website
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">CAD $2,500</span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">
                            <strong>• Purpose:</strong> {project.description}
                          </div>
                        </div>
                      </div>

                      {/* Selected Additional Features + Cost */}
                      {project.requirements.addons && project.requirements.addons.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">⭐</span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">Selected Additional Features & Cost</h4>
                            </div>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                              {project.requirements.addons.length} items
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {project.requirements.addons.map((addon, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">
                                  <strong>• Feature {index + 1}:</strong> {addon}
                                </span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">CAD $75</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Design Requirements */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-xl">🎨</span>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Design Requirements</h4>
                        </div>
                        <div className="space-y-2">
                          {project.requirements.designStyle && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <strong>• Design Style:</strong> {project.requirements.designStyle.charAt(0).toUpperCase() + project.requirements.designStyle.slice(1)}
                            </div>
                          )}
                          {project.requirements.referenceWebsites && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <strong>• Reference Websites:</strong> {project.requirements.referenceWebsites}
                            </div>
                          )}
                          {project.requirements.colorScheme && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <strong>• Color Scheme:</strong> {project.requirements.colorScheme.charAt(0).toUpperCase() + project.requirements.colorScheme.slice(1)}
                            </div>
                          )}
                          {project.requirements.layoutPreference && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <strong>• Layout Preferences:</strong> {project.requirements.layoutPreference.charAt(0).toUpperCase() + project.requirements.layoutPreference.slice(1)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Domain & Hosting + Cost */}
                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-5">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-xl">🌐</span>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Domain & Hosting & Cost</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">
                              <strong>• Domain:</strong> {project.requirements.domain || 'Client provided domain'}
                            </span>
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">CAD $12</span>
                          </div>
                          {project.requirements.hosting && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-300">
                                <strong>• Hosting:</strong> {project.requirements.hosting.charAt(0).toUpperCase() + project.requirements.hosting.slice(1)}
                              </span>
                              <span className="font-bold text-cyan-600 dark:text-cyan-400">CAD $60/year</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Maintenance & Support + Cost */}
                      {project.requirements.maintenance && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xl">🔧</span>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Maintenance & Support & Cost</h4>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">
                              <strong>• Maintenance Plan:</strong> {project.requirements.maintenance.charAt(0).toUpperCase() + project.requirements.maintenance.slice(1)}
                            </span>
                            <span className="font-bold text-green-600 dark:text-green-400">CAD $175/month</span>
                          </div>
                        </div>
                      )}

                      {/* Total Cost Summary */}
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">Total Project Cost</span>
                          <span className="text-2xl font-bold text-primary">
                            CAD $2,647
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Includes one-time setup and annual recurring costs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Deadline Card - Out of the Box */}
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg border-2 border-red-200">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-2xl">📅</span>
                    <h4 className="font-bold text-lg">Project Deadline</h4>
                  </div>
                  <div className="mb-4">
                    <p className="text-3xl font-bold mb-2">
                      {project.deadline ? formatDate(project.deadline) : 'Not Set'}
                    </p>
                    {project.deadline && (
                      <Badge variant={getDeadlineStatus(project.deadline) === "overdue" ? "destructive" : 
                                    getDeadlineStatus(project.deadline) === "due-soon" ? "default" : "secondary"}
                                    className="bg-white text-red-600 hover:bg-red-50">
                        {getDeadlineStatus(project.deadline)}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      const newDeadline = prompt("Enter deadline (YYYY-MM-DD):", project.deadline || "");
                      if (newDeadline) {
                        handleDeadlineUpdate(newDeadline);
                      }
                    }}
                    className="w-full bg-white text-red-600 hover:bg-red-50 font-semibold"
                  >
                    Edit Deadline
                  </Button>
                </div>
              </div>

              {/* Team Members */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">👥 Team Members</h3>
                <div className="space-y-3">
                  {project.teamMembers?.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

        </Card>

        {/* Project Controls */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">🎛️ Project Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Dropdown */}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={project.status} onValueChange={handleStatusChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="awaiting_invoice">Awaiting Invoice</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approval Toggle */}
            <div>
              <Label className="text-sm font-medium">Approved</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  checked={project.isApproved}
                  onCheckedChange={handleApprovalToggle}
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  {project.isApproved ? "Approved" : "Not Approved"}
                </span>
              </div>
            </div>

            {/* Invoice Button */}
            <div>
              <Label className="text-sm font-medium">Invoice</Label>
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => setShowInvoiceModal(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
              <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>📄 Create Invoice</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Owner Information */}
                    <div>
                      <h4 className="font-medium mb-3">Owner Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input value={invoiceData.ownerName} onChange={(e) => setInvoiceData({ ...invoiceData, ownerName: e.target.value })} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={invoiceData.ownerEmail} onChange={(e) => setInvoiceData({ ...invoiceData, ownerEmail: e.target.value })} />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input value={invoiceData.ownerCompany} onChange={(e) => setInvoiceData({ ...invoiceData, ownerCompany: e.target.value })} />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Input value={invoiceData.ownerAddress} onChange={(e) => setInvoiceData({ ...invoiceData, ownerAddress: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div>
                      <h4 className="font-medium mb-3">Project Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Project</Label>
                          <Input value={invoiceData.projectName} onChange={(e) => setInvoiceData({ ...invoiceData, projectName: e.target.value })} />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input value={invoiceData.duration} onChange={(e) => setInvoiceData({ ...invoiceData, duration: e.target.value })} />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input type="date" value={invoiceData.startDate} onChange={(e) => setInvoiceData({ ...invoiceData, startDate: e.target.value })} />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input type="date" value={invoiceData.endDate} onChange={(e) => setInvoiceData({ ...invoiceData, endDate: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <h4 className="font-medium mb-3">Pricing</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Base Price ($)</Label>
                          <Input type="number" value={invoiceData.basePrice} onChange={(e) => setInvoiceData({ ...invoiceData, basePrice: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label>Add-ons Price ($)</Label>
                          <Input type="number" value={invoiceData.addonsPrice} onChange={(e) => setInvoiceData({ ...invoiceData, addonsPrice: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label>Tax Rate</Label>
                          <Input type="number" step="0.01" value={invoiceData.taxRate} onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label>Payment Terms</Label>
                          <Select value={invoiceData.paymentTerms} onValueChange={(value) => setInvoiceData({ ...invoiceData, paymentTerms: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="net_15">Net 15</SelectItem>
                              <SelectItem value="net_30">Net 30</SelectItem>
                              <SelectItem value="net_60">Net 60</SelectItem>
                              <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input type="date" value={invoiceData.dueDate} onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-medium mb-3">Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateInvoice} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Invoice"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Send to Client */}
            <div>
              <Label className="text-sm font-medium">Actions</Label>
              <Button
                onClick={handleSendToClient}
                disabled={isLoading || project.status !== "in_progress"}
                className="w-full mt-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Sending..." : "🚀 Send to Client"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions & Activity Feed */}
          <div className="lg:col-span-2 space-y-6">


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
      </div>
    </div>
  );
}
