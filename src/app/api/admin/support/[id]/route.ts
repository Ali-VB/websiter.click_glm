import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Fetch the ticket with all related data
    const { data: ticket, error } = await supabase
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
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching support ticket:", error);
      return NextResponse.json({ error: "Failed to fetch support ticket" }, { status: 500 });
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Unexpected error in support ticket API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get the update data from the request body
    const { status, assignedTo } = await request.json();

    // Update the ticket
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .update({
        status: status || undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating support ticket:", error);
      return NextResponse.json({ error: "Failed to update support ticket" }, { status: 500 });
    }

    // If assignedTo is provided, create or update an assignment record
    if (assignedTo !== undefined) {
      // This assumes you have a ticket_assignments table
      // You might need to adjust this based on your actual schema
      const { error: assignmentError } = await supabase
        .from("ticket_assignments")
        .upsert({
          ticket_id: id,
          assigned_to: assignedTo,
          assigned_by: user.id,
          assigned_at: new Date().toISOString()
        });

      if (assignmentError) {
        console.error("Error updating ticket assignment:", assignmentError);
        // We don't return an error here since the ticket was updated successfully
      }
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Unexpected error in update support ticket API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
