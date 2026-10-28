import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Debt, DebtDirection, DebtStatus } from '../types/debt';
import { getTodayString } from '../utils/debtDate';

const LOCAL_STORAGE_PREFIX = 'orbit_debts_cache_';

export const DEBTS_SQL_SCHEMA = `-- Create the debts table for ORBIT Borrow & Lend module
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  person TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  direction TEXT CHECK (direction IN ('borrowed', 'lent')) NOT NULL,
  return_date TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'settled')) DEFAULT 'pending',
  notes TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can manage their own debts"
  ON public.debts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`;

const getLocalDebts = (userId: string): Debt[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading debts cache:', e);
  }
  return [];
};

const saveLocalDebts = (userId: string, debts: Debt[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(debts));
  } catch (e) {
    console.error('Error saving debts cache:', e);
  }
};

export const debtService = {
  async getDebts(userId: string): Promise<{ debts: Debt[]; fromDatabase: boolean; error?: string }> {
    const local = getLocalDebts(userId);

    if (!isSupabaseConfigured || !userId) {
      return { debts: local, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { debts: local, fromDatabase: false, error: error.message };
      }

      const debts = (data as Debt[]) || [];
      saveLocalDebts(userId, debts);
      return { debts, fromDatabase: true };
    } catch (err: unknown) {
      return { debts: local, fromDatabase: false, error: err instanceof Error ? err.message : 'Fetch failed' };
    }
  },

  async createDebt(
    userId: string,
    debtData: {
      person: string;
      amount: number;
      direction: DebtDirection;
      return_date: string;
      notes?: string | null;
    }
  ): Promise<{ debt: Debt; fromDatabase: boolean; error?: string }> {
    const newDebt: Debt = {
      id: crypto.randomUUID ? crypto.randomUUID() : `debt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      person: debtData.person.trim(),
      amount: Number(debtData.amount),
      direction: debtData.direction,
      return_date: debtData.return_date,
      status: 'pending',
      notes: debtData.notes ? debtData.notes.trim() : null,
      settled_at: null,
      created_at: new Date().toISOString(),
    };

    // Optimistic local update
    const current = getLocalDebts(userId);
    const updated = [newDebt, ...current];
    saveLocalDebts(userId, updated);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { debt: newDebt, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([newDebt])
        .select()
        .single();

      if (error) {
        return { debt: newDebt, fromDatabase: false, error: error.message };
      }

      if (data) {
        const finalDebts = updated.map((d) => (d.id === newDebt.id ? (data as Debt) : d));
        saveLocalDebts(userId, finalDebts);
        return { debt: data as Debt, fromDatabase: true };
      }

      return { debt: newDebt, fromDatabase: true };
    } catch (err: unknown) {
      return { debt: newDebt, fromDatabase: false, error: err instanceof Error ? err.message : 'Insert failed' };
    }
  },

  async updateDebt(
    userId: string,
    debtId: string,
    updates: Partial<Debt>
  ): Promise<{ debt: Debt; fromDatabase: boolean; error?: string }> {
    const current = getLocalDebts(userId);
    const existing = current.find((d) => d.id === debtId);
    if (!existing) {
      throw new Error('Debt not found');
    }

    const updatedDebt: Debt = {
      ...existing,
      ...updates,
    };

    const nextList = current.map((d) => (d.id === debtId ? updatedDebt : d));
    saveLocalDebts(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { debt: updatedDebt, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', debtId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { debt: updatedDebt, fromDatabase: false, error: error.message };
      }

      return { debt: (data as Debt) || updatedDebt, fromDatabase: true };
    } catch (err: unknown) {
      return { debt: updatedDebt, fromDatabase: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  },

  async settleDebt(
    userId: string,
    debtId: string,
    logToBudget: boolean = false
  ): Promise<{ debt: Debt; loggedToBudget: boolean; error?: string }> {
    const current = getLocalDebts(userId);
    const target = current.find((d) => d.id === debtId);
    if (!target) throw new Error('Debt record not found');

    const now = new Date().toISOString();
    const { debt } = await this.updateDebt(userId, debtId, {
      status: 'settled',
      settled_at: now,
    });

    let loggedToBudget = false;
    if (logToBudget && isSupabaseConfigured && !userId.startsWith('demo-')) {
      try {
        const transactionRecord = {
          user_id: userId,
          type: target.direction === 'borrowed' ? 'expense' : 'income',
          amount: target.amount,
          category: 'debt',
          notes: target.direction === 'borrowed' ? `Repaid to ${target.person}` : `Received from ${target.person}`,
          date: getTodayString(),
        };

        const { error } = await supabase.from('transactions').insert([transactionRecord]);
        if (!error) {
          loggedToBudget = true;
        }
      } catch {
        // Transactions table may not be created yet, silently continue settlement
        loggedToBudget = false;
      }
    }

    return { debt, loggedToBudget };
  },

  async deleteDebt(userId: string, debtId: string): Promise<{ success: boolean; error?: string }> {
    const current = getLocalDebts(userId);
    const nextList = current.filter((d) => d.id !== debtId);
    saveLocalDebts(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
  },
};
