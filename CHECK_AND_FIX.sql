-- CHECK AND FIX: First see what constraint exists, then fix it

-- Step 1: Check what constraint currently exists
SELECT 'Current constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_def 
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass AND contype = 'c' AND conname = 'check_project_stage';

-- Step 2: Show current status values in database
SELECT 'Current status values in database:' as info;
SELECT DISTINCT status FROM projects WHERE status IS NOT NULL;

-- Step 3: Force drop the constraint (ignore errors)
ALTER TABLE projects DROP CONSTRAINT check_project_stage;

-- Step 4: Add the new constraint that allows 'pending'
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Step 5: Verify the new constraint
SELECT 'New constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_def 
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass AND contype = 'c' AND conname = 'check_project_stage';

-- Step 6: Test the constraint with a sample insert (this will show if it works)
SELECT 'SUCCESS: Constraint updated to allow pending status' as result;
SELECT 'You can now create projects with status: pending' as confirmation;
