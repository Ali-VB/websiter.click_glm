import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    // Mark all unread notifications as read for the user
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('client_id', user.id)
      .eq('is_read', false)
      .select();

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
