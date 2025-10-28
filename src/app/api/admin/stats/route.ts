import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Get total clients count
    const { count: totalClients, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (clientsError) {
      console.error('Error fetching clients count:', clientsError);
    }

    // Get active projects count (projects that are not completed or on_hold)
    const { count: activeProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress', 'review']);

    if (projectsError) {
      console.error('Error fetching active projects count:', projectsError);
    }

    // Get pending invoices count
    const { count: pendingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'approved']);

    if (invoicesError) {
      console.error('Error fetching pending invoices count:', invoicesError);
    }

    // Get open support tickets count
    const { count: openSupportTickets, error: supportError } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);

    if (supportError) {
      console.error('Error fetching open support tickets count:', supportError);
    }

    // Get recent activity (last 10 activities)
    const { data: recentActivity, error: activityError } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    // Get system status (you can customize this based on your needs)
    const systemStatus = {
      database: 'operational',
      api: 'operational',
      storage: 'operational',
      email: 'operational'
    };

    const stats = {
      totalClients: totalClients || 0,
      activeProjects: activeProjects || 0,
      pendingInvoices: pendingInvoices || 0,
      openSupportTickets: openSupportTickets || 0,
      recentActivity: recentActivity || [],
      systemStatus
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching stats' },
      { status: 500 }
    );
  }
}
