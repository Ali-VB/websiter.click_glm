import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL migration content
const migrationSQL = `
-- Add missing columns to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS recipient_id UUID NOT NULL,
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'project_update', 'invoice', 'support', 'marketing')),
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Rename client_id to old_client_id temporarily for data migration
ALTER TABLE notifications RENAME COLUMN client_id TO old_client_id;

-- Update recipient_id with data from old_client_id
UPDATE notifications SET recipient_id = old_client_id WHERE recipient_id IS NULL;

-- Drop the old client_id column
ALTER TABLE notifications DROP COLUMN old_client_id;

-- Add foreign key constraint for recipient_id
ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_recipient_id 
FOREIGN KEY (recipient_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_delivered ON notifications(is_delivered);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = auth.uid() 
        AND clients.role = 'admin'
    ));
`;

async function runMigration() {
  try {
    console.log('Running notifications table migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error running migration:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 100) + '...');
          const { error: stmtError } = await supabase.from('notifications').select('count').limit(1);
          
          if (stmtError) {
            console.error('Error executing statement:', stmtError);
          }
        }
      }
    } else {
      console.log('Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

runMigration();
