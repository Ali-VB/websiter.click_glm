import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Create authenticated Supabase client
    const supabase = createServerClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Marking notification as unread:', { id, userId: user.id });

    // Update notification to mark as unread
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', user.id)
      .select();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Mark notification as unread error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to mark notification as unread' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('No notification found or access denied for:', { id, userId: user.id });
      return NextResponse.json(
        { success: false, message: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as unread successfully'
    });

  } catch (error) {
    console.error('Mark notification as unread API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while marking notification as unread' },
      { status: 500 }
    );
  }
}