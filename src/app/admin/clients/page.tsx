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
import { Logo } from "@/components/logo";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive" | "prospect";
  createdAt: string;
  updatedAt: string;
  projects: {
    id: string;
    name: string;
    status: string;
  }[];
  notes: {
    id: string;
    content: string;
    createdAt: string;
    createdBy: string;
  }[];
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

  // Mock data for development
  const mockClients: Client[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john@abccorp.com",
      phone: "555-123-4567",
      company: "ABC Corp",
      status: "active",
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-06-20T14:45:00Z",
      projects: [
        { id: "1", name: "Business Website for ABC Corp", status: "in_progress" }
      ],
      notes: [
        { 
          id: "1", 
          content: "Client prefers blue color scheme. Needs the website live by end of Q3.", 
          createdAt: "2023-05-20T09:15:00Z", 
          createdBy: "Admin" 
        }
      ]
    },
    {
      id: "2",
      name: "Jane Doe",
      email: "jane@janedoe.com",
      phone: "555-987-6543",
      status: "active",
      createdAt: "2023-06-10T14:20:00Z",
      updatedAt: "2023-06-15T16:30:00Z",
      projects: [
        { id: "2", name: "Portfolio for Jane Doe", status: "awaiting_invoice" }
      ],
      notes: [
        { 
          id: "2", 
          content: "Client wants a minimalist design with focus on her photography portfolio.", 
          createdAt: "2023-06-12T10:45:00Z", 
          createdBy: "Admin" 
        }
      ]
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@xyzstore.com",
      phone: "555-456-7890",
      company: "XYZ Store",
      status: "prospect",
      createdAt: "2023-06-25T09:15:00Z",
      updatedAt: "2023-06-25T09:15:00Z",
      projects: [
        { id: "3", name: "E-commerce for XYZ Store", status: "submitted" }
      ],
      notes: []
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
      // Get the auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      // Try to fetch from API first
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

      // If API fails, use mock data (for development)
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
    // Apply search and status filters
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

  const handleAddNote = async () => {
    if (!selectedClient || !newNote.trim()) return;
    
    setIsAddingNote(true);
    
    try {
      // In a real implementation, we would save to the API
      // For now, we'll update the local state
      const newNoteObj = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: "Admin"
      };
      
      setSelectedClient({
        ...selectedClient,
        notes: [...selectedClient.notes, newNoteObj]
      });
      
      setNewNote("");
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to add notes");
        return;
      }

      const response = await fetch(`/api/admin/clients/${selectedClient.id}/notes`, {
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
        // Refresh the client data
        const updatedClient = await fetchClientDetails(selectedClient.id);
        if (updatedClient) {
          setSelectedClient(updatedClient);
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

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
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
          <Link href="/admin/clients" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
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
            <h1 className="text-2xl font-bold">Client Management</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchClients} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Clients Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Manage client accounts, view project history, and add internal notes
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
                              <th className="text-left py-3 px-4">Name</th>
                              <th className="text-left py-3 px-4">Email</th>
                              <th className="text-left py-3 px-4">Company</th>
                              <th className="text-left py-3 px-4">Status</th>
                              <th className="text-left py-3 px-4">Projects</th>
                              <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClients.map((client) => (
                              <tr key={client.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4 font-medium">{client.name}</td>
                                <td className="py-3 px-4">{client.email}</td>
                                <td className="py-3 px-4">{client.company || "-"}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                                    {client.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4">{client.projects.length}</td>
                                <td className="py-3 px-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedClient(client)}
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

                  {/* Client Detail View */}
                  {selectedClient && (
                    <Card className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{selectedClient.name}</h2>
                          <p className="text-muted-foreground">{selectedClient.email}</p>
                        </div>
                        <Button variant="outline" onClick={() => setSelectedClient(null)}>
                          Close
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Client Information</h3>
                          <div className="space-y-2">
                            <div className="flex">
                              <span className="w-32 text-muted-foreground">Name:</span>
                              <span>{selectedClient.name}</span>
                            </div>
                            <div className="flex">
                              <span className="w-32 text-muted-foreground">Email:</span>
                              <span>{selectedClient.email}</span>
                            </div>
                            {selectedClient.phone && (
                              <div className="flex">
                                <span className="w-32 text-muted-foreground">Phone:</span>
                                <span>{selectedClient.phone}</span>
                              </div>
                            )}
                            {selectedClient.company && (
                              <div className="flex">
                                <span className="w-32 text-muted-foreground">Company:</span>
                                <span>{selectedClient.company}</span>
                              </div>
                            )}
                            <div className="flex">
                              <span className="w-32 text-muted-foreground">Status:</span>
                              <Badge className={getStatusColor(selectedClient.status).replace('bg-', 'bg-').replace('text-', 'text-')}>
                                {selectedClient.status}
                              </Badge>
                            </div>
                            <div className="flex">
                              <span className="w-32 text-muted-foreground">Client Since:</span>
                              <span>{formatDate(selectedClient.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3">Projects</h3>
                          {selectedClient.projects.length === 0 ? (
                            <p className="text-muted-foreground">No projects yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedClient.projects.map((project) => (
                                <div key={project.id} className="flex justify-between items-center p-2 border rounded">
                                  <span>{project.name}</span>
                                  <Badge variant="outline">{project.status.replace('_', ' ')}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Internal Notes</h3>
                        
                        {/* Add Note Form */}
                        <div className="mb-4 p-4 border rounded">
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
                        {selectedClient.notes.length === 0 ? (
                          <p className="text-muted-foreground">No notes yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedClient.notes.map((note) => (
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
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                /* Contact Submissions */
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Contact Submissions</h2>
                    <div className="text-sm text-muted-foreground">
                      {contactSubmissions.length} submissions
                    </div>
                  </div>

                  {contactSubmissions.length === 0 ? (
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
                          {contactSubmissions.map((submission) => (
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
      </main>
    </div>
  );
}
