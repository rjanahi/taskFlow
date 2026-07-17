'use client';

import {
  useQuery,
} from '@tanstack/react-query';
import {
  getMembers,
  getWorkItem,
  getWorkItems,
} from '@/lib/work-items-api';
import {
  WorkItemFilters,
} from '@/types/work-item';

export const workItemKeys = {
  all: ['work-items'] as const,

  lists: () =>
    [
      ...workItemKeys.all,
      'list',
    ] as const,

  list: (
    filters: WorkItemFilters,
  ) =>
    [
      ...workItemKeys.lists(),
      filters,
    ] as const,

  details: () =>
    [
      ...workItemKeys.all,
      'detail',
    ] as const,

  detail: (workItemId: string) =>
    [
      ...workItemKeys.details(),
      workItemId,
    ] as const,

  attachment: (
    workItemId: string,
    version: string,
  ) =>
    [
      ...workItemKeys.detail(
        workItemId,
      ),
      'attachment',
      version,
    ] as const,
};

export const memberKeys = {
  all: ['members'] as const,
};

export function useWorkItems(
  filters: WorkItemFilters,
) {
  return useQuery({
    queryKey:
      workItemKeys.list(filters),

    queryFn: () =>
      getWorkItems(filters),
  });
}

export function useWorkItem(
  workItemId: string,
) {
  return useQuery({
    queryKey:
      workItemKeys.detail(
        workItemId,
      ),

    queryFn: () =>
      getWorkItem(workItemId),

    enabled: Boolean(workItemId),
  });
}

export function useMembers(
  enabled: boolean,
) {
  return useQuery({
    queryKey: memberKeys.all,
    queryFn: getMembers,
    enabled,
  });
}