import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch clients with their related projects (remove notes relationship to avoid errors)
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects (
          id,
          name,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      status: client.status,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
      projects: client.projects || [],
      notes: [] // Empty notes array to avoid errors
    }));

    // Fetch contact submissions
    const { data: contactSubmissions, error: contactError } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (contactError) {
      console.error('Error fetching contact submissions:', contactError);
    }

    const transformedContactSubmissions = (contactSubmissions || []).map(submission => ({
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      message: submission.message,
      createdAt: submission.created_at,
      status: submission.status
    }));

    return NextResponse.json({
      success: true,
      clients: transformedClients,
      contactSubmissions: transformedContactSubmissions
    });
  } catch (error) {
    console.error('Admin clients API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching clients' },
      { status: 500 }
    );
  }
}
