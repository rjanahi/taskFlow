'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  workItemKeys,
} from '@/hooks/use-work-items';
import {
  formatDateTime,
  toDateTimeLocalValue,
} from '@/lib/date';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  createTimeExtensionRequest,
  reviewTimeExtensionRequest,
} from '@/lib/work-items-api';
import {
  AuthenticatedUser,
} from '@/types/auth';
import {
  TimeExtensionRequest,
  WorkItemDetail,
} from '@/types/work-item';

interface TimeExtensionPanelProps {
  item: WorkItemDetail;
  user: AuthenticatedUser;
}

interface RequestCardProps {
  request: TimeExtensionRequest;
  isManager: boolean;
  workItemId: string;
}

function RequestCard({
  request,
  isManager,
  workItemId,
}: RequestCardProps) {
  const queryClient =
    useQueryClient();

  const [note, setNote] =
    useState('');

  const reviewMutation =
    useMutation({
      mutationFn: (
        decision:
          | 'approve'
          | 'reject',
      ) =>
        reviewTimeExtensionRequest(
          request.id,
          decision,
          note,
        ),

      onSuccess: async () => {
        setNote('');

        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );
      },
    });

  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {request.requestedBy.name}
        </p>

        <span
          className={[
            'rounded-full px-2 py-1 text-xs font-semibold',
            request.status ===
            'PENDING'
              ? 'bg-amber-100 text-amber-800'
              : request.status ===
                  'APPROVED'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800',
          ].join(' ')}
        >
          {request.status}
        </span>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-slate-500">
            Current deadline
          </dt>

          <dd className="font-medium">
            {formatDateTime(
              request.currentDueDate,
            )}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">
            Proposed deadline
          </dt>

          <dd className="font-medium">
            {formatDateTime(
              request.proposedDueDate,
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-slate-700">
        {request.reason}
      </p>

      {request.reviewNote ? (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span className="font-medium">
            Manager note:
          </span>{' '}
          {request.reviewNote}
        </div>
      ) : null}

      {isManager &&
      request.status === 'PENDING' ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {reviewMutation.isError ? (
            <div
              role="alert"
              className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {getErrorMessage(
                reviewMutation.error,
              )}
            </div>
          ) : null}

          <label
            htmlFor={`review-note-${request.id}`}
            className="block text-sm font-medium"
          >
            Review note
          </label>

          <textarea
            id={`review-note-${request.id}`}
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Optional note"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={
                reviewMutation.isPending
              }
              onClick={() =>
                reviewMutation.mutate(
                  'approve',
                )
              }
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              disabled={
                reviewMutation.isPending
              }
              onClick={() =>
                reviewMutation.mutate(
                  'reject',
                )
              }
              className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      <span className="sr-only">
        Work item {workItemId}
      </span>
    </article>
  );
}

export function TimeExtensionPanel({
  item,
  user,
}: TimeExtensionPanelProps) {
  const queryClient =
    useQueryClient();

  const [proposedDueDate, setProposedDueDate] =
    useState('');

  const [reason, setReason] =
    useState('');

  const [clientError, setClientError] =
    useState<string | null>(null);

  const isManager =
    user.role === 'MANAGER';

  const isAssignedMember =
    user.role === 'MEMBER' &&
    item.assignments.some(
      (assignment) =>
        assignment.member.id ===
        user.id,
    );

  const isTerminal =
    item.status === 'DONE' ||
    item.status === 'CANCELLED';

  const pendingRequest =
    item.timeExtensionRequests.find(
      (request) =>
        request.status ===
        'PENDING',
    );

  useEffect(() => {
    const currentDueDate =
      new Date(item.dueDate);

    const suggestedDate =
      new Date(
        currentDueDate.getTime() +
          24 * 60 * 60 * 1000,
      );

    setProposedDueDate(
      toDateTimeLocalValue(
        suggestedDate,
      ),
    );
  }, [item.dueDate]);

  const requestMutation =
    useMutation({
      mutationFn: () =>
        createTimeExtensionRequest(
          item.id,
          {
            proposedDueDate:
              new Date(
                proposedDueDate,
              ).toISOString(),

            reason: reason.trim(),
          },
        ),

      onSuccess: async () => {
        setReason('');

        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );
      },
    });

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    setClientError(null);

    const proposed =
      new Date(proposedDueDate);

    if (
      Number.isNaN(
        proposed.getTime(),
      )
    ) {
      setClientError(
        'Enter a valid proposed date.',
      );

      return;
    }

    if (
      proposed <=
      new Date(item.dueDate)
    ) {
      setClientError(
        'The proposed date must be later than the current due date.',
      );

      return;
    }

    requestMutation.mutate();
  }

  const requestError =
    clientError ??
    (requestMutation.isError
      ? getErrorMessage(
          requestMutation.error,
        )
      : null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">
        Time extensions
      </h2>

      {!isManager &&
      isAssignedMember &&
      !isTerminal ? (
        <div className="mt-4">
          {pendingRequest ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              A time-extension request
              is awaiting Manager
              review.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {requestError ? (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {requestError}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="proposed-due-date"
                  className="block text-sm font-medium"
                >
                  Proposed deadline
                </label>

                <input
                  id="proposed-due-date"
                  type="datetime-local"
                  required
                  value={
                    proposedDueDate
                  }
                  onChange={(event) =>
                    setProposedDueDate(
                      event.target
                        .value,
                    )
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="extension-reason"
                  className="block text-sm font-medium"
                >
                  Reason
                </label>

                <textarea
                  id="extension-reason"
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target
                        .value,
                    )
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={
                  requestMutation.isPending
                }
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {requestMutation.isPending
                  ? 'Submitting...'
                  : 'Request more time'}
              </button>
            </form>
          )}
        </div>
      ) : null}

      {item.timeExtensionRequests
        .length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No time-extension requests.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {item.timeExtensionRequests.map(
            (request) => (
              <RequestCard
                key={request.id}
                request={request}
                isManager={isManager}
                workItemId={item.id}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}