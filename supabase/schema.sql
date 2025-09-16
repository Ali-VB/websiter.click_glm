-- Schema for websiter.click database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    website_type TEXT NOT NULL,
    design_preferences JSONB,
    add_ons JSONB,
    domain_info JSONB,
    maintenance_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    line_items JSONB NOT NULL,
    total_amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'cad',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_notifications_client_id ON notifications(client_id);
CREATE INDEX idx_clients_email ON clients(email);

-- Schema additions based on expanded spec

-- Table for project assets
CREATE TABLE project_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES clients(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_assets_project_id ON project_assets(project_id);

-- Tables for the support ticket system
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- e.g., 'open', 'in_progress', 'closed'
    priority TEXT NOT NULL, -- e.g., 'low', 'medium', 'high'
    category TEXT NOT NULL, -- e.g., 'design', 'development', 'billing'
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_client_id ON support_tickets(client_id);

CREATE TABLE support_ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL, -- Note: This could be a client or an admin
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);

-- Table for public contact form submissions
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for internal client notes by admins
CREATE TABLE client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL, -- Note: Assumes an admin user system
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);

-- Add tax columns to invoices table
ALTER TABLE invoices
ADD COLUMN tax_amount INTEGER NOT NULL DEFAULT 0,
ADD COLUMN tax_details JSONB;
