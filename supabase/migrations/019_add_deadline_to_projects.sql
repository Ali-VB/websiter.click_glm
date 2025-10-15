-- Add deadline column to projects table
ALTER TABLE projects 
ADD COLUMN deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create index for deadline queries
CREATE INDEX idx_projects_deadline ON projects(deadline);

-- Update updated_at timestamp when project is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
