import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const notificationId = id;

    console.log('Marking notification as read:', { notificationId, userId: user.id });

    // First, let's check what's actually in the notification
    const { data: notificationData, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    console.log('Notification data from DB:', { notificationData, fetchError });

    if (fetchError || !notificationData) {
      console.log('Notification not found in database');
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    console.log('User ID comparison:', {
      notificationClientId: notificationData.client_id,
      currentUserId: user.id,
      match: notificationData.client_id === user.id
    });

    // Update the notification to mark it as read
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('client_id', user.id)
      .select();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Mark notification as read error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while marking notification as read' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('No notification found or access denied for:', { notificationId, userId: user.id });
      return NextResponse.json(
        { success: false, message: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read successfully',
      notification: data[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Mark notification as read API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while marking notification as read' },
      { status: 500 }
    );
  }
}
