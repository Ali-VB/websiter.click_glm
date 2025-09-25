-- Migration: 011_add_notes_to_contact_submissions.sql
-- Description: Add missing columns to contact_submissions table for admin dashboard functionality

-- Add missing columns to contact_submissions table
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'responded', 'archived')),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'email', 'phone', 'other')),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS response JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_notes ON contact_submissions(notes);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Grant necessary permissions
GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON contact_submissions TO service_role;

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_submissions
CREATE POLICY "Users can view contact_submissions" ON contact_submissions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage contact_submissions" ON contact_submissions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = auth.uid() 
        AND clients.role = 'admin'
    ));
