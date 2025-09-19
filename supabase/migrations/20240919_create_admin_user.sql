-- Create initial admin user
-- This script creates an admin user for the websiter.click application
-- Run this script after creating the initial schema

-- Insert admin user
-- Note: The password should be changed after first login
INSERT INTO clients (id, name, email, role, created_at) 
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Admin User', 
    'admin@websiter.click', 
    'admin', 
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- The actual Supabase Auth user needs to be created separately
-- This can be done through the Supabase dashboard or using the Auth API
-- The email verification should be disabled for this admin user during setup
