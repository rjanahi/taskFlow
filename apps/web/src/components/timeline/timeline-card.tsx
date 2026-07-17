import Link from 'next/link';
import {
  formatTimelineTime,
  getDaysUntil,
} from '@/lib/timeline-date';
import {
  WorkItemSummary,
} from '@/types/work-item';
import {
  PriorityBadge,
} from '../work-items/priority-badge';
import {
  StatusBadge,
} from '../work-items/status-badge';

interface TimelineCardProps {
  item: WorkItemSummary;
}

function getDeadlineLabel(
  item: WorkItemSummary,
): string | null {
  if (
    item.status === 'DONE' ||
    item.status === 'CANCELLED'
  ) {
    return null;
  }

  const daysUntil =
    getDaysUntil(item.dueDate);

  if (item.isOverdue) {
    const daysOverdue =
      Math.abs(daysUntil);

    if (daysOverdue === 0) {
      return 'Overdue';
    }

    return `${daysOverdue} ${
      daysOverdue === 1
        ? 'day'
        : 'days'
    } overdue`;
  }

  if (daysUntil === 0) {
    return 'Due today';
  }

  if (daysUntil === 1) {
    return 'Due tomorrow';
  }

  return null;
}

export function TimelineCard({
  item,
}: TimelineCardProps) {
  const deadlineLabel =
    getDeadlineLabel(item);

  const visibleAssignees =
    item.assignments.slice(0, 2);

  const remainingCount =
    Math.max(
      item.assignments.length - 2,
      0,
    );

  return (
    <article
      className={[
        'rounded-lg border bg-white shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md',
        item.isOverdue
          ? 'border-red-300 ring-1 ring-red-100'
          : 'border-slate-200',
      ].join(' ')}
    >
      <Link
        href={`/work-items/${item.id}`}
        className="block rounded-lg p-4 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={[
              'text-sm font-semibold',
              item.isOverdue
                ? 'text-red-700'
                : 'text-slate-900',
            ].join(' ')}
          >
            {formatTimelineTime(
              item.dueDate,
            )}
          </p>

          {item.isOverdue ? (
            <span className="rounded-full bg-red-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Overdue
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          {item.category}
        </p>

        <h3 className="mt-1 font-semibold leading-5 text-slate-950">
          {item.title}
        </h3>

        <p className="mt-2 max-h-15 overflow-hidden text-sm leading-5 text-slate-600">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <StatusBadge
            status={item.status}
          />

          <PriorityBadge
            priority={item.priority}
          />
        </div>

        {deadlineLabel ? (
          <p
            className={[
              'mt-3 text-xs font-semibold',
              item.isOverdue
                ? 'text-red-700'
                : 'text-amber-700',
            ].join(' ')}
          >
            {deadlineLabel}
          </p>
        ) : null}

        <div className="mt-4 border-t border-slate-100 pt-3">
          {item.assignments.length ===
          0 ? (
            <p className="text-xs text-slate-500">
              Unassigned
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {visibleAssignees.map(
                (assignment) => (
                  <span
                    key={
                      assignment.member.id
                    }
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    {
                      assignment.member
                        .name
                    }
                  </span>
                ),
              )}

              {remainingCount > 0 ? (
                <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                  +{remainingCount}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}