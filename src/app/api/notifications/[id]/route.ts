import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

    const notificationId = id;

    console.log('Deleting notification:', { notificationId, userId: user.id });

    // Delete the notification (RLS policy will ensure user can only delete their own)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

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
