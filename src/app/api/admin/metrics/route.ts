import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface RealtimeMetrics {
  activeProjectsWithCompletion: {
    count: number;
    completionRate: number;
    trend: 'up' | 'down' | 'stable';
  };
  revenueComparison: {
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  outstandingPayments: {
    count: number;
    amount: number;
    trend: 'up' | 'down' | 'stable';
  };
  supportTicketResolution: {
    total: number;
    resolved: number;
    resolutionRate: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Get current and previous month dates
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Fetch active projects with progress
    const { data: projects } = await supabase
      .from('projects')
      .select('progress_percentage, status')
      .in('status', ['in_progress', 'approved']);

    const activeProjects = projects || [];
    const totalProgress = activeProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
    const completionRate = activeProjects.length > 0 ? Math.round(totalProgress / activeProjects.length) : 0;

    // Fetch invoices for revenue comparison
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, created_at, status')
      .in('status', ['paid', 'partially_paid']);

    const currentMonthInvoices = invoices?.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }) || [];

    const lastMonthInvoices = invoices?.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
    }) || [];

    const thisMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    // Fetch outstanding payments
    const { data: outstandingInvoices } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .in('status', ['pending', 'overdue']);

    const outstandingAmount = outstandingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const outstandingCount = outstandingInvoices?.length || 0;

    // Fetch support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('status');

    const totalTickets = tickets?.length || 0;
    const resolvedTickets = tickets?.filter(t => t.status === 'closed').length || 0;
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    // Calculate trends (simplified logic)
    const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
      if (current > previous * 1.05) return 'up';
      if (current < previous * 0.95) return 'down';
      return 'stable';
    };

    const metrics: RealtimeMetrics = {
      activeProjectsWithCompletion: {
        count: activeProjects.length,
        completionRate,
        trend: 'stable' // Could be calculated based on historical data
      },
      revenueComparison: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        trend: getTrend(thisMonthRevenue, lastMonthRevenue)
      },
      outstandingPayments: {
        count: outstandingCount,
        amount: outstandingAmount,
        trend: 'stable' // Could be calculated based on historical data
      },
      supportTicketResolution: {
        total: totalTickets,
        resolved: resolvedTickets,
        resolutionRate,
        trend: 'stable' // Could be calculated based on historical data
      }
    };

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Admin metrics API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching metrics' },
      { status: 500 }
    );
  }
}
