-- Migration: 006_fix_admin_dashboard_foreign_keys.sql
-- Description: Add missing foreign key constraints for admin dashboard functionality

-- Add missing columns to invoices table if they don't exist (this is the main fix needed)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Make sure clients table has role column (should already exist from previous migration)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'client';

-- Add missing columns to clients table if they don't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to projects table if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name TEXT;

-- Create indexes for better performance (only after columns exist)
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_project_id ON support_tickets(project_id);

-- Update existing clients to have proper role if they don't have one
UPDATE clients SET role = 'client' WHERE role IS NULL;

-- Note: Foreign key constraints are commented out as they may already exist
-- and PostgreSQL doesn't support IF NOT EXISTS for ADD CONSTRAINT
-- Uncomment these if you need to add the foreign keys and they don't exist:
/*
ALTER TABLE support_tickets 
ADD CONSTRAINT fk_support_tickets_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE support_tickets 
ADD CONSTRAINT fk_support_tickets_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE projects 
ADD CONSTRAINT fk_projects_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
*/
