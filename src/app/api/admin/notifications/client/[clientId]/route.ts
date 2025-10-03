import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params;

    // Validate clientId
    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid client ID is required' },
        { status: 400 }
      );
    }

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

    // Check if user is an admin
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

    // Verify the target client exists
    const { data: targetClient, error: targetClientError } = await supabaseClient
      .from('clients')
      .select('id, name, email')
      .eq('id', clientId)
      .single();

    if (targetClientError || !targetClient) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      );
    }

    // Use service role client to bypass RLS for admin operations
    const serviceSupabase = createServiceRoleClient();

    // Delete all notifications for the specific client
    const { error, count } = await serviceSupabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('client_id', clientId);

    if (error) {
      console.error('Delete client notifications error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while deleting notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count || 0} notifications for ${targetClient.name}`,
      deletedCount: count || 0,
      client: {
        id: targetClient.id,
        name: targetClient.name,
        email: targetClient.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Delete client notifications API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting notifications' },
      { status: 500 }
    );
  }
}
