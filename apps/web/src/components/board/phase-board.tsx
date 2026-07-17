'use client';

import {
  useMemo,
} from 'react';
import {
  WORKFLOW_PHASES,
} from '@/lib/workflow-phases';
import {
  WorkItemStatus,
  WorkItemSummary,
} from '@/types/work-item';
import {
  PhaseBoardColumn,
} from './phase-board-column';

interface PhaseBoardProps {
  items: WorkItemSummary[];
  isUpdating?: boolean;
}

function groupItemsByPhase(
  items: WorkItemSummary[],
): Record<
  WorkItemStatus,
  WorkItemSummary[]
> {
  const groups: Record<
    WorkItemStatus,
    WorkItemSummary[]
  > = {
    BACKLOG: [],
    ASSIGNED: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
    CANCELLED: [],
  };

  for (const item of items) {
    groups[item.status].push(item);
  }

  for (const phaseItems of Object.values(
    groups,
  )) {
    phaseItems.sort(
      (firstItem, secondItem) =>
        new Date(
          firstItem.dueDate,
        ).getTime() -
        new Date(
          secondItem.dueDate,
        ).getTime(),
    );
  }

  return groups;
}

export function PhaseBoard({
  items,
  isUpdating = false,
}: PhaseBoardProps) {
  const groupedItems = useMemo(
    () => groupItemsByPhase(items),
    [items],
  );

  return (
    <div className="relative">
      <div
        role="status"
        aria-live="polite"
        className={[
          'absolute right-0 top-[-38px] text-xs font-medium text-slate-500 transition-opacity',
          isUpdating
            ? 'opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
      >
        Updating board...
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max items-start gap-4">
          {WORKFLOW_PHASES.map(
            (phase) => (
              <PhaseBoardColumn
                key={phase.status}
                phase={phase}
                items={
                  groupedItems[
                    phase.status
                  ]
                }
              />
            ),
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500 lg:hidden">
        Scroll horizontally to view
        every phase.
      </p>
    </div>
  );
}