'use client';

import Link from 'next/link';
import {
  TimelineView,
} from '@/components/timeline/timeline-view';
import {
  useWorkItems,
} from '@/hooks/use-work-items';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  useAuth,
} from '@/providers/auth-provider';

export default function TimelinePage() {
  const { user } = useAuth();

  const workItemsQuery =
    useWorkItems({});

  if (!user) {
    return null;
  }

  const isManager =
    user.role === 'MANAGER';

  const items =
    workItemsQuery.data ?? [];

  const overdueCount =
    items.filter(
      (item) => item.isOverdue,
    ).length;

  const upcomingCount =
    items.filter((item) => {
      if (
        item.status === 'DONE' ||
        item.status ===
          'CANCELLED'
      ) {
        return false;
      }

      const dueDate =
        new Date(item.dueDate);

      const now = new Date();

      const sevenDaysFromNow =
        new Date(
          now.getTime() +
            7 *
              24 *
              60 *
              60 *
              1000,
        );

      return (
        dueDate >= now &&
        dueDate <=
          sevenDaysFromNow
      );
    }).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Deadlines
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Timeline
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            {isManager
              ? 'Track every work item by its due date and identify upcoming or overdue deadlines.'
              : 'Track your assigned work by due date and identify upcoming or overdue deadlines.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={
              workItemsQuery.isFetching
            }
            onClick={() =>
              void workItemsQuery.refetch()
            }
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            {workItemsQuery.isFetching
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          {isManager ? (
            <Link
              href="/work-items/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Create work item
            </Link>
          ) : null}
        </div>
      </div>

      {workItemsQuery.isSuccess &&
      items.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Visible items
            </p>

            <p className="mt-2 text-2xl font-bold">
              {items.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Due in seven days
            </p>

            <p className="mt-2 text-2xl font-bold">
              {upcomingCount}
            </p>
          </div>

          <div
            className={[
              'rounded-xl border bg-white p-4 shadow-sm',
              overdueCount > 0
                ? 'border-red-300'
                : 'border-slate-200',
            ].join(' ')}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Overdue
            </p>

            <p
              className={[
                'mt-2 text-2xl font-bold',
                overdueCount > 0
                  ? 'text-red-700'
                  : '',
              ].join(' ')}
            >
              {overdueCount}
            </p>
          </div>
        </div>
      ) : null}

      {workItemsQuery.isPending ? (
        <div
          aria-label="Loading timeline"
          className="mt-8"
        >
          <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />

          <div className="mt-6 flex min-w-max gap-4 overflow-hidden">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-[540px] w-[250px] shrink-0 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      ) : null}

      {workItemsQuery.isError ? (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6"
        >
          <h2 className="font-semibold text-red-900">
            The timeline could not
            be loaded
          </h2>

          <p className="mt-2 text-sm text-red-800">
            {getErrorMessage(
              workItemsQuery.error,
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              void workItemsQuery.refetch()
            }
            className="mt-4 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-900"
          >
            Try again
          </button>
        </div>
      ) : null}

      {workItemsQuery.isSuccess &&
      items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">
            No deadlines to display
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {isManager
              ? 'Create a work item to begin using the timeline.'
              : 'No work is currently assigned to you.'}
          </p>

          {isManager ? (
            <Link
              href="/work-items/new"
              className="mt-5 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create work item
            </Link>
          ) : null}
        </div>
      ) : null}

      {workItemsQuery.isSuccess &&
      items.length > 0 ? (
        <div className="mt-8">
          <TimelineView
            items={items}
            isUpdating={
              workItemsQuery.isFetching
            }
          />
        </div>
      ) : null}
    </div>
  );
}