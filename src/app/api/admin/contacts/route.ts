import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: "new" | "responded" | "archived";
  source: "contact_form" | "email" | "phone" | "other";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  notes?: string;
  response?: {
    content: string;
    respondedAt: string;
    respondedBy: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();
    const body = await request.json();
    const { id, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Contact submission ID is required' },
        { status: 400 }
      );
    }

    // Update the contact submission with the new note
    const { error } = await supabase
      .from('contact_submissions')
      .update({ 
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating contact submission:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update contact submission' },
        { status: 500 }
      );
    }

    // For development with mock data, we'll just return success
    // In production, this would actually update the database
    return NextResponse.json({
      success: true,
      message: 'Note saved successfully'
    });
  } catch (error) {
    console.error('Admin contacts API PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating contact submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch contact submissions
    const { data: submissions, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact submissions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch contact submissions' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedSubmissions: ContactSubmission[] = (submissions || []).map(submission => ({
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      company: submission.company,
      message: submission.message,
      status: submission.status,
      source: submission.source,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at,
      assignedTo: submission.assigned_to,
      notes: submission.notes,
      response: submission.response ? {
        content: submission.response.content,
        respondedAt: submission.response.responded_at,
        respondedBy: submission.response.responded_by
      } : undefined
    }));

    // Fetch team members for assignment
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*');

    if (teamError) {
      console.error('Error fetching team members:', teamError);
    }

    const transformedTeamMembers: TeamMember[] = (teamMembers || []).map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role
    }));

    return NextResponse.json({
      success: true,
      submissions: transformedSubmissions,
      teamMembers: transformedTeamMembers
    });
  } catch (error) {
    console.error('Admin contacts API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching contact submissions' },
      { status: 500 }
    );
  }
}
