import {
  AuthenticatedUser,
} from '@/types/auth';
import {
  Priority,
  WorkItemFilters,
  WorkItemStatus,
} from '@/types/work-item';

interface WorkItemFiltersProps {
  filters: WorkItemFilters;
  members: AuthenticatedUser[];
  showAssigneeFilter: boolean;

  onChange(
    filters: WorkItemFilters,
  ): void;

  onClear(): void;
}

const statuses: Array<{
  value: WorkItemStatus;
  label: string;
}> = [
  {
    value: 'BACKLOG',
    label: 'Backlog',
  },
  {
    value: 'ASSIGNED',
    label: 'Assigned',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
  },
  {
    value: 'IN_REVIEW',
    label: 'In Review',
  },
  {
    value: 'DONE',
    label: 'Done',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
  },
];

const priorities: Array<{
  value: Priority;
  label: string;
}> = [
  {
    value: 'LOW',
    label: 'Low',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
  },
  {
    value: 'HIGH',
    label: 'High',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
  },
];

export function WorkItemFiltersBar({
  filters,
  members,
  showAssigneeFilter,
  onChange,
  onClear,
}: WorkItemFiltersProps) {
  const hasFilters = Boolean(
    filters.status ||
      filters.priority ||
      filters.assigneeId,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="status-filter"
            className="mb-1 block text-sm font-medium"
          >
            Phase
          </label>

          <select
            id="status-filter"
            value={filters.status ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,

                status:
                  event.target.value
                    ? (event.target
                        .value as WorkItemStatus)
                    : undefined,
              })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              All phases
            </option>

            {statuses.map(
              (status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="priority-filter"
            className="mb-1 block text-sm font-medium"
          >
            Priority
          </label>

          <select
            id="priority-filter"
            value={
              filters.priority ?? ''
            }
            onChange={(event) =>
              onChange({
                ...filters,

                priority:
                  event.target.value
                    ? (event.target
                        .value as Priority)
                    : undefined,
              })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              All priorities
            </option>

            {priorities.map(
              (priority) => (
                <option
                  key={
                    priority.value
                  }
                  value={
                    priority.value
                  }
                >
                  {priority.label}
                </option>
              ),
            )}
          </select>
        </div>

        {showAssigneeFilter ? (
          <div>
            <label
              htmlFor="assignee-filter"
              className="mb-1 block text-sm font-medium"
            >
              Assignee
            </label>

            <select
              id="assignee-filter"
              value={
                filters.assigneeId ??
                ''
              }
              onChange={(event) =>
                onChange({
                  ...filters,

                  assigneeId:
                    event.target
                      .value ||
                    undefined,
                })
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">
                All assignees
              </option>

              {members.map(
                (member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                ),
              )}
            </select>
          </div>
        ) : null}
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-sm font-medium text-slate-700 underline"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}