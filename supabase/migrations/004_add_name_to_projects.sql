-- Migration: 004_add_name_to_projects.sql
-- Description: Add name column to projects table to support API queries

-- Add name column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index for name column for better performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Update existing projects to have a default name based on website_type
UPDATE projects 
SET name = CONCAT('Project ', website_type) 
WHERE name IS NULL;

-- Set name column to NOT NULL after updating existing records
ALTER TABLE projects 
ALTER COLUMN name SET NOT NULL;