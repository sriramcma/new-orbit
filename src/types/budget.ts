export type PlannedPurchaseStatus = 'planned' | 'bought' | 'cancelled';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string; // Lucide icon name: PiggyBank | Zap | ShoppingBag | Home | Utensils | CreditCard | Wallet | Gift | Car | Heart | BookOpen | MoreHorizontal
  color: string; // emerald | indigo | amber | rose | cyan | purple
  created_at?: string;
}

export type CategoryAllocations = Record<string, number>;

export interface MonthlyBudget {
  id?: string;
  user_id: string;
  month: string; // YYYY-MM
  income: number;
  allocations: CategoryAllocations;
  created_at?: string;
}

export interface BudgetTemplate {
  id: string;
  user_id: string;
  name: string;
  allocations: CategoryAllocations; // {"catId": amount}
  is_default: boolean;
  created_at?: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string; // Category ID or Name
  day_of_month: number; // 1 to 31
  active: boolean;
  created_at: string;
}

export interface PlannedPurchase {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  target_month: string; // YYYY-MM
  status: PlannedPurchaseStatus;
  category: string; // Category ID or Name
  notes?: string | null;
  created_at: string;
}

export interface MonthSummary {
  month: string; // YYYY-MM
  income: number;
  totalAllocated: number;
  unallocated: number; // income - totalAllocated
  savingsPercent: number; // Percentage of income allocated to Savings
  categoriesCount: number;
  recurringCount: number;
  recurringTotal: number;
  plannedCount: number;
}

export type BudgetPlannerTab = 'plan' | 'recurring' | 'planned';
