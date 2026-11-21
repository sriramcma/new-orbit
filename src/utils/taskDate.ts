import { TaskStatus } from '../types/task';

export function formatDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatDateOnly(new Date());
}

export function parseDateOnly(dateStr: string): Date {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Computes exact whole calendar day difference (toDateStr - fromDateStr) using UTC midnight,
 * completely immune to Daylight Saving Time transitions.
 */
export function diffCalendarDays(fromDateStr: string, toDateStr: string): number {
  const from = parseDateOnly(fromDateStr);
  const to = parseDateOnly(toDateStr);
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Formats an ISO timestamp into a local `YYYY-MM-DDTHH:mm` string for `<input type="datetime-local">`.
 */
export function toDateTimeLocalInput(isoStr?: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getTaskDateKey(task: { due_date?: string | null; created_at?: string }): string {
  if (task.due_date && /^\d{4}-\d{2}-\d{2}$/.test(task.due_date)) {
    return task.due_date;
  }
  if (task.created_at) {
    const parsed = new Date(task.created_at);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateOnly(parsed);
    }
  }
  return getTodayString();
}

export function shiftDateByDays(dateStr: string, days: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateOnly(d);
}

/**
 * Returns the 7 days (Monday -> Sunday) of the week containing `dateStr`.
 */
export function getWeekDays(dateStr: string): { date: Date; dateStr: string; dayNumber: number; weekdayShort: string }[] {
  const target = parseDateOnly(dateStr);
  const jsDay = target.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(target);
  monday.setDate(target.getDate() + mondayOffset);

  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d,
      dateStr: formatDateOnly(d),
      dayNumber: d.getDate(),
      weekdayShort: letters[i],
    };
  });
}

/**
 * Returns a Monday-first month calendar grid for the given year & 0-indexed month.
 */
export function getMonthGridDays(
  year: number,
  monthIndex: number
): { date: Date; dateStr: string; dayNumber: number; inMonth: boolean }[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  const startJsDay = firstOfMonth.getDay();
  const leadingDays = startJsDay === 0 ? 6 : startJsDay - 1;

  const totalDaysInMonth = lastOfMonth.getDate();
  const totalCells = Math.ceil((leadingDays + totalDaysInMonth) / 7) * 7;

  const gridStart = new Date(year, monthIndex, 1 - leadingDays);
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return {
      date: d,
      dateStr: formatDateOnly(d),
      dayNumber: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
    };
  });
}

export function formatWeekdayHeading(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatMonthYearLabel(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${month} ${d.getFullYear()}`;
}

export function formatShortDateLabel(dateStr: string): string {
  const today = getTodayString();
  if (dateStr === today) return 'Today';
  if (dateStr === shiftDateByDays(today, 1)) return 'Tomorrow';
  if (dateStr === shiftDateByDays(today, -1)) return 'Yesterday';
  const d = parseDateOnly(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isTaskToday(dueDate?: string | null, createdAt?: string): boolean {
  const today = getTodayString();
  if (dueDate) {
    return dueDate === today;
  }
  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateOnly(parsed) === today;
    }
  }
  return false;
}

export function isTaskUpcoming(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const today = getTodayString();
  return dueDate > today;
}

export function isTaskOverdue(dueDate?: string | null, status?: TaskStatus): boolean {
  if (status === 'done') return false;
  if (!dueDate) return false;
  const today = getTodayString();
  return dueDate < today;
}

export function formatDueBadge(
  dueDate?: string | null,
  status?: TaskStatus
): { label: string; isOverdue: boolean; isToday: boolean; isTomorrow: boolean } | null {
  if (!dueDate) return null;

  const today = getTodayString();

  if (dueDate === today) {
    return { label: 'Today', isOverdue: false, isToday: true, isTomorrow: false };
  }

  const diffDays = diffCalendarDays(today, dueDate);

  if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false, isTomorrow: true };
  }

  if (diffDays < 0 && status !== 'done') {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue 1d' : `Overdue ${daysAgo}d`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  }

  const targetDate = parseDateOnly(dueDate);
  const formatted = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return {
    label: formatted,
    isOverdue: diffDays < 0 && status !== 'done',
    isToday: false,
    isTomorrow: false,
  };
}
