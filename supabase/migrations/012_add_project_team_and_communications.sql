-- Migration: 012_add_project_team_and_communications.sql
-- Description: Add project team members junction table and project communications

-- ============================================
-- PROJECT TEAM MEMBERS JUNCTION TABLE
-- ============================================

-- Create project_team_members junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    role TEXT, -- e.g., 'Project Manager', 'Developer', 'Designer'
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, team_member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member_id ON project_team_members(team_member_id);

-- ============================================
-- PROJECT COMMUNICATIONS TABLE
-- ============================================

-- Create project_communications table for internal notes and client messages
CREATE TABLE IF NOT EXISTS project_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('internal', 'client')),
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_communications_project_id ON project_communications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_communications_sender_id ON project_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_project_communications_type ON project_communications(type);
CREATE INDEX IF NOT EXISTS idx_project_communications_created_at ON project_communications(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for project_communications updated_at
CREATE TRIGGER update_project_communications_updated_at
    BEFORE UPDATE ON project_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_team_members
CREATE POLICY "Users can view team members for their projects" ON project_team_members
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_team_members.project_id AND p.client_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all project team members" ON project_team_members
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = auth.uid() 
        AND clients.role = 'admin'
    ));

-- RLS Policies for project_communications
CREATE POLICY "Users can view communications for their projects" ON project_communications
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_communications.project_id AND p.client_id = auth.uid()
    ));

CREATE POLICY "Users can create communications for their projects" ON project_communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_communications.project_id AND p.client_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

CREATE POLICY "Admins can manage all project communications" ON project_communications
    FOR ALL USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = auth.uid() 
        AND clients.role = 'admin'
    ));

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON project_team_members TO authenticated;
GRANT ALL ON project_team_members TO service_role;
GRANT ALL ON project_communications TO authenticated;
GRANT ALL ON project_communications TO service_role;
