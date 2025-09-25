-- Migration: 009_enhanced_database_schema_expansion.sql
-- Description: Phase 1 - Enhanced database schema expansion for advanced features

-- ============================================
-- PAYMENT WORKFLOW ENHANCEMENTS
-- ============================================

-- Enhance existing payment_methods table with additional fields
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create payment_intents table for detailed payment tracking
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'cad',
    status TEXT NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled', 'requires_capture')),
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_method_types TEXT[] DEFAULT ARRAY['card'],
    capture_method TEXT DEFAULT 'automatic',
    confirmation_method TEXT DEFAULT 'automatic',
    description TEXT,
    statement_descriptor TEXT,
    receipt_email TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- NOTIFICATION SYSTEM ENHANCEMENTS
-- ============================================

-- Drop and recreate notifications table with enhanced structure
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'payment', 'project_update', 'support', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_delivered BOOLEAN NOT NULL DEFAULT false,
    delivery_method TEXT[] DEFAULT ARRAY['in_app'],
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    payment_alerts BOOLEAN DEFAULT true,
    project_updates BOOLEAN DEFAULT true,
    support_responses BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_delivery_logs table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    delivery_method TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ASSET MANAGEMENT ENHANCEMENTS
-- ============================================

-- Drop and recreate project_assets table with enhanced structure
DROP TABLE IF EXISTS project_assets CASCADE;

CREATE TABLE project_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    original_name TEXT,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'document', 'video', 'audio', 'archive', 'code', 'other')),
    dimensions JSONB, -- For images: {width, height}, For videos: {duration, resolution}
    thumbnail_path TEXT,
    description TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES project_assets(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create asset_folders table
CREATE TABLE IF NOT EXISTS asset_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create asset_usage table for tracking asset usage
CREATE TABLE IF NOT EXISTS asset_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES project_assets(id) ON DELETE CASCADE,
    used_by UUID REFERENCES clients(id) ON DELETE SET NULL,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('view', 'download', 'embed', 'share')),
    usage_context TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create asset_shares table for sharing assets externally
CREATE TABLE IF NOT EXISTS asset_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES project_assets(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    password_hash TEXT,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    permissions TEXT[] DEFAULT ARRAY['view'],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ENHANCED CLIENT/PROJECT TABLES
-- ============================================

-- Enhance clients table with new fields
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Toronto',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferences JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Enhance projects table with new fields
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE,
ADD COLUMN IF NOT EXISTS actual_completion_date DATE,
ADD COLUMN IF NOT EXISTS budget INTEGER,
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0, -- in minutes
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_time_entries table for time tracking
CREATE TABLE IF NOT EXISTS project_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    date DATE NOT NULL,
    billable BOOLEAN DEFAULT true,
    hourly_rate INTEGER,
    task_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ANALYTICS AND REPORTING TABLES
-- ============================================

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    user_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_summary table for pre-computed metrics
CREATE TABLE IF NOT EXISTS analytics_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    date_range TEXT NOT NULL, -- e.g., '2024-01-01:2024-01-31'
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(metric_name, date_range)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN ('financial', 'project', 'client', 'support', 'custom')),
    query_config JSONB NOT NULL,
    schedule_config JSONB,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    generated_by UUID REFERENCES clients(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_instances table for generated reports
CREATE TABLE IF NOT EXISTS report_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'csv', 'xlsx', 'json')),
    parameters JSONB,
    generated_by UUID REFERENCES clients(id) ON DELETE SET NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Payment workflow indexes
CREATE INDEX IF NOT EXISTS idx_payment_intents_client_id ON payment_intents(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_invoice_id ON payment_intents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_intent_id ON payment_logs(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Notification system indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON notification_delivery_logs(status);

-- Asset management indexes
CREATE INDEX IF NOT EXISTS idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_folder_id ON project_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_uploaded_by ON project_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_assets_asset_type ON project_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_folders_project_id ON asset_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_folder_id ON asset_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_asset_id ON asset_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_used_by ON asset_usage(used_by);
CREATE INDEX IF NOT EXISTS idx_asset_usage_created_at ON asset_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_asset_shares_asset_id ON asset_shares(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_shares_share_token ON asset_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_asset_shares_expires_at ON asset_shares(expires_at);

-- Enhanced client/project indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email_verified ON clients(email_verified);
CREATE INDEX IF NOT EXISTS idx_clients_last_login_at ON clients(last_login_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_payment_status ON projects(payment_status);
CREATE INDEX IF NOT EXISTS idx_projects_progress_percentage ON projects(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity_at ON projects(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_project_id ON project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_user_id ON project_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_date ON project_time_entries(date);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_metric_name ON analytics_summary(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_computed_at ON analytics_summary(computed_at);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_report_instances_report_id ON report_instances(report_id);
CREATE INDEX IF NOT EXISTS idx_report_instances_generated_at ON report_instances(generated_at);
CREATE INDEX IF NOT EXISTS idx_report_instances_expires_at ON report_instances(expires_at);

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for all tables with updated_at column
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at 
    BEFORE UPDATE ON payment_intents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assets_updated_at 
    BEFORE UPDATE ON project_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_folders_updated_at 
    BEFORE UPDATE ON asset_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_shares_updated_at 
    BEFORE UPDATE ON asset_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at 
    BEFORE UPDATE ON project_milestones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_time_entries_updated_at 
    BEFORE UPDATE ON project_time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_intents
CREATE POLICY "Users can view their own payment intents" ON payment_intents
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can view all payment intents" ON payment_intents
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = auth.uid() 
        AND clients.role = 'admin'
    ));

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

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for project_assets
CREATE POLICY "Users can view assets for their projects" ON project_assets
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_assets.project_id AND p.client_id = auth.uid()
    ));

CREATE POLICY "Users can upload assets to their projects" ON project_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_assets.project_id AND p.client_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

-- RLS Policies for project_milestones
CREATE POLICY "Users can view milestones for their projects" ON project_milestones
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_milestones.project_id AND p.client_id = auth.uid()
    ));

-- RLS Policies for project_time_entries
CREATE POLICY "Users can view time entries for their projects" ON project_time_entries
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_time_entries.project_id AND p.client_id = auth.uid()
    ));

CREATE POLICY "Users can create time entries for their projects" ON project_time_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_time_entries.project_id AND p.client_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- ============================================
-- DEFAULT DATA SETUP
-- ============================================

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM clients 
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Update existing projects with default values
UPDATE projects SET 
    progress_percentage = 0,
    last_activity_at = COALESCE(updated_at, created_at),
    updated_at = COALESCE(updated_at, created_at)
WHERE progress_percentage IS NULL OR last_activity_at IS NULL;

-- Update existing clients with default values
UPDATE clients SET 
    status = 'active',
    updated_at = COALESCE(updated_at, created_at)
WHERE status IS NULL;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
