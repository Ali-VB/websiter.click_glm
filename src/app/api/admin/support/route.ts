import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Get the auth token from the request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Check if the user is an admin (you might need to implement a role system)
    // For now, we'll assume any authenticated user can access this
    // In a real implementation, you would check for admin role

    // Fetch support tickets with client information
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        client:clients(id, name, email),
        project:projects(id, name),
        replies:support_ticket_replies(
          *,
          author:clients(id, name, email)
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

    return NextResponse.json({
      tickets: tickets || [],
      teamMembers: teamMembers || []
    });
  } catch (error) {
    console.error("Unexpected error in support tickets API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Get the auth token from the request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

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