export const CATEGORY_ICON_NAMES = [
  'PiggyBank',
  'Zap',
  'ShoppingBag',
  'Home',
  'Utensils',
  'CreditCard',
  'Wallet',
  'Gift',
  'Car',
  'Heart',
  'BookOpen',
  'MoreHorizontal',
] as const;

export type CategoryIconName = typeof CATEGORY_ICON_NAMES[number];

export const CATEGORY_COLORS = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/60', dot: 'bg-indigo-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/60', dot: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/60', dot: 'bg-rose-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/60', dot: 'bg-cyan-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/60', dot: 'bg-purple-500' },
] as const;

export type CategoryColorId = typeof CATEGORY_COLORS[number]['id'];

export function getColorClasses(colorName?: string) {
  const found = CATEGORY_COLORS.find((c) => c.id === colorName);
  return found || CATEGORY_COLORS[1]; // default indigo
}

export function formatIndianCurrency(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNum] = monthStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthNum, 10) - 1;
  const d = new Date(y, m, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatShortMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNum] = monthStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthNum, 10) - 1;
  const d = new Date(y, m, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getPrevMonth(monthStr: string): string {
  const [yearStr, monthNum] = monthStr.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthNum, 10) - 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function getNextMonth(monthStr: string): string {
  const [yearStr, monthNum] = monthStr.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthNum, 10) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Returns upcoming months array [YYYY-MM, ...] starting from the month after fromMonth
 */
export function getUpcomingMonths(count = 3, fromMonth: string): string[] {
  const list: string[] = [];
  let curr = fromMonth;
  for (let i = 0; i < count; i++) {
    curr = getNextMonth(curr);
    list.push(curr);
  }
  return list;
}

/**
 * Generates next 12 months for target month selection dropdown
 */
export function getSelectableMonths(fromMonth: string, count = 12): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  let curr = fromMonth;
  for (let i = 0; i < count; i++) {
    months.push({
      value: curr,
      label: formatMonthLabel(curr),
    });
    curr = getNextMonth(curr);
  }
  return months;
}

/**
 * Format day of month with ordinal suffix (e.g. 5 -> "5th", 1 -> "1st", 22 -> "22nd")
 */
export function formatDayOfMonth(day: number): string {
  if (day <= 0 || day > 31) return `day ${day}`;
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) {
    return `${day}st`;
  }
  if (j === 2 && k !== 12) {
    return `${day}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${day}rd`;
  }
  return `${day}th`;
}
