-- Fix notifications table schema consistency
-- Run this SQL manually in your Supabase dashboard SQL editor

-- Step 1: Check current table structure and fix column names
DO $$
BEGIN
    -- Check if recipient_id exists and client_id doesn't, then rename
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'recipient_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN recipient_id TO client_id;
        RAISE NOTICE 'Renamed recipient_id to client_id';
    END IF;
END $$;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info',
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Notification',
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_method TEXT[] DEFAULT ARRAY['in_app'],
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Step 3: Add constraints if they don't exist
DO $$
BEGIN
    -- Add type constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_notification_type'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_type 
        CHECK (type IN ('info', 'warning', 'error', 'success', 'payment', 'project_update', 'support', 'system'));
    END IF;

    -- Add priority constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_notification_priority'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_notification_priority 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

-- Step 4: Update existing records with proper defaults
UPDATE notifications SET 
    type = COALESCE(type, 'info'),
    title = COALESCE(title, 'Notification'),
    is_delivered = COALESCE(is_delivered, false),
    delivery_method = COALESCE(delivery_method, ARRAY['in_app']),
    priority = COALESCE(priority, 'normal'),
    updated_at = COALESCE(updated_at, created_at)
WHERE type IS NULL OR title IS NULL OR is_delivered IS NULL OR delivery_method IS NULL OR priority IS NULL OR updated_at IS NULL;

-- Step 5: Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Step 6: Drop and recreate RLS policies
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

-- Step 7: Ensure trigger exists for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
