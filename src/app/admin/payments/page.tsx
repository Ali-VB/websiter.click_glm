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

interface PaymentIntent {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "canceled" | "requires_capture";
  payment_method_id?: string;
  payment_method_type?: string;
  invoice_id?: string;
  invoice_number?: string;
  failure_reason?: string;
  failure_code?: string;
  next_action?: Record<string, unknown>;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  dispute_id?: string;
  dispute_status?: string;
  dispute_reason?: string;
  refund_id?: string;
  refund_amount?: number;
  refund_status?: string;
  refund_reason?: string;
  metadata?: Record<string, unknown>;
  last4?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  id: string;
  client_id: string;
  client_name: string;
  method_type: "card" | "bank_account" | "paypal" | "stripe" | "other";
  provider: string;
  provider_method_id: string;
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  billing_name?: string;
  billing_address?: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PaymentSubscription {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  payment_method_id: string;
  payment_method_type?: string;
  stripe_subscription_id: string;
  status: "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "trialing";
  amount: number;
  currency: string;
  frequency: "weekly" | "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  ended_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PaymentDispute {
  id: string;
  payment_intent_id: string;
  stripe_dispute_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: "needs_response" | "under_review" | "won" | "lost" | "warning_needs_response" | "warning_under_review" | "warning_won" | "warning_lost";
  evidence?: Record<string, unknown>;
  evidence_due_by?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  total_amount: number;
  success_rate: number;
  average_payment_amount: number;
  monthly_trend: Array<{ month: string; amount: number; count: number }>;
  payment_methods_breakdown: Array<{ type: string; count: number; amount: number }>;
  subscriptions_count: number;
  active_subscriptions: number;
  disputes_count: number;
  open_disputes: number;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntent[]>([]);
  const [filteredPaymentIntents, setFilteredPaymentIntents] = useState<PaymentIntent[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<PaymentSubscription[]>([]);
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentIntent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [refundForm, setRefundForm] = useState({
    amount: 0,
    reason: "",
    notes: "",
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/payments", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentIntents(data.paymentIntents || []);
        setFilteredPaymentIntents(data.paymentIntents || []);
        setPaymentMethods(data.paymentMethods || []);
        setSubscriptions(data.subscriptions || []);
        setDisputes(data.disputes || []);
        setStats(data.stats || null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch payments");
      }
    } catch (err) {
      setError("An error occurred while loading payments");
      console.error("Admin payments error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    // Apply filters
    let result = paymentIntents;
    
    if (statusFilter !== "all") {
      result = result.filter(payment => payment.status === statusFilter);
    }
    
    if (clientFilter !== "all") {
      result = result.filter(payment => payment.client_id === clientFilter);
    }
    
    if (searchTerm) {
      result = result.filter(payment => 
        payment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.invoice_number && payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredPaymentIntents(result);
  }, [paymentIntents, statusFilter, clientFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
      case "requires_capture":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "trialing":
        return "bg-green-100 text-green-800";
      case "past_due":
      case "unpaid":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
      case "incomplete":
      case "incomplete_expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-100 text-green-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "needs_response":
      case "warning_needs_response":
        return "bg-red-100 text-red-800";
      case "lost":
      case "warning_lost":
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

  const handleRetryPayment = async (paymentId: string) => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to retry payments");
        return;
      }

      const response = await fetch(`/api/admin/payments/${paymentId}/retry`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        await fetchPayments();
        setIsRetryModalOpen(false);
        setSelectedPayment(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to retry payment");
      }
    } catch (err) {
      setError("An error occurred while retrying the payment");
      console.error("Retry payment error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to process refunds");
        return;
      }

      const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify(refundForm),
      });

      if (response.ok) {
        await fetchPayments();
        setIsRefundModalOpen(false);
        setSelectedPayment(null);
        setRefundForm({ amount: 0, reason: "", notes: "" });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to process refund");
      }
    } catch (err) {
      setError("An error occurred while processing the refund");
      console.error("Refund payment error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewPaymentDetails = (payment: PaymentIntent) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const handleOpenRetryModal = (payment: PaymentIntent) => {
    setSelectedPayment(payment);
    setIsRetryModalOpen(true);
  };

  const handleOpenRefundModal = (payment: PaymentIntent) => {
    setSelectedPayment(payment);
    setRefundForm({
      amount: payment.amount,
      reason: "",
      notes: "",
    });
    setIsRefundModalOpen(true);
  };

  const getClientSelectItems = () => {
    const clients = Array.from(new Set(paymentIntents.map(p => p.client_id))).map(clientId => {
      const payment = paymentIntents.find(p => p.client_id === clientId);
      return {
        id: clientId,
        name: payment?.client_name || "Unknown",
      };
    });
    
    return clients.map(client => (
      <SelectItem key={client.id} value={client.id}>
        {client.name}
      </SelectItem>
    ));
  };

  const getUniqueClients = () => {
    return Array.from(new Set(paymentIntents.map(p => ({
      id: p.client_id,
      name: p.client_name,
      email: p.client_email,
    }))));
  };

  return (
    <AdminLayout
      title="Payment Management"
      showRefresh={true}
      onRefresh={fetchPayments}
      isLoading={isLoading}
    >
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Advanced payment management with real-time tracking, retry logic, and dispute handling
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Payment Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.successful_payments}/{stats.total_payments} payments
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(stats.average_payment_amount)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {stats.subscriptions_count}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.open_disputes}</div>
              <div className="text-sm text-muted-foreground">Open Disputes</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {stats.disputes_count}
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Payments</Label>
              <Input
                id="search"
                placeholder="Search by client or invoice"
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
                <option value="succeeded">Succeeded</option>
                <option value="processing">Processing</option>
                <option value="requires_payment_method">Requires Payment Method</option>
                <option value="requires_confirmation">Requires Confirmation</option>
                <option value="requires_action">Requires Action</option>
                <option value="requires_capture">Requires Capture</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="clientFilter">Filter by Client</Label>
              <Select onValueChange={(value) => setClientFilter(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {getClientSelectItems()}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Payment Intents Table */}
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Payment Intents</h2>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredPaymentIntents.length} of {paymentIntents.length} payments
                </div>
              </div>

              {filteredPaymentIntents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payments found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Client</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Payment Method</th>
                        <th className="text-left py-3 px-4">Invoice</th>
                        <th className="text-left py-3 px-4">Created</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentIntents.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{payment.client_name}</div>
                              <div className="text-sm text-muted-foreground">{payment.client_email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            {payment.refund_amount && (
                              <div className="text-sm text-red-600">
                                Refunded: {formatCurrency(payment.refund_amount)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status.replace('_', ' ')}
                            </span>
                            {payment.dispute_status && (
                              <Badge variant="destructive" className="ml-1 text-xs">
                                Disputed
                              </Badge>
                            )}
                            {payment.retry_count > 0 && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Retries: {payment.retry_count}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {payment.payment_method_type && (
                              <div className="text-sm">
                                {payment.payment_method_type}
                                {payment.last4 && ` •••• ${payment.last4}`}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {payment.invoice_number && (
                              <div className="text-sm font-medium">{payment.invoice_number}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">{formatDate(payment.created_at)}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPaymentDetails(payment)}
                              >
                                Details
                              </Button>
                              {(payment.status === "requires_payment_method" || 
                                payment.status === "requires_confirmation" || 
                                payment.status === "requires_action") && 
                                payment.retry_count < payment.max_retries && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenRetryModal(payment)}
                                  disabled={isProcessing}
                                >
                                  Retry
                                </Button>
                              )}
                              {payment.status === "succeeded" && !payment.refund_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenRefundModal(payment)}
                                  disabled={isProcessing}
                                >
                                  Refund
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Active Subscriptions */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Active Subscriptions</h2>
              
              {subscriptions.filter(s => s.status === "active" || s.status === "trialing").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active subscriptions.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Client</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Frequency</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Next Billing</th>
                        <th className="text-left py-3 px-4">Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions
                        .filter(s => s.status === "active" || s.status === "trialing")
                        .map((subscription) => (
                        <tr key={subscription.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{subscription.client_name}</div>
                              <div className="text-sm text-muted-foreground">{subscription.client_email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{formatCurrency(subscription.amount)}</div>
                            <div className="text-sm text-muted-foreground">{subscription.frequency}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{subscription.frequency}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusColor(subscription.status)}`}>
                              {subscription.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatDate(subscription.current_period_end)}</td>
                          <td className="py-3 px-4">{formatDate(subscription.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Open Disputes */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Open Disputes</h2>
              
              {disputes.filter(d => d.status.includes("needs_response") || d.status === "under_review").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No open disputes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Reason</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Evidence Due</th>
                        <th className="text-left py-3 px-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes
                        .filter(d => d.status.includes("needs_response") || d.status === "under_review")
                        .map((dispute) => (
                        <tr key={dispute.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-red-600">-{formatCurrency(dispute.amount)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{dispute.reason.replace('_', ' ')}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDisputeStatusColor(dispute.status)}`}>
                              {dispute.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {dispute.evidence_due_by ? formatDate(dispute.evidence_due_by) : "Not set"}
                          </td>
                          <td className="py-3 px-4">{formatDate(dispute.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </section>

      {/* Payment Details Modal */}
      {isDetailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Payment Details</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.client_name} - {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block mt-1 ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <div className="mt-1">{formatDateTime(selectedPayment.created_at)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedPayment.client_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedPayment.client_email}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <div className="mt-1 font-medium">{formatCurrency(selectedPayment.amount)}</div>
                </div>
              </div>

              {selectedPayment.payment_method_type && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <div className="mt-1">
                    <div className="capitalize">{selectedPayment.payment_method_type}</div>
                    {selectedPayment.last4 && (
                      <div className="text-sm text-muted-foreground">•••• {selectedPayment.last4}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedPayment.invoice_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Invoice</Label>
                  <div className="mt-1 font-medium">{selectedPayment.invoice_number}</div>
                </div>
              )}

              {selectedPayment.failure_reason && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Failure Details</Label>
                  <div className="mt-1">
                    <div className="text-sm font-medium">{selectedPayment.failure_code}</div>
                    <div className="text-sm">{selectedPayment.failure_reason}</div>
                  </div>
                </div>
              )}

              {selectedPayment.retry_count > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Retry Information</Label>
                  <div className="mt-1">
                    <div className="text-sm">Retries: {selectedPayment.retry_count}/{selectedPayment.max_retries}</div>
                    {selectedPayment.next_retry_at && (
                      <div className="text-sm">Next retry: {formatDateTime(selectedPayment.next_retry_at)}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedPayment.refund_id && (
                <div className="p-3 border rounded bg-red-50">
                  <Label className="text-sm font-medium text-red-800">Refund Information</Label>
                  <div className="mt-1">
                    <div className="text-sm font-medium">Amount: {formatCurrency(selectedPayment.refund_amount || 0)}</div>
                    <div className="text-sm">Status: {selectedPayment.refund_status}</div>
                    {selectedPayment.refund_reason && (
                      <div className="text-sm">Reason: {selectedPayment.refund_reason}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedPayment.dispute_status && (
                <div className="p-3 border rounded bg-yellow-50">
                  <Label className="text-sm font-medium text-yellow-800">Dispute Information</Label>
                  <div className="mt-1">
                    <div className="text-sm font-medium">Status: {selectedPayment.dispute_status}</div>
                    <div className="text-sm">Reason: {selectedPayment.dispute_reason}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retry Payment Modal */}
      {isRetryModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Retry Payment</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                <div className="mt-1">{selectedPayment.client_name}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                <div className="mt-1 font-medium">{formatCurrency(selectedPayment.amount)}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block mt-1 ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status.replace('_', ' ')}
                </div>
              </div>
              
              {selectedPayment.failure_reason && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Failure Reason</Label>
                  <div className="mt-1 text-sm">{selectedPayment.failure_reason}</div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Retry Attempts</Label>
                <div className="mt-1 text-sm">{selectedPayment.retry_count} of {selectedPayment.max_retries}</div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsRetryModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRetryPayment(selectedPayment.id)}
                disabled={isProcessing}
              >
                {isProcessing ? "Retrying..." : "Retry Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Payment Modal */}
      {isRefundModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Process Refund</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                <div className="mt-1">{selectedPayment.client_name}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Original Amount</Label>
                <div className="mt-1 font-medium">{formatCurrency(selectedPayment.amount)}</div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-1">Refund Amount (cents)</Label>
                <Input
                  type="number"
                  max={selectedPayment.amount}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({...refundForm, amount: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-1">Reason</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})}
                >
                  <option value="">Select a reason</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="requested_by_customer">Requested by customer</option>
                  <option value="product_unacceptable">Product unacceptable</option>
                  <option value="product_not_received">Product not received</option>
                  <option value="unrecognized">Unrecognized</option>
                  <option value="credit_not_processed">Credit not processed</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-1">Notes</Label>
                <Textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={refundForm.notes}
                  onChange={(e) => setRefundForm({...refundForm, notes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRefundPayment(selectedPayment.id)}
                disabled={isProcessing || !refundForm.reason || refundForm.amount <= 0}
              >
                {isProcessing ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
