import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define the Project interface
interface Project {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  client_id: string;
  created_at: string;
  updated_at: string;
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
      .from('projects')
     .select('*', { count: 'exact' })
      .eq('client_id', user.id);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

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