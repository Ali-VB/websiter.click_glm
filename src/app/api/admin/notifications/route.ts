import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

// Define the Notification interface based on current database schema (before migration 013)
interface DatabaseNotification {
  id: string;
  client_id: string; // Current database uses client_id, not recipient_id
  message: string;
  is_read: boolean; // Current database uses is_read, not is_delivered
  created_at: string;
  // These columns might not exist yet in current database
  sender_id?: string | null;
  type?: string;
  title?: string;
  data?: Record<string, unknown> | null;
  priority?: string;
  expires_at?: string | null;
  updated_at?: string;
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

    // Create Supabase client with bearer token
    const supabaseClient = createServerClient(token);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const { data: clientData, error: clientError } = await supabaseClient
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
    const clientId = searchParams.get('clientId'); // Optional client filter

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
    // Use service role client to bypass RLS for admin view of all notifications
    const supabase = createServiceRoleClient();

    // Build the base query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' });

    // Add client filter if specified
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Execute the query with pagination and ordering
    const { data: notificationsData, error: notificationsError, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (notificationsError) {
      console.error('Admin notifications fetch error:', notificationsError);
      return NextResponse.json(
        { success: false, message: 'An error occurred while retrieving notifications' },
        { status: 500 }
      );
    }

    // If we have notifications, fetch the related client information
    let data = notificationsData;
    if (notificationsData && notificationsData.length > 0) {
      // Get all unique client IDs (current database uses client_id)
      const clientIds = [...new Set(notificationsData.map(n => n.client_id).filter(Boolean))];

      // Fetch client information
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, email, status')
        .in('id', clientIds);

      // Combine the data - map client_id to client info
      data = notificationsData.map(notification => ({
        ...notification,
        clients: clientsData?.find(c => c.id === notification.client_id) || null,
        senders: null // No sender info in current database schema
      }));
    }

  
    // Define the type for the joined data (current database schema)
    interface NotificationWithClient {
      id: string;
      client_id: string; // Current database uses client_id
      message: string;
      is_read: boolean; // Current database uses is_read
      created_at: string;
      // These might be null or undefined in current database
      sender_id?: string | null;
      type?: string;
      title?: string;
      data?: Record<string, any> | null;
      priority?: string;
      expires_at?: string | null;
      updated_at?: string;
      clients: {
        id: string;
        name: string;
        email: string;
        status: "active" | "inactive" | "prospect";
      };
      senders: null; // No sender info in current database schema
    }

    // Transform the data to match expected format
    const transformedNotifications = (data || []).map((item: NotificationWithClient) => {
      // Extract title from message if title field doesn't exist
      const title = item.title || item.message.split(':')[0] || 'Notification';
      const message = item.title && item.message.includes(':')
        ? item.message.substring(item.message.indexOf(':') + 1).trim()
        : item.message;

      return {
        id: item.id,
        title: title,
        message: message,
        recipientType: 'specific', // All notifications are client-specific
        recipients: [item.client_id], // Use client_id for current database schema
        sentAt: item.created_at,
        sentBy: 'System', // No sender info in current database schema
        status: item.is_read ? 'read' : 'sent', // Use is_read instead of is_delivered
        type: item.type || 'system', // Default to system if type doesn't exist
        priority: item.priority || 'normal', // Default to normal if priority doesn't exist
        client: item.clients,
        sender: null // No sender info in current database schema
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

export async function DELETE(request: NextRequest) {
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

    // Create Supabase client with bearer token
    const supabaseClient = createServerClient(token);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const { data: clientData, error: clientError } = await supabaseClient
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

    // Use service role client to bypass RLS for admin operations
    const serviceSupabase = createServiceRoleClient();

    // Delete all notifications
    const { error } = await serviceSupabase
      .from('notifications')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (gte with minimum UUID matches all)

    if (error) {
      console.error('Delete all notifications error:', error);
      return NextResponse.json(
        { success: false, message: 'An error occurred while deleting notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications deleted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Delete all notifications API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting notifications' },
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

    // Create Supabase client with bearer token
    const supabaseClient = createServerClient(token);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const { data: clientData, error: clientError } = await supabaseClient
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

    // Get the current admin user ID to use as sender_id
    const senderId = user.id;

    // Create notifications for each client
    // Use current database schema (client_id, is_read) for compatibility
    const notifications = client_ids.map((client_id: string) => ({
      client_id: client_id, // Current database uses client_id
      message: `${title}: ${message}`, // Combine title and message since only message field exists
      is_read: false, // Current database uses is_read
      created_at: new Date().toISOString()
    }));

    // Insert notifications using service role to bypass RLS
    const serviceSupabase = createServiceRoleClient();
    const { data, error } = await serviceSupabase
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

    // Send real-time notifications to each client
    const { realtime } = await import('@/lib/realtime');
    for (const client_id of client_ids) {
      try {
        await realtime.sendNotification(client_id, {
          id: data?.find(n => n.client_id === client_id)?.id || '',
          recipient_id: client_id, // Use client_id for current database schema
          type: type,
          title: title,
          message: message,
          is_read: false,
          priority: 'normal'
        });
      } catch (error) {
        console.error(`Failed to send real-time notification to ${client_id}:`, error);
      }
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
