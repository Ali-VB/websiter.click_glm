-- Diagnostic script to check notifications table structure and data
-- Run this in your Supabase SQL Editor to debug the issue

-- Step 1: Check if notifications table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Step 2: Check if there are any notifications in the table
SELECT COUNT(*) as total_notifications FROM notifications;

-- Step 3: Show sample notifications data (if any)
SELECT 
    id, 
    client_id,
    recipient_id,
    title, 
    message, 
    is_read, 
    type,
    created_at
FROM notifications 
LIMIT 5;

-- Step 4: Check RLS policies on notifications table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- Step 5: Check if the user ID from the logs exists in clients table
-- Replace 'e0fc4666-b179-4173-a6d0-ad9f4e6b9235' with the actual user ID
SELECT 
    id, 
    email, 
    name, 
    role,
    created_at
FROM clients 
WHERE id = 'e0fc4666-b179-4173-a6d0-ad9f4e6b9235';

-- Step 6: Check if specific notification IDs exist
-- Replace with actual notification IDs from the error logs
SELECT 
    id,
    client_id,
    recipient_id,
    title,
    message,
    is_read,
    created_at
FROM notifications 
WHERE id IN ('e08d28b1-bff3-4eea-8d00-11497ab2e811', '72417629-a97e-4353-abfc-848edeb43981');
