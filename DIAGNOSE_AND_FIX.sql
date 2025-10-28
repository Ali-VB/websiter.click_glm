-- STEP 1: First, let's see what status values actually exist
SELECT 'Current status values in database:' as info;
SELECT DISTINCT status FROM projects WHERE status IS NOT NULL;

-- STEP 2: Show all problematic rows
SELECT 'Problematic rows that need fixing:' as info;
SELECT id, name, status FROM projects WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed', NULL);

-- STEP 3: Fix the data (more comprehensive)
UPDATE projects SET status = 
  CASE 
    -- Map to pending
    WHEN status IN ('submitted', 'reviewing', 'invoice_sent', 'payment_pending', 'cancelled', 'awaiting_invoice', 'approved', 'on_hold') THEN 'pending'
    -- Map to in_progress  
    WHEN status IN ('in_progress', 'ongoing', 'active', 'development') THEN 'in_progress'
    -- Map to review
    WHEN status IN ('review_needed', 'pending_review', 'client_review', 'revision') THEN 'review'
    -- Map to completed
    WHEN status IN ('completed', 'finished', 'done', 'delivered') THEN 'completed'
    -- Default to pending for anything else
    ELSE 'pending'
  END;

-- STEP 4: Handle NULL values
UPDATE projects SET status = 'pending' WHERE status IS NULL;

-- STEP 5: Verify no more problematic rows
SELECT 'Checking for remaining problematic rows:' as info;
SELECT COUNT(*) as remaining_problematic_rows FROM projects WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed');

-- STEP 6: Show final status distribution
SELECT 'Final status distribution:' as info;
SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status;

-- STEP 7: Only add constraint if no problematic rows remain
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM projects WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed')) = 0 THEN
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_stage;
        ALTER TABLE projects ADD CONSTRAINT check_project_stage CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));
        RAISE NOTICE 'Constraint added successfully - all data is valid';
    ELSE
        RAISE NOTICE 'Cannot add constraint - there are still invalid status values';
    END IF;
END $$;
