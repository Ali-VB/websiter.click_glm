import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

    // Create authenticated server client
    const supabase = createServerClient(token);

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Marking all notifications as read for user:', user.id);

    // Update all notifications for the user to is_read = true (RLS policy will ensure user can only update their own)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('client_id', user.id);

    if (error) {
      console.error('Mark all notifications as read error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while marking notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Mark all notifications as read API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while marking notifications as read' },
      { status: 500 }
    );
  }
}
