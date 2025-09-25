"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "@/components/admin-layout";

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: "draft" | "pending_payment" | "paid" | "cancelled";
  dueDate: string;
  paymentTerms: string;
  paymentIntentId?: string;
  stripeInvoiceId?: string;
  pdfUrl?: string;
  lastSentAt?: string;
  reminderCount: number;
  lastReminderAt?: string;
  lateFeeAmount: number;
  lateFeeApplied: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  status: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  projectId?: string;
  lineItems: LineItem[];
  taxAmount: number;
  taxDetails?: TaxDetails;
  paymentTerms: string;
  currency: string;
  recurringFrequency?: string;
  recurringDay?: number;
  recurringEndDate?: string;
  isActive: boolean;
  createdAt: string;
}

interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  notes?: string;
  createdAt: string;
}

interface CreditMemo {
  id: string;
  invoiceId: string;
  amount: number;
  reason: string;
  notes?: string;
  createdAt: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

interface TaxDetails {
  rate: number;
  amount: number;
  name?: string;
  description?: string;
}

interface EditInvoiceForm {
  status: "draft" | "pending_payment" | "paid" | "cancelled";
  amount: number;
  taxAmount: number;
  dueDate: string;
  paymentTerms: string;
  notes: string;
  lateFeeAmount: number;
}

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState<EditInvoiceForm>({
    status: "draft",
    amount: 0,
    taxAmount: 0,
    dueDate: "",
    paymentTerms: "net_30",
    notes: "",
    lateFeeAmount: 0,
  });

  const [createForm, setCreateForm] = useState({
    projectId: "",
    amount: 0,
    taxAmount: 0,
    dueDate: "",
    paymentTerms: "net_30",
    notes: "",
    templateId: "",
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    clientId: "",
    projectId: "",
    lineItems: "[]",
    taxAmount: 0,
    paymentTerms: "net_30",
    recurringFrequency: "",
    recurringDay: "",
    recurringEndDate: "",
  });

