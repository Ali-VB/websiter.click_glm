"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface EditInvoiceForm {
  status: "pending" | "approved" | "paid" | "rejected";
  amount: number;
  dueDate: string;
  notes: string;
}

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<EditInvoiceForm>({
    status: "pending",
    amount: 0,
    dueDate: "",
    notes: "",
  });

  const fetchInvoices = useCallback(async () => {
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

      // Fetch invoices
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

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    // Apply status filter
    if (statusFilter === "all") {
      setFilteredInvoices(invoices);
    } else {
      setFilteredInvoices(invoices.filter(invoice => invoice.status === statusFilter));
    }
  }, [invoices, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "rejected":
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount / 100); // Convert cents to dollars
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditForm({
      status: invoice.status,
      amount: invoice.amount,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
      notes: "", // Notes would need to be fetched separately if stored in a different table
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;

    setIsUpdating(true);
    setError("");

    try {
      // Get the auth token from localStorage
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
        body: JSON.stringify({
          status: editForm.status,
          amount: editForm.amount,
          dueDate: editForm.dueDate,
          notes: editForm.notes,
        }),
      });

      if (response.ok) {
        // Refresh the invoices list
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

  const handleLogout = () => {
    localStorage.removeItem("supabase.auth.token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="font-bold text-xl">websiter.click</span>
          <span className="text-sm text-muted-foreground">Admin Portal</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Client Dashboard</Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </header>

      {/* Admin Invoices Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
          <p className="text-muted-foreground">
            Review, edit, and approve client invoices
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              className="w-full md:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInvoices} disabled={isLoading}>
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-background p-6 rounded-lg border">
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
                      <th className="text-left py-3 px-4">Invoice ID</th>
                      <th className="text-left py-3 px-4">Project</th>
                      <th className="text-left py-3 px-4">Client</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">#{invoice.id}</td>
                        <td className="py-3 px-4">{invoice.projectName}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{invoice.clientName}</div>
                            <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(invoice.amount)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{formatDate(invoice.createdAt)}</td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Edit Invoice Modal */}
      {isEditModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Edit Invoice</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as "pending" | "approved" | "paid" | "rejected"})}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Amount (cents)</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
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
        </div>
      )}
    </div>
  );
}