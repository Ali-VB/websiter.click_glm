-- Migration: 005_add_foreign_key_to_support_ticket_replies.sql
-- Description: Add foreign key constraint from support_ticket_replies.author_id to clients.id

-- Add foreign key constraint from author_id to clients.id
ALTER TABLE support_ticket_replies 
ADD CONSTRAINT fk_support_ticket_replies_author_id 
FOREIGN KEY (author_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Create index for author_id for better performance
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_author_id ON support_ticket_replies(author_id);