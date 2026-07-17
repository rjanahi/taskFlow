'use client';

import Link from 'next/link';
import {
  useState,
} from 'react';
import {
  WorkItemCard,
} from '@/components/work-items/work-item-card';
import {
  WorkItemFiltersBar,
} from '@/components/work-items/work-item-filters';
import {
  useMembers,
  useWorkItems,
} from '@/hooks/use-work-items-ts';
import {
  getErrorMessage,
} from '@/lib/errors';
import {
  useAuth,
} from '@/providers/auth-provider';
import {
  WorkItemFilters,
} from '@/types/work-item';

export default function WorkItemsPage() {
  const { user } = useAuth();

  const [filters, setFilters] =
    useState<WorkItemFilters>(
      {},
    );

  const isManager =
    user?.role === 'MANAGER';

  const workItemsQuery =
    useWorkItems(filters);

  const membersQuery =
    useMembers(isManager);

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Work items
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            {isManager
              ? 'All work items'
              : 'Assigned to me'}
          </h1>

          <p className="mt-2 text-slate-600">
            {isManager
              ? 'Review work across every phase and team member.'
              : 'Only work items assigned to your account are shown.'}
          </p>
        </div>

        {isManager ? (
          <Link
            href="/work-items/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Create work item
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        <WorkItemFiltersBar
          filters={filters}
          members={
            membersQuery.data ?? []
          }
          showAssigneeFilter={
            isManager
          }
          onChange={setFilters}
          onClear={() =>
            setFilters({})
          }
        />
      </div>

      {membersQuery.isError &&
      isManager ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Assignee options could not
          be loaded. Other filters
          will still work.
        </div>
      ) : null}

      {workItemsQuery.isPending ? (
        <div
          aria-label="Loading work items"
          className="mt-6 grid gap-4 lg:grid-cols-2"
        >
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : null}

      {workItemsQuery.isError ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <h2 className="font-semibold text-red-900">
            Work items could not
            be loaded
          </h2>

          <p className="mt-1 text-sm text-red-800">
            {getErrorMessage(
              workItemsQuery.error,
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              void workItemsQuery.refetch()
            }
            className="mt-4 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-900"
          >
            Try again
          </button>
        </div>
      ) : null}

      {workItemsQuery.isSuccess &&
      workItemsQuery.data.length ===
        0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold">
            No work items found
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {Object.keys(filters)
              .length > 0
              ? 'No items match the selected filters.'
              : isManager
                ? 'Create the first work item to begin.'
                : 'No work is currently assigned to you.'}
          </p>

          {Object.keys(filters)
            .length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setFilters({})
              }
              className="mt-4 text-sm font-medium underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {workItemsQuery.isSuccess &&
      workItemsQuery.data.length >
        0 ? (
        <>
          <p className="mt-6 text-sm text-slate-500">
            {
              workItemsQuery.data
                .length
            }{' '}
            {workItemsQuery.data
              .length === 1
              ? 'item'
              : 'items'}
          </p>

          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {workItemsQuery.data.map(
              (item) => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                />
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}