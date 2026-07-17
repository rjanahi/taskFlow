'use client';

import {
  ChangeEvent,
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
  removeWorkItemAttachment,
  uploadWorkItemAttachment,
} from '@/lib/work-items-api';
import {
  AttachmentSummary,
} from '@/types/work-item';
import {
  AuthenticatedAttachment,
} from './authenticated-attachment';

interface AttachmentPanelProps {
  workItemId: string;
  attachment: AttachmentSummary | null;
  isManager: boolean;
}

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function AttachmentPanel({
  workItemId,
  attachment,
  isManager,
}: AttachmentPanelProps) {
  const queryClient =
    useQueryClient();

  const [file, setFile] =
    useState<File | null>(null);

  const [clientError, setClientError] =
    useState<string | null>(null);

  const uploadMutation =
    useMutation({
      mutationFn: (
        selectedFile: File,
      ) =>
        uploadWorkItemAttachment(
          workItemId,
          selectedFile,
        ),

      onSuccess: async () => {
        setFile(null);

        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );
      },
    });

  const removeMutation =
    useMutation({
      mutationFn: () =>
        removeWorkItemAttachment(
          workItemId,
        ),

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey:
              workItemKeys.all,
          },
        );
      },
    });

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setClientError(null);

    const selectedFile =
      event.target.files?.[0] ??
      null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      !ACCEPTED_TYPES.includes(
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

  function handleRemove(): void {
    const confirmed =
      window.confirm(
        'Remove this attachment?',
      );

    if (confirmed) {
      removeMutation.mutate();
    }
  }

  const error =
    clientError ??
    (uploadMutation.isError
      ? getErrorMessage(
          uploadMutation.error,
        )
      : null) ??
    (removeMutation.isError
      ? getErrorMessage(
          removeMutation.error,
        )
      : null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">
        Attachment
      </h2>

      <div className="mt-4">
        {attachment ? (
          <AuthenticatedAttachment
            workItemId={workItemId}
            attachment={attachment}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
            No sketch or screenshot
            attached.
          </div>
        )}
      </div>

      {isManager ? (
        <div className="mt-5 border-t border-slate-100 pt-5">
          {error ? (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          ) : null}

          <label
            htmlFor="detail-attachment"
            className="block text-sm font-medium"
          >
            {attachment
              ? 'Replace image'
              : 'Upload image'}
          </label>

          <input
            id="detail-attachment"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleFileChange
            }
            className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          {file ? (
            <p className="mt-2 text-sm text-slate-600">
              Selected: {file.name}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                !file ||
                uploadMutation.isPending
              }
              onClick={() => {
                if (file) {
                  uploadMutation.mutate(
                    file,
                  );
                }
              }}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {uploadMutation.isPending
                ? 'Uploading...'
                : attachment
                  ? 'Replace image'
                  : 'Upload image'}
            </button>

            {attachment ? (
              <button
                type="button"
                disabled={
                  removeMutation.isPending
                }
                onClick={handleRemove}
                className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending
                  ? 'Removing...'
                  : 'Remove image'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}