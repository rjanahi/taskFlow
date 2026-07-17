'use client';

import Link from 'next/link';
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
  useRouter,
} from 'next/navigation';
import {
  workItemKeys,
} from '@/hooks/use-work-items-ts';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  createWorkItem,
  uploadWorkItemAttachment,
} from '@/lib/work-items-api';
import {
  useAuth,
} from '@/providers/auth-provider';
import {
  CreateWorkItemInput,
  Priority,
  WorkItemSummary,
} from '@/types/work-item';

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

interface CreateMutationInput {
  input: CreateWorkItemInput;
  file: File | null;
}

interface CreateMutationResult {
  item: WorkItemSummary;
  attachmentWarning?: string;
}

export default function NewWorkItemPage() {
  const router = useRouter();

  const queryClient =
    useQueryClient();

  const { user } = useAuth();

  const [title, setTitle] =
    useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [priority, setPriority] =
    useState<Priority>('MEDIUM');

  const [category, setCategory] =
    useState('');

  const [dueDate, setDueDate] =
    useState('');

  const [file, setFile] =
    useState<File | null>(null);

  const [
    clientError,
    setClientError,
  ] = useState<string | null>(
    null,
  );

  const [
    createdItem,
    setCreatedItem,
  ] =
    useState<WorkItemSummary | null>(
      null,
    );

  const [
    attachmentWarning,
    setAttachmentWarning,
  ] = useState<string | null>(
    null,
  );

  const isManager =
    user?.role === 'MANAGER';

  useEffect(() => {
    if (
      user &&
      user.role !== 'MANAGER'
    ) {
      router.replace('/dashboard');
    }
  }, [
    router,
    user,
  ]);

  const createMutation =
    useMutation({
      mutationFn: async ({
        input,
        file: selectedFile,
      }: CreateMutationInput):
        Promise<CreateMutationResult> => {
        const item =
          await createWorkItem(input);

        if (!selectedFile) {
          return {
            item,
          };
        }

        try {
          await uploadWorkItemAttachment(
            item.id,
            selectedFile,
          );

          return {
            item,
          };
        } catch (
          attachmentError: unknown
        ) {
          return {
            item,

            attachmentWarning:
              getErrorMessage(
                attachmentError,
              ),
          };
        }
      },

      onSuccess: async (result) => {
        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );

        if (
          result.attachmentWarning
        ) {
          setCreatedItem(
            result.item,
          );

          setAttachmentWarning(
            result.attachmentWarning,
          );

          return;
        }

        router.push('/work-items');
      },
    });

  if (!user || !isManager) {
    return null;
  }

  function handleFileChange(
    selectedFile: File | null,
  ): void {
    setClientError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      !ACCEPTED_FILE_TYPES.includes(
        selectedFile.type,
      )
    ) {
      setFile(null);

      setClientError(
        'Only JPEG, PNG and WebP images are allowed.',
      );

      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setFile(null);

      setClientError(
        'The image must be 5 MB or smaller.',
      );

      return;
    }

    setFile(selectedFile);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setClientError(null);

    const parsedDueDate =
      new Date(dueDate);

    if (
      Number.isNaN(
        parsedDueDate.getTime(),
      )
    ) {
      setClientError(
        'Enter a valid due date and time.',
      );

      return;
    }

    createMutation.mutate({
      input: {
        title: title.trim(),
        description:
          description.trim(),
        priority,
        category:
          category.trim(),
        dueDate:
          parsedDueDate.toISOString(),
      },

      file,
    });
  }

  if (createdItem) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-950">
            Work item created
          </h1>

          <p className="mt-2 text-sm text-amber-900">
            “{createdItem.title}” was
            created successfully, but
            its attachment could not be
            uploaded.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            {attachmentWarning}
          </p>

          <Link
            href="/work-items"
            className="mt-5 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Go to work items
          </Link>
        </div>
      </div>
    );
  }

  const serverError =
    createMutation.isError
      ? getErrorMessage(
          createMutation.error,
        )
      : null;

  return (
    <div className="max-w-3xl">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Work items
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Create work item
        </h1>

        <p className="mt-2 text-slate-600">
          New work items begin in
          Backlog and can be assigned
          after creation.
        </p>
      </div>

      {clientError ||
      serverError ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {clientError ??
            serverError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium"
          >
            Title
          </label>

          <input
            id="title"
            required
            minLength={3}
            maxLength={200}
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
            placeholder="Set up new starter laptop"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="description"
            required
            maxLength={5000}
            rows={5}
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
            placeholder="Describe the required work and expected result."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="priority"
              className="mb-1 block text-sm font-medium"
            >
              Priority
            </label>

            <select
              id="priority"
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target
                    .value as Priority,
                )
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
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
              htmlFor="category"
              className="mb-1 block text-sm font-medium"
            >
              Category
            </label>

            <input
              id="category"
              required
              minLength={2}
              maxLength={100}
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value,
                )
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              placeholder="Hardware"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="due-date"
            className="mb-1 block text-sm font-medium"
          >
            Due date and time
          </label>

          <input
            id="due-date"
            type="datetime-local"
            required
            value={dueDate}
            onChange={(event) =>
              setDueDate(
                event.target.value,
              )
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />

          <p className="mt-1 text-xs text-slate-500">
            Enter the deadline in
            your local time.
          </p>
        </div>

        <div>
          <label
            htmlFor="attachment"
            className="mb-1 block text-sm font-medium"
          >
            Sketch or screenshot
          </label>

          <input
            id="attachment"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) =>
              handleFileChange(
                event.target
                  .files?.[0] ??
                  null,
              )
            }
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />

          <p className="mt-1 text-xs text-slate-500">
            Optional. JPEG, PNG or
            WebP, up to 5 MB.
          </p>

          {file ? (
            <p className="mt-2 text-sm font-medium text-slate-700">
              Selected: {file.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={
              createMutation.isPending
            }
            className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending
              ? 'Creating...'
              : 'Create work item'}
          </button>

          <Link
            href="/work-items"
            className="rounded-md border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}