import { RepeatPreset, Subtask, Task, TaskRepeatRule, WeekdayIndex } from '../types/task';
import { diffCalendarDays, formatDateOnly, getTaskDateKey, parseDateOnly } from './taskDate';

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

/** Monday-first sort order for displaying weekday lists and computing week boundaries */
const MONDAY_FIRST_ORDER: Record<WeekdayIndex, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  0: 6,
};

const PROJECTED_PREFIX = 'projected::';

export function createPresetRule(
  preset: Exclude<RepeatPreset, 'custom'>,
  anchorDateStr?: string
): TaskRepeatRule {
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

/**
 * Keeps a `weekly` preset rule aligned with a task's date when the user changes its Date picker.
 */
export function syncRuleWithAnchorDate(
  rule: TaskRepeatRule | null | undefined,
  newAnchorDateStr?: string
): TaskRepeatRule | null {
  if (!rule) return null;
  if (rule.preset === 'weekly' && newAnchorDateStr && /^\d{4}-\d{2}-\d{2}$/.test(newAnchorDateStr)) {
    const dayIdx = parseDateOnly(newAnchorDateStr).getDay() as WeekdayIndex;
    return {
      ...rule,
      weekdays: [dayIdx],
    };
  }
  return rule;
}

export function formatRepeatLabel(rule?: TaskRepeatRule | null): string | null {
  if (!rule) return null;

  if (rule.preset === 'daily') return 'Daily';
  if (rule.preset === 'weekdays') return 'Weekdays';
  if (rule.preset === 'weekly') {
    const wd = rule.weekdays?.[0];
    return wd !== undefined ? `Weekly · ${WEEKDAY_SHORT_MAP[wd]}` : 'Weekly';
  }
  if (rule.preset === 'monthly') return 'Monthly';
  if (rule.preset === 'yearly') return 'Yearly';

  const interval = Math.max(1, Math.floor(rule.interval || 1));

  if (rule.unit === 'days') {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  }

  if (rule.unit === 'weeks') {
    const sortedDays = Array.from(new Set(rule.weekdays || [])).sort(
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
 * Computes the next YYYY-MM-DD occurrence date strictly after `currentDateStr` for the given repeat rule.
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
 * Returns true if `targetDateStr` (strictly after `anchorDateStr`) is a scheduled repeat occurrence
 * for a task anchored on `anchorDateStr` with the given `rule`.
 */
export function doesRepeatRuleMatchDate(
  anchorDateStr: string,
  targetDateStr: string,
  rule: TaskRepeatRule | null | undefined
): boolean {
  if (!rule) return false;
  if (!anchorDateStr || !targetDateStr) return false;
  if (targetDateStr <= anchorDateStr) return false;

  const anchor = parseDateOnly(anchorDateStr);
  const target = parseDateOnly(targetDateStr);
  const interval = Math.max(1, Math.floor(rule.interval || 1));

  // Weekdays preset (Mon-Fri)
  if (rule.preset === 'weekdays') {
    const wd = target.getDay();
    return wd >= 1 && wd <= 5;
  }

  // Daily / Every N days
  if (rule.preset === 'daily' || rule.unit === 'days') {
    const dayDiff = diffCalendarDays(anchorDateStr, targetDateStr);
    return dayDiff > 0 && dayDiff % interval === 0;
  }

  // Weekly / Every N weeks on selected weekdays (Mon-Sun weeks)
  if (rule.preset === 'weekly' || rule.unit === 'weeks') {
    const selected =
      rule.weekdays && rule.weekdays.length > 0
        ? Array.from(new Set(rule.weekdays))
        : [anchor.getDay() as WeekdayIndex];

    const targetWd = target.getDay() as WeekdayIndex;
    if (!selected.includes(targetWd)) return false;

    const anchorOrder = MONDAY_FIRST_ORDER[anchor.getDay() as WeekdayIndex];
    const targetOrder = MONDAY_FIRST_ORDER[targetWd];

    const anchorMondayUtc =
      Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()) -
      anchorOrder * 86400000;
    const targetMondayUtc =
      Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
      targetOrder * 86400000;

    const weekDiff = Math.round((targetMondayUtc - anchorMondayUtc) / (7 * 86400000));
    return weekDiff >= 0 && weekDiff % interval === 0;
  }

  // Monthly / Every N months (clamped to end of shorter months)
  if (rule.preset === 'monthly' || rule.unit === 'months') {
    const monthDiff =
      (target.getFullYear() - anchor.getFullYear()) * 12 +
      (target.getMonth() - anchor.getMonth());
    if (monthDiff <= 0 || monthDiff % interval !== 0) return false;

    const lastDayOfTargetMonth = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate();
    const expectedDay = Math.min(anchor.getDate(), lastDayOfTargetMonth);
    return target.getDate() === expectedDay;
  }

  // Yearly / Every N years (Feb 29 clamped to Feb 28 on non-leap years)
  if (rule.preset === 'yearly' || rule.unit === 'years') {
    const yearDiff = target.getFullYear() - anchor.getFullYear();
    if (yearDiff <= 0 || yearDiff % interval !== 0) return false;
    if (target.getMonth() !== anchor.getMonth()) return false;

    const lastDayOfTargetMonth = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate();
    const expectedDay = Math.min(anchor.getDate(), lastDayOfTargetMonth);
    return target.getDate() === expectedDay;
  }

  return false;
}

/**
 * Shifts an ISO reminder timestamp by the exact calendar day difference between two YYYY-MM-DD dates,
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

  const dayDiff = diffCalendarDays(fromDateStr, toDateStr);
  const shifted = new Date(parsedReminder);
  shifted.setDate(shifted.getDate() + dayDiff);
  return shifted.toISOString();
}

export function buildProjectedTaskId(sourceTaskId: string, targetDateStr: string): string {
  return `${PROJECTED_PREFIX}${sourceTaskId}::${targetDateStr}`;
}

export function isProjectedTaskId(taskId: string): boolean {
  return taskId.startsWith(PROJECTED_PREFIX);
}

export function parseProjectedTaskId(
  taskId: string
): { sourceTaskId: string; targetDate: string } | null {
  if (!isProjectedTaskId(taskId)) return null;
  const rest = taskId.slice(PROJECTED_PREFIX.length);
  const splitIdx = rest.lastIndexOf('::');
  if (splitIdx === -1) return null;
  const sourceTaskId = rest.slice(0, splitIdx);
  const targetDate = rest.slice(splitIdx + 2);
  if (!sourceTaskId || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null;
  return { sourceTaskId, targetDate };
}

/**
 * Creates a clean virtual/projected occurrence of a pending repeating task for a future calendar date.
 */
export function createProjectedRepeatTask(sourceTask: Task, targetDateStr: string): Task {
  const anchorDateStr = getTaskDateKey(sourceTask);
  const freshSubtasks: Subtask[] = (sourceTask.subtasks || []).map((s, idx) => ({
    id: `${s.id}::${targetDateStr}_${idx}`,
    title: s.title,
    completed: false,
  }));

  return {
    ...sourceTask,
    id: buildProjectedTaskId(sourceTask.id, targetDateStr),
    status: 'pending',
    due_date: targetDateStr,
    reminder_at: shiftReminderForNextDate(sourceTask.reminder_at, anchorDateStr, targetDateStr),
    subtasks: freshSubtasks,
    completed_at: null,
  };
}
