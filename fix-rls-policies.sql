-- Fix RLS policies for notifications table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL existing RLS policies on notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;

-- Step 2: Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new RLS policies using client_id
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (client_id = auth.uid());

-- Step 4: Service role policy (for admin operations)
CREATE POLICY "Service role can manage all notifications" ON notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Step 6: Test the policy by checking if the user can access their notifications
-- This should return notifications if the policies work correctly
SELECT 
    id, 
    client_id,
    title, 
    message, 
    is_read, 
    created_at
FROM notifications 
WHERE client_id = 'e0fc4666-b179-4173-a6d0-ad9f4e6b9235'
LIMIT 3;

-- Step 7: Test individual notification access (this should work now)
SELECT 
    id, 
    client_id,
    title, 
    message, 
    is_read, 
    created_at
FROM notifications 
WHERE id = 'e08d28b1-bff3-4eea-8d00-11497ab2e811'
AND client_id = 'e0fc4666-b179-4173-a6d0-ad9f4e6b9235';

-- Step 8: Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';
