
-- Step 1: Update existing data to conform to the new status values
UPDATE projects
SET status = CASE
    WHEN status = 'submitted' THEN 'pending'
    WHEN status = 'reviewing' THEN 'review'
    WHEN status = 'invoice_sent' THEN 'pending'
    WHEN status = 'payment_pending' THEN 'pending'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status = 'review_needed' THEN 'review'
    WHEN status = 'completed' THEN 'completed'
    ELSE status
END;
