-- Migration to add role column to clients table
-- Run this script to update existing databases

-- Add role column to clients table with default value
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

-- Add check constraint to ensure role is one of the allowed values
ALTER TABLE clients 
ADD CONSTRAINT IF NOT EXISTS clients_role_check 
CHECK (role IN ('client', 'admin'));

-- Create index for role column for better performance
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);

-- Update any existing admin users to have the admin role
-- This is a placeholder - in a real scenario, you would identify admin users
-- and update their role accordingly
-- UPDATE clients SET role = 'admin' WHERE email IN ('admin@example.com');