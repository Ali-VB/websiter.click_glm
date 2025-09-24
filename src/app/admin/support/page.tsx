"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/logo";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "design" | "development" | "billing" | "other";
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
  }[];
  responses: {
    id: string;
    content: string;
    author: string;
    createdAt: string;
    isInternal: boolean;
  }[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newResponse, setNewResponse] = useState<string>("");
  const [isInternal, setIsInternal] = useState<boolean>(false);
  const [isAddingResponse, setIsAddingResponse] = useState<boolean>(false);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState<boolean>(false);

  // Mock data for development
  const mockTickets: SupportTicket[] = [
    {
      id: "1",
      title: "Website not loading properly on mobile",
      description: "My website is not loading correctly on mobile devices. The layout is broken and some images are not showing up.",
      clientName: "John Smith",
      clientEmail: "john@abccorp.com",
      status: "open",
      priority: "high",
      category: "development",
      assignedTo: "1",
      createdAt: "2023-06-28T10:30:00Z",
      updatedAt: "2023-06-28T10:30:00Z",
      attachments: [
        { id: "1", name: "screenshot.png", type: "image/png", size: 1024000 }
      ],
      responses: [
        { 
          id: "1", 
          content: "Thank you for reporting this issue. We're looking into it.", 
          author: "Support Team", 
          createdAt: "2023-06-28T11:15:00Z", 
          isInternal: false 
        }
      ]
    },
    {
      id: "2",
      title: "Question about invoice",
      description: "I have a question about the invoice I received for my project. Can you explain the additional charges?",
      clientName: "Jane Doe",
      clientEmail: "jane@janedoe.com",
      status: "in_progress",
      priority: "medium",
      category: "billing",
      assignedTo: "2",
      createdAt: "2023-06-27T14:20:00Z",
      updatedAt: "2023-06-28T09:15:00Z",
      responses: [
        { 
          id: "2", 
          content: "I'd be happy to explain the charges. The additional costs are for the extra features you requested.", 
          author: "Billing Team", 
          createdAt: "2023-06-28T09:30:00Z", 
          isInternal: false 
        }
      ]
    },
    {
      id: "3",
      title: "Need help with color scheme",
      description: "I'd like to change the color scheme of my website. Can you help me with that?",
      clientName: "Mike Johnson",
      clientEmail: "mike@xyzstore.com",
      status: "resolved",
      priority: "low",
      category: "design",
      createdAt: "2023-06-25T09:15:00Z",
      updatedAt: "2023-06-26T16:45:00Z",
      responses: [
        { 
          id: "3", 
          content: "We've updated the color scheme as requested. Please let us know if you need any further changes.", 
          author: "Design Team", 
          createdAt: "2023-06-26T16:45:00Z", 
          isInternal: false 
        }
      ]
    }
  ];

  const mockTeamMembers: TeamMember[] = [
    { id: "1", name: "Alex Johnson", email: "alex@example.com", role: "Developer" },
    { id: "2", name: "Sarah Williams", email: "sarah@example.com", role: "Billing Specialist" },
    { id: "3", name: "Mike Chen", email: "mike@example.com", role: "Designer" },
    { id: "4", name: "Emily Davis", email: "emily@example.com", role: "Support Lead" }
  ];

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/support", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match the expected format
        const transformedTickets = data.tickets.map((ticket: {
          id: string;
          subject: string;
          replies?: Array<{
            id: string;
            message: string;
            author: { name: string };
            created_at: string;
            is_internal?: boolean;
          }>;
          client: { name: string; email: string };
          status: string;
          priority: string;
          category: string;
          assigned_to?: string;
          created_at: string;
          updated_at: string;
        }) => ({
          id: ticket.id,
          title: ticket.subject,
          description: ticket.replies && ticket.replies.length > 0 ? ticket.replies[0].message : "",
          clientName: ticket.client.name,
          clientEmail: ticket.client.email,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          assignedTo: ticket.assigned_to,
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at,
          attachments: [],
          responses: ticket.replies ? ticket.replies.map((reply) => ({
            id: reply.id,
            content: reply.message,
            author: reply.author.name,
            createdAt: reply.created_at,
            isInternal: reply.is_internal || false
          })) : []
        }));
        
        const transformedTeamMembers = data.teamMembers.map((member: {
          id: string;
          name: string;
          email: string;
          role: string;
        }) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role
        }));
        
        setTickets(transformedTickets);
        setFilteredTickets(transformedTickets);
        setTeamMembers(transformedTeamMembers);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch support tickets");
      }
    } catch (err) {
      setError("An error occurred while loading support tickets");
      console.error("Admin support error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    // Apply filters
    let result = tickets;
    
    if (statusFilter !== "all") {
      result = result.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter !== "all") {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }
    
    if (categoryFilter !== "all") {
      result = result.filter(ticket => ticket.category === categoryFilter);
    }
    
    if (searchTerm) {
      result = result.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTickets(result);
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "design":
        return "bg-purple-100 text-purple-800";
      case "development":
        return "bg-blue-100 text-blue-800";
      case "billing":
        return "bg-green-100 text-green-800";
      case "other":
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

  const getAssignedToName = (assignedToId?: string) => {
    if (!assignedToId) return "Unassigned";
    const member = teamMembers.find(m => m.id === assignedToId);
    return member ? member.name : "Unknown";
  };

  const handleAddResponse = async () => {
    if (!selectedTicket || !newResponse.trim()) return;
    
    setIsAddingResponse(true);
    
    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to add responses");
        return;
      }

      const response = await fetch(`/api/admin/support/${selectedTicket.id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          message: newResponse,
          isInternal
        }),
      });

      if (response.ok) {
        // Refresh the tickets list to get the updated data
        await fetchTickets();
        
        // Find the updated ticket in the refreshed list
        const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
        
        setNewResponse("");
        setIsInternal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add response");
      }
    } catch (err) {
      setError("An error occurred while adding the response");
      console.error("Add response error:", err);
    } finally {
      setIsAddingResponse(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedTicket) return;
    
    setIsUpdatingAssignment(true);
    
    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to update assignment");
        return;
      }

      const response = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          assignedTo: assignedTo || null
        }),
      });

      if (response.ok) {
        // Refresh the tickets list to get the updated data
        await fetchTickets();
        
        // Find the updated ticket in the refreshed list
        const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update assignment");
      }
    } catch (err) {
      setError("An error occurred while updating the assignment");
      console.error("Update assignment error:", err);
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    
    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to update status");
        return;
      }

      const response = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        // Refresh the tickets list to get the updated data
        await fetchTickets();
        
        // Find the updated ticket in the refreshed list
        const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update status");
      }
    } catch (err) {
      setError("An error occurred while updating the status");
      console.error("Update status error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("supabase.auth.token");
    router.push("/");
  };

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
          <Link href="/admin" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
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
          <Link href="/admin/support" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
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
        </nav>
        
        <Separator className="my-6" />
        
        <div className="space-y-1">
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href="/dashboard">Client Dashboard</Link>
          </Button>
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
            <h1 className="text-2xl font-bold">Support Ticket Management</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchTickets} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Support Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              View, assign, and resolve customer support tickets
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Tickets</Label>
                <Input
                  id="search"
                  placeholder="Search by title, description, or client"
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
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="priorityFilter">Filter by Priority</Label>
                <select
                  id="priorityFilter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="categoryFilter">Filter by Category</Label>
                <select
                  id="categoryFilter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="design">Design</option>
                  <option value="development">Development</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Ticket List */}
              <Card className="p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Support Tickets</h2>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredTickets.length} of {tickets.length} tickets
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tickets found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">ID</th>
                          <th className="text-left py-3 px-4">Title</th>
                          <th className="text-left py-3 px-4">Client</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Priority</th>
                          <th className="text-left py-3 px-4">Category</th>
                          <th className="text-left py-3 px-4">Assigned To</th>
                          <th className="text-left py-3 px-4">Created</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">#{ticket.id}</td>
                            <td className="py-3 px-4">{ticket.title}</td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{ticket.clientName}</div>
                                <div className="text-sm text-muted-foreground">{ticket.clientEmail}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                                {ticket.category}
                              </span>
                            </td>
                            <td className="py-3 px-4">{getAssignedToName(ticket.assignedTo)}</td>
                            <td className="py-3 px-4">{formatDate(ticket.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Ticket Detail View */}
              {selectedTicket && (
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">#{selectedTicket.id} - {selectedTicket.title}</h2>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStatusColor(selectedTicket.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                          {selectedTicket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority).replace('bg-', 'bg-').replace('text-', 'text-')}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge className={getCategoryColor(selectedTicket.category).replace('bg-', 'bg-').replace('text-', 'text-')}>
                          {selectedTicket.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        From {selectedTicket.clientName} ({selectedTicket.clientEmail}) on {formatDateTime(selectedTicket.createdAt)}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                      Close
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Ticket Information</h3>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(selectedTicket.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedTicket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Priority:</span>
                          <Badge className={getPriorityColor(selectedTicket.priority).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Category:</span>
                          <Badge className={getCategoryColor(selectedTicket.category).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedTicket.category}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Created:</span>
                          <span>{formatDateTime(selectedTicket.createdAt)}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Updated:</span>
                          <span>{formatDateTime(selectedTicket.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Assignment</h3>
                      <div className="space-y-4">
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Assigned To:</span>
                          <span>{getAssignedToName(selectedTicket.assignedTo)}</span>
                        </div>
                        <div>
                          <Label htmlFor="assignTo">Reassign Ticket</Label>
                          <Select onValueChange={setAssignedTo} defaultValue={selectedTicket.assignedTo || ""}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name} ({member.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex justify-end mt-2">
                            <Button 
                              onClick={handleUpdateAssignment} 
                              disabled={isUpdatingAssignment || assignedTo === selectedTicket.assignedTo}
                            >
                              {isUpdatingAssignment ? "Updating..." : "Update Assignment"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Update Status</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status">Change Status</Label>
                          <Select onValueChange={handleUpdateStatus} defaultValue={selectedTicket.status}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="bg-muted p-4 rounded">{selectedTicket.description}</p>
                  </div>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                      <div className="space-y-2">
                        {selectedTicket.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex justify-between items-center p-2 border rounded">
                            <span>{attachment.name}</span>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Responses</h3>
                    
                    {/* Responses List */}
                    {selectedTicket.responses.length === 0 ? (
                      <p className="text-muted-foreground mb-4">No responses yet.</p>
                    ) : (
                      <div className="space-y-4 mb-6">
                        {selectedTicket.responses.map((response) => (
                          <div key={response.id} className={`p-4 border rounded ${response.isInternal ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                              <span>{response.author} {response.isInternal && '(Internal Note)'}</span>
                              <span>{formatDateTime(response.createdAt)}</span>
                            </div>
                            <p>{response.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Response Form */}
                    <div className="p-4 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Add Response</h4>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isInternal"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="isInternal">Internal Note</Label>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Enter your response here..."
                        value={newResponse}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewResponse(e.target.value)}
                        rows={3}
                        className="mb-2"
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleAddResponse} disabled={isAddingResponse || !newResponse.trim()}>
                          {isAddingResponse ? "Adding..." : "Add Response"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
