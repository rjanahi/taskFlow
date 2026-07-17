'use client';

import {
  FormEvent,
  useState,
} from 'react';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useRouter,
} from 'next/navigation';
import {
  workItemKeys,
} from '@/hooks/use-work-items';
import {
  toDateTimeLocalValue,
} from '@/lib/date';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  deleteWorkItem,
  updateWorkItem,
} from '@/lib/work-items-api';
import {
  Priority,
  WorkItemDetail,
} from '@/types/work-item';

interface WorkItemEditPanelProps {
  item: WorkItemDetail;
}

export function WorkItemEditPanel(
  props: WorkItemEditPanelProps,
) {
  return (
    <WorkItemEditPanelForm
      key={props.item.id}
      {...props}
    />
  );
}

function WorkItemEditPanelForm({
  item,
}: WorkItemEditPanelProps) {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const [title, setTitle] =
    useState(item.title);

  const [
    description,
    setDescription,
  ] = useState(item.description);

  const [priority, setPriority] =
    useState<Priority>(
      item.priority,
    );

  const [category, setCategory] =
    useState(item.category);

  const [dueDate, setDueDate] =
    useState(
      toDateTimeLocalValue(
        item.dueDate,
      ),
    );

  const updateMutation =
    useMutation({
      mutationFn: () =>
        updateWorkItem(item.id, {
          title: title.trim(),
          description:
            description.trim(),
          priority,
          category:
            category.trim(),
          dueDate:
            new Date(
              dueDate,
            ).toISOString(),
        }),

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: () =>
        deleteWorkItem(item.id),

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );

        router.replace(
          '/work-items',
        );
      },
    });

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    updateMutation.mutate();
  }

  function handleDelete(): void {
    const confirmed =
      window.confirm(
        `Delete “${item.title}”? This cannot be undone.`,
      );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  const error =
    updateMutation.isError
      ? getErrorMessage(
          updateMutation.error,
        )
      : deleteMutation.isError
        ? getErrorMessage(
            deleteMutation.error,
          )
        : null;

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <summary className="cursor-pointer font-semibold">
        Edit work item
      </summary>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {updateMutation.isSuccess ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Work item updated.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-5 space-y-4"
      >
        <div>
          <label
            htmlFor="edit-title"
            className="block text-sm font-medium"
          >
            Title
          </label>

          <input
            id="edit-title"
            required
            minLength={3}
            maxLength={200}
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="edit-description"
            className="block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="edit-description"
            required
            maxLength={5000}
            rows={5}
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-priority"
              className="block text-sm font-medium"
            >
              Priority
            </label>

            <select
              id="edit-priority"
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target
                    .value as Priority,
                )
              }
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="LOW">
                Low
              </option>
              <option value="MEDIUM">
                Medium
              </option>
              <option value="HIGH">
                High
              </option>
              <option value="URGENT">
                Urgent
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-category"
              className="block text-sm font-medium"
            >
              Category
            </label>

            <input
              id="edit-category"
              required
              minLength={2}
              maxLength={100}
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value,
                )
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-due-date"
            className="block text-sm font-medium"
          >
            Due date and time
          </label>

          <input
            id="edit-due-date"
            type="datetime-local"
            required
            value={dueDate}
            onChange={(event) =>
              setDueDate(
                event.target.value,
              )
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={
            updateMutation.isPending
          }
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {updateMutation.isPending
            ? 'Saving...'
            : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 border-t border-red-100 pt-6">
        <h3 className="font-semibold text-red-800">
          Delete work item
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          This also deletes its
          assignments, activities,
          extension requests, and
          attachment.
        </p>

        <button
          type="button"
          disabled={
            deleteMutation.isPending
          }
          onClick={handleDelete}
          className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
        >
          {deleteMutation.isPending
            ? 'Deleting...'
            : 'Delete work item'}
        </button>
      </div>
    </details>
  );
}