import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create authenticated server client
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    console.log('Deleting all notifications for user:', user.id);

    // Delete all notifications for the user (RLS policy will ensure user can only delete their own)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('client_id', user.id);

    if (error) {
      console.error('Delete all notifications error:', error);
      return NextResponse.json({ success: false, message: 'An error occurred while deleting notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'All notifications deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Delete all notifications API error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 });
  }
}
