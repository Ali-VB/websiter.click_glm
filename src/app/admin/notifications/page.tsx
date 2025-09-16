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

interface Client {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "prospect";
}

interface Notification {
  id: string;
  title: string;
  message: string;
  recipientType: "all" | "specific";
  recipients: string[];
  sentAt: string;
  sentBy: string;
  status: "draft" | "sent" | "scheduled";
  scheduledFor?: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<"all" | "specific">("all");
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Mock data for development
  const mockClients: Client[] = [
    { id: "1", name: "John Smith", email: "john@abccorp.com", status: "active" },
    { id: "2", name: "Jane Doe", email: "jane@janedoe.com", status: "active" },
    { id: "3", name: "Mike Johnson", email: "mike@xyzstore.com", status: "prospect" },
    { id: "4", name: "Sarah Williams", email: "sarah@example.com", status: "active" },
    { id: "5", name: "Robert Brown", email: "robert@brownconsulting.com", status: "inactive" }
  ];

  const mockNotifications: Notification[] = [
    {
      id: "1",
      title: "System Maintenance Scheduled",
      message: "We will be performing scheduled maintenance on our servers this weekend. The system may be unavailable for a few hours during this time. We apologize for any inconvenience.",
      recipientType: "all",
      recipients: [],
      sentAt: "2023-06-25T10:30:00Z",
      sentBy: "Admin",
      status: "sent"
    },
    {
      id: "2",
      title: "New Feature Launch",
      message: "We're excited to announce the launch of our new analytics dashboard! Check your client dashboard for more details.",
      recipientType: "specific",
      recipients: ["1", "2", "4"],
      sentAt: "2023-06-20T14:15:00Z",
      sentBy: "Admin",
      status: "sent"
    },
    {
      id: "3",
      title: "Holiday Hours",
      message: "Please note our office will be closed for the upcoming holiday. Normal business hours will resume on January 2nd.",
      recipientType: "all",
      recipients: [],
      sentAt: "2023-06-15T09:45:00Z",
      sentBy: "Admin",
      status: "sent"
    }
  ];

  const fetchClients = useCallback(async () => {
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
        setClients(mockClients);
        setNotifications(mockNotifications);
        setIsLoading(false);
      }, 1000);
      
