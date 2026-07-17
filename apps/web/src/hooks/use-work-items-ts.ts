'use client';

import {
  useQuery,
} from '@tanstack/react-query';
import {
  getMembers,
  getWorkItems,
} from '@/lib/work-items-api';
import {
  WorkItemFilters,
} from '@/types/work-item';

export const workItemKeys = {
  all: ['work-items'] as const,

  list: (
    filters: WorkItemFilters,
  ) =>
    [
      ...workItemKeys.all,
      'list',
      filters,
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

export function useMembers(
  enabled: boolean,
) {
  return useQuery({
    queryKey: memberKeys.all,
    queryFn: getMembers,
    enabled,
  });
}