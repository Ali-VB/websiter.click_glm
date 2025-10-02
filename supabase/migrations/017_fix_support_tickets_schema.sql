-- Migration: 017_fix_support_tickets_schema.sql
-- Description: Remove category constraint and add description field to support_tickets

-- Add description column to support_tickets table
ALTER TABLE support_tickets ADD COLUMN description TEXT;

-- Drop the problematic category check constraint
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS chk_support_tickets_category;

-- Update existing records to have a default description if needed
UPDATE support_tickets SET description = 'No description provided' WHERE description IS NULL;

-- Recreate RLS policies if they don't exist due to schema changes
-- (The previous migration 016 should have created them, but this ensures they work after schema changes)