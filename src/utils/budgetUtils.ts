import { Category, CategoryAllocations, PlannedPurchase, RecurringExpense } from '../types/budget';

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
  }).format(Number.isFinite(val) ? val : 0);
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
  if (Number.isNaN(y) || Number.isNaN(m)) return monthStr;
  const d = new Date(y, m, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatShortMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNum] = monthStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthNum, 10) - 1;
  if (Number.isNaN(y) || Number.isNaN(m)) return monthStr;
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

/**
 * Matches a recurring/planned item's category field (ID or Name) against a Category object.
 */
export function matchesBudgetCategory(itemCategory: string | undefined | null, cat: Category): boolean {
  if (!itemCategory) return false;
  if (itemCategory === cat.id) return true;
  return itemCategory.trim().toLowerCase() === cat.name.trim().toLowerCase();
}

export interface CategoryBudgetBreakdown {
  categoryId: string;
  manualAmount: number;
  recurringTotal: number;
  recurringCount: number;
  plannedTotal: number;
  plannedCount: number;
  committedTotal: number;
  effectiveAmount: number;
  extraAmount: number;
}

export interface BudgetPlanBreakdown {
  byCategoryId: Record<string, CategoryBudgetBreakdown>;
  effectiveAllocations: CategoryAllocations;
  totalAllocated: number;
  totalRecurring: number;
  totalPlannedThisMonth: number;
  unmatchedRecurringTotal: number;
  unmatchedPlannedTotal: number;
  savingsAllocated: number;
}

/**
 * Single source of truth for combining manual category allocations with active Recurring Expenses
 * and this month's Planned Purchases without double counting.
 *
 * For each category:
 *   committedTotal = activeRecurringInCategory + activePlannedThisMonthInCategory
 *   effectiveAmount = Math.max(manualAllocation, committedTotal)
 */
export function computeBudgetPlanBreakdown(
  categories: Category[],
  manualAllocations: CategoryAllocations,
  recurringExpenses: RecurringExpense[],
  thisMonthPlanned: PlannedPurchase[]
): BudgetPlanBreakdown {
  const byCategoryId: Record<string, CategoryBudgetBreakdown> = {};
  const effectiveAllocations: CategoryAllocations = {};

  const activeRecurring = recurringExpenses.filter((r) => r.active);
  const activePlanned = thisMonthPlanned.filter((p) => p.status !== 'cancelled');

  const matchedRecurringIds = new Set<string>();
  const matchedPlannedIds = new Set<string>();

  let totalAllocated = 0;
  let savingsAllocated = 0;

  for (const cat of categories) {
    let recurringTotal = 0;
    let recurringCount = 0;
    for (const r of activeRecurring) {
      if (matchesBudgetCategory(r.category, cat)) {
        recurringTotal += Math.max(0, Number(r.amount) || 0);
        recurringCount += 1;
        matchedRecurringIds.add(r.id);
      }
    }

    let plannedTotal = 0;
    let plannedCount = 0;
    for (const p of activePlanned) {
      if (matchesBudgetCategory(p.category, cat)) {
        plannedTotal += Math.max(0, Number(p.amount) || 0);
        plannedCount += 1;
        matchedPlannedIds.add(p.id);
      }
    }

    const committedTotal = recurringTotal + plannedTotal;
    const manualAmount = Math.max(0, Number(manualAllocations?.[cat.id]) || 0);
    const effectiveAmount = Math.max(manualAmount, committedTotal);
    const extraAmount = Math.max(0, effectiveAmount - committedTotal);

    byCategoryId[cat.id] = {
      categoryId: cat.id,
      manualAmount,
      recurringTotal,
      recurringCount,
      plannedTotal,
      plannedCount,
      committedTotal,
      effectiveAmount,
      extraAmount,
    };

    effectiveAllocations[cat.id] = effectiveAmount;
    totalAllocated += effectiveAmount;

    if (
      cat.icon === 'PiggyBank' ||
      cat.name.toLowerCase().includes('saving') ||
      cat.name.toLowerCase().includes('invest')
    ) {
      savingsAllocated += effectiveAmount;
    }
  }

  let unmatchedRecurringTotal = 0;
  for (const r of activeRecurring) {
    if (!matchedRecurringIds.has(r.id)) {
      unmatchedRecurringTotal += Math.max(0, Number(r.amount) || 0);
    }
  }

  let unmatchedPlannedTotal = 0;
  for (const p of activePlanned) {
    if (!matchedPlannedIds.has(p.id)) {
      unmatchedPlannedTotal += Math.max(0, Number(p.amount) || 0);
    }
  }

  totalAllocated += unmatchedRecurringTotal + unmatchedPlannedTotal;

  const totalRecurring = activeRecurring.reduce(
    (sum, r) => sum + Math.max(0, Number(r.amount) || 0),
    0
  );
  const totalPlannedThisMonth = activePlanned.reduce(
    (sum, p) => sum + Math.max(0, Number(p.amount) || 0),
    0
  );

  return {
    byCategoryId,
    effectiveAllocations,
    totalAllocated,
    totalRecurring,
    totalPlannedThisMonth,
    unmatchedRecurringTotal,
    unmatchedPlannedTotal,
    savingsAllocated,
  };
}
