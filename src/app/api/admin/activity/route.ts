import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface ActivityFeedItem {
  id: string;
  type: 'project_submission' | 'payment' | 'ticket' | 'asset_upload' | 'status_change';
  clientId: string;
  clientName: string;
  action: string;
  description: string;
  timestamp: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch recent projects
    const { data: recentProjects } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        created_at,
        clients!fk_projects_client_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent invoices
    const { data: recentInvoices } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent support tickets
    const { data: recentTickets } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent assets
    const { data: recentAssets } = await supabase
      .from('project_assets')
      .select(`
        id,
        file_name,
        asset_type,
        created_at,
        projects!fk_project_assets_project_id (
          id,
          name
        ),
        clients!fk_project_assets_uploaded_by (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Transform and combine all activities
    const activities: ActivityFeedItem[] = [];

    // Add project activities
    recentProjects?.forEach((project: any) => {
      const clients = project.clients as { id: string; name: string; email: string }[] | null;
      const client = clients?.[0];
      if (client) {
        activities.push({
          id: `project_${project.id}`,
          type: 'project_submission',
          clientId: client.id,
          clientName: client.name,
          action: 'New Project Submitted',
          description: `Project "${project.name}" - Status: ${project.status}`,
          timestamp: project.created_at,
          priority: 'normal'
        });
      }
    });

    // Add payment activities
    recentInvoices?.forEach((invoice: any) => {
      const clients = invoice.clients as { id: string; name: string; email: string }[] | null;
      const projects = invoice.projects as { id: string; name: string }[] | null;
      const client = clients?.[0];
      const project = projects?.[0];
      if (client) {
        activities.push({
          id: `invoice_${invoice.id}`,
          type: 'payment',
          clientId: client.id,
          clientName: client.name,
          action: `Invoice ${invoice.status}`,
          description: `Amount: $${(invoice.total_amount || 0).toLocaleString()}${project ? ` for ${project.name}` : ''}`,
          timestamp: invoice.created_at,
          priority: invoice.status === 'overdue' ? 'high' : 'normal'
        });
      }
    });

    // Add ticket activities
    recentTickets?.forEach((ticket: any) => {
      const clients = ticket.clients as { id: string; name: string; email: string }[] | null;
      const client = clients?.[0];
      if (client) {
        activities.push({
          id: `ticket_${ticket.id}`,
          type: 'ticket',
          clientId: client.id,
          clientName: client.name,
          action: 'Support Ticket Created',
          description: `${ticket.subject} - Priority: ${ticket.priority}`,
          timestamp: ticket.created_at,
          priority: ticket.priority as 'low' | 'normal' | 'high' | 'urgent'
        });
      }
    });

    // Add asset upload activities
    recentAssets?.forEach((asset: any) => {
      const clients = asset.clients as { id: string; name: string; email: string }[] | null;
      const projects = asset.projects as { id: string; name: string }[] | null;
      const client = clients?.[0];
      const project = projects?.[0];
      if (client) {
        activities.push({
          id: `asset_${asset.id}`,
          type: 'asset_upload',
          clientId: client.id,
          clientName: client.name,
          action: 'Asset Uploaded',
          description: `${asset.file_name} (${asset.asset_type})${project ? ` to ${project.name}` : ''}`,
          timestamp: asset.created_at,
          priority: 'low'
        });
      }
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return only the most recent 20 activities
    return NextResponse.json({
      success: true,
      activity: activities.slice(0, 20)
    });
  } catch (error) {
    console.error('Admin activity API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching activity' },
      { status: 500 }
    );
  }
}
