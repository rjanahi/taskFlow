import { apiRequest } from './api';
import { AuthenticatedUser } from '@/types/auth';
import {
  AttachmentSummary,
  CreateWorkItemInput,
  WorkItemFilters,
  WorkItemSummary,
} from '@/types/work-item';

export async function getWorkItems(
  filters: WorkItemFilters = {},
): Promise<WorkItemSummary[]> {
  const searchParams = new URLSearchParams();

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