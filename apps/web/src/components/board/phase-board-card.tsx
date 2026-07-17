import Link from 'next/link';
import {
  formatDateTime,
} from '@/lib/date';
import {
  WorkItemSummary,
} from '@/types/work-item';
import {
  PriorityBadge,
} from '../work-items/priority-badge';

interface PhaseBoardCardProps {
  item: WorkItemSummary;
}

export function PhaseBoardCard({
  item,
}: PhaseBoardCardProps) {
  const visibleAssignments =
    item.assignments.slice(0, 2);

  const remainingAssigneeCount =
    Math.max(
      item.assignments.length - 2,
      0,
    );

  return (
    <article
      className={[
        'rounded-lg border bg-white p-4 shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md',
        item.isOverdue
          ? 'border-red-300 ring-1 ring-red-100'
          : 'border-slate-200',
      ].join(' ')}
    >
      <Link
        href={`/work-items/${item.id}`}
        className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.category}
          </p>

          <PriorityBadge
            priority={item.priority}
          />
        </div>

        <h3 className="mt-3 font-semibold leading-5 text-slate-950">
          {item.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
          {item.description}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Due
          </p>

          <p
            className={[
              'mt-1 text-sm font-medium',
              item.isOverdue
                ? 'text-red-700'
                : 'text-slate-800',
            ].join(' ')}
          >
            {formatDateTime(
              item.dueDate,
            )}
          </p>

          {item.isOverdue ? (
            <span className="mt-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
              Overdue
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Assigned to
          </p>

          {item.assignments.length ===
          0 ? (
            <p className="mt-1 text-sm text-slate-500">
              Unassigned
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {visibleAssignments.map(
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

              {remainingAssigneeCount >
              0 ? (
                <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                  +
                  {
                    remainingAssigneeCount
                  }
                </span>
              ) : null}
            </div>
          )}
        </div>

        {item.attachment ? (
          <p className="mt-4 text-xs text-slate-500">
            Image attached
          </p>
        ) : null}
      </Link>
    </article>
  );
}