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

const LS_CATEGORIES = 'orbit_categories_cache_';
const LS_BUDGETS = 'orbit_budgets_cache_';
const LS_RECURRING = 'orbit_recurring_cache_';
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

const STARTER_CATEGORIES: Array<{ name: string; icon: string; color: string; defaultAllocation: number }> = [
  { name: 'Savings & Investments', icon: 'PiggyBank', color: 'emerald', defaultAllocation: 15000 },
  { name: 'Bills & Utilities', icon: 'Zap', color: 'indigo', defaultAllocation: 12000 },
  { name: 'Food & Groceries', icon: 'Utensils', color: 'amber', defaultAllocation: 10000 },
  { name: 'Shopping & Grooming', icon: 'ShoppingBag', color: 'purple', defaultAllocation: 5000 },
  { name: 'Home & Living', icon: 'Home', color: 'cyan', defaultAllocation: 8000 },
];

class BudgetService {
  // ================= CATEGORIES =================

  async fetchCategories(userId: string): Promise<Category[]> {
    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const cachedStr = localStorage.getItem(cacheKey);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          if (data.length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data as Category[];
          } else {
            // Seed starter categories for fresh user
            const seeded = await this.seedStarterCategories(userId);
            return seeded;
          }
        }
      } catch (err) {
        console.warn('Failed fetching categories from Supabase, using cache:', err);
      }
    }

    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    // Default local seed
    return this.seedStarterCategories(userId);
  }

  async seedStarterCategories(userId: string): Promise<Category[]> {
    const now = new Date().toISOString();
    const starterList: Category[] = STARTER_CATEGORIES.map((c, idx) => ({
      id: `cat_starter_${idx + 1}_${Date.now()}`,
      user_id: userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      created_at: now,
    }));

    if (isSupabaseConfigured) {
      try {
        const inserts = starterList.map((item) => ({
          user_id: userId,
          name: item.name,
          icon: item.icon,
          color: item.color,
        }));
        const { data, error } = await supabase.from('categories').insert(inserts).select();
        if (!error && data && data.length > 0) {
          localStorage.setItem(`${LS_CATEGORIES}${userId}`, JSON.stringify(data));
          return data as Category[];
        }
      } catch (err) {
        console.warn('Failed seeding categories to Supabase:', err);
      }
    }

    localStorage.setItem(`${LS_CATEGORIES}${userId}`, JSON.stringify(starterList));
    return starterList;
  }

  async addCategory(
    userId: string,
    category: { name: string; icon: string; color: string }
  ): Promise<Category> {
    const newCat: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    // Update Local Cache
    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const cached = await this.fetchCategories(userId);
    const updated = [...cached, newCat];
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: category.name,
            icon: category.icon,
            color: category.color,
          })
          .select()
          .single();

        if (!error && data) {
          const finalItem = data as Category;
          const synced = updated.map((c) => (c.id === newCat.id ? finalItem : c));
          localStorage.setItem(cacheKey, JSON.stringify(synced));
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
    const cached = await this.fetchCategories(userId);
    const index = cached.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');

    const updatedCat = { ...cached[index], ...updates };
    cached[index] = updatedCat;
    localStorage.setItem(cacheKey, JSON.stringify(cached));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data as Category;
        }
      } catch (err) {
        console.warn('Supabase update category failed:', err);
      }
    }

    return updatedCat;
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_CATEGORIES}${userId}`;
    const cached = await this.fetchCategories(userId);
    const filtered = cached.filter((c) => c.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    // Clean up allocations from local budgets
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
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete category failed:', err);
      }
    }
  }

  // ================= MONTHLY BUDGETS =================

  async fetchMonthlyBudget(userId: string, month: string): Promise<MonthlyBudget> {
    const cacheKey = `${LS_BUDGETS}${userId}_${month}`;
    const cachedStr = localStorage.getItem(cacheKey);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('monthly_budgets')
          .select('*')
          .eq('user_id', userId)
          .eq('month', month)
          .maybeSingle();

        if (!error && data) {
          const budget: MonthlyBudget = {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            income: Number(data.income) || 0,
            allocations: data.allocations || {},
            created_at: data.created_at,
          };
          localStorage.setItem(cacheKey, JSON.stringify(budget));
          return budget;
        }
      } catch (err) {
        console.warn('Supabase fetch budget failed:', err);
      }
    }

    if (cachedStr) {
      try {
        return JSON.parse(cachedStr);
      } catch {}
    }

    // Default fallback starter budget with income 60,000
    const categories = await this.fetchCategories(userId);
    const initialAllocations: Record<string, number> = {};
    categories.forEach((cat) => {
      const starter = STARTER_CATEGORIES.find((s) => s.name === cat.name);
      initialAllocations[cat.id] = starter ? starter.defaultAllocation : 0;
    });

    const fallback: MonthlyBudget = {
      user_id: userId,
      month,
      income: 60000,
      allocations: initialAllocations,
    };
    localStorage.setItem(cacheKey, JSON.stringify(fallback));
    return fallback;
  }

  async upsertMonthlyBudget(
    userId: string,
    month: string,
    income: number,
    allocations: Record<string, number>
  ): Promise<MonthlyBudget> {
    const cacheKey = `${LS_BUDGETS}${userId}_${month}`;
    const budgetObj: MonthlyBudget = {
      user_id: userId,
      month,
      income,
      allocations,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(budgetObj));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('monthly_budgets')
          .upsert(
            {
              user_id: userId,
              month,
              income,
              allocations,
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
          localStorage.setItem(cacheKey, JSON.stringify(synced));
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
    const cachedStr = localStorage.getItem(cacheKey);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .select('*')
          .eq('user_id', userId)
          .order('day_of_month', { ascending: true });

        if (!error && data) {
          const list = data as RecurringExpense[];
          localStorage.setItem(cacheKey, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Supabase fetch recurring failed:', err);
      }
    }

    if (cachedStr) {
      try {
        return JSON.parse(cachedStr);
      } catch {}
    }

    // Default starter recurring expenses
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
    localStorage.setItem(cacheKey, JSON.stringify(starters));
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
    const newItem: RecurringExpense = {
      ...item,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `${LS_RECURRING}${userId}`;
    const current = await this.fetchRecurring(userId);
    const updated = [...current, newItem].sort((a, b) => a.day_of_month - b.day_of_month);
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .insert({
            user_id: userId,
            name: item.name,
            amount: item.amount,
            category: item.category,
            day_of_month: item.day_of_month,
            active: item.active,
          })
          .select()
          .single();

        if (!error && data) {
          const synced = updated.map((r) => (r.id === newItem.id ? (data as RecurringExpense) : r));
          localStorage.setItem(cacheKey, JSON.stringify(synced));
          return data as RecurringExpense;
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
    updates: Partial<RecurringExpense>
  ): Promise<RecurringExpense> {
    const cacheKey = `${LS_RECURRING}${userId}`;
    const current = await this.fetchRecurring(userId);
    const idx = current.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Recurring item not found');

    const updated = { ...current[idx], ...updates };
    current[idx] = updated;
    current.sort((a, b) => a.day_of_month - b.day_of_month);
    localStorage.setItem(cacheKey, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data as RecurringExpense;
        }
      } catch (err) {
        console.warn('Supabase update recurring failed:', err);
      }
    }

    return updated;
  }

  async deleteRecurring(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_RECURRING}${userId}`;
    const current = await this.fetchRecurring(userId);
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('recurring_expenses').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete recurring failed:', err);
      }
    }
  }

  async toggleRecurring(userId: string, id: string, active: boolean): Promise<RecurringExpense> {
    return this.updateRecurring(userId, id, { active });
  }

  // ================= PLANNED PURCHASES =================

  async fetchPlanned(userId: string, month?: string): Promise<PlannedPurchase[]> {
    const cacheKey = `${LS_PLANNED}${userId}`;
    const cachedStr = localStorage.getItem(cacheKey);

    let all: PlannedPurchase[] = [];

    if (isSupabaseConfigured) {
      try {
        const query = supabase
          .from('planned_purchases')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
          all = data as PlannedPurchase[];
          localStorage.setItem(cacheKey, JSON.stringify(all));
        }
      } catch (err) {
        console.warn('Supabase fetch planned failed:', err);
      }
    }

    if (all.length === 0 && cachedStr) {
      try {
        all = JSON.parse(cachedStr);
      } catch {}
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
    const newItem: PlannedPurchase = {
      ...item,
      id: `pln_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const cacheKey = `${LS_PLANNED}${userId}`;
    const all = await this.fetchPlanned(userId);
    const updated = [newItem, ...all];
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('planned_purchases')
          .insert({
            user_id: userId,
            name: item.name,
            amount: item.amount,
            target_month: item.target_month,
            status: item.status,
            category: item.category,
            notes: item.notes,
          })
          .select()
          .single();

        if (!error && data) {
          const synced = updated.map((p) => (p.id === newItem.id ? (data as PlannedPurchase) : p));
          localStorage.setItem(cacheKey, JSON.stringify(synced));
          return data as PlannedPurchase;
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
    updates: Partial<PlannedPurchase>
  ): Promise<PlannedPurchase> {
    const cacheKey = `${LS_PLANNED}${userId}`;
    const all = await this.fetchPlanned(userId);
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Planned item not found');

    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(cacheKey, JSON.stringify(all));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('planned_purchases')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data as PlannedPurchase;
        }
      } catch (err) {
        console.warn('Supabase update planned failed:', err);
      }
    }

    return updated;
  }

  async deletePlanned(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_PLANNED}${userId}`;
    const all = await this.fetchPlanned(userId);
    const filtered = all.filter((p) => p.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('planned_purchases').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete planned failed:', err);
      }
    }
  }

  async markPlannedBought(userId: string, id: string): Promise<PlannedPurchase> {
    return this.updatePlanned(userId, id, { status: 'bought' });
  }

  // ================= TEMPLATES =================

  async fetchTemplates(userId: string): Promise<BudgetTemplate[]> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cachedStr = localStorage.getItem(cacheKey);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('budget_templates')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return data as BudgetTemplate[];
        }
      } catch (err) {
        console.warn('Supabase fetch templates failed, using cache:', err);
      }
    }

    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }

    return [];
  }

  async saveAsTemplate(
    userId: string,
    name: string,
    allocations: Record<string, number>,
    isDefault: boolean = false
  ): Promise<BudgetTemplate> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cleanName = name.trim();

    // Clean allocations (only positive numbers)
    const cleanAllocations: Record<string, number> = {};
    Object.entries(allocations).forEach(([k, v]) => {
      const num = Number(v) || 0;
      if (num > 0) {
        cleanAllocations[k] = num;
      }
    });

    const newTemplate: BudgetTemplate = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      name: cleanName,
      allocations: cleanAllocations,
      is_default: !!isDefault,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        if (isDefault) {
          // Unset other defaults first
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
          localStorage.setItem(cacheKey, JSON.stringify(all));
          return data as BudgetTemplate;
        }
      } catch (err) {
        console.warn('Supabase insert template failed, using local:', err);
      }
    }

    // Local fallback
    const cached = await this.fetchTemplates(userId);
    let updatedList = isDefault
      ? cached.map((t) => ({ ...t, is_default: false }))
      : [...cached];
    updatedList = [newTemplate, ...updatedList];
    localStorage.setItem(cacheKey, JSON.stringify(updatedList));
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

    // Get categories to validate
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

    // Keep the current month's income
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
    const cached = await this.fetchTemplates(userId);
    const existing = cached.find((t) => t.id === id);

    if (!existing) {
      throw new Error('Template not found');
    }

    const updated: BudgetTemplate = {
      ...existing,
      ...updates,
      name: updates.name ? updates.name.trim() : existing.name,
    };

    if (isSupabaseConfigured) {
      try {
        if (updates.is_default) {
          // Unset other defaults
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
          localStorage.setItem(cacheKey, JSON.stringify(all));
          return data as BudgetTemplate;
        }
      } catch (err) {
        console.warn('Supabase update template failed, updating local:', err);
      }
    }

    // Local fallback
    let list = cached.map((t) => {
      if (t.id === id) return updated;
      if (updates.is_default) return { ...t, is_default: false };
      return t;
    });
    localStorage.setItem(cacheKey, JSON.stringify(list));
    return updated;
  }

  async deleteTemplate(userId: string, id: string): Promise<void> {
    const cacheKey = `${LS_TEMPLATES}${userId}`;
    const cached = await this.fetchTemplates(userId);
    const updated = cached.filter((t) => t.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
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
    const cached = await this.fetchTemplates(userId);

    const updated = cached.map((t) => ({
      ...t,
      is_default: t.id === id,
    }));
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
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
    const allocations = budget.allocations || {};

    // Sum allocations for existing categories
    let totalAllocated = 0;
    let savingsAllocated = 0;

    categories.forEach((cat) => {
      const amt = Number(allocations[cat.id]) || 0;
      totalAllocated += amt;
      if (
        cat.icon === 'PiggyBank' ||
        cat.name.toLowerCase().includes('saving') ||
        cat.name.toLowerCase().includes('invest')
      ) {
        savingsAllocated += amt;
      }
    });

    const unallocated = income - totalAllocated;
    const savingsPercent = income > 0 ? Math.round((savingsAllocated / income) * 100) : 0;

    const activeRecurring = recurring.filter((r) => r.active);
    const recurringTotal = activeRecurring.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const pendingPlanned = planned.filter((p) => p.status === 'planned');

    return {
      month,
      income,
      totalAllocated,
      unallocated,
      savingsPercent,
      categoriesCount: categories.length,
      recurringCount: activeRecurring.length,
      recurringTotal,
      plannedCount: pendingPlanned.length,
    };
  }
}

export const budgetService = new BudgetService();
