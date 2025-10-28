-- Direct SQL script to fix the project status constraint
-- This replaces the 7-stage system with the simplified 4-stage system

-- First, update existing projects to fit the new simplified workflow
-- This must be done BEFORE adding the new constraint
UPDATE projects SET status = 
  CASE 
    WHEN status IN ('submitted', 'reviewing') THEN 'pending'
    WHEN status IN ('invoice_sent', 'payment_pending') THEN 'pending'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status = 'review_needed' THEN 'review'
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'ongoing' THEN 'in_progress'
    WHEN status = 'cancelled' THEN 'pending'
    ELSE 'pending'
  END
WHERE status IS NOT NULL;

-- Handle any NULL status values
UPDATE projects SET status = 'pending' WHERE status IS NULL;

-- Drop the existing constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;

-- Add new simplified constraint
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Add comment explaining the new simplified workflow
COMMENT ON COLUMN projects.status IS 'Simplified project workflow: pending -> in_progress -> review -> completed';

-- Verify the changes
SELECT 'Constraint updated successfully' as status;
SELECT COUNT(*) as total_projects FROM projects;
SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status;
