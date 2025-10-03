-- Migration: 018_fix_notifications_schema_consistency.sql
-- Description: Fix notifications table schema consistency between migrations

-- The issue: Migration 009 created notifications with recipient_id, but migration 015 tried to use client_id
-- We need to ensure the table structure is consistent

-- First, let's check if recipient_id column exists and client_id doesn't
DO $$
BEGIN
    -- Check if recipient_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'recipient_id'
    ) THEN
        -- Check if client_id doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'client_id'
        ) THEN
            -- Rename recipient_id to client_id for consistency
            ALTER TABLE notifications RENAME COLUMN recipient_id TO client_id;
            RAISE NOTICE 'Renamed recipient_id to client_id in notifications table';
        END IF;
    END IF;
END $$;

-- Ensure all required columns exist
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'info';
        ALTER TABLE notifications ADD CONSTRAINT check_notification_type 
            CHECK (type IN ('info', 'warning', 'error', 'success', 'payment', 'project_update', 'support', 'system'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'title'
    ) THEN
        ALTER TABLE notifications ADD COLUMN title TEXT NOT NULL DEFAULT 'Notification';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN sender_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'data'
    ) THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_delivered'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_delivered BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'delivery_method'
    ) THEN
        ALTER TABLE notifications ADD COLUMN delivery_method TEXT[] DEFAULT ARRAY['in_app'];
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
        ALTER TABLE notifications ADD CONSTRAINT check_notification_priority 
            CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
END $$;

-- Update existing notifications to have proper default values
UPDATE notifications SET 
    type = COALESCE(type, 'info'),
    title = COALESCE(title, 'Notification'),
    is_delivered = COALESCE(is_delivered, false),
    delivery_method = COALESCE(delivery_method, ARRAY['in_app']),
    priority = COALESCE(priority, 'normal'),
    updated_at = COALESCE(updated_at, created_at)
WHERE type IS NULL OR title IS NULL OR is_delivered IS NULL OR delivery_method IS NULL OR priority IS NULL OR updated_at IS NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Drop existing RLS policies to recreate them correctly
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

-- Ensure trigger exists for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
