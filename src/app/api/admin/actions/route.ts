import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface ActionItem {
  id: string;
  type: 'project_approval' | 'invoice_review' | 'contact_submission' | 'urgent_ticket';
  title: string;
  description: string;
  clientId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch projects awaiting approval
    const { data: pendingProjects } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        created_at,
        clients!fk_projects_client_id (
          id,
          name,
          email
        )
      `)
      .in('status', ['submitted', 'awaiting_invoice'])
      .order('created_at', { ascending: false });

    // Fetch invoices pending review
    const { data: pendingInvoices } = await supabase
      .from('invoices')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        projects!fk_invoices_project_id (
          id,
          name
        ),
        clients!fk_invoices_client_id (
          id,
          name,
          email
        )
      `)
      .in('status', ['pending', 'draft'])
      .order('created_at', { ascending: false });

    // Fetch unresolved contact submissions
    const { data: contactSubmissions } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    // Fetch urgent/high priority support tickets
    const { data: urgentTickets } = await supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        status,
        priority,
        created_at,
        clients!fk_support_tickets_client_id (
          id,
          name,
          email
        )
      `)
      .in('priority', ['high', 'urgent'])
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false });

    // Transform and combine all action items
    const actions: ActionItem[] = [];

    // Add project approval actions
    pendingProjects?.forEach((project: any) => {
      const clients = project.clients as { id: string; name: string; email: string }[] | null;
      const client = clients?.[0];
      if (client) {
        actions.push({
          id: `project_approval_${project.id}`,
          type: 'project_approval',
          title: 'Project Approval Required',
          description: `Project "${project.name}" from ${client.name} is awaiting approval`,
          clientId: client.id,
          priority: project.status === 'submitted' ? 'high' : 'normal',
          timestamp: project.created_at
        });
      }
    });

    // Add invoice review actions
    pendingInvoices?.forEach((invoice: any) => {
      const clients = invoice.clients as { id: string; name: string; email: string }[] | null;
      const projects = invoice.projects as { id: string; name: string }[] | null;
      const client = clients?.[0];
      const project = projects?.[0];
      if (client) {
        actions.push({
          id: `invoice_review_${invoice.id}`,
          type: 'invoice_review',
          title: 'Invoice Review Required',
          description: `Invoice for $${(invoice.total_amount || 0).toLocaleString()}${project ? ` (${project.name})` : ''} from ${client.name} needs review`,
          clientId: client.id,
          priority: invoice.status === 'pending' ? 'high' : 'normal',
          timestamp: invoice.created_at
        });
      }
    });

    // Add contact submission actions
    contactSubmissions?.forEach((submission: any) => {
      actions.push({
        id: `contact_submission_${submission.id}`,
        type: 'contact_submission',
        title: 'New Contact Submission',
        description: `Contact form submission from ${submission.name} (${submission.email}): ${submission.message.substring(0, 100)}...`,
        priority: 'normal',
        timestamp: submission.created_at
      });
    });

    // Add urgent ticket actions
    urgentTickets?.forEach((ticket: any) => {
      const clients = ticket.clients as { id: string; name: string; email: string }[] | null;
      const client = clients?.[0];
      if (client) {
        actions.push({
          id: `urgent_ticket_${ticket.id}`,
          type: 'urgent_ticket',
          title: 'Urgent Support Ticket',
          description: `Ticket "${ticket.subject}" from ${client.name} requires immediate attention`,
          clientId: client.id,
          priority: ticket.priority as 'low' | 'normal' | 'high' | 'urgent',
          timestamp: ticket.created_at
        });
      }
    });

    // Sort actions by priority and timestamp
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    actions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return -priorityDiff; // Higher priority first
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Most recent first
    });

    return NextResponse.json({
      success: true,
      actions: actions.slice(0, 20) // Return top 20 actions
    });
  } catch (error) {
    console.error('Admin actions API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching actions' },
      { status: 500 }
    );
  }
}
