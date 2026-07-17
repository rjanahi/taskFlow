'use client';

import Link from 'next/link';
import {
  useParams,
} from 'next/navigation';
import {
  ActivityTimeline,
} from '@/components/work-items/activity-timeline';
import {
  AssignmentManager,
} from '@/components/work-items/assignment-manager';
import {
  AttachmentPanel,
} from '@/components/work-items/attachment-panel';
import {
  PriorityBadge,
} from '@/components/work-items/priority-badge';
import {
  StatusBadge,
} from '@/components/work-items/status-badge';
import {
  TimeExtensionPanel,
} from '@/components/work-items/time-extension-panel';
import {
  WorkflowActions,
} from '@/components/work-items/workflow-actions';
import {
  WorkItemEditPanel,
} from '@/components/work-items/work-item-edit-panel';
import {
  useMembers,
  useWorkItem,
} from '@/hooks/use-work-items';
import {
  formatDateTime,
} from '@/lib/date';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  useAuth,
} from '@/providers/auth-provider';

export default function WorkItemDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const { user } = useAuth();

  const workItemQuery =
    useWorkItem(params.id);

  const isManager =
    user?.role === 'MANAGER';

  const membersQuery =
    useMembers(isManager);

  if (!user) {
    return null;
  }

  if (workItemQuery.isPending) {
    return (
      <div
        aria-label="Loading work item"
        className="space-y-5"
      >
        <div className="h-32 animate-pulse rounded-xl bg-white" />
        <div className="h-80 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (workItemQuery.isError) {
    return (
      <div>
        <Link
          href="/work-items"
          className="text-sm font-medium underline"
        >
          Back to work items
        </Link>

        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6"
        >
          <h1 className="text-xl font-bold text-red-900">
            Work item could not be
            loaded
          </h1>

          <p className="mt-2 text-sm text-red-800">
            {getErrorMessage(
              workItemQuery.error,
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              void workItemQuery.refetch()
            }
            className="mt-4 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const item =
    workItemQuery.data;

  return (
    <div>
      <Link
        href="/work-items"
        className="text-sm font-medium text-slate-600 underline"
      >
        Back to work items
      </Link>

      <header className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {item.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {item.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={item.status}
            />

            <PriorityBadge
              priority={
                item.priority
              }
            />

            {item.isOverdue ? (
              <span className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white">
                Overdue
              </span>
            ) : null}
          </div>
        </div>

        <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Due
            </dt>

            <dd
              className={[
                'mt-1 font-medium',
                item.isOverdue
                  ? 'text-red-700'
                  : '',
              ].join(' ')}
            >
              {formatDateTime(
                item.dueDate,
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Created by
            </dt>

            <dd className="mt-1 font-medium">
              {item.createdBy.name}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Created
            </dt>

            <dd className="mt-1 font-medium">
              {formatDateTime(
                item.createdAt,
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Description
            </h2>

            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
              {item.description}
            </p>
          </section>

          <AttachmentPanel
            workItemId={item.id}
            attachment={
              item.attachment
            }
            isManager={isManager}
          />

          <ActivityTimeline
            activities={
              item.activities
            }
          />

          {isManager ? (
            <WorkItemEditPanel
              item={item}
            />
          ) : null}
        </div>

        <aside className="space-y-6">
          <WorkflowActions
            item={item}
            user={user}
          />

          {isManager ? (
            <AssignmentManager
              item={item}
              members={
                membersQuery.data ??
                []
              }
              membersLoading={
                membersQuery.isPending
              }
            />
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">
                Assigned Members
              </h2>

              <div className="mt-3 space-y-2">
                {item.assignments.map(
                  (assignment) => (
                    <div
                      key={
                        assignment.member
                          .id
                      }
                      className="rounded-md bg-slate-50 px-3 py-2"
                    >
                      <p className="text-sm font-medium">
                        {
                          assignment.member
                            .name
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          assignment.member
                            .email
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          <TimeExtensionPanel
            item={item}
            user={user}
          />
        </aside>
      </div>
    </div>
  );
}