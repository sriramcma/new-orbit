import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Medicine, MedicineStockStatus, MedicineSummary } from '../types/medicine';

const LS_MEDICINES_KEY = 'orbit_medicines_cache_';

export const MEDICINES_SQL_SCHEMA = `-- ============================================
-- ORBIT — Medicines & Health Cabinet
-- ============================================

CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  dosage_notes TEXT,
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own medicines
CREATE POLICY "Users can view own medicines"
  ON public.medicines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medicines"
  ON public.medicines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medicines"
  ON public.medicines FOR DELETE
  USING (auth.uid() = user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_medicines_user ON public.medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_medicines_stock ON public.medicines(stock_status);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON public.medicines(expiry_date);
`;

const INITIAL_SEED_MEDICINES: Omit<Medicine, 'user_id'>[] = [
  {
    id: 'med_seed_1',
    name: 'Paracetamol 500mg',
    purpose: 'Fever & mild pain relief',
    dosage_notes: '1 tablet every 6 hours after food. Max 4 tablets/day.',
    stock_status: 'in_stock',
    expiry_date: new Date(Date.now() + 86400000 * 320).toISOString().split('T')[0], // ~10 months
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'med_seed_2',
    name: 'Cetirizine 10mg',
    purpose: 'Allergies, runny nose & sneezing',
    dosage_notes: '1 tablet once daily before bedtime. May cause mild drowsiness.',
    stock_status: 'low_stock',
    expiry_date: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0], // expiring in 18 days!
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'med_seed_3',
    name: 'Ibuprofen 400mg',
    purpose: 'Inflammation, toothache & body pain',
    dosage_notes: 'Take with a glass of water after meals. Do not take on empty stomach.',
    stock_status: 'out_of_stock',
    expiry_date: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'med_seed_4',
    name: 'Digene Antacid Gel',
    purpose: 'Acidity, heartburn & gas relief',
    dosage_notes: '10ml after meals or when discomfort occurs.',
    stock_status: 'in_stock',
    expiry_date: new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'med_seed_5',
    name: 'Oral Rehydration Salts (ORS)',
    purpose: 'Dehydration, summer heat & upset stomach',
    dosage_notes: 'Dissolve entire sachet in 1 liter clean drinking water.',
    stock_status: 'in_stock',
    expiry_date: new Date(Date.now() + 86400000 * 450).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'med_seed_6',
    name: 'D-Cold Total',
    purpose: 'Cold, headache & nasal congestion',
    dosage_notes: '1 tablet twice daily after meals.',
    stock_status: 'low_stock',
    expiry_date: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

function getLocalMedicines(userId: string): Medicine[] {
  try {
    const raw = localStorage.getItem(`${LS_MEDICINES_KEY}${userId}`);
    if (!raw) {
      // Seed default items for first time view
      const seeded = INITIAL_SEED_MEDICINES.map((item) => ({
        ...item,
        user_id: userId,
      }));
      localStorage.setItem(`${LS_MEDICINES_KEY}${userId}`, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Medicine[];
  } catch {
    return [];
  }
}

function saveLocalMedicines(userId: string, medicines: Medicine[]): void {
  try {
    localStorage.setItem(`${LS_MEDICINES_KEY}${userId}`, JSON.stringify(medicines));
  } catch (err) {
    console.error('Failed to cache medicines to localStorage:', err);
  }
}

export const medicineService = {
  async fetchMedicines(userId: string): Promise<{ medicines: Medicine[]; fromDatabase: boolean; error?: string }> {
    const cached = getLocalMedicines(userId);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { medicines: cached, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { medicines: cached, fromDatabase: false, error: error.message };
      }

      if (data && data.length > 0) {
        saveLocalMedicines(userId, data as Medicine[]);
        return { medicines: data as Medicine[], fromDatabase: true };
      }

      // If user has zero medicines in Supabase, seed the defaults to Supabase as well
      if (data && data.length === 0 && cached.length > 0) {
        try {
          const toInsert = cached.map((m) => ({
            ...m,
            user_id: userId,
          }));
          const { data: insertedData } = await supabase
            .from('medicines')
            .insert(toInsert)
            .select();

          if (insertedData && insertedData.length > 0) {
            saveLocalMedicines(userId, insertedData as Medicine[]);
            return { medicines: insertedData as Medicine[], fromDatabase: true };
          }
        } catch {
          // ignore seeding error
        }
      }

      return { medicines: (data || cached) as Medicine[], fromDatabase: true };
    } catch (err: unknown) {
      return {
        medicines: cached,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Database error',
      };
    }
  },

  async addMedicine(
    userId: string,
    medicine: Omit<Medicine, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ medicine: Medicine; fromDatabase: boolean; error?: string }> {
    const newMedicine: Medicine = {
      ...medicine,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    // Optimistic local update
    const current = getLocalMedicines(userId);
    const updated = [newMedicine, ...current];
    saveLocalMedicines(userId, updated);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { medicine: newMedicine, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('medicines')
        .insert([newMedicine])
        .select()
        .single();

      if (error) {
        return { medicine: newMedicine, fromDatabase: false, error: error.message };
      }

      if (data) {
        const finalMedicines = updated.map((m) => (m.id === newMedicine.id ? (data as Medicine) : m));
        saveLocalMedicines(userId, finalMedicines);
        return { medicine: data as Medicine, fromDatabase: true };
      }

      return { medicine: newMedicine, fromDatabase: true };
    } catch (err: unknown) {
      return {
        medicine: newMedicine,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Insert failed',
      };
    }
  },

  async updateMedicine(
    userId: string,
    id: string,
    updates: Partial<Medicine>
  ): Promise<{ medicine: Medicine; fromDatabase: boolean; error?: string }> {
    const current = getLocalMedicines(userId);
    const existing = current.find((m) => m.id === id);
    if (!existing) {
      throw new Error('Medicine not found');
    }

    const updatedMedicine: Medicine = {
      ...existing,
      ...updates,
    };

    const nextList = current.map((m) => (m.id === id ? updatedMedicine : m));
    saveLocalMedicines(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { medicine: updatedMedicine, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('medicines')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { medicine: updatedMedicine, fromDatabase: false, error: error.message };
      }

      if (data) {
        const finalMedicines = nextList.map((m) => (m.id === id ? (data as Medicine) : m));
        saveLocalMedicines(userId, finalMedicines);
        return { medicine: data as Medicine, fromDatabase: true };
      }

      return { medicine: updatedMedicine, fromDatabase: true };
    } catch (err: unknown) {
      return {
        medicine: updatedMedicine,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Update failed',
      };
    }
  },

  async updateStock(
    userId: string,
    id: string,
    status: MedicineStockStatus
  ): Promise<{ medicine: Medicine; fromDatabase: boolean; error?: string }> {
    return this.updateMedicine(userId, id, { stock_status: status });
  },

  async deleteMedicine(
    userId: string,
    id: string
  ): Promise<{ success: boolean; fromDatabase: boolean; error?: string }> {
    const current = getLocalMedicines(userId);
    const nextList = current.filter((m) => m.id !== id);
    saveLocalMedicines(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { success: true, fromDatabase: false };
    }

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return { success: true, fromDatabase: false, error: error.message };
      }

      return { success: true, fromDatabase: true };
    } catch (err: unknown) {
      return {
        success: true,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Delete failed',
      };
    }
  },

  calculateSummary(medicines: Medicine[]): MedicineSummary {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let expiringSoon = 0;
    let expired = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    medicines.forEach((med) => {
      if (med.stock_status === 'in_stock') inStock++;
      else if (med.stock_status === 'low_stock') lowStock++;
      else if (med.stock_status === 'out_of_stock') outOfStock++;

      if (med.expiry_date) {
        const exp = new Date(med.expiry_date);
        exp.setHours(0, 0, 0, 0);
        if (exp < today) {
          expired++;
        } else if (exp <= thirtyDaysFromNow) {
          expiringSoon++;
        }
      }
    });

    return {
      total: medicines.length,
      inStock,
      lowStock,
      outOfStock,
      expiringSoon,
      expired,
    };
  },

  subscribeToMedicines(userId: string, callback: () => void): () => void {
    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`medicines_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medicines',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            callback();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },
};
