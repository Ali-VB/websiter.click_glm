-- Create unified project stages system
-- This migration updates the projects table to use the new 7-stage workflow

-- First, let's add a new column for the unified status
ALTER TABLE projects 
ADD COLUMN unified_status TEXT;

-- Create a custom type for the new stages to ensure data integrity
DO $$ BEGIN
    CREATE TYPE project_stage AS ENUM (
        'submitted',
        'reviewing', 
        'invoice_sent',
        'payment_pending',
        'in_progress',
        'review_needed',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the unified_status column based on current status
UPDATE projects SET unified_status = CASE 
    WHEN status = 'submitted' THEN 'submitted'
    WHEN status = 'awaiting_invoice' THEN 'invoice_sent'
    WHEN status = 'approved' THEN 'payment_pending'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'on_hold' THEN 'reviewing'
    ELSE 'submitted'
END;

-- Drop the old status column and rename the new one
ALTER TABLE projects DROP COLUMN status;
ALTER TABLE projects RENAME COLUMN unified_status TO status;

-- Add constraint to ensure only valid stages are used
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('submitted', 'reviewing', 'invoice_sent', 'payment_pending', 'in_progress', 'review_needed', 'completed'));

-- Add indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_status_client ON projects(client_id, status);

-- Add comments for documentation
COMMENT ON COLUMN projects.status IS 'Unified project stage system: submitted -> reviewing -> invoice_sent -> payment_pending -> in_progress -> review_needed -> completed';
