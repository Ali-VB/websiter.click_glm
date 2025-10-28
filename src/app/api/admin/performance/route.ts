import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface PerformanceData {
  projectStatusDistribution: {
    pending: number;
    in_progress: number;
    review: number;
    completed: number;
  };
  revenueTrends: Array<{
    month: string;
    revenue: number;
  }>;
  clientAcquisition: Array<{
    month: string;
    newClients: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch project status distribution
    const { data: projects } = await supabase
      .from('projects')
      .select('status');

    const projectStatusDistribution = {
      pending: 0,
      in_progress: 0,
      review: 0,
      completed: 0
    };

    projects?.forEach(project => {
      switch (project.status) {
        case 'pending':
          projectStatusDistribution.pending++;
          break;
        case 'in_progress':
          projectStatusDistribution.in_progress++;
          break;
        case 'review':
          projectStatusDistribution.review++;
          break;
        case 'completed':
          projectStatusDistribution.completed++;
          break;
      }
    });

    // Fetch revenue trends for the last 6 months
    const now = new Date();
    const revenueTrends = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('created_at', monthDate.toISOString())
        .lt('created_at', new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toISOString());

      const monthRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      
      revenueTrends.push({
        month: monthName,
        revenue: monthRevenue
      });
    }

    // Fetch client acquisition trends for the last 6 months
    const clientAcquisition = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .gte('created_at', monthDate.toISOString())
        .lt('created_at', new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toISOString());

      const newClients = clients?.length || 0;
      
      clientAcquisition.push({
        month: monthName,
        newClients
      });
    }

    const performanceData: PerformanceData = {
      projectStatusDistribution,
      revenueTrends,
      clientAcquisition
    };

    return NextResponse.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Admin performance API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching performance data' },
      { status: 500 }
    );
  }
}
