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

    // Get the client ID from the user metadata or email
    // This assumes you have a way to link the auth user to a client record
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", user.email)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch support tickets for this client
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        project:projects(id, name),
        replies:support_ticket_replies(
          *,
          author:clients(id, name, email)
        )
      `)
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching support tickets:", error);
      console.error("DEBUG: The API is trying to access author:clients(id, name, email) but there's no foreign key relationship");
      console.error("DEBUG: support_ticket_replies.author_id should reference clients.id but the foreign key constraint is missing");
      console.error("DEBUG: Current support_ticket_replies schema has author_id without a foreign key to clients table");
      return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets || [] });
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

    // Get the client ID from the user metadata or email
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", user.email)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get the ticket data from the request body
    const { projectId, subject, description, priority, category } = await request.json();

    if (!subject || !description || !priority || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the support ticket
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        client_id: client.id,
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
        author_id: client.id,
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