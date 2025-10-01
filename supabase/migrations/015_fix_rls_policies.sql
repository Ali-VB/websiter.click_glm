-- Migration: 015_fix_rls_policies.sql
-- Description: Fix RLS policies to use client_id instead of recipient_id

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- Create corrected RLS policies using client_id
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = auth.uid()
        AND clients.role = 'admin'
    ));

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;