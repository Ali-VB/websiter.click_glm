import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase';
import { realtime } from '@/lib/realtime';

// Define the Notification interfaces based on actual database schema
interface DatabaseNotification {
  id: string;
  client_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  sent_at: string;
  read: boolean;
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

    // Create authenticated server client
    const supabase = createServerClient(token);
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

    // Use the authenticated client (RLS policies will ensure user can only access their own notifications)

    // Build the query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('client_id', user.id);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query.order('created_at', { ascending: false });

    console.log('Notifications query result:', { data, error, count, userId: user.id });

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
      title: n.message.split(':')[0] || 'Notification', // Extract title from message
      message: n.message.includes(':') ? n.message.substring(n.message.indexOf(':') + 1).trim() : n.message,
      read: n.is_read, // Use read directly for client compatibility
      type: 'system',
      sent_at: n.created_at,
      is_read: n.is_read // Keep both for compatibility
    }));

    // Skip is_delivered logic since it doesn't exist in the current schema

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { client_id, message } = body;

    // Validate required fields
    if (!client_id || !message) {
      return NextResponse.json(
        { success: false, message: 'Client ID and message are required' },
        { status: 400 }
      );
    }

    // Use the authenticated client (RLS policies will ensure proper access control)

    // Check if user has permission to send notifications (admin or sending to self)
    if (client_id !== user.id) {
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
        client_id: client_id,
        message: message,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
    await realtime.sendNotification(client_id, {
      id: notification.id,
      recipient_id: notification.client_id,
      type: 'system',
      title: 'Notification',
      message: notification.message,
      is_read: notification.is_read,
      priority: 'normal'
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
