"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin-layout";
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
  MapPin,
  Upload,
  Ticket,
  Save,
  Edit2
} from "lucide-react";

// Types for the workspace
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
    taxAmount?: number;
    currency?: string;
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
    website_type?: string;
    createdAt: string;
    updatedAt: string;
    deadline?: string;
    progressPercentage: number;
    lastActivityAt: string;
    teamMembers: TeamMember[];
    milestones: ProjectMilestone[];
    assets: ProjectAsset[];
    communications: Communication[];
    invoices: Invoice[];
    design_preferences?: Record<string, unknown>;
    add_ons?: Record<string, unknown>;
    domain_info?: Record<string, unknown>;
    maintenance_plan?: string;
    // Legacy support for old structure
    requirements?: {
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

interface AdminProjectWorkspaceProps {
    project: Project;
    onBack: () => void;
    onProjectUpdate: (project: Project) => void;
}

export default function AdminProjectWorkspace({
    project: initialProject,
    onBack,
    onProjectUpdate
}: AdminProjectWorkspaceProps) {
    const [project, setProject] = useState(initialProject);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [newInternalNote, setNewInternalNote] = useState("");
    const [newClientMessage, setNewClientMessage] = useState("");
    const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
    const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
    const [isEditingDeadline, setIsEditingDeadline] = useState(false);
    const [newDeadline, setNewDeadline] = useState("");

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
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        return formatDate(dateString);
    };

    const formatCurrency = (amount: number, currency: string = 'CAD') => {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: currency,
        }).format(amount);
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

    const handleConfirmProject = async () => {
        setIsLoading(true);
        setError("");

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const updatedProject = {
                ...project,
                status: "approved" as const,
                updatedAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString()
            };

            setProject(updatedProject);
            onProjectUpdate(updatedProject);

            // Add to activity feed
            const newActivity: ActivityItem = {
                id: Date.now().toString(),
                type: "project_update",
                description: "Project confirmed and approved",
                timestamp: new Date().toISOString(),
                user: "Admin"
            };
            setActivityFeed(prev => [newActivity, ...prev]);

        } catch (err) {
            setError("Failed to confirm project");
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

            const updatedProject = {
                ...project,
                status: "completed" as const,
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

    const handleAddInternalNote = async () => {
        if (!newInternalNote.trim()) return;

        try {
            const newNote: Communication = {
                id: Date.now().toString(),
                type: "internal",
                message: newInternalNote,
                sender: "Admin",
                timestamp: new Date().toISOString(),
                isInternal: true
            };

            const updatedProject = {
                ...project,
                communications: [...project.communications, newNote],
                lastActivityAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setProject(updatedProject);
            onProjectUpdate(updatedProject);
            setNewInternalNote("");

            // Add to activity feed
            const newActivity: ActivityItem = {
                id: Date.now().toString(),
                type: "communication",
                description: "Internal note added",
                timestamp: new Date().toISOString(),
                user: "Admin"
            };
            setActivityFeed(prev => [newActivity, ...prev]);

        } catch (err) {
            setError("Failed to add internal note");
        }
    };

    const handleSendClientMessage = async () => {
        if (!newClientMessage.trim()) return;

        try {
            const newMessage: Communication = {
                id: Date.now().toString(),
                type: "client",
                message: newClientMessage,
                sender: "Admin",
                timestamp: new Date().toISOString(),
                isInternal: false
            };

            const updatedProject = {
                ...project,
                communications: [...project.communications, newMessage],
                lastActivityAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setProject(updatedProject);
            onProjectUpdate(updatedProject);
            setNewClientMessage("");

            // Add to activity feed
            const newActivity: ActivityItem = {
                id: Date.now().toString(),
                type: "communication",
                description: "Message sent to client",
                timestamp: new Date().toISOString(),
                user: "Admin"
            };
            setActivityFeed(prev => [newActivity, ...prev]);

        } catch (err) {
            setError("Failed to send message to client");
        }
    };

    const handleUpdateDeadline = async () => {
        if (!newDeadline.trim()) return;

        try {
            // Get auth token from localStorage
            const token = localStorage.getItem('admin_token');
            if (!token) {
                setError("Authentication required");
                return;
            }

            // Convert date string to ISO format (handle timezone properly)
            // Create date at noon UTC to avoid timezone issues
            const [year, month, day] = newDeadline.split('-').map(Number);
            const deadlineDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            
            if (isNaN(deadlineDate.getTime())) {
                setError("Invalid date format");
                return;
            }

            const response = await fetch(`/api/admin/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    deadline: deadlineDate.toISOString()
                })
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.message || "Failed to update deadline");
                return;
            }

            const updatedProject = {
                ...project,
                deadline: deadlineDate.toISOString(),
                updatedAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString()
            };

            setProject(updatedProject);
            onProjectUpdate(updatedProject);
            setIsEditingDeadline(false);
            setNewDeadline("");

            // Add to activity feed
            const newActivity: ActivityItem = {
                id: Date.now().toString(),
                type: "project_update",
                description: `Project deadline updated to ${formatDate(deadlineDate.toISOString())}`,
                timestamp: new Date().toISOString(),
                user: "Admin"
            };
            setActivityFeed(prev => [newActivity, ...prev]);

        } catch (err) {
            setError("Failed to update deadline");
        }
    };

    const handleStartEditDeadline = () => {
        setIsEditingDeadline(true);
        // Set current deadline as default value if it exists
        if (project.deadline) {
            // Parse the UTC date and format it as YYYY-MM-DD in local timezone
            const utcDate = new Date(project.deadline);
            const year = utcDate.getUTCFullYear();
            const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(utcDate.getUTCDate()).padStart(2, '0');
            setNewDeadline(`${year}-${month}-${day}`);
        } else {
            setNewDeadline("");
        }
    };

    const handleCancelEditDeadline = () => {
        setIsEditingDeadline(false);
        setNewDeadline("");
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

    // Generate mock milestones for visual timeline
    const generateMilestones = () => {
        const baseMilestones: ProjectMilestone[] = [
            {
                id: '1',
                title: 'Project Discovery',
                description: 'Initial consultation and requirements gathering',
                status: 'completed',
                dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '2',
                title: 'Design Phase',
                description: 'Website design and mockups creation',
                status: project.status === 'submitted' ? 'pending' : 'completed',
                dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: project.status !== 'submitted' ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            },
            {
                id: '3',
                title: 'Development',
                description: 'Website development and implementation',
                status: project.status === 'in_progress' ? 'in_progress' : 
                        project.status === 'completed' ? 'completed' : 'pending',
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: project.status === 'completed' ? new Date().toISOString() : undefined,
            },
            {
                id: '4',
                title: 'Testing & Review',
                description: 'Quality assurance and client review',
                status: project.status === 'completed' ? 'completed' : 'pending',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: project.status === 'completed' ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            },
            {
                id: '5',
                title: 'Launch',
                description: 'Website deployment and go-live',
                status: project.status === 'completed' ? 'completed' : 'pending',
                dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: project.status === 'completed' ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            },
        ];

        return baseMilestones;
    };

    const milestones = generateMilestones();
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const progressPercentage = Math.round((completedMilestones / milestones.length) * 100);

    return (
        <AdminLayout title={`Project: ${project.name}`} showRefresh={false}>
            <div className="container mx-auto px-4 py-6">
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                        {error}
                    </div>
                )}

                {/* Project Overview Header */}
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

                            {/* Quick Actions */}
                            <div className="flex gap-3 flex-wrap">
                                {project.status === "submitted" && (
                                    <Button
                                        onClick={handleConfirmProject}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isLoading ? "Confirming..." : "✓ Confirm Project"}
                                    </Button>
                                )}
                                {project.status === "approved" && (
                                    <Button
                                        onClick={() => setShowInvoiceCreator(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        💳 Create Invoice
                                    </Button>
                                )}
                                {project.status === "in_progress" && (
                                    <Button
                                        onClick={handleSendToClient}
                                        disabled={isLoading}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {isLoading ? "Sending..." : "🚀 Send to Client Dashboard"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
                            <div className="text-sm text-muted-foreground">Complete</div>
                            <Progress value={progressPercentage} className="mt-2 h-2" />
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {daysUntilDeadline !== null ? (
                                    <span className={daysUntilDeadline < 0 ? 'text-red-600' : daysUntilDeadline <= 7 ? 'text-yellow-600' : 'text-green-600'}>
                                        {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)}d` : `${daysUntilDeadline}d`}
                                    </span>
                                ) : 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">Until Deadline</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{project.teamMembers?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Team Members</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{project.assets.length}</div>
                            <div className="text-sm text-muted-foreground">Assets</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{project.invoices.length}</div>
                            <div className="text-sm text-muted-foreground">Invoices</div>
                        </div>
                    </div>
                </Card>

                {/* Comprehensive Project Details - Modern Card Design */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    
                    {/* Main Project Info Card */}
                    <div className="lg:col-span-2">
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
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        {/* Main Content - 3/4 width */}
                                        <div className="lg:col-span-3 space-y-6">
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
                                            {(project.add_ons && Object.keys(project.add_ons).length > 0) || (project.requirements?.addons && project.requirements.addons.length > 0) ? (
                                                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-xl p-5">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xl">⭐</span>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">Selected Additional Features & Cost</h4>
                                                        </div>
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                                            {project.add_ons ? Object.keys(project.add_ons).length : project.requirements?.addons?.length || 0} items
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {project.add_ons && typeof project.add_ons === 'object' ? (
                                                            Object.entries(project.add_ons).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between items-center">
                                                                    <span className="text-gray-700 dark:text-gray-300">
                                                                        <strong>• {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}:</strong> {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : typeof value === 'string' ? value : String(value)}
                                                                    </span>
                                                                    <span className="font-bold text-amber-600 dark:text-amber-400">CAD $75</span>
                                                                </div>
                                                            ))
                                                        ) : project.requirements?.addons ? (
                                                            project.requirements.addons.map((addon, index) => (
                                                                <div key={index} className="flex justify-between items-center">
                                                                    <span className="text-gray-700 dark:text-gray-300">
                                                                        <strong>• Feature {index + 1}:</strong> {addon}
                                                                    </span>
                                                                    <span className="font-bold text-amber-600 dark:text-amber-400">CAD $75</span>
                                                                </div>
                                                            ))
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Design Requirements */}
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <span className="text-xl">🎨</span>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">Design Requirements</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    {project.design_preferences && typeof project.design_preferences === 'object' ? (
                                                        Object.entries(project.design_preferences).map(([key, value]) => (
                                                            <div key={key} className="text-gray-700 dark:text-gray-300">
                                                                <strong>• {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}:</strong> {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : String(value)}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <>
                                                            {project.requirements?.designStyle && (
                                                                <div className="text-gray-700 dark:text-gray-300">
                                                                    <strong>• Design Style:</strong> {project.requirements.designStyle.charAt(0).toUpperCase() + project.requirements.designStyle.slice(1)}
                                                                </div>
                                                            )}
                                                            {project.requirements?.colorScheme && (
                                                                <div className="text-gray-700 dark:text-gray-300">
                                                                    <strong>• Color Scheme:</strong> {project.requirements.colorScheme.charAt(0).toUpperCase() + project.requirements.colorScheme.slice(1)}
                                                                </div>
                                                            )}
                                                            {project.requirements?.layoutPreference && (
                                                                <div className="text-gray-700 dark:text-gray-300">
                                                                    <strong>• Layout Preferences:</strong> {project.requirements.layoutPreference.charAt(0).toUpperCase() + project.requirements.layoutPreference.slice(1)}
                                                                </div>
                                                            )}
                                                        </>
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
                                                            <strong>• Domain:</strong> {project.domain_info && typeof project.domain_info === 'object' && 'domain' in project.domain_info ? String(project.domain_info.domain) : project.requirements?.domain || 'Client provided domain'}
                                                        </span>
                                                        <span className="font-bold text-cyan-600 dark:text-cyan-400">CAD $12</span>
                                                    </div>
                                                    {project.domain_info && typeof project.domain_info === 'object' && 'hosting' in project.domain_info && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-700 dark:text-gray-300">
                                                                <strong>• Hosting:</strong> {String(project.domain_info.hosting).charAt(0).toUpperCase() + String(project.domain_info.hosting).slice(1)}
                                                            </span>
                                                            <span className="font-bold text-cyan-600 dark:text-cyan-400">CAD $60/year</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Maintenance & Support + Cost */}
                                            {(project.maintenance_plan || project.requirements?.maintenance) && (
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5">
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <span className="text-xl">🔧</span>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">Maintenance & Support & Cost</h4>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 dark:text-gray-300">
                                                            <strong>• Maintenance Plan:</strong> {(project.maintenance_plan || project.requirements?.maintenance || '').charAt(0).toUpperCase() + (project.maintenance_plan || project.requirements?.maintenance || '').slice(1)}
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

                                        {/* Right Side - Client Info & Timeline - 1/4 width */}
                                        <div className="space-y-6">
                                            {/* Client Information Card */}
                                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center space-x-2 mb-4">
                                                        <span className="text-2xl">👤</span>
                                                        <h4 className="font-bold text-lg">Client Information</h4>
                                                    </div>
                                                    <div className="space-y-3 text-left">
                                                        <div>
                                                            <p className="text-sm opacity-80">Name</p>
                                                            <p className="font-semibold">{project.clientName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm opacity-80">Email</p>
                                                            <p className="font-semibold text-sm break-all">{project.clientEmail}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm opacity-80">Project Type</p>
                                                            <p className="font-semibold">{project.type.charAt(0).toUpperCase() + project.type.slice(1)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                                                        <span className="text-white">📅</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timeline</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Project dates</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Created</span>
                                                        <span className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(project.createdAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Updated</span>
                                                        <span className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(project.updatedAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Last Activity</span>
                                                        <span className="text-xs font-medium text-gray-900 dark:text-white">{formatDateTime(project.lastActivityAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Specs Card */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                                    <span className="text-white">⚙️</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Technical Specs</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Domain & hosting details</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm">🌍</span>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Domain</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {project.domain_info && typeof project.domain_info === 'object' && 'domain' in project.domain_info ? String(project.domain_info.domain) : project.requirements?.domain || 'Not specified'}
                                    </p>
                                </div>

                                {(project.domain_info && typeof project.domain_info === 'object' && 'hosting' in project.domain_info) || project.requirements?.hosting ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-sm">🖥️</span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hosting</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {project.domain_info && typeof project.domain_info === 'object' && 'hosting' in project.domain_info ? String(project.domain_info.hosting) : project.requirements?.hosting}
                                        </p>
                                    </div>
                                ) : null}

                                {project.maintenance_plan || project.requirements?.maintenance ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-sm">🔧</span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Maintenance</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {project.maintenance_plan || project.requirements?.maintenance}
                                        </p>
                                    </div>
                                ) : null}

                                {(project.design_preferences && typeof project.design_preferences === 'object' && 'layout_preference' in project.design_preferences) || project.requirements?.layoutPreference ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-sm">📐</span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Layout</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {project.design_preferences && typeof project.design_preferences === 'object' && 'layout_preference' in project.design_preferences ? String(project.design_preferences.layout_preference) : project.requirements?.layoutPreference}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Timeline */}
                <Card className="p-6 mb-6">
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
                                    {milestones.length} milestones • {completedMilestones} completed
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
                                                            <Badge variant="outline" className={getMilestoneStatusColor(milestone.status)}>
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
                                                                <span>Due: {formatDate(milestone.dueDate)}</span>
                                                            </div>
                                                            {milestone.completedAt && (
                                                                <div className="flex items-center text-sm text-green-600">
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    <span>Completed: {formatDate(milestone.completedAt)}</span>
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
                                            {Math.ceil((new Date(milestones[milestones.length - 1]?.dueDate || Date.now()).getTime() - new Date(milestones[0]?.dueDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} days
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
                                            {Math.round((completedMilestones / milestones.length) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Workspace Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Central Workspace (3 columns) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Column 1: Project Management */}
                            <div className="space-y-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">📋 Project Management</h3>

                                    {/* Client Info */}
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Client Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Name:</strong> {project.clientName}</div>
                                            <div><strong>Email:</strong> {project.clientEmail}</div>
                                            <div><strong>Project Type:</strong> {project.type}</div>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Milestones */}
                                    <div>
                                        <h4 className="font-medium mb-3">Milestones</h4>
                                        <div className="space-y-3">
                                            {milestones.slice(0, 4).map((milestone) => (
                                                <div key={milestone.id} className="border rounded-lg p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{milestone.title}</div>
                                                            <div className="text-xs text-muted-foreground">{milestone.description}</div>
                                                        </div>
                                                        <Badge className={`text-xs ${getMilestoneStatusColor(milestone.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                                            {milestone.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Due: {formatDate(milestone.dueDate)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

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

                            {/* Column 2: Financial Management */}
                            <div className="space-y-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">💳 Financial Management</h3>

                                    {/* Project Requirements */}
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-3">Project Requirements</h4>
                                        <div className="space-y-2 text-sm">
                                            {project.requirements?.basePackage && (
                                                <div><strong>Package:</strong> {project.requirements.basePackage}</div>
                                            )}
                                            {project.requirements?.designStyle && (
                                                <div><strong>Design:</strong> {project.requirements.designStyle}</div>
                                            )}
                                            {project.requirements?.colorScheme && (
                                                <div><strong>Colors:</strong> {project.requirements.colorScheme}</div>
                                            )}
                                            {project.requirements?.domain && (
                                                <div><strong>Domain:</strong> {project.requirements.domain}</div>
                                            )}
                                        </div>

                                        {(project.add_ons && Object.keys(project.add_ons).length > 0) || (project.requirements?.addons && project.requirements.addons.length > 0) ? (
                                            <div className="mt-3">
                                                <div className="font-medium mb-2">Add-ons:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {project.add_ons && typeof project.add_ons === 'object' ? (
                                                        Object.keys(project.add_ons).map((key, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                                                            </Badge>
                                                        ))
                                                    ) : project.requirements?.addons ? (
                                                        project.requirements.addons.map((addon, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {addon}
                                                            </Badge>
                                                        ))
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Invoices */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium">Invoices</h4>
                                            <Button
                                                size="sm"
                                                onClick={() => setShowInvoiceCreator(true)}
                                                className="text-xs"
                                            >
                                                + Create
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {project.invoices.map((invoice) => (
                                                <div key={invoice.id} className="flex justify-between items-center p-2 border rounded">
                                                    <div>
                                                        <div className="text-sm font-medium">{invoice.invoiceNumber}</div>
                                                        <div className="text-xs text-muted-foreground">{formatDate(invoice.createdAt)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium">{formatCurrency(invoice.totalAmount + (invoice.taxAmount || 0), invoice.currency || 'CAD')}</div>
                                                        <Badge variant="outline" className={`text-xs ${getStatusColor(invoice.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                                            {invoice.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Assets */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">📁 Assets</h3>
                                    <div className="space-y-2">
                                        {project.assets.map((asset) => (
                                            <div key={asset.id} className="flex items-center space-x-2 p-2 border rounded">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{asset.name}</div>
                                                    <div className="text-xs text-muted-foreground">{asset.type}</div>
                                                </div>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Column 3: Communications */}
                            <div className="space-y-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">💬 Communications</h3>

                                    {/* Internal Notes */}
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-3">Internal Notes</h4>
                                        <div className="space-y-2 mb-3">
                                            {project.communications.filter(c => c.isInternal).slice(-3).map((comm) => (
                                                <div key={comm.id} className="p-2 bg-muted/50 rounded text-sm">
                                                    <div className="font-medium">{comm.sender}</div>
                                                    <div className="text-muted-foreground">{comm.message}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">{formatDateTime(comm.timestamp)}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Add internal note..."
                                                value={newInternalNote}
                                                onChange={(e) => setNewInternalNote(e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border rounded"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddInternalNote()}
                                            />
                                            <Button size="sm" onClick={handleAddInternalNote}>Add</Button>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Client Messages */}
                                    <div>
                                        <h4 className="font-medium mb-3">Client Messages</h4>
                                        <div className="space-y-2 mb-3">
                                            {project.communications.filter(c => !c.isInternal).slice(-3).map((comm) => (
                                                <div key={comm.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                                    <div className="font-medium">{comm.sender}</div>
                                                    <div className="text-muted-foreground">{comm.message}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">{formatDateTime(comm.timestamp)}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Send message to client..."
                                                value={newClientMessage}
                                                onChange={(e) => setNewClientMessage(e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border rounded"
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendClientMessage()}
                                            />
                                            <Button size="sm" onClick={handleSendClientMessage}>Send</Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Activity Feed */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">🔄 Recent Activity</h3>
                                    <div className="space-y-3">
                                        {activityFeed.map((activity) => (
                                            <div key={activity.id} className="flex items-start space-x-2">
                                                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                                                <div className="flex-1">
                                                    <p className="text-sm">{activity.description}</p>
                                                    <p className="text-xs text-muted-foreground">
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

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">🎛️ Quick Actions</h3>
                            <div className="space-y-3">
                <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="h-5 w-5" />
                  <span className="text-lg">Add Files to Project</span>
                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Ticket className="mr-2 h-4 w-4" />
                                    View Tickets
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Messages
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={() => setShowInvoiceCreator(true)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Invoices
                                </Button>
                            </div>
                        </Card>

                        {/* Project Status */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">📊 Project Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Progress</span>
                                        <span>{progressPercentage}%</span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2" />
                                </div>
                                <div className="text-sm">
                                    <div className="flex justify-between">
                                        <span>Status:</span>
                                        <Badge className={getStatusColor(project.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                
                                {/* Deadline Section */}
                                <div className="text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span>Deadline:</span>
                                        {!isEditingDeadline && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleStartEditDeadline}
                                                className="h-6 w-6 p-0"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {isEditingDeadline ? (
                                        <div className="space-y-2">
                                            <div className="flex space-x-2">
                                                <Input
                                                    type="date"
                                                    value={newDeadline}
                                                    onChange={(e) => setNewDeadline(e.target.value)}
                                                    className="flex-1 h-8 text-xs"
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleUpdateDeadline}
                                                    disabled={!newDeadline.trim()}
                                                    className="h-7 text-xs"
                                                >
                                                    <Save className="h-3 w-3 mr-1" />
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCancelEditDeadline}
                                                    className="h-7 text-xs"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {project.deadline ? (
                                                <span className={getDeadlineStatus(project.deadline) === "overdue" ? 'text-red-600' : 
                                                              getDeadlineStatus(project.deadline) === "due-soon" ? 'text-yellow-600' : 'text-green-600'}>
                                                    {formatDate(project.deadline)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">No deadline set</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
