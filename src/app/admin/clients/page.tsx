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
import { getStageColor, getStageInfo } from "@/lib/project-stages";
import type { ProjectStage } from "@/lib/project-stages";

interface ClientProject {
  id: string;
  name: string;
  status: ProjectStage;
  progressPercentage: number;
  lastActivityAt: string;
  budget?: number;
  spent?: number;
}

interface ClientEngagement {
  lastLoginAt: string;
  loginCount: number;
  projectViews: number;
  messagesSent: number;
  assetsUploaded: number;
  responseTime: number; // in hours
  satisfactionScore: number; // 1-5
}

interface ClientAction {
  id: string;
  type: "email_sent" | "call_made" | "meeting_scheduled" | "follow_up" | "contract_signed";
  title: string;
  description: string;
  scheduledAt?: string;
  completedAt?: string;
  status: "pending" | "completed" | "cancelled";
  assignedTo: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive" | "prospect" | "suspended";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  timezone: string;
  language: string;
  projects: ClientProject[];
  engagement: ClientEngagement;
  actions: ClientAction[];
  notes: {
    id: string;
    content: string;
    createdAt: string;
    createdBy: string;
    isInternal: boolean;
  }[];
  totalSpent: number;
  projectCount: number;
  averageProjectValue: number;
  clientSince: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
  status: "new" | "responded" | "archived";
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState<string>("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"clients" | "contacts">("clients");
  const [activeClientTab, setActiveClientTab] = useState("overview");

  // Enhanced mock data with engagement metrics
  const mockClients: Client[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john@abccorp.com",
      phone: "555-123-4567",
      company: "ABC Corp",
      status: "active",
      avatar: "/avatars/john.jpg",
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-06-20T14:45:00Z",
      lastLoginAt: "2023-06-20T09:30:00Z",
      emailVerified: true,
      phoneVerified: true,
      timezone: "America/Toronto",
      language: "en",
      projects: [
        { 
          id: "1", 
          name: "Business Website for ABC Corp", 
          status: "in_progress", 
          progressPercentage: 50,
          lastActivityAt: "2023-06-20T14:45:00Z",
          budget: 5000,
          spent: 3250
        }
      ],
      engagement: {
        lastLoginAt: "2023-06-20T09:30:00Z",
        loginCount: 45,
        projectViews: 128,
        messagesSent: 23,
        assetsUploaded: 8,
        responseTime: 2.5,
        satisfactionScore: 4.5
      },
      actions: [
        {
          id: "1",
          type: "meeting_scheduled",
          title: "Project Kickoff Meeting",
          description: "Initial project discussion and requirements gathering",
          scheduledAt: "2023-05-20T14:00:00Z",
          completedAt: "2023-05-20T15:30:00Z",
          status: "completed",
          assignedTo: "Alex Johnson"
        },
        {
          id: "2",
          type: "follow_up",
          title: "Design Review Follow-up",
          description: "Follow up on design feedback and next steps",
          scheduledAt: "2023-06-25T10:00:00Z",
          status: "pending",
          assignedTo: "Sarah Chen"
        }
      ],
      notes: [
        { 
          id: "1", 
          content: "Client prefers blue color scheme. Needs the website live by end of Q3.", 
          createdAt: "2023-05-20T09:15:00Z", 
          createdBy: "Alex Johnson",
          isInternal: true
        },
        { 
          id: "2", 
          content: "Client very responsive and provides clear feedback. Great to work with.", 
          createdAt: "2023-06-15T11:30:00Z", 
          createdBy: "Sarah Chen",
          isInternal: true
        }
      ],
      totalSpent: 3250,
      projectCount: 1,
      averageProjectValue: 5000,
      clientSince: "2023-05-15"
    },
    {
      id: "2",
      name: "Jane Doe",
      email: "jane@janedoe.com",
      phone: "555-987-6543",
      status: "active",
      avatar: "/avatars/jane.jpg",
      createdAt: "2023-06-10T14:20:00Z",
      updatedAt: "2023-06-15T16:30:00Z",
      lastLoginAt: "2023-06-18T08:15:00Z",
      emailVerified: true,
      phoneVerified: false,
      timezone: "America/New_York",
      language: "en",
      projects: [
        { 
          id: "2", 
          name: "Portfolio for Jane Doe", 
          status: "pending", 
          progressPercentage: 10,
          lastActivityAt: "2023-06-15T16:30:00Z",
          budget: 3500,
          spent: 2975
        }
      ],
      engagement: {
        lastLoginAt: "2023-06-18T08:15:00Z",
        loginCount: 32,
        projectViews: 89,
        messagesSent: 18,
        assetsUploaded: 12,
        responseTime: 4.2,
        satisfactionScore: 4.8
      },
      actions: [
        {
          id: "3",
          type: "email_sent",
          title: "Project Completion Notification",
          description: "Notify client that project is ready for review",
          scheduledAt: "2023-06-15T16:30:00Z",
          completedAt: "2023-06-15T16:35:00Z",
          status: "completed",
          assignedTo: "Emma Davis"
        }
      ],
      notes: [
        { 
          id: "3", 
          content: "Client wants a minimalist design with focus on her photography portfolio.", 
          createdAt: "2023-06-12T10:45:00Z", 
          createdBy: "Emma Davis",
          isInternal: true
        }
      ],
      totalSpent: 2975,
      projectCount: 1,
      averageProjectValue: 3500,
      clientSince: "2023-06-10"
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@xyzstore.com",
      phone: "555-456-7890",
      company: "XYZ Store",
      status: "prospect",
      avatar: "/avatars/mike.jpg",
      createdAt: "2023-06-25T09:15:00Z",
      updatedAt: "2023-06-25T09:15:00Z",
      lastLoginAt: "2023-06-25T09:15:00Z",
      emailVerified: false,
      phoneVerified: false,
      timezone: "America/Chicago",
      language: "en",
      projects: [
        { 
          id: "3", 
          name: "E-commerce for XYZ Store", 
          status: "pending", 
          progressPercentage: 10,
          lastActivityAt: "2023-06-25T09:15:00Z",
          budget: 12000,
          spent: 0
        }
      ],
      engagement: {
        lastLoginAt: "2023-06-25T09:15:00Z",
        loginCount: 3,
        projectViews: 12,
        messagesSent: 2,
        assetsUploaded: 0,
        responseTime: 8.5,
        satisfactionScore: 3.0
      },
      actions: [
        {
          id: "4",
          type: "call_made",
          title: "Initial Consultation Call",
          description: "Discuss e-commerce requirements and provide quote",
          scheduledAt: "2023-06-26T14:00:00Z",
          status: "pending",
          assignedTo: "Alex Johnson"
        }
      ],
      notes: [],
      totalSpent: 0,
      projectCount: 1,
      averageProjectValue: 12000,
      clientSince: "2023-06-25"
    }
  ];

