import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  Category,
  MonthlyBudget,
  BudgetTemplate,
  RecurringExpense,
  PlannedPurchase,
  PlannedPurchaseStatus,
  MonthSummary,
} from '../types/budget';
import { computeBudgetPlanBreakdown } from '../utils/budgetUtils';

const LS_CATEGORIES = 'orbit_categories_cache_';
const LS_CATEGORIES_SEEDED = 'orbit_categories_seeded_';
const LS_BUDGETS = 'orbit_budgets_cache_';
const LS_RECURRING = 'orbit_recurring_cache_';
const LS_RECURRING_SEEDED = 'orbit_recurring_seeded_';
const LS_PLANNED = 'orbit_planned_cache_';
const LS_TEMPLATES = 'orbit_templates_cache_';

export const BUDGET_SQL_SCHEMA = `-- Tables for the ORBIT Budget Planner module

-- 1. Custom Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'MoreHorizontal',
  color TEXT NOT NULL DEFAULT 'indigo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Monthly Budgets (Income & Category Allocations)
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  income NUMERIC NOT NULL DEFAULT 0,
  allocations JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own monthly budgets"
  ON public.monthly_budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Recurring Expenses (Planning / Bills reminder)
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recurring expenses"
  ON public.recurring_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Planned Purchases
CREATE TABLE IF NOT EXISTS public.planned_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  target_month TEXT NOT NULL, -- YYYY-MM
  status TEXT CHECK (status IN ('planned', 'bought', 'cancelled')) DEFAULT 'planned',
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planned_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own planned purchases"
  ON public.planned_purchases FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Budget Templates
CREATE TABLE IF NOT EXISTS public.budget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  allocations JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budget templates"
  ON public.budget_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tpl_user ON public.budget_templates(user_id);
`;

const STARTER_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: 'Savings & Investments', icon: 'PiggyBank', color: 'emerald' },
  { name: 'Bills & Utilities', icon: 'Zap', color: 'indigo' },
  { name: 'Food & Groceries', icon: 'Utensils', color: 'amber' },
  { name: 'Shopping & Grooming', icon: 'ShoppingBag', color: 'purple' },
  { name: 'Home & Living', icon: 'Home', color: 'cyan' },
];

function canUseSupabase(userId: string): boolean {
  return Boolean(
    isSupabaseConfigured &&
      userId &&
      !userId.startsWith('demo-') &&
      userId !== 'guest_user'
  );
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Budget localStorage write failed:', err);
  }
}

function normalizeRecurring(raw: RecurringExpense): RecurringExpense {
  return {
    ...raw,
    amount: Number(raw.amount) || 0,
    day_of_month: Math.max(1, Math.min(31, Number(raw.day_of_month) || 1)),
    active: raw.active !== undefined ? Boolean(raw.active) : true,
  };
}

function normalizePlanned(raw: PlannedPurchase): PlannedPurchase {
  return {
    ...raw,
    amount: Number(raw.amount) || 0,
    status: raw.status || 'planned',
  };
}

class BudgetService {
  // ================= CATEGORIES =================

