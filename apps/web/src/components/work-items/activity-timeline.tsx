import {
  formatDateTime,
} from '@/lib/date';
import {
  Activity,
  ActivityAction,
} from '@/types/work-item';

interface ActivityTimelineProps {
  activities: Activity[];
}

const actionLabels:
  Record<ActivityAction, string> = {
    ITEM_CREATED:
      'created the work item',
    ITEM_UPDATED:
      'updated the work item',
    MEMBERS_ASSIGNED:
      'assigned Members',
    MEMBERS_REASSIGNED:
      'changed the assignees',
    MEMBERS_REMOVED:
      'removed the assignees',
    WORK_STARTED:
      'started work',
    SUBMITTED_FOR_REVIEW:
      'submitted the item for review',
    REVIEW_ACCEPTED:
      'accepted the completed work',
    SENT_BACK:
      'sent the item back',
    ITEM_CANCELLED:
      'cancelled the item',
    ITEM_REOPENED:
      'reopened the item',
    STATUS_CHANGED:
      'changed the status',
    TIME_EXTENSION_REQUESTED:
      'requested more time',
    TIME_EXTENSION_APPROVED:
      'approved a time extension',
    TIME_EXTENSION_REJECTED:
      'rejected a time extension',
    ATTACHMENT_ADDED:
      'added an attachment',
    ATTACHMENT_REPLACED:
      'replaced the attachment',
    ATTACHMENT_REMOVED:
      'removed the attachment',
    RETURNED_TO_BACKLOG:
      'returned the item to Backlog',
  };

function getDetailText(
  activity: Activity,
): string | null {
  const details =
    activity.details;

  if (!details) {
    return null;
  }

  if (
    typeof details.note ===
    'string'
  ) {
    return details.note;
  }

  if (
    typeof details.reason ===
    'string'
  ) {
    return details.reason;
  }

  if (
    Array.isArray(
      details.newMemberNames,
    )
  ) {
    const names =
      details.newMemberNames.filter(
        (
          value,
        ): value is string =>
          typeof value ===
          'string',
      );

    return names.length > 0
      ? `Assigned to ${names.join(', ')}`
      : 'All assignees removed';
  }

  if (
    Array.isArray(
      details.changedFields,
    )
  ) {
    const fields =
      details.changedFields.filter(
        (
          value,
        ): value is string =>
          typeof value ===
          'string',
      );

    if (fields.length > 0) {
      return `Changed: ${fields.join(', ')}`;
    }
  }

  return null;
}

export function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {
  const newestFirst = [
    ...activities,
  ].reverse();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">
        Activity timeline
      </h2>

      {newestFirst.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No activity has been
          recorded.
        </p>
      ) : (
        <ol className="mt-6 space-y-0">
          {newestFirst.map(
            (activity, index) => {
              const detailText =
                getDetailText(
                  activity,
                );

              return (
                <li
                  key={activity.id}
                  className="relative grid grid-cols-[24px_1fr] gap-3 pb-6"
                >
                  {index <
                  newestFirst.length -
                    1 ? (
                    <span className="absolute left-[11px] top-5 h-full w-px bg-slate-200" />
                  ) : null}

                  <span className="relative mt-1 h-6 w-6 rounded-full border-4 border-white bg-slate-900" />

                  <div>
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold">
                        {activity.actor
                          ?.name ??
                          'System'}
                      </span>{' '}
                      {
                        actionLabels[
                          activity
                            .action
                        ]
                      }
                    </p>

                    {activity.fromStatus &&
                    activity.toStatus ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {
                          activity.fromStatus
                        }{' '}
                        →{' '}
                        {
                          activity.toStatus
                        }
                      </p>
                    ) : null}

                    {detailText ? (
                      <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {detailText}
                      </p>
                    ) : null}

                    <time className="mt-2 block text-xs text-slate-500">
                      {formatDateTime(
                        activity.createdAt,
                      )}
                    </time>
                  </div>
                </li>
              );
            },
          )}
        </ol>
      )}
    </section>
  );
}