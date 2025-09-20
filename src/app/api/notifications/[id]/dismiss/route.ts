import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const notificationId = params.id;

    // Delete the notification (only if it belongs to the user)
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('client_id', user.id)
      .select();

    if (error) {
      console.error('Dismiss notification error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while dismissing notification' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification dismissed successfully',
      notification: data[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Dismiss notification API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while dismissing notification' },
      { status: 500 }
    );
  }
}
