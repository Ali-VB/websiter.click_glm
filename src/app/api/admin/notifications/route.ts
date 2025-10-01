import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

// Define the Notification interface based on actual database schema
interface DatabaseNotification {
  id: string;
  client_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
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
    const supabase = createServerClient();
    let query = supabase
      .from('notifications')
      .select(`
        *,
        clients!fk_notifications_client_id(id, name, email, status)
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
      message: string;
      is_read: boolean;
      created_at: string;
      updated_at: string;
      clients: {
        id: string;
        name: string;
        email: string;
        status: "active" | "inactive" | "prospect";
      };
    }

    // Transform the data to match expected format
    const transformedNotifications = (data || []).map((item: NotificationWithClient) => {
      return {
        id: item.id,
        title: 'Notification', // Default title since it doesn't exist in DB
        message: item.message,
        recipientType: 'specific', // All notifications are client-specific
        recipients: [item.client_id],
        sentAt: item.created_at,
        sentBy: 'System', // Default since sender_id doesn't exist
        status: item.is_read ? 'read' : 'sent',
        type: 'system', // Default type since it doesn't exist in DB
        priority: 'normal', // Default priority since it doesn't exist in DB
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

    // Create notifications for each client
    const notifications = client_ids.map((client_id: string) => ({
      client_id: client_id, // Use client_id as per actual database schema
      message: `${title}: ${message}`, // Combine title and message since only message field exists
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
          recipient_id: client_id,
          type: 'system',
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
