-- Migration: 007_add_missing_admin_tables.sql
-- Description: Add missing tables for admin dashboard functionality

-- Create activity_log table for tracking system activities
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    user_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table for support ticket assignment
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fix the invoices table structure
-- First, add the missing client_id column if it doesn't exist
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Update existing invoices to set client_id based on project relationship
UPDATE invoices 
SET client_id = projects.client_id
FROM projects 
WHERE invoices.project_id = projects.id 
AND invoices.client_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

-- Add some default team members if the table is empty
INSERT INTO team_members (name, email, role, department) VALUES
('Admin User', 'admin@websiter.click', 'Administrator', 'Management'),
('Support Agent', 'support@websiter.click', 'Support Agent', 'Customer Support')
ON CONFLICT (email) DO NOTHING;

-- Create a trigger to update updated_at timestamp for team_members
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON team_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON activity_log TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON activity_log TO service_role;
GRANT ALL ON team_members TO service_role;

-- Enable RLS (Row Level Security)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_log
CREATE POLICY "Users can view activity_log" ON activity_log
    FOR SELECT USING (true);

CREATE POLICY "Users can insert activity_log" ON activity_log
    FOR INSERT WITH CHECK (true);

-- RLS policies for team_members
CREATE POLICY "Users can view team_members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage team_members" ON team_members
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = auth.uid() 
        AND clients.role = 'admin'
    ));