  async fetchCategories(userId: string): Promise<Category[]> {
    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const seededKey = `${LS_CATEGORIES_SEEDED}${userId}`;
    const alreadySeeded = typeof window !== 'undefined' && localStorage.getItem(seededKey) === '1';

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          if (data.length > 0) {
            writeJson(cacheKey, data);
            if (typeof window !== 'undefined') localStorage.setItem(seededKey, '1');
            return data as Category[];
          }
          if (!alreadySeeded) {
            return await this.seedStarterCategories(userId);
          }
          writeJson(cacheKey, []);
          return [];
        }
      } catch (err) {
        console.warn('Failed fetching categories from Supabase, using cache:', err);
      }
    }

    const cached = readJson<Category[] | null>(cacheKey, null);
    if (Array.isArray(cached)) {
      if (cached.length > 0 || alreadySeeded) {
        if (cached.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem(seededKey, '1');
        }
        return cached;
      }
    }

    return this.seedStarterCategories(userId);
  }

  async seedStarterCategories(userId: string): Promise<Category[]> {
    const now = new Date().toISOString();
    const baseTs = Date.now();
    const starterList: Category[] = STARTER_CATEGORIES.map((c, idx) => ({
      id: `cat_starter_${idx + 1}_${baseTs}`,
      user_id: userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      created_at: now,
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LS_CATEGORIES_SEEDED}${userId}`, '1');
    }

    if (canUseSupabase(userId)) {
      try {
        const inserts = starterList.map((item) => ({
          user_id: userId,
          name: item.name,
          icon: item.icon,
          color: item.color,
        }));
        const { data, error } = await supabase.from('categories').insert(inserts).select();
        if (!error && data && data.length > 0) {
          writeJson(`${LS_CATEGORIES}${userId}`, data);
          return data as Category[];
        }
      } catch (err) {
        console.warn('Failed seeding categories to Supabase:', err);
      }
    }

    writeJson(`${LS_CATEGORIES}${userId}`, starterList);
    return starterList;
  }

  async addCategory(
    userId: string,
    category: { name: string; icon: string; color: string }
  ): Promise<Category> {
    const newCat: Category = {
      name: category.name.trim(),
      icon: category.icon,
      color: category.color,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const cached = readJson<Category[]>(cacheKey, []);
    const updated = [...cached, newCat];
    writeJson(cacheKey, updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LS_CATEGORIES_SEEDED}${userId}`, '1');
    }

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: newCat.name,
            icon: newCat.icon,
            color: newCat.color,
          })
          .select()
          .single();

        if (!error && data) {
          const finalItem = data as Category;
          const latest = readJson<Category[]>(cacheKey, updated);
          const synced = latest.map((c) => (c.id === newCat.id ? finalItem : c));
          writeJson(cacheKey, synced);
          return finalItem;
        }
      } catch (err) {
        console.warn('Supabase add category failed:', err);
      }
    }

    return newCat;
  }

  async updateCategory(
    userId: string,
    id: string,
    updates: Partial<Category>
  ): Promise<Category> {
    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const cached = readJson<Category[]>(cacheKey, []);
    const index = cached.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');

    const oldName = cached[index].name;
    const cleanUpdates: Partial<Category> = {
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    };

    const updatedCat: Category = { ...cached[index], ...cleanUpdates };
    const nextList = cached.map((c) => (c.id === id ? updatedCat : c));
    writeJson(cacheKey, nextList);

    // If category was renamed, cascade-rename references in recurring expenses & planned purchases
    const newName = updatedCat.name;
    if (oldName && newName && oldName !== newName) {
      await this.cascadeCategoryRename(userId, oldName, newName);
    }

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(cleanUpdates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          const serverCat = data as Category;
          const latest = readJson<Category[]>(cacheKey, nextList);
          writeJson(
            cacheKey,
            latest.map((c) => (c.id === id ? serverCat : c))
          );
          return serverCat;
        }
      } catch (err) {
        console.warn('Supabase update category failed:', err);
      }
    }

    return updatedCat;
  }

  private async cascadeCategoryRename(
    userId: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    const oldNorm = oldName.trim().toLowerCase();

    // Update local recurring cache
    const recKey = `${LS_RECURRING}${userId}`;
    const recList = readJson<RecurringExpense[]>(recKey, []);
    let recChanged = false;
    const nextRec = recList.map((r) => {
      if (r.category.trim().toLowerCase() === oldNorm) {
        recChanged = true;
        return { ...r, category: newName };
      }
      return r;
    });
    if (recChanged) writeJson(recKey, nextRec);

    // Update local planned cache
    const plnKey = `${LS_PLANNED}${userId}`;
    const plnList = readJson<PlannedPurchase[]>(plnKey, []);
    let plnChanged = false;
    const nextPln = plnList.map((p) => {
      if (p.category.trim().toLowerCase() === oldNorm) {
        plnChanged = true;
        return { ...p, category: newName };
      }
      return p;
    });
    if (plnChanged) writeJson(plnKey, nextPln);

    if (canUseSupabase(userId)) {
      try {
        await Promise.all([
          supabase
            .from('recurring_expenses')
            .update({ category: newName })
            .eq('user_id', userId)
            .eq('category', oldName),
          supabase
            .from('planned_purchases')
            .update({ category: newName })
            .eq('user_id', userId)
            .eq('category', oldName),
        ]);
      } catch (err) {
        console.warn('Supabase cascade category rename failed:', err);
      }
    }
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const cached = readJson<Category[]>(cacheKey, []);
    const filtered = cached.filter((c) => c.id !== id);
    writeJson(cacheKey, filtered);

    // Clean up allocations from local budgets
    if (typeof window !== 'undefined') {
      try {
        const budgetKeyPrefix = `${LS_BUDGETS}${userId}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(budgetKeyPrefix)) {
            const bStr = localStorage.getItem(key);
            if (bStr) {
              const b = JSON.parse(bStr);
              if (b.allocations && b.allocations[id] !== undefined) {
                delete b.allocations[id];
                localStorage.setItem(key, JSON.stringify(b));
              }
            }
          }
        }
      } catch {
        // ignore storage cleanup errors
      }
    }

    if (canUseSupabase(userId)) {
      try {
        await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete category failed:', err);
      }
    }
  }

  // ================= MONTHLY BUDGETS =================

  private findLatestKnownIncome(userId: string): number {
    if (typeof window === 'undefined') return 0;
    try {
      const prefix = `${LS_BUDGETS}${userId}_`;
      const found: { month: string; income: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const month = key.slice(prefix.length);
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as MonthlyBudget;
            const inc = Number(parsed.income) || 0;
            if (inc > 0) {
              found.push({ month, income: inc });
            }
          }
        }
      }
      if (found.length > 0) {
        found.sort((a, b) => b.month.localeCompare(a.month));
        return found[0].income;
      }
    } catch {
      // ignore
    }
    return 0;
  }

  async fetchMonthlyBudget(userId: string, month: string): Promise<MonthlyBudget> {
    const cacheKey = `${LS_BUDGETS}${userId}_${month}`;
    let dbCheckedEmpty = false;

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('monthly_budgets')
          .select('*')
          .eq('user_id', userId)
          .eq('month', month)
          .maybeSingle();

        if (!error) {
          if (data) {
            const budget: MonthlyBudget = {
              id: data.id,
              user_id: data.user_id,
              month: data.month,
              income: Number(data.income) || 0,
              allocations: data.allocations || {},
              created_at: data.created_at,
            };
            writeJson(cacheKey, budget);
            return budget;
          }
          dbCheckedEmpty = true;
        }
      } catch (err) {
        console.warn('Supabase fetch budget failed:', err);
      }
    }

    const cached = readJson<MonthlyBudget | null>(cacheKey, null);
    if (cached && (!dbCheckedEmpty || cached.income > 0 || Object.keys(cached.allocations || {}).length > 0)) {
      return {
        ...cached,
        income: Number(cached.income) || 0,
        allocations: cached.allocations || {},
      };
    }

    // For a fresh/unbudgeted month, carry forward latest known income (or 0) with clean empty allocations
    // so TemplateBanner appears cleanly and active recurring bills drive initial category amounts.
    const carriedIncome = this.findLatestKnownIncome(userId);
    const fresh: MonthlyBudget = {
      user_id: userId,
      month,
      income: carriedIncome,
      allocations: {},
    };
    return fresh;
  }

  async upsertMonthlyBudget(
    userId: string,
    month: string,
    income: number,
    allocations: Record<string, number>
  ): Promise<MonthlyBudget> {
    const cacheKey = `${LS_BUDGETS}${userId}_${month}`;
    const safeIncome = Math.max(0, Number(income) || 0);
    const safeAllocations: Record<string, number> = {};
    Object.entries(allocations || {}).forEach(([k, v]) => {
      safeAllocations[k] = Math.max(0, Number(v) || 0);
    });

    const budgetObj: MonthlyBudget = {
      user_id: userId,
      month,
      income: safeIncome,
      allocations: safeAllocations,
      created_at: new Date().toISOString(),
    };
    writeJson(cacheKey, budgetObj);

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('monthly_budgets')
          .upsert(
            {
              user_id: userId,
              month,
              income: safeIncome,
              allocations: safeAllocations,
            },
            { onConflict: 'user_id,month' }
          )
          .select()
          .single();

        if (!error && data) {
          const synced: MonthlyBudget = {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            income: Number(data.income) || 0,
            allocations: data.allocations || {},
            created_at: data.created_at,
          };
          writeJson(cacheKey, synced);
          return synced;
        }
      } catch (err) {
        console.warn('Supabase upsert budget failed:', err);
      }
    }

    return budgetObj;
  }

  // ================= RECURRING EXPENSES =================

  async fetchRecurring(userId: string): Promise<RecurringExpense[]> {
    const cacheKey = `${LS_RECURRING}${userId}`;
    const seededKey = `${LS_RECURRING_SEEDED}${userId}`;
    const alreadySeeded = typeof window !== 'undefined' && localStorage.getItem(seededKey) === '1';

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .select('*')
          .eq('user_id', userId)
          .order('day_of_month', { ascending: true });

        if (!error && data) {
          const list = (data as RecurringExpense[]).map(normalizeRecurring);
          writeJson(cacheKey, list);
          if (typeof window !== 'undefined') localStorage.setItem(seededKey, '1');
          return list;
        }
      } catch (err) {
        console.warn('Supabase fetch recurring failed:', err);
      }
    }

    const cached = readJson<RecurringExpense[] | null>(cacheKey, null);
    if (Array.isArray(cached)) {
      if (cached.length > 0 && typeof window !== 'undefined') {
        localStorage.setItem(seededKey, '1');
      }
      return cached.map(normalizeRecurring);
    }

    if (alreadySeeded) {
      return [];
    }

    // Default starter recurring expenses for first-time local/demo visitors only
    const starters: RecurringExpense[] = [
      {
        id: 'rec_1',
        user_id: userId,
        name: 'House Rent',
        amount: 15000,
        category: 'Home & Living',
        day_of_month: 5,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'rec_2',
        user_id: userId,
        name: 'Fiber Broadband',
        amount: 999,
        category: 'Bills & Utilities',
        day_of_month: 12,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'rec_3',
        user_id: userId,
        name: 'Mobile Recharge',
        amount: 699,
        category: 'Bills & Utilities',
        day_of_month: 24,
        active: true,
        created_at: new Date().toISOString(),
      },
    ];
    writeJson(cacheKey, starters);
    if (typeof window !== 'undefined') localStorage.setItem(seededKey, '1');
    return starters;
  }

  async addRecurring(
    userId: string,
    item: {
      name: string;
      amount: number;
      category: string;
      day_of_month: number;
      active: boolean;
    }
  ): Promise<RecurringExpense> {
    const newItem: RecurringExpense = normalizeRecurring({
      name: item.name.trim(),
      amount: Number(item.amount) || 0,
      category: item.category,
      day_of_month: Math.max(1, Math.min(31, Number(item.day_of_month) || 1)),
      active: item.active,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    });

    const cacheKey = `${LS_RECURRING}${userId}`;
    const current = readJson<RecurringExpense[]>(cacheKey, []);
    const updated = [...current, newItem].sort((a, b) => a.day_of_month - b.day_of_month);
    writeJson(cacheKey, updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LS_RECURRING_SEEDED}${userId}`, '1');
    }

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .insert({
            user_id: userId,
            name: newItem.name,
            amount: newItem.amount,
            category: newItem.category,
            day_of_month: newItem.day_of_month,
            active: newItem.active,
          })
          .select()
          .single();

        if (!error && data) {
          const syncedItem = normalizeRecurring(data as RecurringExpense);
          const latest = readJson<RecurringExpense[]>(cacheKey, updated);
          const syncedList = latest
            .map((r) => (r.id === newItem.id ? syncedItem : r))
            .sort((a, b) => a.day_of_month - b.day_of_month);
          writeJson(cacheKey, syncedList);
          return syncedItem;
        }
      } catch (err) {
        console.warn('Supabase add recurring failed:', err);
      }
    }

    return newItem;
  }

  async updateRecurring(
    userId: string,
    id: string,
    updates: Partial<RecurringExpense>,
    fallbackItem?: RecurringExpense
  ): Promise<RecurringExpense> {
    const cacheKey = `${LS_RECURRING}${userId}`;
    const current = readJson<RecurringExpense[]>(cacheKey, []);
    const idx = current.findIndex((r) => r.id === id);
    const existing = idx !== -1 ? current[idx] : fallbackItem;
    if (!existing) throw new Error('Recurring item not found');

    const cleanUpdates: Partial<RecurringExpense> = {
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.amount !== undefined ? { amount: Math.max(0, Number(updates.amount) || 0) } : {}),
      ...(updates.day_of_month !== undefined
        ? { day_of_month: Math.max(1, Math.min(31, Number(updates.day_of_month) || 1)) }
        : {}),
    };

    const updated = normalizeRecurring({ ...existing, ...cleanUpdates });
    const nextList =
      idx !== -1
        ? current.map((r) => (r.id === id ? updated : r))
        : [...current, updated];
    nextList.sort((a, b) => a.day_of_month - b.day_of_month);
    writeJson(cacheKey, nextList);

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .update(cleanUpdates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          const syncedItem = normalizeRecurring(data as RecurringExpense);
          const latest = readJson<RecurringExpense[]>(cacheKey, nextList);
          writeJson(
            cacheKey,
            latest
              .map((r) => (r.id === id ? syncedItem : r))
              .sort((a, b) => a.day_of_month - b.day_of_month)
          );
          return syncedItem;
        }
      } catch (err) {
        console.warn('Supabase update recurring failed:', err);
      }
    }

    return updated;
  }

  async deleteRecurring(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_RECURRING}${userId}`;
    const current = readJson<RecurringExpense[]>(cacheKey, []);
    const filtered = current.filter((r) => r.id !== id);
    writeJson(cacheKey, filtered);

    if (canUseSupabase(userId)) {
      try {
        await supabase.from('recurring_expenses').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete recurring failed:', err);
      }
    }
  }

  async toggleRecurring(
    userId: string,
    id: string,
    active: boolean,
    fallbackItem?: RecurringExpense
  ): Promise<RecurringExpense> {
    return this.updateRecurring(userId, id, { active }, fallbackItem);
  }

  // ================= PLANNED PURCHASES =================

  async fetchPlanned(userId: string, month?: string): Promise<PlannedPurchase[]> {
    const cacheKey = `${LS_PLANNED}${userId}`;
    let loadedFromDb = false;
    let all: PlannedPurchase[] = [];

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('planned_purchases')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          all = (data as PlannedPurchase[]).map(normalizePlanned);
          writeJson(cacheKey, all);
          loadedFromDb = true;
        }
      } catch (err) {
        console.warn('Supabase fetch planned failed:', err);
      }
    }

    if (!loadedFromDb) {
      all = readJson<PlannedPurchase[]>(cacheKey, []).map(normalizePlanned);
    }

    if (month) {
      return all.filter((p) => p.target_month === month);
    }
    return all;
  }

  async addPlanned(
    userId: string,
    item: {
      name: string;
      amount: number;
      category: string;
      target_month: string;
      status: PlannedPurchaseStatus;
      notes?: string | null;
    }
  ): Promise<PlannedPurchase> {
    const newItem: PlannedPurchase = normalizePlanned({
      name: item.name.trim(),
      amount: Number(item.amount) || 0,
      category: item.category,
      target_month: item.target_month,
      status: item.status || 'planned',
      notes: item.notes?.trim() || null,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `pln_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    });

    const cacheKey = `${LS_PLANNED}${userId}`;
    const all = readJson<PlannedPurchase[]>(cacheKey, []);
    const updated = [newItem, ...all];
    writeJson(cacheKey, updated);

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('planned_purchases')
          .insert({
            user_id: userId,
            name: newItem.name,
            amount: newItem.amount,
            target_month: newItem.target_month,
            status: newItem.status,
            category: newItem.category,
            notes: newItem.notes,
          })
          .select()
          .single();

        if (!error && data) {
          const syncedItem = normalizePlanned(data as PlannedPurchase);
          const latest = readJson<PlannedPurchase[]>(cacheKey, updated);
          writeJson(
            cacheKey,
            latest.map((p) => (p.id === newItem.id ? syncedItem : p))
          );
          return syncedItem;
        }
      } catch (err) {
        console.warn('Supabase add planned failed:', err);
      }
    }

    return newItem;
  }

  async updatePlanned(
    userId: string,
    id: string,
    updates: Partial<PlannedPurchase>,
    fallbackItem?: PlannedPurchase
  ): Promise<PlannedPurchase> {
    const cacheKey = `${LS_PLANNED}${userId}`;
    const all = readJson<PlannedPurchase[]>(cacheKey, []);
    const idx = all.findIndex((p) => p.id === id);
    const existing = idx !== -1 ? all[idx] : fallbackItem;
    if (!existing) throw new Error('Planned item not found');

    const cleanUpdates: Partial<PlannedPurchase> = {
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.amount !== undefined ? { amount: Math.max(0, Number(updates.amount) || 0) } : {}),
    };

    const updated = normalizePlanned({ ...existing, ...cleanUpdates });
    const nextList =
      idx !== -1 ? all.map((p) => (p.id === id ? updated : p)) : [updated, ...all];
    writeJson(cacheKey, nextList);

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('planned_purchases')
          .update(cleanUpdates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          const syncedItem = normalizePlanned(data as PlannedPurchase);
          const latest = readJson<PlannedPurchase[]>(cacheKey, nextList);
          writeJson(
            cacheKey,
            latest.map((p) => (p.id === id ? syncedItem : p))
          );
          return syncedItem;
        }
      } catch (err) {
        console.warn('Supabase update planned failed:', err);
      }
    }

    return updated;
  }

  async deletePlanned(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_PLANNED}${userId}`;
    const all = readJson<PlannedPurchase[]>(cacheKey, []);
    const filtered = all.filter((p) => p.id !== id);
    writeJson(cacheKey, filtered);

    if (canUseSupabase(userId)) {
      try {
        await supabase.from('planned_purchases').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete planned failed:', err);
      }
    }
  }

  async markPlannedBought(
    userId: string,
    id: string,
    status: PlannedPurchaseStatus = 'bought',
    fallbackItem?: PlannedPurchase
  ): Promise<PlannedPurchase> {
    return this.updatePlanned(userId, id, { status }, fallbackItem);
  }

  // ================= TEMPLATES =================

  async fetchTemplates(userId: string): Promise<BudgetTemplate[]> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;

    if (canUseSupabase(userId)) {
      try {
        const { data, error } = await supabase
          .from('budget_templates')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          writeJson(cacheKey, data);
          return data as BudgetTemplate[];
        }
      } catch (err) {
        console.warn('Supabase fetch templates failed, using cache:', err);
      }
    }

    return readJson<BudgetTemplate[]>(cacheKey, []);
  }

  async saveAsTemplate(
    userId: string,
    name: string,
    allocations: Record<string, number>,
    isDefault: boolean = false
  ): Promise<BudgetTemplate> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cleanName = name.trim();

    const cleanAllocations: Record<string, number> = {};
    Object.entries(allocations).forEach(([k, v]) => {
      const num = Number(v) || 0;
      if (num > 0) {
        cleanAllocations[k] = num;
      }
    });

    const newTemplate: BudgetTemplate = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      name: cleanName,
      allocations: cleanAllocations,
      is_default: !!isDefault,
      created_at: new Date().toISOString(),
    };

    if (canUseSupabase(userId)) {
      try {
        if (isDefault) {
          await supabase
            .from('budget_templates')
            .update({ is_default: false })
            .eq('user_id', userId);
        }

        const { data, error } = await supabase
          .from('budget_templates')
          .insert({
            id: newTemplate.id,
            user_id: userId,
            name: cleanName,
            allocations: cleanAllocations,
            is_default: !!isDefault,
          })
          .select()
          .single();

        if (!error && data) {
          const all = await this.fetchTemplates(userId);
          writeJson(cacheKey, all);
          return data as BudgetTemplate;
        }
      } catch (err) {
        console.warn('Supabase insert template failed, using local:', err);
      }
    }

    const cached = readJson<BudgetTemplate[]>(cacheKey, []);
    let updatedList = isDefault
      ? cached.map((t) => ({ ...t, is_default: false }))
      : [...cached];
    updatedList = [newTemplate, ...updatedList];
    writeJson(cacheKey, updatedList);
    return newTemplate;
  }

  async applyTemplate(
    userId: string,
    templateId: string,
    targetMonth: string,
    existingCategories?: Category[]
  ): Promise<{ budget: MonthlyBudget; skippedCount: number; skippedCategories: string[] }> {
    const templates = await this.fetchTemplates(userId);
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    const categories = existingCategories || (await this.fetchCategories(userId));
    const validCategoryIds = new Set(categories.map((c) => c.id));

    const validAllocations: Record<string, number> = {};
    const skippedCategories: string[] = [];

    Object.entries(template.allocations || {}).forEach(([catId, amount]) => {
      if (validCategoryIds.has(catId)) {
        validAllocations[catId] = amount;
      } else {
        skippedCategories.push(catId);
      }
    });

    const currentBudget = await this.fetchMonthlyBudget(userId, targetMonth);
    const updatedBudget = await this.upsertMonthlyBudget(
      userId,
      targetMonth,
      currentBudget.income,
      validAllocations
    );

    return {
      budget: updatedBudget,
      skippedCount: skippedCategories.length,
      skippedCategories,
    };
  }

  async updateTemplate(
    userId: string,
    id: string,
    updates: Partial<Pick<BudgetTemplate, 'name' | 'allocations' | 'is_default'>>
  ): Promise<BudgetTemplate> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cached = readJson<BudgetTemplate[]>(cacheKey, []);
    const existing = cached.find((t) => t.id === id);

    if (!existing) {
      throw new Error('Template not found');
    }

    const updated: BudgetTemplate = {
      ...existing,
      ...updates,
      name: updates.name ? updates.name.trim() : existing.name,
    };

    if (canUseSupabase(userId)) {
      try {
        if (updates.is_default) {
          await supabase
            .from('budget_templates')
            .update({ is_default: false })
            .eq('user_id', userId);
        }

        const { data, error } = await supabase
          .from('budget_templates')
          .update({
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.allocations !== undefined ? { allocations: updates.allocations } : {}),
            ...(updates.is_default !== undefined ? { is_default: updates.is_default } : {}),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          const all = await this.fetchTemplates(userId);
          writeJson(cacheKey, all);
          return data as BudgetTemplate;
        }
      } catch (err) {
        console.warn('Supabase update template failed, updating local:', err);
      }
    }

    const list = cached.map((t) => {
      if (t.id === id) return updated;
      if (updates.is_default) return { ...t, is_default: false };
      return t;
    });
    writeJson(cacheKey, list);
    return updated;
  }

  async deleteTemplate(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cached = readJson<BudgetTemplate[]>(cacheKey, []);
    const updated = cached.filter((t) => t.id !== id);
    writeJson(cacheKey, updated);

    if (canUseSupabase(userId)) {
      try {
        await supabase
          .from('budget_templates')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete template failed:', err);
      }
    }
  }

  async setDefaultTemplate(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cached = readJson<BudgetTemplate[]>(cacheKey, []);

    const updated = cached.map((t) => ({
      ...t,
      is_default: t.id === id,
    }));
    writeJson(cacheKey, updated);

    if (canUseSupabase(userId)) {
      try {
        await supabase
          .from('budget_templates')
          .update({ is_default: false })
          .eq('user_id', userId);

        await supabase
          .from('budget_templates')
          .update({ is_default: true })
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase set default template failed:', err);
      }
    }
  }

  async getTemplateForMonth(userId: string, _month: string): Promise<BudgetTemplate | null> {
    const templates = await this.fetchTemplates(userId);
    const defaultTpl = templates.find((t) => t.is_default);
    return defaultTpl || null;
  }

  // ================= SUMMARY =================

  async getMonthSummary(userId: string, month: string): Promise<MonthSummary> {
    const [budget, categories, recurring, planned] = await Promise.all([
      this.fetchMonthlyBudget(userId, month),
      this.fetchCategories(userId),
      this.fetchRecurring(userId),
      this.fetchPlanned(userId, month),
    ]);

    const income = Number(budget.income) || 0;
    const breakdown = computeBudgetPlanBreakdown(
      categories,
      budget.allocations || {},
      recurring,
      planned
    );

    const totalAllocated = breakdown.totalAllocated;
    const unallocated = income - totalAllocated;
    const savingsPercent =
      income > 0 ? Math.round((breakdown.savingsAllocated / income) * 100) : 0;

    const activeRecurring = recurring.filter((r) => r.active);
    const pendingPlanned = planned.filter((p) => p.status === 'planned');

    return {
      month,
      income,
      totalAllocated,
      unallocated,
      savingsPercent,
      categoriesCount: categories.length,
      recurringCount: activeRecurring.length,
      recurringTotal: breakdown.totalRecurring,
      plannedCount: pendingPlanned.length,
    };
  }
}

export const budgetService = new BudgetService();
