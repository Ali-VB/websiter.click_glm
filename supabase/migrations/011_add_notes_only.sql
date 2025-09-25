-- Migration: 011_add_notes_only.sql
-- Description: Add only notes column to contact_submissions table (skip existing objects)

-- Add notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_submissions' AND column_name = 'notes') THEN
        ALTER TABLE contact_submissions ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contact_submissions' AND column_name = 'updated_at') THEN
        ALTER TABLE contact_submissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_contact_submissions_notes ON contact_submissions(notes);

-- Skip trigger creation since it already exists

-- Grant necessary permissions (idempotent)
GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON contact_submissions TO service_role;

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contact_submissions' AND rowsecurity = true) THEN
        ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS policies (create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Users can view contact_submissions') THEN
        CREATE POLICY "Users can view contact_submissions" ON contact_submissions
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Admins can manage contact_submissions') THEN
        CREATE POLICY "Admins can manage contact_submissions" ON contact_submissions
            FOR ALL USING (EXISTS (
                SELECT 1 FROM clients 
                WHERE clients.id = auth.uid() 
                AND clients.role = 'admin'
            ));
    END IF;
END $$;
