import {
  apiRequest,
  apiRequestBlob,
} from './api';
import { AuthenticatedUser } from '@/types/auth';
import {
  AttachmentSummary,
  CreateTimeExtensionInput,
  CreateWorkItemInput,
  TimeExtensionRequest,
  UpdateWorkItemInput,
  WorkflowAction,
  WorkItemDetail,
  WorkItemFilters,
  WorkItemSummary,
} from '@/types/work-item';

export async function getWorkItems(
  filters: WorkItemFilters = {},
): Promise<WorkItemSummary[]> {
  const searchParams =
    new URLSearchParams();

  if (filters.status) {
    searchParams.set(
      'status',
      filters.status,
    );
  }

  if (filters.priority) {
    searchParams.set(
      'priority',
      filters.priority,
    );
  }

  if (filters.assigneeId) {
    searchParams.set(
      'assigneeId',
      filters.assigneeId,
    );
  }

  const queryString =
    searchParams.toString();

  return apiRequest<WorkItemSummary[]>(
    `/work-items${
      queryString
        ? `?${queryString}`
        : ''
    }`,
  );
}

export async function getWorkItem(
  workItemId: string,
): Promise<WorkItemDetail> {
  return apiRequest<WorkItemDetail>(
    `/work-items/${workItemId}`,
  );
}

export async function getMembers():
  Promise<AuthenticatedUser[]> {
  return apiRequest<AuthenticatedUser[]>(
    '/users/members',
  );
}

export async function createWorkItem(
  input: CreateWorkItemInput,
): Promise<WorkItemSummary> {
  return apiRequest<WorkItemSummary>(
    '/work-items',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateWorkItem(
  workItemId: string,
  input: UpdateWorkItemInput,
): Promise<WorkItemDetail> {
  return apiRequest<WorkItemDetail>(
    `/work-items/${workItemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteWorkItem(
  workItemId: string,
): Promise<void> {
  return apiRequest<void>(
    `/work-items/${workItemId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function assignWorkItem(
  workItemId: string,
  memberIds: string[],
): Promise<WorkItemDetail> {
  return apiRequest<WorkItemDetail>(
    `/work-items/${workItemId}/assignees`,
    {
      method: 'PUT',
      body: JSON.stringify({
        memberIds,
      }),
    },
  );
}

export async function performWorkflowAction(
  workItemId: string,
  action: WorkflowAction,
  note?: string,
): Promise<WorkItemDetail> {
  const needsBody =
    action === 'send-back' ||
    action === 'cancel' ||
    action === 'reopen';

  return apiRequest<WorkItemDetail>(
    `/work-items/${workItemId}/actions/${action}`,
    {
      method: 'POST',

      body: needsBody
        ? JSON.stringify({
            note: note?.trim() || undefined,
          })
        : undefined,
    },
  );
}

export async function createTimeExtensionRequest(
  workItemId: string,
  input: CreateTimeExtensionInput,
): Promise<TimeExtensionRequest> {
  return apiRequest<TimeExtensionRequest>(
    `/work-items/${workItemId}/time-extension-requests`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function reviewTimeExtensionRequest(
  requestId: string,
  decision: 'approve' | 'reject',
  note?: string,
): Promise<TimeExtensionRequest> {
  return apiRequest<TimeExtensionRequest>(
    `/time-extension-requests/${requestId}/${decision}`,
    {
      method: 'POST',
      body: JSON.stringify({
        note: note?.trim() || undefined,
      }),
    },
  );
}

export async function uploadWorkItemAttachment(
  workItemId: string,
  file: File,
): Promise<AttachmentSummary> {
  const formData = new FormData();

  formData.append('file', file);

  return apiRequest<AttachmentSummary>(
    `/work-items/${workItemId}/attachment`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function removeWorkItemAttachment(
  workItemId: string,
): Promise<void> {
  return apiRequest<void>(
    `/work-items/${workItemId}/attachment`,
    {
      method: 'DELETE',
    },
  );
}

export async function getWorkItemAttachmentBlob(
  workItemId: string,
): Promise<Blob> {
  return apiRequestBlob(
    `/work-items/${workItemId}/attachment`,
  );
}