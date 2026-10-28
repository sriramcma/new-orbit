import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  LearningItem,
  LearningType,
  LearningStatus,
  LearningSummary,
} from '../types/learning';

const LS_LEARNING_KEY = 'orbit_learning_cache_';

export const LEARNING_SQL_SCHEMA = `-- ============================================
-- ORBIT — Learning & Skills Vault
-- ============================================

CREATE TABLE IF NOT EXISTS public.learning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('skill', 'language', 'doubt', 'wishlist')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'learning', 'done')),
  notes TEXT,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own learning items"
  ON public.learning_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning items"
  ON public.learning_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning items"
  ON public.learning_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning items"
  ON public.learning_items FOR DELETE
  USING (auth.uid() = user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_learning_user ON public.learning_items(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_type ON public.learning_items(type);
CREATE INDEX IF NOT EXISTS idx_learning_status ON public.learning_items(status);
`;

const INITIAL_SEED_ITEMS: Omit<LearningItem, 'user_id'>[] = [
  {
    id: 'learn_seed_1',
    title: 'TypeScript Advanced Generics & Inference',
    type: 'skill',
    status: 'learning',
    notes: 'Focusing on distributive conditional types, template literal types, and infer keyword.',
    links: [
      { label: 'TS Handbook', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
      { label: 'Type Challenges', url: 'https://github.com/type-challenges/type-challenges' },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'learn_seed_2',
    title: 'System Design: Distributed Caching & Redis',
    type: 'skill',
    status: 'todo',
    notes: 'Study cache-aside, write-through, write-back, and cache invalidation strategies.',
    links: [{ label: 'ByteByteGo System Design', url: 'https://bytebytego.com' }],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'learn_seed_3',
    title: 'Spanish Conversational Basics (A2 Level)',
    type: 'language',
    status: 'learning',
    notes: '15 mins daily practice on sentence structures and verb conjugations (present & preterite).',
    links: [
      { label: 'SpanishDict Grammar', url: 'https://www.spanishdict.com' },
      { label: 'Coffee Break Spanish', url: 'https://coffeebreaklanguages.com' },
    ],
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'learn_seed_4',
    title: 'German B1 Vocabulary & Modal Particles',
    type: 'language',
    status: 'todo',
    notes: 'Next up after consolidating basic vocabulary.',
    links: [],
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'learn_seed_5',
    title: 'When to choose useLayoutEffect over useEffect?',
    type: 'doubt',
    status: 'learning',
    notes: 'Question: What visual flickers require useLayoutEffect?\n\nAnswer in progress: useLayoutEffect fires synchronously after all DOM mutations before browser paints. Use it only when measuring DOM elements or preventing UI jitter.',
    links: [{ label: 'React Docs Reference', url: 'https://react.dev/reference/react/useLayoutEffect' }],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'learn_seed_6',
    title: 'How does PostgreSQL B-Tree index handle range scans?',
    type: 'doubt',
    status: 'done',
    notes: 'Question: Why are B-Trees so fast for BETWEEN queries?\n\nSolved: Leaf nodes are stored in a doubly-linked sorted sequence. The query finds the start key in O(log N) then traverses sequentially across pointers.',
    links: [],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'learn_seed_7',
    title: 'Rust for High Performance WebAssembly',
    type: 'wishlist',
    status: 'todo',
    notes: 'Plan to build an interactive canvas simulation or audio processing node.',
    links: [{ label: 'The Rust Book', url: 'https://doc.rust-lang.org/book/' }],
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: 'learn_seed_8',
    title: 'Piano Chord Progressions & Music Theory',
    type: 'wishlist',
    status: 'todo',
    notes: 'Learn major/minor sevenths and jazz extensions on keyboard.',
    links: [],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

function getLocalItems(userId: string): LearningItem[] {
  try {
    const raw = localStorage.getItem(`${LS_LEARNING_KEY}${userId}`);
    if (!raw) {
      const seeded = INITIAL_SEED_ITEMS.map((item) => ({
        ...item,
        user_id: userId,
      }));
      localStorage.setItem(`${LS_LEARNING_KEY}${userId}`, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as LearningItem[];
  } catch {
    return [];
  }
}

function saveLocalItems(userId: string, items: LearningItem[]): void {
  try {
    localStorage.setItem(`${LS_LEARNING_KEY}${userId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save learning items to localStorage:', err);
  }
}

export const learningService = {
  async fetchItems(
    userId: string,
    type?: LearningType
  ): Promise<{ items: LearningItem[]; fromDatabase: boolean; error?: string }> {
    const cached = getLocalItems(userId);
    const filteredCached = type ? cached.filter((i) => i.type === type) : cached;

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { items: filteredCached, fromDatabase: false };
    }

    try {
      let query = supabase
        .from('learning_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        return { items: filteredCached, fromDatabase: false, error: error.message };
      }

      if (data && data.length > 0) {
        const formatted = data.map((d) => ({
          ...d,
          links: Array.isArray(d.links) ? d.links : [],
        })) as LearningItem[];

        // Sync local cache
        const allLocal = getLocalItems(userId);
        const nonType = type ? allLocal.filter((i) => i.type !== type) : [];
        saveLocalItems(userId, [...formatted, ...nonType]);

        return { items: formatted, fromDatabase: true };
      }

      // If user has zero items in Supabase, seed defaults
      if (data && data.length === 0 && cached.length > 0 && !type) {
        try {
          const toInsert = cached.map((c) => ({
            ...c,
            user_id: userId,
          }));
          const { data: inserted } = await supabase
            .from('learning_items')
            .insert(toInsert)
            .select();

          if (inserted && inserted.length > 0) {
            const formatted = inserted.map((d) => ({
              ...d,
              links: Array.isArray(d.links) ? d.links : [],
            })) as LearningItem[];
            saveLocalItems(userId, formatted);
            return { items: formatted, fromDatabase: true };
          }
        } catch {
          // fallback to cached
        }
      }

      return { items: filteredCached, fromDatabase: true };
    } catch (err: unknown) {
      return {
        items: filteredCached,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Database error',
      };
    }
  },

  async addItem(
    userId: string,
    item: Omit<LearningItem, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ item: LearningItem; fromDatabase: boolean; error?: string }> {
    const newItem: LearningItem = {
      ...item,
      id: crypto.randomUUID(),
      user_id: userId,
      links: item.links || [],
      created_at: new Date().toISOString(),
    };

    const current = getLocalItems(userId);
    const updated = [newItem, ...current];
    saveLocalItems(userId, updated);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { item: newItem, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('learning_items')
        .insert([newItem])
        .select()
        .single();

      if (error) {
        return { item: newItem, fromDatabase: false, error: error.message };
      }

      if (data) {
        const formatted = {
          ...data,
          links: Array.isArray(data.links) ? data.links : [],
        } as LearningItem;
        const finalItems = updated.map((i) => (i.id === newItem.id ? formatted : i));
        saveLocalItems(userId, finalItems);
        return { item: formatted, fromDatabase: true };
      }

      return { item: newItem, fromDatabase: true };
    } catch (err: unknown) {
      return {
        item: newItem,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Insert failed',
      };
    }
  },

  async updateItem(
    userId: string,
    id: string,
    updates: Partial<LearningItem>
  ): Promise<{ item: LearningItem; fromDatabase: boolean; error?: string }> {
    const current = getLocalItems(userId);
    const existing = current.find((i) => i.id === id);
    if (!existing) {
      throw new Error('Learning item not found');
    }

    const updatedItem: LearningItem = {
      ...existing,
      ...updates,
    };

    const nextList = current.map((i) => (i.id === id ? updatedItem : i));
    saveLocalItems(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { item: updatedItem, fromDatabase: false };
    }

    try {
      const { data, error } = await supabase
        .from('learning_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { item: updatedItem, fromDatabase: false, error: error.message };
      }

      if (data) {
        const formatted = {
          ...data,
          links: Array.isArray(data.links) ? data.links : [],
        } as LearningItem;
        const finalItems = nextList.map((i) => (i.id === id ? formatted : i));
        saveLocalItems(userId, finalItems);
        return { item: formatted, fromDatabase: true };
      }

      return { item: updatedItem, fromDatabase: true };
    } catch (err: unknown) {
      return {
        item: updatedItem,
        fromDatabase: false,
        error: err instanceof Error ? err.message : 'Update failed',
      };
    }
  },

  async updateStatus(
    userId: string,
    id: string,
    status: LearningStatus
  ): Promise<{ item: LearningItem; fromDatabase: boolean; error?: string }> {
    return this.updateItem(userId, id, { status });
  },

  async deleteItem(
    userId: string,
    id: string
  ): Promise<{ success: boolean; fromDatabase: boolean; error?: string }> {
    const current = getLocalItems(userId);
    const nextList = current.filter((i) => i.id !== id);
    saveLocalItems(userId, nextList);

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { success: true, fromDatabase: false };
    }

    try {
      const { error } = await supabase
        .from('learning_items')
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

  calculateSummary(items: LearningItem[]): LearningSummary {
    let learning = 0;
    let todo = 0;
    let done = 0;
    const byType: Record<LearningType, number> = {
      skill: 0,
      language: 0,
      doubt: 0,
      wishlist: 0,
    };

    let activeLearningItem: LearningItem | null = null;

    items.forEach((item) => {
      if (item.status === 'learning') {
        learning++;
        if (!activeLearningItem) {
          activeLearningItem = item;
        }
      } else if (item.status === 'todo') {
        todo++;
      } else if (item.status === 'done') {
        done++;
      }

      if (byType[item.type] !== undefined) {
        byType[item.type]++;
      }
    });

    return {
      total: items.length,
      learning,
      todo,
      done,
      byType,
      activeLearningItem,
    };
  },

  subscribeToLearning(userId: string, callback: () => void): () => void {
    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`learning_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'learning_items',
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
