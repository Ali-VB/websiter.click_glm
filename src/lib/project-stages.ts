// Simplified Project Stage System
// This file contains the stage definitions, mappings, and helper functions

export type ProjectStage = 
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'completed';

// Client-facing stage information
export const clientStageInfo = {
  pending: {
    title: 'Project Submitted',
    description: 'We have received your project requirements and will start reviewing them shortly.',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: '📝',
    actionRequired: false,
    nextStep: 'Our team will review your requirements'
  },
  in_progress: {
    title: 'In Development',
    description: 'Your website is currently being built. We will update you on progress.',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '🚀',
    actionRequired: false,
    nextStep: 'We will notify you when ready for review'
  },
  review: {
    title: 'Ready for Review',
    description: 'Your website is ready! Please review it and provide any feedback.',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: '✨',
    actionRequired: true,
    nextStep: 'Provide feedback or approve the final version'
  },
  completed: {
    title: 'Project Completed',
    description: 'Congratulations! Your website is live and ready to use.',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: '🎉',
    actionRequired: false,
    nextStep: 'Enjoy your new website!'
  }
} as const;

// Admin-facing stage information
export const adminStageInfo = {
  pending: {
    title: 'Pending Review',
    description: 'Client submitted project, awaiting admin review',
    color: 'bg-yellow-100 text-yellow-800',
    adminActions: ['Review project', 'Start development', 'Request more info'],
    nextStage: 'in_progress'
  },
  in_progress: {
    title: 'In Development',
    description: 'Active design and development phase',
    color: 'bg-blue-100 text-blue-800',
    adminActions: ['Update progress', 'Add assets', 'Send for review'],
    nextStage: 'review'
  },
  review: {
    title: 'Client Review',
    description: 'Project ready, waiting for client feedback',
    color: 'bg-purple-100 text-purple-800',
    adminActions: ['View feedback', 'Make revisions', 'Complete project'],
    nextStage: 'completed'
  },
  completed: {
    title: 'Completed',
    description: 'Project finished and delivered',
    color: 'bg-green-100 text-green-800',
    adminActions: ['Archive project', 'Create follow-up', 'Request review'],
    nextStage: null
  }
} as const;

// Stage order for progress calculation
export const stageOrder: ProjectStage[] = [
  'pending',
  'in_progress',
  'review',
  'completed'
];

// Helper functions
export function getStageProgress(stage: ProjectStage): number {
  const index = stageOrder.indexOf(stage);
  return Math.round(((index + 1) / stageOrder.length) * 100);
}

export function getNextStage(stage: ProjectStage): ProjectStage | null {
  const index = stageOrder.indexOf(stage);
  return index < stageOrder.length - 1 ? stageOrder[index + 1] : null;
}

export function canTransitionTo(from: ProjectStage, to: ProjectStage): boolean {
  const fromIndex = stageOrder.indexOf(from);
  const toIndex = stageOrder.indexOf(to);
  
  // Can only move forward in the workflow
  return toIndex > fromIndex;
}

export function getStageInfo(stage: ProjectStage, isAdmin: boolean = false) {
  return isAdmin ? adminStageInfo[stage] : clientStageInfo[stage];
}

export function getStageColor(stage: ProjectStage, isAdmin: boolean = false): string {
  return getStageInfo(stage, isAdmin).color;
}

export function getStageTitle(stage: ProjectStage, isAdmin: boolean = false): string {
  return getStageInfo(stage, isAdmin).title;
}

export function isActionRequired(stage: ProjectStage): boolean {
  return clientStageInfo[stage].actionRequired;
}

// Legacy status mapping for backward compatibility
export function mapLegacyStatus(legacyStatus: string): ProjectStage {
  const mapping: Record<string, ProjectStage> = {
    // Map old 7-stage system to new 4-stage system
    'submitted': 'pending',
    'reviewing': 'pending',
    'invoice_sent': 'pending',
    'payment_pending': 'pending',
    'in_progress': 'in_progress',
    'review_needed': 'review',
    'completed': 'completed',
    // Handle other legacy statuses
    'ongoing': 'in_progress',
    'cancelled': 'pending' // Reset cancelled projects to pending
  };
  
  return mapping[legacyStatus] || 'pending';
}

// Get all available stages for dropdowns
export function getAllStages(isAdmin: boolean = false): { value: ProjectStage; label: string }[] {
  const info = isAdmin ? adminStageInfo : clientStageInfo;
  return stageOrder.map(stage => ({
    value: stage,
    label: info[stage].title
  }));
}
