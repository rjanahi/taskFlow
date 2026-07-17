import {
  formatTimelineDay,
} from '@/lib/timeline-date';
import {
  WorkItemSummary,
} from '@/types/work-item';
import {
  TimelineCard,
} from './timeline-card';

interface TimelineDayColumnProps {
  date: Date;
  items: WorkItemSummary[];
  isToday: boolean;
}

export function TimelineDayColumn({
  date,
  items,
  isToday,
}: TimelineDayColumnProps) {
  const dayLabel =
    formatTimelineDay(date);

  return (
    <section
      aria-label={`${dayLabel.weekday}, ${dayLabel.date}`}
      className={[
        'relative flex min-h-[540px] w-[250px] shrink-0 flex-col overflow-hidden rounded-xl border',
        isToday
          ? 'border-red-400 bg-red-50/30 ring-2 ring-red-100'
          : 'border-slate-200 bg-slate-50/70',
      ].join(' ')}
    >
      {isToday ? (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-1 bg-red-500"
        />
      ) : null}

      <header
        className={[
          'sticky top-0 z-10 border-b px-4 py-4',
          isToday
            ? 'border-red-200 bg-red-50'
            : 'border-slate-200 bg-white',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={[
                'text-xs font-semibold uppercase tracking-wide',
                isToday
                  ? 'text-red-700'
                  : 'text-slate-500',
              ].join(' ')}
            >
              {dayLabel.weekday}
            </p>

            <h2
              className={[
                'mt-1 text-lg font-bold',
                isToday
                  ? 'text-red-900'
                  : 'text-slate-950',
              ].join(' ')}
            >
              {dayLabel.date}
            </h2>
          </div>

          {isToday ? (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
              Today
            </span>
          ) : (
            <span
              aria-label={`${items.length} items`}
              className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-semibold text-slate-700"
            >
              {items.length}
            </span>
          )}
        </div>

        {isToday ? (
          <p className="mt-2 text-xs font-medium text-red-700">
            {items.length}{' '}
            {items.length === 1
              ? 'deadline'
              : 'deadlines'}
          </p>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 p-3">
        {items.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 text-center">
            <p className="text-sm text-slate-500">
              No deadlines
            </p>
          </div>
        ) : (
          items.map((item) => (
            <TimelineCard
              key={item.id}
              item={item}
            />
          ))
        )}
      </div>
    </section>
  );
}