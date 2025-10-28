import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { ProjectStage } from '@/lib/project-stages';

// Define the Project interface with new unified stage system
interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStage;
  client_id: string;
  website_type: string;
  design_preferences: Record<string, unknown>;
  add_ons: Record<string, unknown>;
  domain_info: Record<string, unknown>;
  maintenance_plan: string;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const projectId = id;

    // Fetch the project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('client_id', user.id) // Ensure the project belongs to the authenticated user
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

    // Prepare the response
    const response = {
      success: true,
      message: 'Project retrieved successfully',
      project: project as Project
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Project detail API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving the project' },
      { status: 500 }
    );
  }
}