  // Invoice details
  const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
  const [creditMemos, setCreditMemos] = useState<CreditMemo[]>([]);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/invoices", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setFilteredInvoices(data.invoices || []);
        setProjects(data.projects || []);
        setTemplates(data.templates || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch invoices");
      }
    } catch (err) {
      setError("An error occurred while loading invoices");
      console.error("Admin invoices error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchInvoiceDetails = useCallback(async (invoiceId: string) => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) return;

      const [paymentsResponse, memosResponse] = await Promise.all([
        fetch(`/api/admin/invoices/${invoiceId}/payments`, {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` },
        }),
        fetch(`/api/admin/invoices/${invoiceId}/credit-memos`, {
          headers: { "Authorization": `Bearer ${JSON.parse(token).access_token}` },
        }),
      ]);

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setInvoicePayments(paymentsData.payments || []);
      }

      if (memosResponse.ok) {
        const memosData = await memosResponse.json();
        setCreditMemos(memosData.creditMemos || []);
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    // Apply filters
    let result = invoices;
    
    if (statusFilter !== "all") {
      result = result.filter(invoice => invoice.status === statusFilter);
    }
    
    if (projectFilter !== "all") {
      result = result.filter(invoice => invoice.projectId === projectFilter);
    }
    
    if (searchTerm) {
      result = result.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredInvoices(result);
  }, [invoices, statusFilter, projectFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
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
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount / 100); // Convert cents to dollars
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    await fetchInvoiceDetails(invoice.id);
    setEditForm({
      status: invoice.status,
      amount: invoice.amount,
      taxAmount: invoice.taxAmount,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes || "",
      lateFeeAmount: invoice.lateFeeAmount,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;

    setIsUpdating(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to update invoices");
        return;
      }

      const response = await fetch(`/api/admin/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchInvoices();
        setIsEditModalOpen(false);
        setSelectedInvoice(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update invoice");
      }
    } catch (err) {
      setError("An error occurred while updating the invoice");
      console.error("Update invoice error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateInvoice = async () => {
    setIsCreating(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to create invoices");
        return;
      }

      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        await fetchInvoices();
        setIsCreateModalOpen(false);
        setCreateForm({
          projectId: "",
          amount: 0,
          taxAmount: 0,
          dueDate: "",
          paymentTerms: "net_30",
          notes: "",
          templateId: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create invoice");
      }
    } catch (err) {
      setError("An error occurred while creating the invoice");
      console.error("Create invoice error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTemplate = async () => {
    setIsCreating(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to create templates");
        return;
      }

      const response = await fetch("/api/admin/invoice-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({
          ...templateForm,
          lineItems: JSON.parse(templateForm.lineItems),
        }),
      });

      if (response.ok) {
        await fetchInvoices();
        setIsTemplateModalOpen(false);
        setTemplateForm({
          name: "",
          description: "",
          clientId: "",
          projectId: "",
          lineItems: "[]",
          taxAmount: 0,
          paymentTerms: "net_30",
          recurringFrequency: "",
          recurringDay: "",
          recurringEndDate: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create template");
      }
    } catch (err) {
      setError("An error occurred while creating the template");
      console.error("Create template error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setIsSendingInvoice(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to send invoices");
        return;
      }

      const response = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        await fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send invoice");
      }
    } catch (err) {
      setError("An error occurred while sending the invoice");
      console.error("Send invoice error:", err);
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleGeneratePdf = async (invoiceId: string) => {
    setIsGeneratingPdf(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to generate PDFs");
        return;
      }

      const response = await fetch(`/api/admin/invoices/${invoiceId}/generate-pdf`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        await fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to generate PDF");
      }
    } catch (err) {
      setError("An error occurred while generating the PDF");
      console.error("Generate PDF error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const getTemplateSelectItems = () => {
    return templates.filter(t => t.isActive).map(template => (
      <SelectItem key={template.id} value={template.id}>
        {template.name} {template.recurringFrequency ? `(Recurring: ${template.recurringFrequency})` : ""}
      </SelectItem>
    ));
  };

  return (
    <AdminLayout
      title="Invoice Management"
      showRefresh={true}
      onRefresh={fetchInvoices}
      isLoading={isLoading}
    >
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Advanced invoice management with templates, recurring billing, and payment tracking
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Invoice
          </Button>
          <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Invoices</Label>
              <Input
                id="search"
                placeholder="Search by number, project, or client"
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
                <option value="draft">Draft</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="projectFilter">Filter by Project</Label>
              <select
                id="projectFilter"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Invoices</h2>
              <div className="text-sm text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No invoices found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Invoice #</th>
                      <th className="text-left py-3 px-4">Project</th>
                      <th className="text-left py-3 px-4">Client</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Due Date</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                        <td className="py-3 px-4">{invoice.projectName}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{invoice.clientName}</div>
                            <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div>{formatCurrency(invoice.amount)}</div>
                            {invoice.taxAmount > 0 && (
                              <div className="text-sm text-muted-foreground">
                                +{formatCurrency(invoice.taxAmount)} tax
                              </div>
                            )}
                            <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status.replace('_', ' ')}
                          </span>
                          {invoice.lateFeeApplied && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                              Late Fee
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : "Not set"}
                        </td>
                        <td className="py-3 px-4">{formatDate(invoice.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                            >
                              Edit
                            </Button>
                            {invoice.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendInvoice(invoice.id)}
                                disabled={isSendingInvoice}
                              >
                                Send
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGeneratePdf(invoice.id)}
                              disabled={isGeneratingPdf}
                            >
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </section>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Invoice</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Project</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createForm.projectId}
                  onChange={(e) => setCreateForm({...createForm, projectId: e.target.value})}
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">Template (Optional)</Label>
                <Select onValueChange={(value) => setCreateForm({...createForm, templateId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template</SelectItem>
                    {getTemplateSelectItems()}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Amount (cents)</Label>
                  <Input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({...createForm, amount: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-1">Tax Amount (cents)</Label>
                  <Input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={createForm.taxAmount}
                    onChange={(e) => setCreateForm({...createForm, taxAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Due Date</Label>
                  <Input
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({...createForm, dueDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-1">Payment Terms</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={createForm.paymentTerms}
                    onChange={(e) => setCreateForm({...createForm, paymentTerms: e.target.value})}
                  >
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                    <option value="due_on_receipt">Due on Receipt</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-1">Notes</Label>
                <Textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={isCreating || !createForm.projectId}
              >
                {isCreating ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create Invoice Template</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Template Name</Label>
                <Input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">Description</Label>
                <Textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-1">Line Items (JSON)</Label>
                <Textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  rows={6}
                  value={templateForm.lineItems}
                  onChange={(e) => setTemplateForm({...templateForm, lineItems: e.target.value})}
                  placeholder='[{"description": "Item 1", "quantity": 1, "unit_price": 10000}]'
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Tax Amount (cents)</Label>
                  <Input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={templateForm.taxAmount}
                    onChange={(e) => setTemplateForm({...templateForm, taxAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-1">Payment Terms</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={templateForm.paymentTerms}
                    onChange={(e) => setTemplateForm({...templateForm, paymentTerms: e.target.value})}
                  >
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                    <option value="due_on_receipt">Due on Receipt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Recurring Frequency</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={templateForm.recurringFrequency}
                    onChange={(e) => setTemplateForm({...templateForm, recurringFrequency: e.target.value})}
                  >
                    <option value="">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">Recurring Day</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={templateForm.recurringDay}
                    onChange={(e) => setTemplateForm({...templateForm, recurringDay: e.target.value})}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">End Date</Label>
                  <Input
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={templateForm.recurringEndDate}
                    onChange={(e) => setTemplateForm({...templateForm, recurringEndDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsTemplateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={isCreating || !templateForm.name || !templateForm.lineItems}
              >
                {isCreating ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {isEditModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Edit Invoice {selectedInvoice.invoiceNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedInvoice.projectName} - {selectedInvoice.clientName}
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Status</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as "draft" | "pending_payment" | "paid" | "cancelled"})}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-1">Amount (cents)</Label>
                    <Input
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-1">Tax Amount (cents)</Label>
                    <Input
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.taxAmount}
                      onChange={(e) => setEditForm({...editForm, taxAmount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-1">Due Date</Label>
                    <Input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-1">Payment Terms</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.paymentTerms}
                      onChange={(e) => setEditForm({...editForm, paymentTerms: e.target.value})}
                    >
                      <option value="net_15">Net 15</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_60">Net 60</option>
                      <option value="due_on_receipt">Due on Receipt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">Late Fee Amount (cents)</Label>
                  <Input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.lateFeeAmount}
                    onChange={(e) => setEditForm({...editForm, lateFeeAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-1">Notes</Label>
                  <Textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateInvoice}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Invoice"}
                  </Button>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment History</h4>
                  {invoicePayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {invoicePayments.map(payment => (
                        <div key={payment.id} className="p-3 border rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(payment.createdAt)}
                            {payment.transactionId && (
                              <div>Transaction ID: {payment.transactionId}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Credit Memos</h4>
                  {creditMemos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No credit memos</p>
                  ) : (
                    <div className="space-y-2">
                      {creditMemos.map(memo => (
                        <div key={memo.id} className="p-3 border rounded bg-red-50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">-{formatCurrency(memo.amount)}</span>
                            <span className="text-sm text-muted-foreground">{formatDate(memo.createdAt)}</span>
                          </div>
                          <div className="text-sm">{memo.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Invoice Actions</h4>
                  <div className="space-y-2">
                    {selectedInvoice.status === "draft" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSendInvoice(selectedInvoice.id)}
                        disabled={isSendingInvoice}
                      >
                        {isSendingInvoice ? "Sending..." : "Send Invoice"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGeneratePdf(selectedInvoice.id)}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? "Generating..." : "Generate PDF"}
                    </Button>
                    {selectedInvoice.pdfUrl && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(selectedInvoice.pdfUrl, '_blank')}
                      >
                        View PDF
                      </Button>
                    )}
                  </div>
                </div>

                {selectedInvoice.lastSentAt && (
                  <div className="text-sm text-muted-foreground">
                    Last sent: {formatDateTime(selectedInvoice.lastSentAt)}
                  </div>
                )}

                {selectedInvoice.reminderCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Reminders sent: {selectedInvoice.reminderCount}
                    {selectedInvoice.lastReminderAt && (
                      <div>Last reminder: {formatDateTime(selectedInvoice.lastReminderAt)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
