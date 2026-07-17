import {
  Priority,
} from '@/types/work-item';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityLabels:
  Record<Priority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };

const priorityClasses:
  Record<Priority, string> = {
    LOW:
      'border-slate-300 text-slate-600',
    MEDIUM:
      'border-blue-300 text-blue-700',
    HIGH:
      'border-orange-300 text-orange-700',
    URGENT:
      'border-red-300 bg-red-50 text-red-800',
  };

export function PriorityBadge({
  priority,
}: PriorityBadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
        priorityClasses[priority],
      ].join(' ')}
    >
      {priorityLabels[priority]}
    </span>
  );
}