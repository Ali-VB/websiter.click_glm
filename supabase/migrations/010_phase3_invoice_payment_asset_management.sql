-- Migration: 010_phase3_invoice_payment_asset_management.sql
-- Description: Phase 3 - Enhanced invoice, payment, and asset management systems

-- ============================================
-- INVOICE MANAGEMENT ENHANCEMENTS
-- ============================================

-- Enhance invoices table with advanced features
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net_30',
ADD COLUMN IF NOT EXISTS recurring_template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS late_fee_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Update invoice status to new values
ALTER TABLE invoices
ALTER COLUMN status TYPE TEXT USING (CASE 
    WHEN status = 'pending' THEN 'draft'
    WHEN status = 'approved' THEN 'pending_payment'
    WHEN status = 'paid' THEN 'paid'
    WHEN status = 'rejected' THEN 'cancelled'
    ELSE status
END),
ADD CONSTRAINT CHECK (status IN ('draft', 'pending_payment', 'paid', 'cancelled'));

-- Create invoice_templates table for recurring invoices
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    line_items JSONB NOT NULL,
    tax_amount INTEGER DEFAULT 0,
    tax_details JSONB,
    payment_terms TEXT DEFAULT 'net_30',
    currency TEXT DEFAULT 'cad',
    recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    recurring_day INTEGER, -- Day of month/week for recurring invoices
    recurring_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_payments table for partial payments
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_delivery_logs table
CREATE TABLE IF NOT EXISTS invoice_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'portal', 'api')),
    recipient_email TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE
);

-- Create credit_memos table
CREATE TABLE IF NOT EXISTS credit_memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- PAYMENT MANAGEMENT ENHANCEMENTS
-- ============================================

-- Enhance payment_intents table with additional fields
ALTER TABLE payment_intents
ADD COLUMN IF NOT EXISTS invoice_payment_id UUID REFERENCES invoice_payments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS failure_code TEXT,
ADD COLUMN IF NOT EXISTS next_action JSONB,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_id TEXT,
ADD COLUMN IF NOT EXISTS dispute_status TEXT,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_amount INTEGER,
ADD COLUMN IF NOT EXISTS refund_status TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create payment_methods table if not exists
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL CHECK (method_type IN ('card', 'bank_account', 'paypal', 'stripe', 'other')),
    provider TEXT NOT NULL DEFAULT 'stripe',
    provider_method_id TEXT NOT NULL,
    last4 TEXT,
    brand TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    billing_name TEXT,
    billing_address JSONB,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_subscriptions table for recurring payments
CREATE TABLE IF NOT EXISTS payment_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'cad',
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    stripe_dispute_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'cad',
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('needs_response', 'under_review', 'won', 'lost', 'warning_needs_response', 'warning_under_review', 'warning_won', 'warning_lost')),
    evidence JSONB,
    evidence_due_by TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ASSET MANAGEMENT ENHANCEMENTS
-- ============================================

-- Create client_assets table for client-wide assets
CREATE TABLE IF NOT EXISTS client_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES client_asset_folders(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    original_name TEXT,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'document', 'video', 'audio', 'archive', 'code', 'other')),
    dimensions JSONB,
    thumbnail_path TEXT,
    description TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES client_assets(id) ON DELETE SET NULL,
    metadata JSONB,
    storage_cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_asset_folders table
CREATE TABLE IF NOT EXISTS client_asset_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES client_asset_folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create asset_optimization_recommendations table
CREATE TABLE IF NOT EXISTS asset_optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES project_assets(id) ON DELETE CASCADE,
    client_asset_id UUID REFERENCES client_assets(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('compress', 'resize', 'convert_format', 'delete_duplicate', 'archive_unused')),
    current_size BIGINT,
    potential_savings BIGINT,
    recommendation_details JSONB,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage_usage_stats table
CREATE TABLE IF NOT EXISTS storage_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_assets INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    asset_type_breakdown JSONB, -- {image: {count, size, cost}, document: {...}, etc.}
    monthly_trend JSONB, -- Array of monthly usage data
    last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- CONTACT SUBMISSIONS ENHANCEMENTS
-- ============================================

