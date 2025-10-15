// Unified Project Stage System
// This file contains the stage definitions, mappings, and helper functions

export type ProjectStage = 
  | 'submitted'
  | 'reviewing'
  | 'invoice_sent'
  | 'payment_pending'
  | 'in_progress'
  | 'review_needed'
  | 'completed';

// Client-facing stage information
export const clientStageInfo = {
  submitted: {
    title: 'Project Submitted',
    description: 'We have received your project requirements and will start reviewing them shortly.',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: '📝',
    actionRequired: false,
    nextStep: 'Our team will review your requirements'
  },
  reviewing: {
    title: 'Under Review',
    description: 'Our team is reviewing your requirements and preparing your project proposal.',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '👀',
    actionRequired: false,
    nextStep: 'We will send you an invoice shortly'
  },
  invoice_sent: {
    title: 'Invoice Sent',
    description: 'Your invoice has been sent to your email. Please review and proceed with payment.',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    icon: '📧',
    actionRequired: true,
    nextStep: 'Complete payment to begin development'
  },
  payment_pending: {
    title: 'Awaiting Payment',
    description: 'We are waiting for your payment confirmation to begin development.',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: '💳',
    actionRequired: true,
    nextStep: 'Complete your payment to proceed'
  },
  in_progress: {
    title: 'In Development',
    description: 'Your website is currently being built. We will update you on progress.',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: '🚀',
    actionRequired: false,
    nextStep: 'We will notify you when ready for review'
  },
  review_needed: {
    title: 'Ready for Review',
    description: 'Your website is ready! Please review it and provide any feedback.',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
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
  submitted: {
    title: 'Submitted',
    description: 'Client submitted project through onboarding',
    color: 'bg-yellow-100 text-yellow-800',
    adminActions: ['Review project', 'Send to reviewing', 'Request more info'],
    nextStage: 'reviewing'
  },
  reviewing: {
    title: 'Admin Review',
    description: 'Admin reviewing project requirements',
    color: 'bg-blue-100 text-blue-800',
    adminActions: ['Create invoice', 'Request changes', 'Approve project'],
    nextStage: 'invoice_sent'
  },
  invoice_sent: {
    title: 'Invoice Created',
    description: 'Invoice generated and sent to client',
    color: 'bg-orange-100 text-orange-800',
    adminActions: ['View invoice', 'Send reminder', 'Mark as paid'],
    nextStage: 'payment_pending'
  },
  payment_pending: {
    title: 'Awaiting Payment',
    description: 'Waiting for client payment confirmation',
    color: 'bg-red-100 text-red-800',
    adminActions: ['Confirm payment', 'Send reminder', 'Cancel project'],
    nextStage: 'in_progress'
  },
  in_progress: {
    title: 'In Development',
    description: 'Active design and development phase',
    color: 'bg-purple-100 text-purple-800',
    adminActions: ['Update progress', 'Add assets', 'Send for review'],
    nextStage: 'review_needed'
  },
  review_needed: {
    title: 'Client Review',
    description: 'Project ready, waiting for client feedback',
    color: 'bg-indigo-100 text-indigo-800',
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
  'submitted',
  'reviewing',
  'invoice_sent',
  'payment_pending',
  'in_progress',
  'review_needed',
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
    'submitted': 'submitted',
    'awaiting_invoice': 'invoice_sent',
    'approved': 'payment_pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'on_hold': 'reviewing',
    'pending': 'submitted',
    'cancelled': 'submitted' // Reset cancelled projects to submitted
  };
  
  return mapping[legacyStatus] || 'submitted';
}

// Get all available stages for dropdowns
export function getAllStages(isAdmin: boolean = false): { value: ProjectStage; label: string }[] {
  const info = isAdmin ? adminStageInfo : clientStageInfo;
  return stageOrder.map(stage => ({
    value: stage,
    label: info[stage].title
  }));
}
