"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "@/components/admin-layout";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export default function AdminContactsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [note, setNote] = useState<string>("");
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  // Mock data for development
  const mockSubmissions: ContactSubmission[] = [
    {
      id: "1",
      name: "Sarah Williams",
      email: "sarah@example.com",
      phone: "555-111-2222",
      message: "I'm interested in getting a custom website for my small business. Can you provide a quote? I need something professional with e-commerce functionality.",
      createdAt: "2023-06-28T11:30:00Z",
      updatedAt: "2023-06-28T11:30:00Z",
    },
    {
      id: "2",
      name: "Robert Brown",
      email: "robert@brownconsulting.com",
      message: "Looking for a landing page design for my consulting business. Please contact me to discuss requirements. I need something modern and responsive.",
      createdAt: "2023-06-27T15:45:00Z",
      updatedAt: "2023-06-28T09:30:00Z",
      notes: "Client prefers blue color scheme. Needs the website live by end of Q3.",
    },
    {
      id: "3",
      name: "Jennifer Davis",
      email: "jennifer@davisphotography.com",
      phone: "555-333-4444",
      message: "I'm a photographer looking to update my portfolio website. I want something clean and modern that showcases my work effectively.",
      createdAt: "2023-06-25T10:15:00Z",
      updatedAt: "2023-06-26T14:20:00Z",
      notes: "Converted to client. Project started on July 1st."
    },
    {
      id: "4",
      name: "Michael Wilson",
      email: "michael@techstartup.io",
      message: "We're a new tech startup looking for a complete website redesign. We need something innovative that reflects our brand identity.",
      createdAt: "2023-06-29T09:20:00Z",
      updatedAt: "2023-06-29T09:20:00Z",
    },
    {
      id: "5",
      name: "Lisa Thompson",
      email: "lisa@restaurant.com",
      phone: "555-555-6666",
      message: "Need a website for our restaurant with online reservation system and menu display.",
      createdAt: "2023-06-26T16:40:00Z",
      updatedAt: "2023-06-27T11:15:00Z",
    }
  ];

  const fetchSubmissions = useCallback(async () => {
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
        const response = await fetch("/api/admin/contacts", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSubmissions(data.submissions || []);
            setFilteredSubmissions(data.submissions || []);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.log("API endpoint not available, using mock data");
      }

      // If API fails, use mock data (for development)
      setTimeout(() => {
        setSubmissions(mockSubmissions);
        setFilteredSubmissions(mockSubmissions);
        setIsLoading(false);
      }, 500);

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

    if (searchTerm) {
      result = result.filter(submission =>
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (submission.phone && submission.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        submission.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubmissions(result);
  }, [submissions, searchTerm]);

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

  const getMessagePreview = (message: string, maxLength = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const handleSaveNote = async () => {
    if (!selectedSubmission) return;
    
    console.log("handleSaveNote called for submission:", selectedSubmission.name);
    console.log("Current note value:", note);
    
    setIsSavingNote(true);
    
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setError("You must be logged in to save notes");
        return;
      }

      // Make API call to save the note
      const response = await fetch("/api/admin/contacts", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedSubmission.id,
          notes: note
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Update the submissions array to persist the note
          const updatedSubmission = {
            ...selectedSubmission,
            notes: note,
            updatedAt: new Date().toISOString()
          };
          
          setSubmissions(prevSubmissions => 
            prevSubmissions.map(submission => 
              submission.id === selectedSubmission.id 
                ? updatedSubmission
                : submission
            )
          );
          
          // Update the selected submission to reflect the changes
          setSelectedSubmission(updatedSubmission);
          
          // Switch to edit mode after saving
          setIsEditingNote(true);
          
          console.log("Note saved successfully for", selectedSubmission.name);
          setSuccessMessage("Note saved successfully!");
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage("");
          }, 3000);
        } else {
          setError(data.message || "Failed to save note");
        }
      } else {
        setError("Failed to save note. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while saving the note");
      console.error("Save note error:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleEditNote = () => {
    setIsEditingNote(false);
  };




  return (
    <AdminLayout
      title="Contact Submissions"
      showRefresh={true}
      onRefresh={fetchSubmissions}
      isLoading={isLoading}
    >
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
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
            {successMessage}
          </div>
        )}

        {/* Search */}
        <Card className="p-4 mb-6">
          <div>
            <Label htmlFor="search">Search Submissions</Label>
            <Input
              id="search"
              placeholder="Search by name, email, phone, or message"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
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
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Phone</th>
                        <th className="text-left py-3 px-4">Message Preview</th>
                        <th className="text-left py-3 px-4">Received</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{submission.name}</div>
                          </td>
                          <td className="py-3 px-4">{submission.email}</td>
                          <td className="py-3 px-4">{submission.phone || "-"}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm max-w-xs truncate">
                              {getMessagePreview(submission.message)}
                            </div>
                          </td>
                          <td className="py-3 px-4">{formatDate(submission.createdAt)}</td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setNote(submission.notes || "");
                        setIsEditingNote(!!submission.notes);
                      }}
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
                    <h2 className="text-2xl font-bold mb-2">{selectedSubmission.name}</h2>
                    <p className="text-muted-foreground">
                      From {selectedSubmission.name} ({selectedSubmission.email}) on {formatDateTime(selectedSubmission.createdAt)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setSelectedSubmission(null);
                    setNote("");
                  }}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                      <div className="flex">
                        <span className="w-32 text-muted-foreground">Received:</span>
                        <span>{formatDateTime(selectedSubmission.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Message</h3>
                  <div className="bg-muted p-4 rounded whitespace-pre-wrap">
                    {selectedSubmission.message}
                  </div>
                </div>

                {/* Note Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Internal Note</h3>
                  <div className="p-4 border rounded">
                    <Textarea
                      placeholder="Enter your note here..."
                      value={note}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                      rows={4}
                      className="mb-2"
                      disabled={isEditingNote}
                    />
                    <div className="flex justify-end gap-2">
                      {isEditingNote ? (
                        <Button onClick={handleEditNote} variant="outline">
                          Edit Note
                        </Button>
                      ) : (
                        <Button onClick={handleSaveNote} disabled={isSavingNote}>
                          {isSavingNote ? "Saving..." : "Save Note"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  );
}
