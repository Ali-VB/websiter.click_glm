import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define the Notification interfaces
interface DatabaseNotification {
  id: string;
  client_id: string;
  title?: string;
  message: string;
  is_read: boolean;
  read?: boolean;
  created_at: string;
  sent_at?: string;
  type?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  read: boolean;
  type: "system" | "project" | "invoice" | "support";
}

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Validate limit and offset
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, message: 'Offset must be a positive number' },
        { status: 400 }
      );
    }

    // Build the query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('client_id', user.id);

    // Apply unread filter if requested
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Notifications fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving notifications' },
        { status: 500 }
      );
    }

    // Transform to match expected interface
    const transformedNotifications = (data || []).map((n: DatabaseNotification) => {
      // Parse the message to extract title and content
      // Messages are stored as "Title: Content"
      const messageParts = n.message.split(': ');
      const title = messageParts.length > 1 ? messageParts[0] : 'System Notification';
      const message = messageParts.length > 1 ? messageParts.slice(1).join(': ') : n.message;
      
      return {
        id: n.id,
        title,
        message,
        sent_at: n.sent_at || n.created_at,
        read: n.read || n.is_read,
        type: 'system' as "system" | "project" | "invoice" | "support"
      };
    });

    // Prepare the response
    const response: {
      success: boolean;
      message: string;
      notifications: Notification[];
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasNextPage: boolean;
      };
    } = {
      success: true,
      message: data && data.length > 0 ? 'Notifications retrieved successfully' : 'No notifications found',
      notifications: transformedNotifications,
    };

    // Add pagination metadata if pagination parameters were provided
    if (searchParams.has('limit') || searchParams.has('offset')) {
      response.pagination = {
        total: count || 0,
        limit,
        offset,
        hasNextPage: (count || 0) > offset + limit,
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving notifications' },
      { status: 500 }
    );
  }
}
