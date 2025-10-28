-- TWO STEP FIX: Fix existing data first, then add constraint

-- STEP 1: Fix all existing data to use valid statuses
UPDATE projects SET status = 
  CASE 
    WHEN status IN ('pending', 'in_progress', 'review', 'completed') THEN status
    WHEN status IN ('submitted', 'reviewing', 'invoice_sent', 'payment_pending', 'cancelled', 'awaiting_invoice', 'approved', 'on_hold') THEN 'pending'
    WHEN status IN ('in_progress', 'ongoing', 'active', 'development') THEN 'in_progress'
    WHEN status IN ('review_needed', 'pending_review', 'client_review', 'revision') THEN 'review'
    WHEN status IN ('completed', 'finished', 'done', 'delivered') THEN 'completed'
    ELSE 'pending'  -- Catch-all for any unexpected values
  END
WHERE status IS NOT NULL;

-- Handle NULL values
UPDATE projects SET status = 'pending' WHERE status IS NULL;

-- STEP 2: Verify no more problematic rows
SELECT 'Checking for problematic rows:' as info;
SELECT COUNT(*) as problematic_rows FROM projects WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed');

-- STEP 3: Show status distribution
SELECT 'Current status distribution:' as info;
SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status;

-- STEP 4: Now safely drop and recreate constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;

ALTER TABLE projects 
ADD CONSTRAINT check_project_stage 
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- STEP 5: Final verification
SELECT 'SUCCESS: Data fixed and constraint updated' as result;
