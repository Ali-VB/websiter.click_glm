import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireAdminFromToken } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch support tickets with client information
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        client:clients(id, name, email),
        project:projects(id, name),
        replies:support_ticket_replies(
          id,
          message,
          created_at,
          author_id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching support tickets:", error);
      return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
    }

    // Fetch team members (for assignment)
    const { data: teamMembers, error: teamError } = await supabase
      .from("team_members")
      .select("*");

    if (teamError) {
      console.error("Error fetching team members:", error);
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }

    // Manually fetch author details for replies to avoid foreign key issues
    if (tickets) {
      for (const ticket of tickets) {
        if (ticket.replies) {
          for (const reply of ticket.replies) {
            const { data: author } = await supabase
              .from("clients")
              .select("id, name, email")
              .eq("id", reply.author_id)
              .single();
            
            reply.author = author;
          }
        }
      }
    }

    return NextResponse.json({
      tickets: tickets || [],
      teamMembers: teamMembers || []
    });
  } catch (error) {
    console.error("Unexpected error in support tickets API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Get the ticket data from the request body
    const { clientId, projectId, subject, description, priority, category } = await request.json();

    if (!clientId || !subject || !description || !priority || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the support ticket
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        client_id: clientId,
        project_id: projectId || null,
        status: "open",
        priority,
        category,
        subject
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating support ticket:", error);
      return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
    }

    // Add the initial message as a reply
    const { data: reply, error: replyError } = await supabase
      .from("support_ticket_replies")
      .insert({
        ticket_id: ticket.id,
        author_id: clientId,
        message: description
      })
      .select()
      .single();

    if (replyError) {
      console.error("Error creating initial reply:", replyError);
      // We don't return an error here since the ticket was created successfully
    }

    return NextResponse.json({ ticket, reply });
  } catch (error) {
    console.error("Unexpected error in create support ticket API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
