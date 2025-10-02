-- Migration: 016_add_support_tickets_rls.sql
-- Description: Add RLS policies for support_tickets table

-- Enable RLS on support_tickets if not already enabled
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can create their own support tickets" ON support_tickets
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all support tickets" ON support_tickets
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = auth.uid()
        AND clients.role = 'admin'
    ));

-- RLS for support_ticket_replies
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies to their own tickets" ON support_ticket_replies
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM support_tickets
        WHERE support_tickets.id = support_ticket_replies.ticket_id
        AND support_tickets.client_id = auth.uid()
    ));

CREATE POLICY "Users can create replies to their own tickets" ON support_ticket_replies
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM support_tickets
        WHERE support_tickets.id = support_ticket_replies.ticket_id
        AND support_tickets.client_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all ticket replies" ON support_ticket_replies
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = auth.uid()
        AND clients.role = 'admin'
    ));