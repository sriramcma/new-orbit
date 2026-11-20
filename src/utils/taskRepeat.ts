import { RepeatPreset, TaskRepeatRule, WeekdayIndex } from '../types/task';
import { formatDateOnly, parseDateOnly } from './taskDate';

export const WEEKDAY_OPTIONS: { index: WeekdayIndex; short: string; label: string }[] = [
  { index: 1, short: 'MON', label: 'Mon' },
  { index: 2, short: 'TUE', label: 'Tue' },
  { index: 3, short: 'WED', label: 'Wed' },
  { index: 4, short: 'THU', label: 'Thu' },
  { index: 5, short: 'FRI', label: 'Fri' },
  { index: 6, short: 'SAT', label: 'Sat' },
  { index: 0, short: 'SUN', label: 'Sun' },
];

const WEEKDAY_SHORT_MAP: Record<WeekdayIndex, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

/** Monday-first sort order for displaying weekday lists */
const MONDAY_FIRST_ORDER: Record<WeekdayIndex, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  0: 6,
};

export function createPresetRule(preset: Exclude<RepeatPreset, 'custom'>, anchorDateStr?: string): TaskRepeatRule {
  switch (preset) {
    case 'daily':
      return { preset: 'daily', interval: 1, unit: 'days' };
    case 'weekdays':
      return { preset: 'weekdays', interval: 1, unit: 'weeks', weekdays: [1, 2, 3, 4, 5] };
    case 'weekly': {
      const d = anchorDateStr ? parseDateOnly(anchorDateStr) : new Date();
      const dayIdx = d.getDay() as WeekdayIndex;
      return { preset: 'weekly', interval: 1, unit: 'weeks', weekdays: [dayIdx] };
    }
    case 'monthly':
      return { preset: 'monthly', interval: 1, unit: 'months' };
    case 'yearly':
      return { preset: 'yearly', interval: 1, unit: 'years' };
  }
}

export function formatRepeatLabel(rule?: TaskRepeatRule | null): string | null {
  if (!rule) return null;

  if (rule.preset === 'daily') return 'Daily';
  if (rule.preset === 'weekdays') return 'Weekdays';
  if (rule.preset === 'weekly') return 'Weekly';
  if (rule.preset === 'monthly') return 'Monthly';
  if (rule.preset === 'yearly') return 'Yearly';

  const interval = Math.max(1, Math.floor(rule.interval || 1));

  if (rule.unit === 'days') {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  }

  if (rule.unit === 'weeks') {
    const sortedDays = [...(rule.weekdays || [])].sort(
      (a, b) => MONDAY_FIRST_ORDER[a] - MONDAY_FIRST_ORDER[b]
    );
    const daysText =
      sortedDays.length > 0 && sortedDays.length < 7
        ? sortedDays.map((d) => WEEKDAY_SHORT_MAP[d]).join(', ')
        : '';

    if (sortedDays.length === 7 && interval === 1) return 'Daily';
    if (
      interval === 1 &&
      sortedDays.length === 5 &&
      sortedDays.every((d) => d >= 1 && d <= 5)
    ) {
      return 'Weekdays';
    }

    const prefix = interval === 1 ? 'Weekly' : `Every ${interval} wks`;
    return daysText ? `${prefix} · ${daysText}` : prefix;
  }

  if (rule.unit === 'months') {
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  }

  if (rule.unit === 'years') {
    return interval === 1 ? 'Yearly' : `Every ${interval} years`;
  }

  return 'Repeating';
}

function addMonthsClamped(base: Date, monthsToAdd: number): Date {
  const year = base.getFullYear();
  const month = base.getMonth() + monthsToAdd;
  const day = base.getDate();
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDayOfTargetMonth));
}

function addYearsClamped(base: Date, yearsToAdd: number): Date {
  const targetYear = base.getFullYear() + yearsToAdd;
  const month = base.getMonth();
  const day = base.getDate();
  const lastDayOfTargetMonth = new Date(targetYear, month + 1, 0).getDate();
  return new Date(targetYear, month, Math.min(day, lastDayOfTargetMonth));
}

/**
 * Computes the next YYYY-MM-DD occurrence date after `currentDateStr` for the given repeat rule.
 */
export function getNextRepeatDate(currentDateStr: string, rule: TaskRepeatRule): string {
  const base = parseDateOnly(currentDateStr);
  const interval = Math.max(1, Math.floor(rule.interval || 1));

  // Weekdays preset (Mon–Fri)
  if (rule.preset === 'weekdays') {
    const next = new Date(base);
    do {
      next.setDate(next.getDate() + 1);
    } while (next.getDay() === 0 || next.getDay() === 6);
    return formatDateOnly(next);
  }

  if (rule.unit === 'days' || rule.preset === 'daily') {
    const next = new Date(base);
    next.setDate(next.getDate() + interval);
    return formatDateOnly(next);
  }

  if (rule.unit === 'weeks' || rule.preset === 'weekly') {
    const selected = Array.from(new Set(rule.weekdays || [])).sort(
      (a, b) => MONDAY_FIRST_ORDER[a] - MONDAY_FIRST_ORDER[b]
    );

    if (selected.length === 0) {
      const next = new Date(base);
      next.setDate(next.getDate() + interval * 7);
      return formatDateOnly(next);
    }

    const currentOrder = MONDAY_FIRST_ORDER[base.getDay() as WeekdayIndex];

    // Find next selected weekday later in the same Mon–Sun week
    const laterInSameWeek = selected.find((wd) => MONDAY_FIRST_ORDER[wd] > currentOrder);
    if (laterInSameWeek !== undefined) {
      const diff = MONDAY_FIRST_ORDER[laterInSameWeek] - currentOrder;
      const next = new Date(base);
      next.setDate(next.getDate() + diff);
      return formatDateOnly(next);
    }

    // Otherwise jump forward by `interval` weeks to the Monday of the target week, then pick earliest selected weekday
    const mondayOfCurrentWeek = new Date(base);
    mondayOfCurrentWeek.setDate(base.getDate() - currentOrder);
    const nextWeekStart = new Date(mondayOfCurrentWeek);
    nextWeekStart.setDate(mondayOfCurrentWeek.getDate() + interval * 7);
    const earliestTargetOrder = MONDAY_FIRST_ORDER[selected[0]];
    nextWeekStart.setDate(nextWeekStart.getDate() + earliestTargetOrder);
    return formatDateOnly(nextWeekStart);
  }

  if (rule.unit === 'months' || rule.preset === 'monthly') {
    return formatDateOnly(addMonthsClamped(base, interval));
  }

  if (rule.unit === 'years' || rule.preset === 'yearly') {
    return formatDateOnly(addYearsClamped(base, interval));
  }

  const fallback = new Date(base);
  fallback.setDate(fallback.getDate() + 1);
  return formatDateOnly(fallback);
}

/**
 * Shifts an ISO reminder timestamp by the day difference between two YYYY-MM-DD dates,
 * preserving the local clock time.
 */
export function shiftReminderForNextDate(
  reminderAt: string | null | undefined,
  fromDateStr: string,
  toDateStr: string
): string | null {
  if (!reminderAt) return null;
  const parsedReminder = new Date(reminderAt);
  if (Number.isNaN(parsedReminder.getTime())) return null;

  const fromDate = parseDateOnly(fromDateStr);
  const toDate = parseDateOnly(toDateStr);
  const dayDiff = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  const shifted = new Date(parsedReminder);
  shifted.setDate(shifted.getDate() + dayDiff);
  return shifted.toISOString();
}