      // Actual implementation would be:
      /*
      const response = await fetch("/api/admin/notifications/clients", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch clients");
      }

      const notificationsResponse = await fetch("/api/admin/notifications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        setNotifications(data.notifications || []);
      } else {
        const errorData = await notificationsResponse.json();
        setError(errorData.message || "Failed to fetch notifications");
      }
      */
    } catch (err) {
      setError("An error occurred while loading data");
      console.error("Admin notifications error:", err);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientSelection = (clientId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  const handleSelectAllActive = () => {
    const activeClientIds = clients.filter(client => client.status === "active").map(client => client.id);
    setSelectedClients(activeClientIds);
  };

  const handleClearSelection = () => {
    setSelectedClients([]);
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required");
      return;
    }

    if (recipientType === "specific" && selectedClients.length === 0) {
      setError("Please select at least one recipient");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      // In a real implementation, we would send to the API
      // For now, we'll update the local state
      const newNotification: Notification = {
        id: Date.now().toString(),
        title,
        message,
        recipientType,
        recipients: recipientType === "specific" ? selectedClients : [],
        sentAt: new Date().toISOString(),
        sentBy: "Admin",
        status: "sent"
      };

      setNotifications([newNotification, ...notifications]);
      
      // Reset form
      setTitle("");
      setMessage("");
      setSelectedClients([]);
      setRecipientType("all");
      setIsPreviewMode(false);
      
      // Actual implementation would be:
      /*
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to send notifications");
        return;
      }

      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          title,
          message,
          recipientType,
          recipients: recipientType === "specific" ? selectedClients : []
        }),
      });

      if (response.ok) {
        // Refresh the notifications list
        await fetchClients();
        // Reset form
        setTitle("");
        setMessage("");
        setSelectedClients([]);
        setRecipientType("all");
        setIsPreviewMode(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send notification");
      }
      */
    } catch (err) {
      setError("An error occurred while sending the notification");
      console.error("Send notification error:", err);
    } finally {
      setIsSending(false);
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

  const getRecipientNames = (recipientIds: string[]) => {
    return recipientIds.map(id => {
      const client = clients.find(c => c.id === id);
      return client ? client.name : "Unknown";
    }).join(", ");
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown";
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
          <Link href="/admin/contacts" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
            Contact Submissions
          </Link>
          <Link href="/admin/notifications" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
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
            <h1 className="text-2xl font-bold">Broadcast Notifications</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchClients} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Notifications Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Send broadcast notifications to all clients or specific clients
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Notification Form */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Create New Notification</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Notification title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Notification message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recipientType">Recipients</Label>
                    <Select onValueChange={(value) => setRecipientType(value as "all" | "specific")} defaultValue={recipientType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        <SelectItem value="specific">Specific Clients</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {recipientType === "specific" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Select Clients</Label>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm" onClick={handleSelectAllActive}>
                            Select All Active
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleClearSelection}>
                            Clear Selection
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                        {clients.length === 0 ? (
                          <p className="text-muted-foreground text-center py-2">No clients found</p>
                        ) : (
                          <div className="space-y-2">
                            {clients.map((client) => (
                              <div key={client.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`client-${client.id}`}
                                  checked={selectedClients.includes(client.id)}
                                  onChange={(e) => handleClientSelection(client.id, e.target.checked)}
                                  className="rounded"
                                />
                                <label htmlFor={`client-${client.id}`} className="flex-1 flex justify-between">
                                  <span>{client.name}</span>
                                  <Badge variant="outline" className={client.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                    {client.status}
                                  </Badge>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      disabled={!title.trim() || !message.trim() || (recipientType === "specific" && selectedClients.length === 0)}
                    >
                      {isPreviewMode ? "Edit" : "Preview"}
                    </Button>
                    <Button 
                      onClick={handleSendNotification}
                      disabled={isSending || !title.trim() || !message.trim() || (recipientType === "specific" && selectedClients.length === 0)}
                    >
                      {isSending ? "Sending..." : "Send Notification"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Preview and History */}
              <div className="space-y-6">
                {/* Preview */}
                {isPreviewMode && (
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Preview</h2>
                    <div className="border rounded-md p-4 bg-white">
                      <h3 className="text-lg font-semibold mb-2">{title}</h3>
                      <p className="whitespace-pre-line">{message}</p>
                      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                        {recipientType === "all" ? (
                          <p>This notification will be sent to all clients.</p>
                        ) : (
                          <p>
                            This notification will be sent to: {getRecipientNames(selectedClients)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Notification History */}
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Notification History</h2>
                    <div className="text-sm text-muted-foreground">
                      {notifications.length} notifications sent
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No notifications sent yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="border rounded-md p-4 hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Badge variant="outline">
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {notification.recipientType === "all" 
                                ? "All clients" 
                                : `${notification.recipients.length} client${notification.recipients.length !== 1 ? 's' : ''}`}
                            </span>
                            <span>{formatDateTime(notification.sentAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Notification Detail Modal */}
          {selectedNotification && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg border max-w-2xl w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{selectedNotification.title}</h3>
                  <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="mb-4">
                  <p className="whitespace-pre-line">{selectedNotification.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Recipients</p>
                    <p>
                      {selectedNotification.recipientType === "all" 
                        ? "All clients" 
                        : `${selectedNotification.recipients.length} client${selectedNotification.recipients.length !== 1 ? 's' : ''}`}
                    </p>
                    {selectedNotification.recipientType === "specific" && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {selectedNotification.recipients.map(clientId => (
                          <div key={clientId} className="text-muted-foreground">
                            • {getClientName(clientId)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Sent By</p>
                    <p>{selectedNotification.sentBy}</p>
                    
                    <p className="text-muted-foreground mt-2">Sent At</p>
                    <p>{formatDateTime(selectedNotification.sentAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}