-- Enhance contact_submissions table
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'email', 'phone', 'other')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'responded', 'archived')),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_to_client BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_project BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Invoice management indexes
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_intent_id ON invoices(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_template_id ON invoices(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_client_id ON invoice_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_project_id ON invoice_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_intent_id ON invoice_payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_status ON invoice_payments(status);
CREATE INDEX IF NOT EXISTS idx_invoice_delivery_logs_invoice_id ON invoice_delivery_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_delivery_logs_status ON invoice_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_credit_memos_invoice_id ON credit_memos(invoice_id);

-- Payment management indexes
CREATE INDEX IF NOT EXISTS idx_payment_intents_invoice_payment_id ON payment_intents(invoice_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_next_retry_at ON payment_intents(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_payment_methods_client_id ON payment_methods(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_client_id ON payment_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_status ON payment_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_intent_id ON payment_disputes(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);

-- Asset management indexes
CREATE INDEX IF NOT EXISTS idx_client_assets_client_id ON client_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_folder_id ON client_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_asset_type ON client_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_client_asset_folders_client_id ON client_asset_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_folders_parent_folder_id ON client_asset_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_asset_optimization_recommendations_asset_id ON asset_optimization_recommendations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_optimization_recommendations_client_asset_id ON asset_optimization_recommendations(client_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_optimization_recommendations_status ON asset_optimization_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_storage_usage_stats_client_id ON storage_usage_stats(client_id);

-- Contact submissions indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_source ON contact_submissions(source);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_assigned_to ON contact_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_converted_to_client ON contact_submissions(converted_to_client);

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

-- Add triggers for new tables with updated_at column
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at 
    BEFORE UPDATE ON invoice_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_payments_updated_at 
    BEFORE UPDATE ON invoice_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_memos_updated_at 
    BEFORE UPDATE ON credit_memos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_subscriptions_updated_at 
    BEFORE UPDATE ON payment_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at 
    BEFORE UPDATE ON payment_disputes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_assets_updated_at 
    BEFORE UPDATE ON client_assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_asset_folders_updated_at 
    BEFORE UPDATE ON client_asset_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_optimization_recommendations_updated_at 
    BEFORE UPDATE ON asset_optimization_recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_usage_stats_updated_at 
    BEFORE UPDATE ON storage_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_templates
CREATE POLICY "Users can view their own invoice templates" ON invoice_templates
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can create their own invoice templates" ON invoice_templates
    FOR INSERT WITH CHECK (client_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Users can update their own invoice templates" ON invoice_templates
    FOR UPDATE USING (client_id = auth.uid());

-- RLS Policies for invoice_payments
CREATE POLICY "Users can view payments for their invoices" ON invoice_payments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM invoices i
        JOIN projects p ON i.project_id = p.id
        WHERE i.id = invoice_payments.invoice_id AND p.client_id = auth.uid()
    ));

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can create their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (client_id = auth.uid());

-- RLS Policies for payment_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON payment_subscriptions
    FOR SELECT USING (client_id = auth.uid());

-- RLS Policies for client_assets
CREATE POLICY "Users can view their own client assets" ON client_assets
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can upload their own client assets" ON client_assets
    FOR INSERT WITH CHECK (client_id = auth.uid() AND uploaded_by = auth.uid());

CREATE POLICY "Users can update their own client assets" ON client_assets
    FOR UPDATE USING (client_id = auth.uid());

-- RLS Policies for client_asset_folders
CREATE POLICY "Users can view their own client asset folders" ON client_asset_folders
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Users can create their own client asset folders" ON client_asset_folders
    FOR INSERT WITH CHECK (client_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Users can update their own client asset folders" ON client_asset_folders
    FOR UPDATE USING (client_id = auth.uid());

-- RLS Policies for storage_usage_stats
CREATE POLICY "Users can view their own storage stats" ON storage_usage_stats
    FOR SELECT USING (client_id = auth.uid());

-- ============================================
-- DEFAULT DATA SETUP
-- ============================================

-- Generate invoice numbers for existing invoices
UPDATE invoices SET invoice_number = 'INV-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(id::text, 6, '0')
WHERE invoice_number IS NULL;

-- Set default due dates for existing invoices (30 days from creation)
UPDATE invoices SET due_date = created_at + INTERVAL '30 days'
WHERE due_date IS NULL;

-- Initialize storage usage stats for existing clients
INSERT INTO storage_usage_stats (client_id, last_calculated_at)
SELECT id, NOW() FROM clients 
WHERE id NOT IN (SELECT client_id FROM storage_usage_stats);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
