'use client';

import {
  useMemo,
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
  getErrorMessage,
} from '@/lib/errors';
import {
  performWorkflowAction,
} from '@/lib/work-items-api';
import {
  AuthenticatedUser,
} from '@/types/auth';
import {
  WorkflowAction,
  WorkItemDetail,
} from '@/types/work-item';

interface WorkflowActionsProps {
  item: WorkItemDetail;
  user: AuthenticatedUser;
}

interface ActionOption {
  action: WorkflowAction;
  label: string;
  requiresNote: boolean;
  destructive?: boolean;
}

export function WorkflowActions({
  item,
  user,
}: WorkflowActionsProps) {
  const queryClient =
    useQueryClient();

  const [
    selectedAction,
    setSelectedAction,
  ] =
    useState<WorkflowAction | null>(
      null,
    );

  const [note, setNote] =
    useState('');

  const actions = useMemo<
    ActionOption[]
  >(() => {
    if (user.role === 'MEMBER') {
      if (
        item.status === 'ASSIGNED'
      ) {
        return [
          {
            action: 'start',
            label: 'Start work',
            requiresNote: false,
          },
        ];
      }

      if (
        item.status ===
        'IN_PROGRESS'
      ) {
        return [
          {
            action:
              'submit-review',
            label:
              'Submit for review',
            requiresNote: false,
          },
        ];
      }

      return [];
    }

    const managerActions:
      ActionOption[] = [];

    if (
      item.status === 'IN_REVIEW'
    ) {
      managerActions.push(
        {
          action: 'accept',
          label: 'Accept as done',
          requiresNote: false,
        },
        {
          action: 'send-back',
          label: 'Send back',
          requiresNote: true,
        },
      );
    }

    if (
      [
        'BACKLOG',
        'ASSIGNED',
        'IN_PROGRESS',
        'IN_REVIEW',
      ].includes(item.status)
    ) {
      managerActions.push({
        action: 'cancel',
        label: 'Cancel item',
        requiresNote: true,
        destructive: true,
      });
    }

    if (
      item.status === 'DONE' ||
      item.status === 'CANCELLED'
    ) {
      managerActions.push({
        action: 'reopen',
        label: 'Reopen item',
        requiresNote: true,
      });
    }

    return managerActions;
  }, [item.status, user.role]);

  const workflowMutation =
    useMutation({
      mutationFn: ({
        action,
        actionNote,
      }: {
        action: WorkflowAction;
        actionNote?: string;
      }) =>
        performWorkflowAction(
          item.id,
          action,
          actionNote,
        ),

      onSuccess: async () => {
        setSelectedAction(null);
        setNote('');

        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );
      },
    });

  function selectAction(
    option: ActionOption,
  ): void {
    if (
      option.requiresNote
    ) {
      setSelectedAction(
        option.action,
      );

      return;
    }

    workflowMutation.mutate({
      action: option.action,
    });
  }

  function submitNotedAction(): void {
    if (!selectedAction) {
      return;
    }

    workflowMutation.mutate({
      action: selectedAction,
      actionNote: note,
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">
        Workflow actions
      </h2>

      {workflowMutation.isError ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {getErrorMessage(
            workflowMutation.error,
          )}
        </div>
      ) : null}

      {actions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No workflow action is
          available for your role at
          this phase.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {actions.map((option) => (
            <button
              key={option.action}
              type="button"
              disabled={
                workflowMutation.isPending
              }
              onClick={() =>
                selectAction(option)
              }
              className={[
                'w-full rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50',
                option.destructive
                  ? 'border-red-300 text-red-700 hover:bg-red-50'
                  : 'border-slate-300 hover:bg-slate-100',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {selectedAction ? (
        <div className="mt-4 rounded-md bg-slate-50 p-4">
          <label
            htmlFor="workflow-note"
            className="block text-sm font-medium"
          >
            Note
          </label>

          <textarea
            id="workflow-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value,
              )
            }
            placeholder="Optional explanation"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={
                workflowMutation.isPending
              }
              onClick={
                submitNotedAction
              }
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {workflowMutation.isPending
                ? 'Updating...'
                : 'Confirm'}
            </button>

            <button
              type="button"
              disabled={
                workflowMutation.isPending
              }
              onClick={() => {
                setSelectedAction(
                  null,
                );

                setNote('');
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              Back
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}