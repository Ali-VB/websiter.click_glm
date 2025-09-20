import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface ProjectRequirement {
  basePackage: string;
  addons: string[];
  designStyle: string;
  colorScheme: string;
  layoutPreference: string;
  domain: string;
  hosting: string;
  maintenance: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch projects with client information
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedProjects = projects.map(project => {
      const client = project.clients as { id: string; name: string; email: string } | null;
      const requirements = project.requirements as ProjectRequirement || {
        basePackage: '',
        addons: [],
        designStyle: '',
        colorScheme: '',
        layoutPreference: '',
        domain: '',
        hosting: '',
        maintenance: ''
      };

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        clientName: client?.name || 'Unknown Client',
        clientEmail: client?.email || 'unknown@example.com',
        status: project.status,
        type: project.type,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        deadline: project.deadline,
        requirements,
        assets: [] // Assets would need to be fetched separately or added to the query
      };
    });

    return NextResponse.json({
      success: true,
      projects: transformedProjects
    });
  } catch (error) {
    console.error('Admin projects API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching projects' },
      { status: 500 }
    );
  }
}
