-- Simplified diagnostic script - only checks existing columns
-- Run this in your Supabase SQL Editor

-- Step 1: Check notifications table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Step 2: Count notifications
SELECT COUNT(*) as total_notifications FROM notifications;

-- Step 3: Show sample data (only existing columns)
SELECT 
    id, 
    client_id,
    title, 
    message, 
    is_read, 
    type,
    created_at
FROM notifications 
LIMIT 5;

-- Step 4: Check if the user exists
SELECT 
    id, 
    email, 
    name, 
    role,
    created_at
FROM clients 
WHERE id = 'e0fc4666-b179-4173-a6d0-ad9f4e6b9235';

-- Step 5: Check if specific notifications exist
SELECT 
    id,
    client_id,
    title,
    message,
    is_read,
    created_at
FROM notifications 
WHERE id IN ('e08d28b1-bff3-4eea-8d00-11497ab2e811', '72417629-a97e-4353-abfc-848edeb43981');
