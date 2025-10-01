import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdminFromToken } from '@/lib/auth-helpers';

interface ProjectRequirement {
  basePackage: string;
  addons: string[];
  designStyle: string;
  colorScheme: string;
  layoutPreference: string;
  domain: string;
  hosting: string;
  maintenance: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  projectRole?: string;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  completed_at?: string;
}

interface Asset {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  asset_type?: string;
  mime_type?: string;
  created_at: string;
  uploaded_by?: string;
}

interface Communication {
  id: string;
  project_id: string;
  type: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  clients?: {
    name: string;
  };
}

interface ProjectTeamMember {
  project_id: string;
  role?: string;
  team_members: TeamMember | TeamMember[];
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Fetch projects with all related data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients!fk_projects_client_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Fetch all project IDs for batch queries
    const projectIds = projects.map(p => p.id);

    // Fetch milestones for all projects
    const { data: milestones } = await supabase
      .from('project_milestones')
      .select('*')
      .in('project_id', projectIds)
      .order('due_date', { ascending: true });

    // Fetch assets for all projects
    const { data: assets } = await supabase
      .from('project_assets')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    // Fetch team members for all projects
    const { data: projectTeamMembers } = await supabase
      .from('project_team_members')
      .select(`
        project_id,
        role,
        team_members (
          id,
          name,
          email,
          role,
          avatar_url
        )
      `)
      .in('project_id', projectIds);

    // Fetch communications for all projects
    const { data: communications } = await supabase
      .from('project_communications')
      .select(`
        id,
        project_id,
        type,
        message,
        is_internal,
        created_at,
        clients!project_communications_sender_id_fkey (
          name
        )
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: true });

    // Group related data by project_id
    const milestonesByProject = new Map();
    const assetsByProject = new Map();
    const teamMembersByProject = new Map();
    const communicationsByProject = new Map();

    milestones?.forEach(milestone => {
      if (!milestonesByProject.has(milestone.project_id)) {
        milestonesByProject.set(milestone.project_id, []);
      }
      milestonesByProject.get(milestone.project_id).push(milestone);
    });

    assets?.forEach(asset => {
      if (!assetsByProject.has(asset.project_id)) {
        assetsByProject.set(asset.project_id, []);
      }
      assetsByProject.get(asset.project_id).push(asset);
    });

    projectTeamMembers?.forEach((ptm: ProjectTeamMember) => {
      if (!teamMembersByProject.has(ptm.project_id)) {
        teamMembersByProject.set(ptm.project_id, []);
      }
      // Handle both single object and array from Supabase
      const member = Array.isArray(ptm.team_members) ? ptm.team_members[0] : ptm.team_members;
      if (member) {
        teamMembersByProject.get(ptm.project_id).push({
          ...member,
          projectRole: ptm.role
        });
      }
    });

    communications?.forEach(comm => {
      if (!communicationsByProject.has(comm.project_id)) {
        communicationsByProject.set(comm.project_id, []);
      }
      communicationsByProject.get(comm.project_id).push(comm);
    });

    // Transform the data to match the expected format
    const transformedProjects = projects.map(project => {
      const client = project.clients as { id: string; name: string; email: string } | null;
      const requirements = project.requirements as ProjectRequirement || {
        basePackage: '',
        addons: [],
        designStyle: '',
        colorScheme: '',
        layoutPreference: '',
        domain: '',
        hosting: '',
        maintenance: ''
      };

      const projectMilestones = milestonesByProject.get(project.id) || [];
      const projectAssets = assetsByProject.get(project.id) || [];
      const projectTeam = teamMembersByProject.get(project.id) || [];
      const projectComms = communicationsByProject.get(project.id) || [];

      return {
        id: project.id,
        name: project.name || 'Untitled Project',
        description: project.description || '',
        clientName: client?.name || 'Unknown Client',
        clientEmail: client?.email || 'unknown@example.com',
        status: project.status,
        type: project.website_type || project.type,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        deadline: project.estimated_completion_date || project.deadline,
        progressPercentage: project.progress_percentage || 0,
        lastActivityAt: project.last_activity_at || project.updated_at || project.created_at,
        requirements,
        
        // Transform team members
        teamMembers: projectTeam.map((member: TeamMember) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.projectRole || member.role,
          avatar: member.avatar_url
        })),

        // Transform milestones
        milestones: projectMilestones.map((milestone: Milestone) => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description || '',
          dueDate: milestone.due_date,
          status: milestone.status,
          completedAt: milestone.completed_at
        })),

        // Transform assets
        assets: projectAssets.map((asset: Asset) => ({
          id: asset.id,
          name: asset.file_name,
          type: asset.asset_type || asset.mime_type,
          uploadedAt: asset.created_at,
          uploadedBy: asset.uploaded_by || 'Unknown',
          size: asset.file_size || 0,
          url: asset.file_path
        })),

        // Transform communications
        communications: projectComms.map((comm: Communication) => ({
          id: comm.id,
          type: comm.type,
          message: comm.message,
          sender: comm.clients?.name || 'Unknown',
          timestamp: comm.created_at,
          isInternal: comm.is_internal
        }))
      };
    });

    return NextResponse.json({
      success: true,
      projects: transformedProjects
    });
  } catch (error) {
    console.error('Admin projects API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching projects' },
      { status: 500 }
    );
  }
}
