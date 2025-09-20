import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define the Notification interface
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

interface Client {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "prospect";
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
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

    // Check if user is an admin
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (clientError || !clientData || clientData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build the query to get all notifications with client info
    let query = supabase
      .from('notifications')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          status
        )
      `, { count: 'exact' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Admin notifications fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving notifications' },
        { status: 500 }
      );
    }

    // Define the type for the joined data
    interface NotificationWithClient {
      id: string;
      client_id: string;
      title?: string;
      message: string;
      is_read: boolean;
      created_at: string;
      sent_at?: string;
      type?: string;
      clients: {
        id: string;
        name: string;
        email: string;
        status: "active" | "inactive" | "prospect";
      };
    }

    // Transform the data to match expected format
    const transformedNotifications = (data || []).map((item: NotificationWithClient) => {
      // Parse the message to extract title and content
      // Messages are stored as "Title: Content"
      const messageParts = item.message.split(': ');
      const title = messageParts.length > 1 ? messageParts[0] : 'System Notification';
      const message = messageParts.length > 1 ? messageParts.slice(1).join(': ') : item.message;
      
      return {
        id: item.id,
        title,
        message,
        recipientType: 'specific', // All notifications are client-specific
        recipients: [item.client_id],
        sentAt: item.sent_at || item.created_at,
        sentBy: 'System',
        status: item.is_read ? 'read' : 'sent',
        client: item.clients
      };
    });

    return NextResponse.json({
      success: true,
      message: data && data.length > 0 ? 'Notifications retrieved successfully' : 'No notifications found',
      notifications: transformedNotifications,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasNextPage: (count || 0) > offset + limit,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin notifications API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
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

    // Check if user is an admin
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (clientError || !clientData || clientData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { client_ids, title, message, type = 'system' } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!client_ids || !Array.isArray(client_ids) || client_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one client ID is required' },
        { status: 400 }
      );
    }

    // Create notifications for each client
    const notifications = client_ids.map((client_id: string) => ({
      client_id,
      message: `${title}: ${message}`, // Include title in the message since we don't have a title column
      is_read: false,
      created_at: new Date().toISOString()
    }));

    // Insert notifications
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Create notifications error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while creating notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent successfully to ${client_ids.length} client(s)`,
      notifications: data || [],
      count: data ? data.length : 0
    }, { status: 201 });

  } catch (error) {
    console.error('Create notifications API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating notifications' },
      { status: 500 }
    );
  }
}
