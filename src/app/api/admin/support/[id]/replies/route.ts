import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get the reply data from the request body
    const { message, isInternal } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check if the ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("id", params.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Add the reply
    const { data: reply, error } = await supabase
      .from("support_ticket_replies")
      .insert({
        ticket_id: params.id,
        author_id: user.id,
        message,
        is_internal: isInternal || false
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding reply to support ticket:", error);
      return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
    }

    // If this is not an internal reply, update the ticket status to "in_progress"
    if (!isInternal) {
      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString()
        })
        .eq("id", params.id);

      if (updateError) {
        console.error("Error updating ticket status:", updateError);
        // We don't return an error here since the reply was added successfully
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Unexpected error in add reply API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}