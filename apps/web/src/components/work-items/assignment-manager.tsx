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
  assignWorkItem,
} from '@/lib/work-items-api';
import {
  AuthenticatedUser,
} from '@/types/auth';
import {
  WorkItemDetail,
} from '@/types/work-item';

interface AssignmentManagerProps {
  item: WorkItemDetail;
  members: AuthenticatedUser[];
  membersLoading: boolean;
}

export function AssignmentManager({
  item,
  members,
  membersLoading,
}: AssignmentManagerProps) {
  const queryClient =
    useQueryClient();

  const currentIds = useMemo(
    () =>
      item.assignments.map(
        (assignment) =>
          assignment.member.id,
      ),
    [item.assignments],
  );

  const [selection, setSelection] =
    useState<{
      itemId: string;
      ids: string[];
    } | null>(null);

  const selectedIds =
    selection?.itemId === item.id
      ? selection.ids
      : currentIds;

  const assignmentMutation =
    useMutation({
      mutationFn: () =>
        assignWorkItem(
          item.id,
          selectedIds,
        ),

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: workItemKeys.all,
        });

        setSelection(null);
      },
    });

  const hasChanges =
    selectedIds.length !==
      currentIds.length ||
    selectedIds.some(
      (memberId) =>
        !currentIds.includes(
          memberId,
        ),
    );

  function toggleMember(
    memberId: string,
  ): void {
    setSelection((currentSelection) => {
      const currentSelectionIds =
        currentSelection?.itemId ===
        item.id
          ? currentSelection.ids
          : currentIds;

      const ids =
        currentSelectionIds.includes(
          memberId,
        )
          ? currentSelectionIds.filter(
              (id) => id !== memberId,
            )
          : [
              ...currentSelectionIds,
              memberId,
            ];

      return {
        itemId: item.id,
        ids,
      };
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">
        Assignees
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        Select all Members who should
        work on this item.
      </p>

      {assignmentMutation.isError ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {getErrorMessage(
            assignmentMutation.error,
          )}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {membersLoading ? (
          <p className="text-sm text-slate-500">
            Loading Members...
          </p>
        ) : null}

        {!membersLoading &&
        members.length === 0 ? (
          <p className="text-sm text-slate-500">
            No Member accounts are
            available.
          </p>
        ) : null}

        {members.map((member) => (
          <label
            key={member.id}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(
                member.id,
              )}
              onChange={() =>
                toggleMember(member.id)
              }
            />

            <span>
              <span className="block text-sm font-medium">
                {member.name}
              </span>

              <span className="block text-xs text-slate-500">
                {member.email}
              </span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={
          !hasChanges ||
          assignmentMutation.isPending
        }
        onClick={() =>
          assignmentMutation.mutate()
        }
        className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {assignmentMutation.isPending
          ? 'Saving...'
          : 'Save assignees'}
      </button>

      {selectedIds.length === 0 &&
      currentIds.length > 0 ? (
        <p className="mt-2 text-xs text-amber-700">
          Removing every assignee from
          an active item returns it to
          Backlog.
        </p>
      ) : null}
    </section>
  );
}