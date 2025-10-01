import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabase = createServerClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Update all notifications for the user to mark as unread
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: false,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', user.id);

    if (error) {
      console.error('Mark all notifications as unread error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to mark all notifications as unread' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as unread successfully'
    });

  } catch (error) {
    console.error('Mark all notifications as unread API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while marking all notifications as unread' },
      { status: 500 }
    );
  }
}