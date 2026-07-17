'use client';

import {
  useMemo,
  useState,
} from 'react';
import {
  addLocalDays,
  formatTimelineRange,
  getLocalDateKey,
  isDateWithinRange,
  isSameLocalDay,
  startOfLocalDay,
  TIMELINE_DAY_COUNT,
  TIMELINE_NAVIGATION_DAYS,
} from '@/lib/timeline-date';
import {
  WorkItemSummary,
} from '@/types/work-item';
import {
  TimelineDayColumn,
} from './timeline-day-column';

interface TimelineViewProps {
  items: WorkItemSummary[];
  isUpdating?: boolean;
}

function createInitialRangeStart(): Date {
  return addLocalDays(
    startOfLocalDay(new Date()),
    -3,
  );
}

export function TimelineView({
  items,
  isUpdating = false,
}: TimelineViewProps) {
  const [rangeStart, setRangeStart] =
    useState<Date>(
      createInitialRangeStart,
    );

  const today = startOfLocalDay(
    new Date(),
  );

  const rangeDates = useMemo(
    () =>
      Array.from(
        {
          length:
            TIMELINE_DAY_COUNT,
        },
        (_, index) =>
          addLocalDays(
            rangeStart,
            index,
          ),
      ),
    [rangeStart],
  );

  const rangeEndExclusive =
  useMemo(
    () =>
      addLocalDays(
        rangeStart,
        TIMELINE_DAY_COUNT,
      ),
    [rangeStart],
  );

    const visibleRangeEnd =
    useMemo(
        () =>
        addLocalDays(
            rangeStart,
            TIMELINE_DAY_COUNT - 1,
        ),
        [rangeStart],
    );

  const groupedItems = useMemo(() => {
    const groups: Record<
      string,
      WorkItemSummary[]
    > = {};

    for (const date of rangeDates) {
      groups[
        getLocalDateKey(date)
      ] = [];
    }

    for (const item of items) {
      const itemDate =
        new Date(item.dueDate);

      if (
        !isDateWithinRange(
          itemDate,
          rangeStart,
          rangeEndExclusive,
        )
      ) {
        continue;
      }

      const dateKey =
        getLocalDateKey(itemDate);

      groups[dateKey]?.push(item);
    }

    for (const dayItems of Object.values(
      groups,
    )) {
      dayItems.sort(
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
  }, [
    items,
    rangeDates,
    rangeStart,
    rangeEndExclusive,
  ]);

  const visibleItemCount =
    useMemo(
      () =>
        Object.values(
          groupedItems,
        ).reduce(
          (total, dayItems) =>
            total +
            dayItems.length,
          0,
        ),
      [groupedItems],
    );

  const outsideRangeCount =
    items.length - visibleItemCount;

  function showPreviousWeek(): void {
    setRangeStart((current) =>
      addLocalDays(
        current,
        -TIMELINE_NAVIGATION_DAYS,
      ),
    );
  }

  function showNextWeek(): void {
    setRangeStart((current) =>
      addLocalDays(
        current,
        TIMELINE_NAVIGATION_DAYS,
      ),
    );
  }

  function showToday(): void {
    setRangeStart(
      createInitialRangeStart(),
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Visible range
          </p>

          <p className="mt-1 font-semibold">
            {formatTimelineRange(
              rangeStart,
              visibleRangeEnd,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {visibleItemCount}{' '}
            {visibleItemCount === 1
              ? 'item'
              : 'items'}{' '}
            in this range
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              showPreviousWeek
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Previous week
          </button>

          <button
            type="button"
            onClick={showToday}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Today
          </button>

          <button
            type="button"
            onClick={showNextWeek}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Next week
          </button>
        </div>
      </div>

      {outsideRangeCount > 0 ? (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {outsideRangeCount}{' '}
          {outsideRangeCount === 1
            ? 'item is'
            : 'items are'}{' '}
          outside the visible date
          range. Use the navigation
          buttons to view other dates.
        </div>
      ) : null}

      {visibleItemCount === 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          There are no deadlines in
          the selected date range.
        </div>
      ) : null}

      <div className="relative mt-6">
        <div
          role="status"
          aria-live="polite"
          className={[
            'absolute right-0 top-[-30px] text-xs font-medium text-slate-500 transition-opacity',
            isUpdating
              ? 'opacity-100'
              : 'pointer-events-none opacity-0',
          ].join(' ')}
        >
          Updating timeline...
        </div>

        <div className="overflow-x-auto pb-5">
          <div className="flex min-w-max items-start gap-4">
            {rangeDates.map(
              (date) => {
                const dateKey =
                  getLocalDateKey(
                    date,
                  );

                return (
                  <TimelineDayColumn
                    key={dateKey}
                    date={date}
                    items={
                      groupedItems[
                        dateKey
                      ] ?? []
                    }
                    isToday={isSameLocalDay(
                      date,
                      today,
                    )}
                  />
                );
              },
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500 lg:hidden">
          Scroll horizontally to view
          every date.
        </p>
      </div>
    </section>
  );
}