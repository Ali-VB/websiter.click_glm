import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/tax';

// Type for tax details
interface TaxDetails {
  provinceCode?: string;
  taxType?: string;
  taxRate?: number;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Validate limit and offset
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, message: 'Offset must be a positive number' },
        { status: 400 }
      );
    }

    // Build the query
    let query = supabase
      .from('invoices')
      .select(`
        id,
        project_id,
        projects(name),
        status,
        total_amount,
        tax_amount,
        tax_details,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('projects.client_id', user.id);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Invoices fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving invoices' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const invoices = data?.map(invoice => {
      const projects = invoice.projects as { name: string }[] | null;
      const taxDetails = invoice.tax_details as TaxDetails || {};
      
      // Calculate subtotal (total amount - tax amount)
      const subtotal = invoice.total_amount - (invoice.tax_amount || 0);
      
      return {
        id: invoice.id,
        projectId: invoice.project_id,
        projectName: projects?.[0]?.name || 'Unknown Project',
        subtotal,
        taxAmount: invoice.tax_amount || 0,
        totalAmount: invoice.total_amount,
        currency: 'CAD',
        status: invoice.status,
        taxDetails,
        dueDate: invoice.created_at, // Using created_at as dueDate for now
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at || invoice.created_at,
        formattedSubtotal: formatCurrency(subtotal),
        formattedTaxAmount: formatCurrency(invoice.tax_amount || 0),
        formattedTotalAmount: formatCurrency(invoice.total_amount),
      };
    }) || [];

    // Prepare the response
    const response: {
      success: boolean;
      message: string;
      invoices: Array<{
        id: string;
        projectId: string;
        projectName: string;
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        currency: string;
        status: string;
        taxDetails: TaxDetails;
        dueDate: string;
        createdAt: string;
        updatedAt: string;
        formattedSubtotal: string;
        formattedTaxAmount: string;
        formattedTotalAmount: string;
      }>;
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasNextPage: boolean;
      };
    } = {
      success: true,
      message: invoices.length > 0 ? 'Invoices retrieved successfully' : 'No invoices found',
      invoices,
    };

    // Add pagination metadata if pagination parameters were provided
    if (searchParams.has('limit') || searchParams.has('offset')) {
      response.pagination = {
        total: count || 0,
        limit,
        offset,
        hasNextPage: (count || 0) > offset + limit,
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving invoices' },
      { status: 500 }
    );
  }
}