  const mockContactSubmissions: ContactSubmission[] = [
    {
      id: "1",
      name: "Sarah Williams",
      email: "sarah@example.com",
      phone: "555-111-2222",
      message: "I'm interested in getting a custom website for my small business. Can you provide a quote?",
      createdAt: "2023-06-28T11:30:00Z",
      status: "new"
    },
    {
      id: "2",
      name: "Robert Brown",
      email: "robert@brownconsulting.com",
      message: "Looking for a landing page design for my consulting business. Please contact me to discuss requirements.",
      createdAt: "2023-06-27T15:45:00Z",
      status: "responded"
    }
  ];

  const fetchClients = useCallback(async () => {
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
        const response = await fetch("/api/admin/clients", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setClients(data.clients || []);
            setFilteredClients(data.clients || []);
            setContactSubmissions(data.contactSubmissions || []);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.log("API endpoint not available, using mock data");
      }

      setTimeout(() => {
        setClients(mockClients);
        setFilteredClients(mockClients);
        setContactSubmissions(mockContactSubmissions);
        setIsLoading(false);
      }, 500);
      
    } catch (err) {
      setError("An error occurred while loading clients");
      console.error("Admin clients error:", err);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    let result = clients;
    
    if (searchTerm) {
      result = result.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(client => client.status === statusFilter);
    }
    
    setFilteredClients(result);
  }, [clients, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "prospect":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "email_sent":
        return "bg-blue-100 text-blue-800";
      case "call_made":
        return "bg-green-100 text-green-800";
      case "meeting_scheduled":
        return "bg-purple-100 text-purple-800";
      case "follow_up":
        return "bg-yellow-100 text-yellow-800";
      case "contract_signed":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-100 text-red-800";
      case "responded":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleAddNote = async () => {
    if (!selectedClient || !newNote.trim()) return;
    
    setIsAddingNote(true);
    
    try {
      const newNoteObj = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: "Admin",
        isInternal: true
      };
      
      setSelectedClient({
        ...selectedClient,
        notes: [...(selectedClient.notes || []), newNoteObj],
        updatedAt: new Date().toISOString()
      });
      
      setNewNote("");
    } catch (err) {
      setError("An error occurred while adding the note");
      console.error("Add note error:", err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getResponseTimeColor = (hours: number) => {
    if (hours <= 2) return "text-green-600";
    if (hours <= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <AdminLayout 
      title="Client Management" 
      showRefresh={true}
      onRefresh={fetchClients}
      isLoading={isLoading}
    >
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Manage client accounts, track engagement metrics, and view detailed client profiles
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === "clients" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("clients")}
          >
            Clients
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === "contacts" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("contacts")}
          >
            Contact Submissions
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === "clients" ? (
              <>
                {/* Client List */}
                {!selectedClient && (
                  <Card className="p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Clients</h2>
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredClients.length} of {clients.length} clients
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="search">Search Clients</Label>
                        <Input
                          id="search"
                          placeholder="Search by name, email, or company"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="statusFilter">Filter by Status</Label>
                        <select
                          id="statusFilter"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="prospect">Prospect</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {filteredClients.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No clients found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4">Client</th>
                              <th className="text-left py-3 px-4">Company</th>
                              <th className="text-left py-3 px-4">Engagement</th>
                              <th className="text-left py-3 px-4">Projects</th>
                              <th className="text-left py-3 px-4">Total Spent</th>
                              <th className="text-left py-3 px-4">Status</th>
                              <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClients.map((client) => (
                              <tr key={client.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-3">
                                    <Avatar>
                                      <AvatarImage src={client.avatar} alt={client.name} />
                                      <AvatarFallback>
                                        {client.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{client.name}</div>
                                      <div className="text-sm text-muted-foreground">{client.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{client.company || "-"}</td>
                                <td className="py-3 px-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm">Score:</span>
                                      <span className={`text-sm font-medium ${getSatisfactionColor(client.engagement?.satisfactionScore || 0)}`}>
                                        {client.engagement?.satisfactionScore || 0}/5
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm">Response:</span>
                                      <span className={`text-sm font-medium ${getResponseTimeColor(client.engagement?.responseTime || 0)}`}>
                                        {client.engagement?.responseTime || 0}h
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-center">
                                    <div className="font-medium">{client.projectCount}</div>
                                    <div className="text-sm text-muted-foreground">projects</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-medium">{formatCurrency(client.totalSpent)}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                                    {client.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedClient(client)}
                                  >
                                    View Profile
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )}

                {/* Client Detail View */}
                {selectedClient && (
                  <div className="space-y-6">
                    {/* Client Profile Header */}
                    <Card className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} />
                            <AvatarFallback className="text-lg">
                              {selectedClient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                            <p className="text-muted-foreground">{selectedClient.email}</p>
                            {selectedClient.company && (
                              <p className="text-sm text-muted-foreground">{selectedClient.company}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClient.status)}`}>
                                {selectedClient.status}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Client since {formatDate(selectedClient.clientSince)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => setSelectedClient(null)}>
                          Back to Clients
                        </Button>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold text-primary">{selectedClient.projectCount}</div>
                          <div className="text-sm text-muted-foreground">Projects</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(selectedClient.totalSpent)}</div>
                          <div className="text-sm text-muted-foreground">Total Spent</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold text-primary">{selectedClient.engagement?.satisfactionScore || 0}/5</div>
                          <div className="text-sm text-muted-foreground">Satisfaction</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-2xl font-bold text-primary">{selectedClient.engagement?.responseTime || 0}h</div>
                          <div className="text-sm text-muted-foreground">Avg Response</div>
                        </div>
                      </div>
                    </Card>

                    {/* Client Profile Tabs */}
                    <Tabs value={activeClientTab} onValueChange={setActiveClientTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Name:</span>
                                <span>{selectedClient.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span>{selectedClient.email}</span>
                              </div>
                              {selectedClient.phone && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{selectedClient.phone}</span>
                                </div>
                              )}
                              {selectedClient.company && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Company:</span>
                                  <span>{selectedClient.company}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge className={getStatusColor(selectedClient.status)}>
                                  {selectedClient.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email Verified:</span>
                                <Badge variant={selectedClient.emailVerified ? "default" : "secondary"}>
                                  {selectedClient.emailVerified ? "Verified" : "Not Verified"}
                                </Badge>
                              </div>
                              {selectedClient.phone && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Phone Verified:</span>
                                  <Badge variant={selectedClient.phoneVerified ? "default" : "secondary"}>
                                    {selectedClient.phoneVerified ? "Verified" : "Not Verified"}
                                  </Badge>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Timezone:</span>
                                <span>{selectedClient.timezone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Language:</span>
                                <span>{selectedClient.language}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Client Since:</span>
                                <span>{formatDate(selectedClient.clientSince)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Login:</span>
                                <span>{formatDateTime(selectedClient.lastLoginAt)}</span>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Projects:</span>
                                <span>{selectedClient.projectCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Spent:</span>
                                <span className="font-medium">{formatCurrency(selectedClient.totalSpent)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Average Project Value:</span>
                                <span>{formatCurrency(selectedClient.averageProjectValue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Client Since:</span>
                                <span>{formatDate(selectedClient.clientSince)}</span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Projects Tab */}
                      <TabsContent value="projects" className="space-y-6">
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4">Client Projects</h3>
                          {(selectedClient.projects || []).length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No projects yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(selectedClient.projects || []).map((project) => (
                                <div key={project.id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-medium">{project.name}</h4>
                                      <div className="flex items-center space-x-4 mt-1">
                                        <Badge variant="outline" className={getStageColor(project.status, true)}>
                                          {getStageInfo(project.status, true).title}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          Last activity: {formatDateTime(project.lastActivityAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <div className="text-sm text-muted-foreground">Progress</div>
                                      <div className="flex items-center space-x-2">
                                        <Progress value={project.progressPercentage} className="h-2 flex-1" />
                                        <span className="text-sm font-medium">{project.progressPercentage}%</span>
                                      </div>
                                    </div>
                                    {project.budget && (
                                      <div>
                                        <div className="text-sm text-muted-foreground">Budget</div>
                                        <div className="font-medium">{formatCurrency(project.budget)}</div>
                                      </div>
                                    )}
                                    {project.spent !== undefined && (
                                      <div>
                                        <div className="text-sm text-muted-foreground">Spent</div>
                                        <div className="font-medium">{formatCurrency(project.spent)}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </TabsContent>

                      {/* Actions Tab */}
                      <TabsContent value="actions" className="space-y-6">
                        <Card className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Client Actions</h3>
                            <Button>Schedule Action</Button>
                          </div>
                          
                          {(selectedClient.actions || []).length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No actions scheduled.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(selectedClient.actions || []).map((action) => (
                                <div key={action.id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium">{action.title}</h4>
                                      <p className="text-sm text-muted-foreground">{action.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge className={getActionTypeColor(action.type).replace('bg-', 'bg-').replace('text-', 'text-')}>
                                        {action.type.replace('_', ' ')}
                                      </Badge>
                                      <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                                        {action.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Assigned to: {action.assignedTo}</span>
                                    {action.scheduledAt && (
                                      <span>
                                        {action.status === 'completed' ? 'Completed' : 'Scheduled'}: {formatDateTime(action.scheduledAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </TabsContent>

                      {/* Notes Tab */}
                      <TabsContent value="notes" className="space-y-6">
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
                          
                          {/* Add Note Form */}
                          <div className="mb-6 p-4 border rounded">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Add New Note</h4>
                            </div>
                            <Textarea
                              placeholder="Enter your note here..."
                              value={newNote}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
                              rows={3}
                              className="mb-2"
                            />
                            <div className="flex justify-end">
                              <Button onClick={handleAddNote} disabled={isAddingNote || !newNote.trim()}>
                                {isAddingNote ? "Adding..." : "Add Note"}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Notes List */}
                          {(selectedClient.notes || []).length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No notes yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(selectedClient.notes || []).map((note) => (
                                <div key={note.id} className="p-3 border rounded">
                                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>{note.createdBy}</span>
                                    <span>{formatDateTime(note.createdAt)}</span>
                                  </div>
                                  <p>{note.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </TabsContent>

                      {/* Analytics Tab */}
                      <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Client Value</h3>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-primary">{formatCurrency(selectedClient.averageProjectValue)}</div>
                              <div className="text-sm text-muted-foreground">Avg Project Value</div>
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Loyalty</h3>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-primary">{selectedClient.projectCount}</div>
                              <div className="text-sm text-muted-foreground">Repeat Projects</div>
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Engagement Rate</h3>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-primary">
                                {Math.round(((selectedClient.engagement?.loginCount || 0) / 30) * 100)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Monthly Activity</div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </>
            ) : (
              /* Contact Submissions */
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Contact Submissions</h2>
                  <div className="text-sm text-muted-foreground">
                    {(contactSubmissions || []).length} submissions
                  </div>
                </div>

                {(contactSubmissions || []).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No contact submissions yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Phone</th>
                          <th className="text-left py-3 px-4">Message</th>
                          <th className="text-left py-3 px-4">Received</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(contactSubmissions || []).map((submission) => (
                          <tr key={submission.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{submission.name}</td>
                            <td className="py-3 px-4">{submission.email}</td>
                            <td className="py-3 px-4">{submission.phone || "-"}</td>
                            <td className="py-3 px-4 max-w-xs truncate">{submission.message}</td>
                            <td className="py-3 px-4">{formatDateTime(submission.createdAt)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContactStatusColor(submission.status)}`}>
                                {submission.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  );
}
