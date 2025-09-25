import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { realtime } from '@/lib/realtime';

// Define the Notification interfaces
interface DatabaseNotification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  is_delivered: boolean;
  delivery_method: string[];
  priority?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  is_delivered: boolean;
  priority?: string;
  created_at: string;
  expires_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

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
      .eq('recipient_id', user.id);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

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
    const transformedNotifications = (data || []).map((n: DatabaseNotification) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      is_read: n.is_read,
      is_delivered: n.is_delivered,
      priority: n.priority,
      created_at: n.created_at,
      expires_at: n.expires_at
    }));

    // Mark notifications as delivered when fetched
    if (data && data.length > 0) {
      const undeliveredNotifications = data.filter(n => !n.is_delivered);
      if (undeliveredNotifications.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_delivered: true })
          .in('id', undeliveredNotifications.map(n => n.id));
      }
    }

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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

    const body = await request.json();
    const { recipient_id, type, title, message, data, priority } = body;

    // Validate required fields
    if (!recipient_id || !type || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Recipient ID, type, title, and message are required' },
        { status: 400 }
      );
    }

    // Check if user has permission to send notifications (admin or sending to self)
    if (recipient_id !== user.id) {
      const { data: currentUser } = await supabase
        .from('clients')
        .select('role')
        .eq('id', user.id)
        .single();

      if (currentUser?.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    // Create the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id,
        sender_id: user.id,
        type,
        title,
        message,
        data: data || {},
        priority: priority || 'normal',
        delivery_method: ['in_app'],
        is_delivered: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Notification creation error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create notification' },
        { status: 500 }
      );
    }

    // Send real-time notification
    await realtime.sendNotification(recipient_id, {
      id: notification.id,
      recipient_id: notification.recipient_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      is_read: notification.is_read,
      priority: notification.priority
    });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification
    }, { status: 201 });

  } catch (error) {
    console.error('Notifications API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating notification' },
      { status: 500 }
    );
  }
}
