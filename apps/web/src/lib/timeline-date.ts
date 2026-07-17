const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const TIMELINE_DAY_COUNT = 14;
export const TIMELINE_NAVIGATION_DAYS = 7;

export function startOfLocalDay(
  value: Date | string,
): Date {
  const date =
    value instanceof Date
      ? new Date(value)
      : new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function addLocalDays(
  value: Date,
  days: number,
): Date {
  const date = new Date(value);

  date.setDate(date.getDate() + days);

  return startOfLocalDay(date);
}

export function getLocalDateKey(
  value: Date | string,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(
  first: Date | string,
  second: Date | string,
): boolean {
  return (
    getLocalDateKey(first) ===
    getLocalDateKey(second)
  );
}

export function isDateWithinRange(
  value: Date | string,
  start: Date,
  end: Date,
): boolean {
  const date = new Date(value);

  return date >= start && date < end;
}

export function formatTimelineDay(
  value: Date,
): {
  weekday: string;
  date: string;
} {
  return {
    weekday: new Intl.DateTimeFormat(
      undefined,
      {
        weekday: 'short',
      },
    ).format(value),

    date: new Intl.DateTimeFormat(
      undefined,
      {
        month: 'short',
        day: 'numeric',
      },
    ).format(value),
  };
}

export function formatTimelineTime(
  value: Date | string,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(date);
}

export function formatTimelineRange(
  start: Date,
  end: Date,
): string {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  const startLabel =
    new Intl.DateTimeFormat(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        ...(startYear !== endYear
          ? {
              year: 'numeric',
            }
          : {}),
      },
    ).format(start);

  const endLabel =
    new Intl.DateTimeFormat(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(end);

  return `${startLabel} to ${endLabel}`;
}

export function getDaysUntil(
  value: Date | string,
): number {
  const today = startOfLocalDay(
    new Date(),
  );

  const target = startOfLocalDay(value);

  return Math.round(
    (target.getTime() -
      today.getTime()) /
      DAY_IN_MS,
  );
}