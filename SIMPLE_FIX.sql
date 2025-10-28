-- SIMPLE FIX: Just update the constraint to allow 'pending'
-- This is the minimal fix needed

-- Step 1: Drop the existing constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;

-- Step 2: Add the new constraint that allows 'pending'
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Step 3: Verify the constraint was added
SELECT 'SUCCESS: Constraint updated to allow pending status' as result;
SELECT 'New constraint allows: pending, in_progress, review, completed' as confirmation;
