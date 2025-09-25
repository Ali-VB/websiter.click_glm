import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { realtime } from '@/lib/realtime';

// Define the Project interface
interface Project {
  id: string;
  name?: string;
  description?: string;
  status: string;
  website_type: string;
  design_preferences?: Record<string, unknown>;
  add_ons?: Record<string, unknown>;
  domain_info?: Record<string, unknown>;
  maintenance_plan?: string;
  client_id: string;
  progress_percentage?: number;
  last_activity_at?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  budget?: number;
  time_spent?: number;
  priority?: string;
  assigned_to?: string;
  tags?: string[];
  payment_status?: string;
  development_start_date?: string;
  payment_confirmed_at?: string;
  invoice_required?: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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
    const paymentStatus = searchParams.get('payment_status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');

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
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('client_id', user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Projects fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving projects' },
        { status: 500 }
      );
    }

    // Prepare the response
    const response: {
      success: boolean;
      message: string;
      projects: Project[];
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasNextPage: boolean;
      };
    } = {
      success: true,
      message: data && data.length > 0 ? 'Projects retrieved successfully' : 'No projects found',
      projects: data || [],
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
    console.error('Projects API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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

    const body = await request.json();
    const {
      name,
      description,
      status,
      website_type,
      design_preferences,
      add_ons,
      domain_info,
      maintenance_plan,
      progress_percentage,
      estimated_completion_date,
      budget,
      priority
    } = body;

    // Validate required fields
    if (!status || !website_type) {
      return NextResponse.json(
        { success: false, message: 'Status and website type are required' },
        { status: 400 }
      );
    }

    // Create the project
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        client_id: user.id,
        name,
        description,
        status,
        website_type,
        design_preferences: design_preferences || {},
        add_ons: add_ons || {},
        domain_info: domain_info || {},
        maintenance_plan,
        progress_percentage: progress_percentage || 0,
        estimated_completion_date,
        budget,
        priority: priority || 'medium',
        payment_status: 'pending',
        invoice_required: true,
        last_activity_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Project creation error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Send real-time project update
    await realtime.sendProjectUpdate(user.id, {
      id: project.id,
      client_id: project.client_id,
      status: project.status,
      progress_percentage: project.progress_percentage,
      last_activity_at: project.last_activity_at
    });

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project
    }, { status: 201 });

  } catch (error) {
    console.error('Projects API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating project' },
      { status: 500 }
    );
  }
}
