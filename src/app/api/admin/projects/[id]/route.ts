import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define the Project interface with new unified stage system
interface Project {
  id: string;
  client_id: string;
  name?: string;
  description?: string;
  status: "submitted" | "reviewing" | "invoice_sent" | "payment_pending" | "in_progress" | "review_needed" | "completed";
  website_type: string;
  design_preferences?: Record<string, unknown>;
  add_ons?: Record<string, unknown>;
  domain_info?: Record<string, unknown>;
  maintenance_plan?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/projects/[id] - Get a specific project (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
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

    // Check if user is admin (you might want to implement a more robust admin check)
    const { data: adminUser } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const projectId = id;

    // Fetch the project with client information
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients!fk_projects_client_id (
          name,
          email
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Project fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedProject: Project = {
      id: project.id,
      client_id: project.client_id,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      status: project.status,
      website_type: project.website_type,
      design_preferences: project.design_preferences || {},
      add_ons: project.add_ons || {},
      domain_info: project.domain_info || {},
      maintenance_plan: project.maintenance_plan || '',
      deadline: project.deadline,
      created_at: project.created_at,
      updated_at: project.updated_at
    };

    // Prepare the response with client info
    const response = {
      success: true,
      message: 'Project retrieved successfully',
      project: {
        ...transformedProject,
        clientName: project.clients?.name || 'Unknown Client',
        clientEmail: project.clients?.email || 'unknown@example.com'
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Admin project detail API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving the project' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/projects/[id] - Update a project (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
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

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const projectId = id;
    const body = await request.json();

    // Validate the request body
    const allowedFields = ['name', 'description', 'status', 'deadline', 'design_preferences', 'add_ons', 'domain_info', 'maintenance_plan'];
    const validStatuses = ['submitted', 'reviewing', 'invoice_sent', 'payment_pending', 'in_progress', 'review_needed', 'completed'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Additional validation for status field
        if (field === 'status' && !validStatuses.includes(body[field])) {
          return NextResponse.json(
            { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the project
    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Project update error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update project' },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project
    }, { status: 200 });

  } catch (error) {
    console.error('Admin project update API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating the project' },
      { status: 500 }
    );
  }
}
