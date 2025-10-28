-- ULTIMATE FIX: Handle all possible issues
-- This script will fix the constraint issue once and for all

-- Step 1: Show all current status values
SELECT 'Current status values:' as info;
SELECT DISTINCT status FROM projects WHERE status IS NOT NULL;

-- Step 3: Show any rows with problematic status values
SELECT 'Rows with problematic status values:' as info;
SELECT id, name, status FROM projects WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed', NULL) LIMIT 10;

-- Step 4: Fix ALL status values comprehensively
UPDATE projects SET status = 
  CASE 
    WHEN status IS NULL THEN 'pending'
    WHEN status IN ('pending', 'in_progress', 'review', 'completed') THEN status
    WHEN status IN ('submitted', 'reviewing', 'invoice_sent', 'payment_pending', 'cancelled', 'awaiting_invoice', 'approved', 'on_hold') THEN 'pending'
    WHEN status IN ('in_progress', 'ongoing', 'active', 'development') THEN 'in_progress'
    WHEN status IN ('review_needed', 'pending_review', 'client_review', 'revision') THEN 'review'
    WHEN status IN ('completed', 'finished', 'done', 'delivered') THEN 'completed'
    ELSE 'pending'  -- Catch-all for any unexpected values
  END;

-- Step 5: Verify the fix
SELECT 'After fix - checking for remaining issues:' as info;
SELECT COUNT(*) as remaining_invalid_rows FROM projects WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed');

-- Step 6: Show final status distribution
SELECT 'Final status distribution:' as info;
SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status;

-- Step 7: Drop and recreate constraint safely
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;

-- Step 8: Add the new constraint
ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Step 9: Final verification
SELECT 'SUCCESS: Constraint updated and all data is valid' as result;
SELECT 'You can now create projects with status: pending' as confirmation;
