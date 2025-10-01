-- Migration: 013_fix_notifications_table.sql
-- Description: Fix notifications table to match API expectations

-- ============================================
-- NOTIFICATIONS TABLE ENHANCEMENTS
-- ============================================

-- Add missing columns to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS recipient_id UUID NOT NULL,
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'project_update', 'invoice', 'support', 'marketing')),
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Rename client_id to old_client_id temporarily for data migration
ALTER TABLE notifications RENAME COLUMN client_id TO old_client_id;

-- Update recipient_id with data from old_client_id
UPDATE notifications SET recipient_id = old_client_id WHERE recipient_id IS NULL;

-- Drop the old client_id column
ALTER TABLE notifications DROP COLUMN old_client_id;

-- Add foreign key constraint for recipient_id
ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_recipient_id 
FOREIGN KEY (recipient_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_delivered ON notifications(is_delivered);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

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
