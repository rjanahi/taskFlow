import {
  WorkItemStatus,
} from '@/types/work-item';

export interface WorkflowPhase {
  status: WorkItemStatus;
  label: string;
  description: string;
  accentClass: string;
  backgroundClass: string;
}

export const WORKFLOW_PHASES:
  readonly WorkflowPhase[] = [
    {
      status: 'BACKLOG',
      label: 'Backlog',
      description:
        'Items waiting to be assigned.',
      accentClass: 'bg-slate-500',
      backgroundClass:
        'bg-slate-50',
    },
    {
      status: 'ASSIGNED',
      label: 'Assigned',
      description:
        'Items assigned to team members.',
      accentClass: 'bg-blue-500',
      backgroundClass:
        'bg-blue-50/40',
    },
    {
      status: 'IN_PROGRESS',
      label: 'In Progress',
      description:
        'Items currently being worked on.',
      accentClass: 'bg-amber-500',
      backgroundClass:
        'bg-amber-50/40',
    },
    {
      status: 'IN_REVIEW',
      label: 'In Review',
      description:
        'Items awaiting Manager review.',
      accentClass: 'bg-purple-500',
      backgroundClass:
        'bg-purple-50/40',
    },
    {
      status: 'DONE',
      label: 'Done',
      description:
        'Items accepted as complete.',
      accentClass: 'bg-emerald-500',
      backgroundClass:
        'bg-emerald-50/40',
    },
    {
      status: 'CANCELLED',
      label: 'Cancelled',
      description:
        'Items that are no longer active.',
      accentClass: 'bg-rose-500',
      backgroundClass:
        'bg-rose-50/40',
    },
  ];