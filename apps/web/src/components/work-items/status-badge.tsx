import {
  WorkItemStatus,
} from '@/types/work-item';

interface StatusBadgeProps {
  status: WorkItemStatus;
}

const statusLabels:
  Record<WorkItemStatus, string> = {
    BACKLOG: 'Backlog',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
  };

const statusClasses:
  Record<WorkItemStatus, string> = {
    BACKLOG:
      'bg-slate-100 text-slate-700',
    ASSIGNED:
      'bg-blue-100 text-blue-800',
    IN_PROGRESS:
      'bg-amber-100 text-amber-800',
    IN_REVIEW:
      'bg-purple-100 text-purple-800',
    DONE:
      'bg-emerald-100 text-emerald-800',
    CANCELLED:
      'bg-rose-100 text-rose-800',
  };

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        statusClasses[status],
      ].join(' ')}
    >
      {statusLabels[status]}
    </span>
  );
}