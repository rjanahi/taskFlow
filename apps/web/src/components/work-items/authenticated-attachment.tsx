'use client';

import Image from 'next/image';
import {
  useEffect,
  useMemo,
} from 'react';
import {
  useQuery,
} from '@tanstack/react-query';
import {
  workItemKeys,
} from '@/hooks/use-work-items';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  getWorkItemAttachmentBlob,
} from '@/lib/work-items-api';
import {
  AttachmentSummary,
} from '@/types/work-item';

interface AuthenticatedAttachmentProps {
  workItemId: string;
  attachment: AttachmentSummary;
}

export function AuthenticatedAttachment({
  workItemId,
  attachment,
}: AuthenticatedAttachmentProps) {

  

  const attachmentQuery = useQuery({
    queryKey:
      workItemKeys.attachment(
        workItemId,
        attachment.updatedAt,
      ),

    queryFn: () =>
      getWorkItemAttachmentBlob(
        workItemId,
      ),
  });

  const objectUrl = useMemo(() => {
  if (!attachmentQuery.data) {
    return null;
  }

  return URL.createObjectURL(
    attachmentQuery.data,
  );
}, [attachmentQuery.data]);

useEffect(() => {
  if (!objectUrl) {
    return;
  }

  return () => {
    URL.revokeObjectURL(objectUrl);
  };
}, [objectUrl]);

  if (attachmentQuery.isPending) {
    return (
      <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
    );
  }

  if (attachmentQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {getErrorMessage(
          attachmentQuery.error,
        )}
      </div>
    );
  }

  if (!objectUrl) {
    return null;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <Image
          src={objectUrl}
          alt={`Attachment: ${attachment.originalName}`}
          width={1200}
          height={800}
          unoptimized
          className="h-auto max-h-[600px] w-full object-contain"
        />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {attachment.originalName}
      </p>
    </div>
  );
}