'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
}

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSuccess: () => void;
}

export default function SupportTicketModal({ isOpen, onClose, projects, onSuccess }: SupportTicketModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form fields
  const [projectId, setProjectId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [category, setCategory] = useState("");

  const categories = [
    "Technical Issue",
    "Feature Request", 
    "Billing Question",
    "Account Management",
    "Project Inquiry",
    "General Support",
    "Bug Report",
    "Other"
  ];

  const resetForm = () => {
    setProjectId("");
    setSubject("");
    setDescription("");
    setPriority("medium");
    setCategory("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!projectId) {
        setError("Project selection is required");
        setIsLoading(false);
        return;
      }

      if (!subject.trim()) {
        setError("Subject is required");
        setIsLoading(false);
        return;
      }

      if (!description.trim()) {
        setError("Description is required");
        setIsLoading(false);
        return;
      }

      if (!category) {
        setError("Category is required");
        setIsLoading(false);
        return;
      }

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError("Authentication error. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Create the support ticket
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create support ticket");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess("Support ticket created successfully!");
      resetForm();
      
      // Notify parent component to refresh data
      onSuccess();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);

    } catch (err) {
      console.error("Error creating support ticket:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-ticket-modal-title"
      aria-describedby="support-ticket-modal-description"
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle id="support-ticket-modal-title">Create Support Ticket</CardTitle>
              <CardDescription id="support-ticket-modal-description">
                Submit a new support request and we'll get back to you as soon as possible.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close support ticket modal"
            >
              &times;
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error and Success Messages */}
            {error && (
              <div
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
            
            {success && (
              <div
                className="p-4 bg-green-100 border border-green-200 rounded-md text-green-800 dark:bg-green-900 dark:text-green-200"
                role="alert"
                aria-live="polite"
              >
                {success}
              </div>
            )}

            {/* Project Selection (Required) */}
            <div className="space-y-2">
              <Label htmlFor="project">Related Project *</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={isLoading} required>
                <SelectTrigger id="project" aria-describedby="project-help">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="project-help" className="text-xs text-muted-foreground">
                Select the project this ticket is related to
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isLoading}
                placeholder="Brief description of your issue"
                required
                aria-required="true"
                aria-describedby="subject-help"
              />
              <p id="subject-help" className="text-xs text-muted-foreground">
                Provide a clear and concise subject line
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} disabled={isLoading} required>
                <SelectTrigger id="category" aria-describedby="category-help">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="category-help" className="text-xs text-muted-foreground">
                Choose the category that best describes your issue
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={(value: "low" | "medium" | "high" | "urgent") => setPriority(value)} disabled={isLoading} required>
                <SelectTrigger id="priority" aria-describedby="priority-help">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Low
                  </Badge>
                  <span>Not urgent</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Medium
                  </Badge>
                  <span>Normal priority</span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    High
                  </Badge>
                  <span>Urgent issue</span>
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Urgent
                  </Badge>
                  <span>Critical issue</span>
                </div>
              </SelectItem>
                </SelectContent>
              </Select>
              <p id="priority-help" className="text-xs text-muted-foreground">
                Select the urgency level of your request
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                placeholder="Please provide detailed information about your issue, including any error messages, steps to reproduce, and what you've already tried."
                required
                aria-required="true"
                aria-describedby="description-help"
                rows={6}
              />
              <p id="description-help" className="text-xs text-muted-foreground">
                Be as detailed as possible to help us understand and resolve your issue quickly
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-input">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} aria-live="polite">
                {isLoading ? "Creating Ticket..." : "Create Support Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
