
-- Step 2: Drop the old constraint
ALTER TABLE projects DROP CONSTRAINT check_project_stage;

-- Step 3: Create the new enum type
CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'review', 'completed');

-- Step 4: Alter the table to use the new enum type
ALTER TABLE projects ALTER COLUMN status TYPE project_status USING status::project_status;
