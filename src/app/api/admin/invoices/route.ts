import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';
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
    // Use standardized authentication
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

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

    // Build the query - fix the relationship issue
    let query = supabase
      .from('invoices')
      .select(`
        id,
        project_id,
        projects(name, client_id),
        status,
        total_amount,
        tax_amount,
        tax_details,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply client filter if provided
    if (clientId) {
      query = query.eq('projects.client_id', clientId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Admin invoices fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving invoices' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const invoices = data?.map(invoice => {
      const projects = invoice.projects as { name: string; client_id: string }[] | null;
      const taxDetails = invoice.tax_details as TaxDetails || {};
      
      // Calculate subtotal (total amount - tax amount)
      const subtotal = invoice.total_amount - (invoice.tax_amount || 0);
      
      return {
        id: invoice.id,
        projectId: invoice.project_id,
        projectName: projects?.[0]?.name || 'Unknown Project',
        clientName: 'Unknown Client', // Will need to fetch client data separately
        clientEmail: 'unknown@example.com',
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

    // If we have invoices, fetch client information separately
    if (invoices.length > 0) {
      const projectIds = invoices
        .filter(invoice => invoice.projectId)
        .map(invoice => invoice.projectId);

      if (projectIds.length > 0) {
        const { data: projectClients } = await supabase
          .from('projects')
          .select('id, client_id, clients(name, email)')
          .in('id', projectIds);

        if (projectClients) {
          const clientMap = new Map();
          projectClients.forEach(pc => {
            const clients = pc.clients as { name: string; email: string }[] | null;
            if (clients && clients.length > 0) {
              clientMap.set(pc.id, {
                name: clients[0].name,
                email: clients[0].email
              });
            }
          });

          invoices.forEach(invoice => {
            if (invoice.projectId && clientMap.has(invoice.projectId)) {
              const client = clientMap.get(invoice.projectId);
              if (client) {
                invoice.clientName = client.name;
                invoice.clientEmail = client.email;
              }
            }
          });
        }
      }
    }

    // Prepare the response
    const response: {
      success: boolean;
      message: string;
      invoices: Array<{
        id: string;
        projectId: string;
        projectName: string;
        clientName: string;
        clientEmail: string;
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
    console.error('Admin invoices API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving invoices' },
      { status: 500 }
    );
  }
}
