-- Add payment workflow integration to support invoice-first business model

-- Enhance projects table with payment-related fields
ALTER TABLE projects 
ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded')),
ADD COLUMN development_start_date TIMESTAMP,
ADD COLUMN payment_confirmed_at TIMESTAMP,
ADD COLUMN invoice_required BOOLEAN DEFAULT true;

-- Enhance invoices table with workflow integration
ALTER TABLE invoices
ADD COLUMN triggers_project_start BOOLEAN DEFAULT true,
ADD COLUMN development_timeline JSONB,
ADD COLUMN refund_eligibility TEXT DEFAULT 'full' CHECK (refund_eligibility IN ('full', 'partial', 'none')),
ADD COLUMN payment_intent_id TEXT,
ADD COLUMN refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'partial', 'full', 'cancelled')),
ADD COLUMN receipt_url TEXT,
ADD COLUMN failure_reason TEXT;

-- Create payment_workflow table to track payment-to-development transitions
CREATE TABLE payment_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'confirmed', 'failed', 'refunded')),
    workflow_step TEXT DEFAULT 'awaiting_payment' CHECK (workflow_step IN ('awaiting_payment', 'payment_confirmed', 'development_started', 'completed', 'cancelled')),
    payment_confirmed_at TIMESTAMP,
    development_started_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_methods table for saved payment methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    card_type TEXT,
    last_four TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refunds table for refund tracking
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    stripe_refund_id TEXT,
    processed_by UUID REFERENCES clients(id),
    processed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_payment_status ON projects(payment_status);
CREATE INDEX idx_invoices_refund_status ON invoices(refund_status);
CREATE INDEX idx_payment_workflow_project_id ON payment_workflow(project_id);
CREATE INDEX idx_payment_workflow_invoice_id ON payment_workflow(invoice_id);
CREATE INDEX idx_payment_methods_client_id ON payment_methods(client_id);
CREATE INDEX idx_refunds_invoice_id ON refunds(invoice_id);
CREATE INDEX idx_refunds_project_id ON refunds(project_id);

-- Add constraints to ensure data integrity
ALTER TABLE payment_workflow 
ADD CONSTRAINT unique_project_workflow UNIQUE (project_id),
ADD CONSTRAINT unique_invoice_workflow UNIQUE (invoice_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_payment_workflow_updated_at 
    BEFORE UPDATE ON payment_workflow 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at 
    BEFORE UPDATE ON refunds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add default project status values if needed
UPDATE projects SET payment_status = 'pending' WHERE payment_status IS NULL;
UPDATE invoices SET refund_eligibility = 'full' WHERE refund_eligibility IS NULL;
