import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
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

    console.log('Deleting notification:', { notificationId, userId: user.id });

    // First, check if the notification exists and belongs to the user
    const { data: notificationData, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !notificationData) {
      console.log('Notification not found or access denied');
      return NextResponse.json(
        { success: false, message: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('client_id', user.id);

    if (error) {
      console.error('Delete notification error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while deleting notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete notification API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting notification' },
      { status: 500 }
    );
  }
}
