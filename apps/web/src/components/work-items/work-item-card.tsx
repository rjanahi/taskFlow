import {
  PriorityBadge,
} from './priority-badge';
import {
  StatusBadge,
} from './status-badge';
import {
  WorkItemSummary,
} from '@/types/work-item';
import Link from 'next/link';

interface WorkItemCardProps {
  item: WorkItemSummary;
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

export function WorkItemCard({
  item,
}: WorkItemCardProps) {
  return (
    <article
      className={[
        'rounded-xl border bg-white p-5 shadow-sm',
        item.isOverdue
          ? 'border-red-300'
          : 'border-slate-200',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.category}
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            {item.title}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={item.status}
          />

          <PriorityBadge
            priority={item.priority}
          />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {item.description}
      </p>

      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Due
          </p>

          <p
            className={[
              'mt-1 font-medium',
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
            <p className="mt-1 text-xs font-semibold text-red-700">
              Overdue
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Assigned to
          </p>

          {item.assignments.length >
          0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.assignments.map(
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
            </div>
          ) : (
            <p className="mt-1 text-slate-500">
              Unassigned
            </p>
          )}
        </div>
      </div>

      {item.attachment ? (
        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Attachment:{' '}
          <span className="font-medium">
            {
              item.attachment
                .originalName
            }
          </span>
        </div>
      ) : null}

        <div className="mt-5 border-t border-slate-100 pt-4">
            <Link
                href={`/work-items/${item.id}`}
                className="text-sm font-semibold text-slate-900 underline"
            >
                View details
            </Link>
        </div>
    </article>
  );
}