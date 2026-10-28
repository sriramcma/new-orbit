import { TaskStatus } from '../types/task';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isTaskToday(dueDate?: string | null, createdAt?: string): boolean {
  const today = getTodayString();
  if (dueDate) {
    return dueDate === today;
  }
  if (createdAt) {
    const createdDate = createdAt.split('T')[0];
    return createdDate === today;
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

  const todayDate = parseDateOnly(today);
  const targetDate = parseDateOnly(dueDate);
  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false, isTomorrow: true };
  }

  if (diffDays < 0 && status !== 'done') {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue 1 day' : `Overdue ${daysAgo} days`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  }

  // Format month and day, e.g. "Oct 28"
  const formatted = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return {
    label: formatted,
    isOverdue: diffDays < 0,
    isToday: false,
    isTomorrow: false,
  };
}
