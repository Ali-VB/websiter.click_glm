-- FIX EXISTING DATA FIRST, THEN ADD CONSTRAINT
-- Run this if you get "check constraint is violated by some row"

-- Step 1: First, fix all existing data to use valid statuses
UPDATE projects SET status = 
  CASE 
    WHEN status IN ('submitted', 'reviewing', 'invoice_sent', 'payment_pending', 'cancelled') THEN 'pending'
    WHEN status IN ('in_progress', 'ongoing') THEN 'in_progress'
    WHEN status = 'review_needed' THEN 'review'
    WHEN status = 'completed' THEN 'completed'
    ELSE 'pending'
  END
WHERE status IS NOT NULL;

-- Step 2: Handle any NULL values
UPDATE projects SET status = 'pending' WHERE status IS NULL;

-- Step 3: Now drop the old constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;

-- Step 4: Add the new constraint
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Step 5: Verify everything is fixed
SELECT 'Data fixed and constraint updated successfully' as result;
SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status;
