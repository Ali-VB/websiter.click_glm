-- QUICK FIX: Drop and recreate constraint immediately
-- Run this if you're still getting constraint violations

-- Step 1: Drop the problematic constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;

-- Step 2: Add the new constraint that allows 'pending'
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Step 3: Verify the constraint is gone and new one is added
SELECT 'Constraint fixed - now allows pending status' as result;
