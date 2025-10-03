-- Test current RLS policies
-- Run this in Supabase SQL Editor to see what's happening

-- Test 1: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'notifications';

-- Test 2: Check existing RLS policies
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

-- Test 3: Try to query as the specific user (this should fail with current policies)
-- This simulates what the API is trying to do
SET ROLE authenticated;
SELECT 
    id, 
    client_id,
    message, 
    is_read 
FROM notifications 
WHERE id = 'e08d28b1-bff3-4eea-8d00-11497ab2e811'
AND client_id = 'e0fc4666-b179-4173-a6d0-ad9f4e6b9235';

-- Reset role
RESET ROLE;
