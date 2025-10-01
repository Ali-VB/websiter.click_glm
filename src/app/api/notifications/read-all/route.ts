import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Mark all as read API called');

    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('Token extracted successfully');

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('User authentication result:', { user: !!user, error: authError });

    if (authError || !user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated, ID:', user.id);
    console.log('Marking all notifications as read for user:', user.id);

    console.log('🔍 Checking existing notifications before update...');

    // First, let's check what notifications exist and their current state
    const { data: existingNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id, is_read, client_id')
      .eq('client_id', user.id);

    console.log('Existing notifications check:', {
      existingNotifications,
      error: checkError,
      count: existingNotifications?.length,
      userId: user.id
    });

    // Mark all notifications as read for the user
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', user.id)
      .eq('is_read', false) // Only update unread notifications
      .select();

    console.log('Update result:', { data, error, updatedCount: data?.length });

    if (error) {
      console.error('Mark all notifications as read error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while marking all notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read successfully',
      count: data ? data.length : 0,
      notifications: data || []
    }, { status: 200 });

  } catch (error) {
    console.error('Mark all notifications as read API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while marking all notifications as read' },
      { status: 500 }
    );
  }
}
