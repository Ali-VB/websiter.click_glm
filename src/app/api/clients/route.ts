import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with bearer token
    const supabaseClient = createServerClient(token);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (clientError || !clientData || clientData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users that are not admins
    const { data, error } = await supabaseClient
      .from('clients')
      .select('id, name, email, status')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while fetching clients.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Clients retrieved successfully.',
        clients: data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Clients API route error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}