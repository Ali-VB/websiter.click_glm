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

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: "new" | "responded" | "archived";
  source: "contact_form" | "email" | "phone" | "other";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  notes?: string;
  response?: {
    content: string;
    respondedAt: string;
    respondedBy: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminContactsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [newNote, setNewNote] = useState<string>("");
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState<boolean>(false);
  const [responseContent, setResponseContent] = useState<string>("");
  const [isAddingResponse, setIsAddingResponse] = useState<boolean>(false);

  // Mock data for development
  const mockSubmissions: ContactSubmission[] = [
    {
      id: "1",
      name: "Sarah Williams",
      email: "sarah@example.com",
      phone: "555-111-2222",
      company: "Williams Consulting",
      message: "I'm interested in getting a custom website for my small business. Can you provide a quote? I need something professional with e-commerce functionality.",
      status: "new",
      source: "contact_form",
      createdAt: "2023-06-28T11:30:00Z",
      updatedAt: "2023-06-28T11:30:00Z",
    },
    {
      id: "2",
      name: "Robert Brown",
      email: "robert@brownconsulting.com",
      message: "Looking for a landing page design for my consulting business. Please contact me to discuss requirements. I need something modern and responsive.",
      status: "responded",
      source: "contact_form",
      createdAt: "2023-06-27T15:45:00Z",
      updatedAt: "2023-06-28T09:30:00Z",
      assignedTo: "1",
      notes: "Client prefers blue color scheme. Needs the website live by end of Q3.",
      response: {
        content: "Thank you for your interest in our services. I'd be happy to discuss your landing page requirements. Would you be available for a call next week?",
        respondedAt: "2023-06-28T09:30:00Z",
        respondedBy: "Alex Johnson"
      }
    },
    {
      id: "3",
      name: "Jennifer Davis",
      email: "jennifer@davisphotography.com",
      phone: "555-333-4444",
      message: "I'm a photographer looking to update my portfolio website. I want something clean and modern that showcases my work effectively.",
      status: "archived",
      source: "email",
      createdAt: "2023-06-25T10:15:00Z",
      updatedAt: "2023-06-26T14:20:00Z",
      assignedTo: "3",
      notes: "Converted to client. Project started on July 1st."
    },
    {
      id: "4",
      name: "Michael Wilson",
      email: "michael@techstartup.io",
      company: "Tech Startup Inc.",
      message: "We're a new tech startup looking for a complete website redesign. We need something innovative that reflects our brand identity.",
      status: "new",
      source: "contact_form",
      createdAt: "2023-06-29T09:20:00Z",
      updatedAt: "2023-06-29T09:20:00Z",
    },
    {
      id: "5",
      name: "Lisa Thompson",
      email: "lisa@restaurant.com",
      phone: "555-555-6666",
      company: "The Great Restaurant",
      message: "Need a website for our restaurant with online reservation system and menu display.",
      status: "responded",
      source: "phone",
      createdAt: "2023-06-26T16:40:00Z",
      updatedAt: "2023-06-27T11:15:00Z",
      assignedTo: "2",
      response: {
        content: "Thank you for contacting us. We have extensive experience with restaurant websites and would be happy to help. I've sent a detailed proposal to your email.",
        respondedAt: "2023-06-27T11:15:00Z",
        respondedBy: "Sarah Williams"
      }
    }
  ];

  const mockTeamMembers: TeamMember[] = [
    { id: "1", name: "Alex Johnson", email: "alex@example.com", role: "Developer" },
    { id: "2", name: "Sarah Williams", email: "sarah@example.com", role: "Sales" },
    { id: "3", name: "Mike Chen", email: "mike@example.com", role: "Designer" },
    { id: "4", name: "Emily Davis", email: "emily@example.com", role: "Project Manager" }
  ];

  const fetchSubmissions = useCallback(async () => {
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

      // In a real implementation, we would fetch from the API
      // For now, we'll use mock data
      setTimeout(() => {
        setSubmissions(mockSubmissions);
        setFilteredSubmissions(mockSubmissions);
        setTeamMembers(mockTeamMembers);
        setIsLoading(false);
      }, 1000);
      
      // Actual implementation would be:
      /*
      const response = await fetch("/api/admin/contacts", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
        setFilteredSubmissions(data.submissions || []);
        setTeamMembers(data.teamMembers || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch contact submissions");
      }
      */
    } catch (err) {
      setError("An error occurred while loading contact submissions");
      console.error("Admin contacts error:", err);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    // Apply filters
    let result = submissions;
    
    if (statusFilter !== "all") {
      result = result.filter(submission => submission.status === statusFilter);
    }
    
    if (sourceFilter !== "all") {
      result = result.filter(submission => submission.source === sourceFilter);
    }
    
    if (searchTerm) {
      result = result.filter(submission => 
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (submission.company && submission.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        submission.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredSubmissions(result);
  }, [submissions, statusFilter, sourceFilter, searchTerm]);

  const getStatusColor = (status: string) => {
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

  const getSourceColor = (source: string) => {
    switch (source) {
      case "contact_form":
        return "bg-green-100 text-green-800";
      case "email":
        return "bg-blue-100 text-blue-800";
      case "phone":
        return "bg-purple-100 text-purple-800";
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

  const handleAddNote = async () => {
    if (!selectedSubmission || !newNote.trim()) return;
    
    setIsAddingNote(true);
    
    try {
      // In a real implementation, we would save to the API
      // For now, we'll update the local state
      setSelectedSubmission({
        ...selectedSubmission,
        notes: newNote,
        updatedAt: new Date().toISOString()
      });
      
      setNewNote("");
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to add notes");
        return;
      }

      const response = await fetch(`/api/admin/contacts/${selectedSubmission.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          content: newNote
        }),
      });

      if (response.ok) {
        // Refresh the submission data
        const updatedSubmission = await fetchSubmissionDetails(selectedSubmission.id);
        if (updatedSubmission) {
          setSelectedSubmission(updatedSubmission);
        }
        setNewNote("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add note");
      }
      */
    } catch (err) {
      setError("An error occurred while adding the note");
      console.error("Add note error:", err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedSubmission) return;
    
    setIsUpdatingAssignment(true);
    
    try {
      // In a real implementation, we would save to the API
      // For now, we'll update the local state
      setSelectedSubmission({
        ...selectedSubmission,
        assignedTo: assignedTo || undefined,
        updatedAt: new Date().toISOString()
      });
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to update assignment");
        return;
      }

      const response = await fetch(`/api/admin/contacts/${selectedSubmission.id}/assign`, {
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
        // Refresh the submission data
        const updatedSubmission = await fetchSubmissionDetails(selectedSubmission.id);
        if (updatedSubmission) {
          setSelectedSubmission(updatedSubmission);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update assignment");
      }
      */
    } catch (err) {
      setError("An error occurred while updating the assignment");
      console.error("Update assignment error:", err);
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  const handleAddResponse = async () => {
    if (!selectedSubmission || !responseContent.trim()) return;
    
    setIsAddingResponse(true);
    
    try {
      // In a real implementation, we would save to the API
      // For now, we'll update the local state
      setSelectedSubmission({
        ...selectedSubmission,
        status: "responded",
        response: {
          content: responseContent,
          respondedAt: new Date().toISOString(),
          respondedBy: "Admin"
        },
        updatedAt: new Date().toISOString()
      });
      
      setResponseContent("");
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to add response");
        return;
      }

      const response = await fetch(`/api/admin/contacts/${selectedSubmission.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          content: responseContent
        }),
      });

      if (response.ok) {
        // Refresh the submission data
        const updatedSubmission = await fetchSubmissionDetails(selectedSubmission.id);
        if (updatedSubmission) {
          setSelectedSubmission(updatedSubmission);
        }
        setResponseContent("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add response");
      }
      */
    } catch (err) {
      setError("An error occurred while adding the response");
      console.error("Add response error:", err);
    } finally {
      setIsAddingResponse(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedSubmission) return;
    
    try {
      // In a real implementation, we would save to the API
      // For now, we'll update the local state
      setSelectedSubmission({
        ...selectedSubmission,
        status: newStatus as ContactSubmission["status"],
        updatedAt: new Date().toISOString()
      });
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to update status");
        return;
      }

      const response = await fetch(`/api/admin/contacts/${selectedSubmission.id}/status`, {
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
        // Refresh the submission data
        const updatedSubmission = await fetchSubmissionDetails(selectedSubmission.id);
        if (updatedSubmission) {
          setSelectedSubmission(updatedSubmission);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update status");
      }
      */
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
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="font-bold text-xl">websiter.click</span>
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
          <Link href="/admin/support" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Support Tickets
          </Link>
          <Link href="/admin/contacts" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
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
            <h1 className="text-2xl font-bold">Contact Submissions</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchSubmissions} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Contacts Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Manage contact submissions from the landing page and other sources
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Submissions</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email, company, or message"
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
                  <option value="new">New</option>
                  <option value="responded">Responded</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="sourceFilter">Filter by Source</Label>
                <select
                  id="sourceFilter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">All Sources</option>
                  <option value="contact_form">Contact Form</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
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
              {/* Submissions List */}
              <Card className="p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Contact Submissions</h2>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                  </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No contact submissions found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">ID</th>
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Company</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Source</th>
                          <th className="text-left py-3 px-4">Assigned To</th>
                          <th className="text-left py-3 px-4">Received</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((submission) => (
                          <tr key={submission.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">#{submission.id}</td>
                            <td className="py-3 px-4">{submission.name}</td>
                            <td className="py-3 px-4">{submission.email}</td>
                            <td className="py-3 px-4">{submission.company || "-"}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                                {submission.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(submission.source)}`}>
                                {submission.source.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">{getAssignedToName(submission.assignedTo)}</td>
                            <td className="py-3 px-4">{formatDate(submission.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
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

              {/* Submission Detail View */}
              {selectedSubmission && (
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">#{selectedSubmission.id} - {selectedSubmission.name}</h2>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStatusColor(selectedSubmission.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                          {selectedSubmission.status}
                        </Badge>
                        <Badge className={getSourceColor(selectedSubmission.source).replace('bg-', 'bg-').replace('text-', 'text-')}>
                          {selectedSubmission.source.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        From {selectedSubmission.name} ({selectedSubmission.email}) on {formatDateTime(selectedSubmission.createdAt)}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                      Close
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Name:</span>
                          <span>{selectedSubmission.name}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Email:</span>
                          <span>{selectedSubmission.email}</span>
                        </div>
                        {selectedSubmission.phone && (
                          <div className="flex">
                            <span className="w-32 text-muted-foreground">Phone:</span>
                            <span>{selectedSubmission.phone}</span>
                          </div>
                        )}
                        {selectedSubmission.company && (
                          <div className="flex">
                            <span className="w-32 text-muted-foreground">Company:</span>
                            <span>{selectedSubmission.company}</span>
                          </div>
                        )}
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(selectedSubmission.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedSubmission.status}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Source:</span>
                          <Badge className={getSourceColor(selectedSubmission.source).replace('bg-', 'bg-').replace('text-', 'text-')}>
                            {selectedSubmission.source.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Received:</span>
                          <span>{formatDateTime(selectedSubmission.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Assignment</h3>
                      <div className="space-y-4">
                        <div className="flex">
                          <span className="w-32 text-muted-foreground">Assigned To:</span>
                          <span>{getAssignedToName(selectedSubmission.assignedTo)}</span>
                        </div>
                        <div>
                          <Label htmlFor="assignTo">Reassign Submission</Label>
                          <Select onValueChange={setAssignedTo} defaultValue={selectedSubmission.assignedTo || ""}>
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
                              disabled={isUpdatingAssignment || assignedTo === selectedSubmission.assignedTo}
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
                          <Select onValueChange={handleUpdateStatus} defaultValue={selectedSubmission.status}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="responded">Responded</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Message</h3>
                    <p className="bg-muted p-4 rounded">{selectedSubmission.message}</p>
                  </div>

                  {selectedSubmission.response && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Response</h3>
                      <div className="bg-blue-50 p-4 rounded">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>From {selectedSubmission.response.respondedBy}</span>
                          <span>{formatDateTime(selectedSubmission.response.respondedAt)}</span>
                        </div>
                        <p>{selectedSubmission.response.content}</p>
                      </div>
                    </div>
                  )}

                  {selectedSubmission.notes && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Internal Notes</h3>
                      <div className="bg-yellow-50 p-4 rounded">
                        <p>{selectedSubmission.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add Note Form */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Add Internal Note</h3>
                      <div className="p-4 border rounded">
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
                    </div>

                    {/* Add Response Form */}
                    {selectedSubmission.status !== "responded" && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Add Response</h3>
                        <div className="p-4 border rounded">
                          <Textarea
                            placeholder="Enter your response here..."
                            value={responseContent}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseContent(e.target.value)}
                            rows={3}
                            className="mb-2"
                          />
                          <div className="flex justify-end">
                            <Button onClick={handleAddResponse} disabled={isAddingResponse || !responseContent.trim()}>
                              {isAddingResponse ? "Adding..." : "Send Response"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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