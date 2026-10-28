import {
  Shirt,
  Watch,
  Glasses,
  Smartphone,
  Home,
  Sparkles,
  ShoppingBag,
  LucideIcon,
} from 'lucide-react';
import { ShoppingCategory, ShoppingPriority } from '../types/shopping';

export interface CategoryMeta {
  id: ShoppingCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeText: string;
  budgetCategoryName: string; // for mapping to budget planned purchases
}

export const SHOPPING_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Clothes',
    label: 'Clothes',
    icon: Shirt,
    color: 'from-blue-500 to-indigo-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-600 dark:text-blue-400',
    budgetCategoryName: 'Grooming & Shopping',
  },
  {
    id: 'Watches',
    label: 'Watches',
    icon: Watch,
    color: 'from-amber-500 to-yellow-600',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-600 dark:text-amber-400',
    budgetCategoryName: 'Grooming & Shopping',
  },
  {
    id: 'Accessories',
    label: 'Accessories',
    icon: Glasses,
    color: 'from-purple-500 to-violet-600',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeText: 'text-purple-600 dark:text-purple-400',
    budgetCategoryName: 'Grooming & Shopping',
  },
  {
    id: 'Gadgets',
    label: 'Gadgets',
    icon: Smartphone,
    color: 'from-cyan-500 to-teal-600',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/60',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
    budgetCategoryName: 'Other',
  },
  {
    id: 'Home',
    label: 'Home',
    icon: Home,
    color: 'from-emerald-500 to-green-600',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    budgetCategoryName: 'Home',
  },
  {
    id: 'Beauty',
    label: 'Beauty',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/60',
    badgeText: 'text-pink-600 dark:text-pink-400',
    budgetCategoryName: 'Grooming & Shopping',
  },
  {
    id: 'Other',
    label: 'Other',
    icon: ShoppingBag,
    color: 'from-slate-500 to-gray-600',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-400',
    budgetCategoryName: 'Other',
  },
];

export function getCategoryMeta(category: string): CategoryMeta {
  const found = SHOPPING_CATEGORIES.find((c) => c.id === category);
  return (
    found || {
      id: 'Other',
      label: category || 'Other',
      icon: ShoppingBag,
      color: 'from-slate-500 to-gray-600',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-600 dark:text-slate-400',
      budgetCategoryName: 'Other',
    }
  );
}

export function getPriorityMeta(priority: ShoppingPriority) {
  switch (priority) {
    case 'high':
      return {
        label: 'High Priority',
        dotClass: 'bg-rose-500',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
        badgeText: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60',
      };
    case 'med':
      return {
        label: 'Medium',
        dotClass: 'bg-amber-500',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
        badgeText: 'text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
      };
    case 'low':
    default:
      return {
        label: 'Low',
        dotClass: 'bg-slate-400',
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      };
  }
}

export function formatUrlForDisplay(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getNextMonthsList(count = 6): { value: string; label: string }[] {
  const list: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${y}-${m}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    list.push({ value, label });
  }

  return list;
}
