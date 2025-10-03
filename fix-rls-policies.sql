-- Fix RLS policies for notifications table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL existing RLS policies on notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications; -- Drop the new policy if it exists

-- Step 2: Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Create a single, consolidated RLS policy for users
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Step 4: Service role policy (for admin operations)
CREATE POLICY "Service role can manage all notifications" ON notifications
    FOR ALL TO service_role USING (auth.role() = 'service_role');

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
