import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  StyleItem,
  StyleCategory,
  StyleStatus,
  StyleSummary,
} from '../types/style';

const LS_STYLE_KEY = 'orbit_style_cache_';

export const STYLE_SQL_SCHEMA = `-- ============================================
-- ORBIT — Style & Wardrobe Lookbook
-- ============================================

CREATE TABLE IF NOT EXISTS public.style_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clothes', 'accessories', 'watches', 'haircut')),
  brand TEXT,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'shortlisted', 'bought')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.style_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own style items"
  ON public.style_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style items"
  ON public.style_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style items"
  ON public.style_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own style items"
  ON public.style_items FOR DELETE
  USING (auth.uid() = user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_style_user ON public.style_items(user_id);
CREATE INDEX IF NOT EXISTS idx_style_category ON public.style_items(category);
CREATE INDEX IF NOT EXISTS idx_style_status ON public.style_items(status);
`;

const INITIAL_SEED_ITEMS: Omit<StyleItem, 'user_id'>[] = [
  {
    id: 'style_seed_1',
    title: 'Japanese Selvedge Denim Type III Jacket',
    category: 'clothes',
    brand: 'Iron Heart',
    status: 'shortlisted',
    notes: 'Heavyweight 14oz raw selvedge. Perfect boxy silhouette for layering over hoodies.',
    links: [
      { label: 'Lookbook Reference', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80' },
      { label: 'Store Link', url: 'https://ironheartamerica.com' },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'style_seed_2',
    title: 'Heavyweight Boxy Crew Neck (Off-White)',
    category: 'clothes',
    brand: 'Uniqlo U',
    status: 'bought',
    notes: 'Size L for relaxed drape. Thick collar ribbing that does not bacon after wash.',
    links: [
      { label: 'Photo Ref', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
    ],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'style_seed_3',
    title: 'Pleated Tapered Wool Trousers (Charcoal)',
    category: 'clothes',
    brand: 'Spier & Mackay',
    status: 'idea',
    notes: 'Single forward pleat, side adjusters instead of belt loops.',
    links: [],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'style_seed_4',
    title: 'Classic Tortoiseshell Acetate Sunglasses',
    category: 'accessories',
    brand: 'Moscot',
    status: 'bought',
    notes: 'Lemtosh 46mm with custom green mineral glass lenses.',
    links: [
      { label: 'Style Reference', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80' },
    ],
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'style_seed_5',
    title: 'Full-Grain Vegetable Tanned Leather Belt',
    category: 'accessories',
    brand: 'Tanner Goods',
    status: 'shortlisted',
    notes: 'Cognac brown with matte brass roller buckle. 1.25 inch width.',
    links: [],
    created_at: new Date(Date.now() - 86400000 * 19).toISOString(),
  },
  {
    id: 'style_seed_6',
    title: 'Seiko 5 GMT Automatic (Black/Blue)',
    category: 'watches',
    brand: 'Seiko',
    status: 'bought',
    notes: 'Ref. SSK003. Jubilee style bracelet, 4R34 automatic dual-time caliber.',
    links: [
      { label: 'Wrist Shot Reference', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80' },
      { label: 'Seiko Official', url: 'https://www.seikowatches.com' },
    ],
    created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
  },
  {
    id: 'style_seed_7',
    title: 'PRX Powermatic 80 (Deep Navy Dial)',
    category: 'watches',
    brand: 'Tissot',
    status: 'idea',
    notes: 'Integrated stainless steel bracelet, waffle dial pattern, 80-hour power reserve.',
    links: [],
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'style_seed_8',
    title: 'Textured French Crop with Low Skin Taper',
    category: 'haircut',
    brand: 'Downtown Barber Co.',
    status: 'shortlisted',
    notes: 'Ask for: 2.5 inches length on top point-cut for texture. Low taper around sideburns and nape. Finish with matte styling clay.',
    links: [
      { label: 'Front Angle Reference', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80' },
      { label: 'Side Fade Angle', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

function getLocalItems(userId: string): StyleItem[] {
  try {
    const raw = localStorage.getItem(`${LS_STYLE_KEY}${userId}`);
    if (!raw) {
      const seeded = INITIAL_SEED_ITEMS.map((item) => ({
        ...item,
        user_id: userId,
      }));
      localStorage.setItem(`${LS_STYLE_KEY}${userId}`, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as StyleItem[];
  } catch {
    return [];
  }
}

function saveLocalItems(userId: string, items: StyleItem[]): void {
  try {
    localStorage.setItem(`${LS_STYLE_KEY}${userId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save style items to localStorage:', err);
  }
}

export const styleService = {
  async fetchStyleItems(
    userId: string,
    category?: StyleCategory
  ): Promise<{ items: StyleItem[]; fromDatabase: boolean; error?: string }> {
    const cached = getLocalItems(userId);
    const filteredCached = category ? cached.filter((i) => i.category === category) : cached;

    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return { items: filteredCached, fromDatabase: false };
    }

    try {
      let query = supabase
        .from('style_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        return { items: filteredCached, fromDatabase: false, error: error.message };
      }

      if (data && data.length > 0) {
        const formatted = data.map((d) => ({
          ...d,
          links: Array.isArray(d.links) ? d.links : [],
        })) as StyleItem[];

        // Sync local cache
        const allLocal = getLocalItems(userId);
        const nonCat = category ? allLocal.filter((i) => i.category !== category) : [];
        saveLocalItems(userId, [...formatted, ...nonCat]);

        return { items: formatted, fromDatabase: true };
      }

      // If user has zero items in Supabase, seed defaults
      if (data && data.length === 0 && cached.length > 0 && !category) {
        try {
          const toInsert = cached.map((c) => ({
            ...c,
            user_id: userId,
          }));
          const { data: inserted } = await supabase
            .from('style_items')
            .insert(toInsert)
            .select();

          if (inserted && inserted.length > 0) {
            const formatted = inserted.map((d) => ({
              ...d,
              links: Array.isArray(d.links) ? d.links : [],
            })) as StyleItem[];
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

  async addStyleItem(
    userId: string,
    item: Omit<StyleItem, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ item: StyleItem; fromDatabase: boolean; error?: string }> {
    const newItem: StyleItem = {
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
        .from('style_items')
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
        } as StyleItem;
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

  async updateStyleItem(
    userId: string,
    id: string,
    updates: Partial<StyleItem>
  ): Promise<{ item: StyleItem; fromDatabase: boolean; error?: string }> {
    const current = getLocalItems(userId);
    const existing = current.find((i) => i.id === id);
    if (!existing) {
      throw new Error('Style item not found');
    }

    const updatedItem: StyleItem = {
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
        .from('style_items')
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
        } as StyleItem;
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
    status: StyleStatus
  ): Promise<{ item: StyleItem; fromDatabase: boolean; error?: string }> {
    return this.updateStyleItem(userId, id, { status });
  },

  async deleteStyleItem(
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
        .from('style_items')
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

  calculateSummary(items: StyleItem[]): StyleSummary {
    let idea = 0;
    let shortlisted = 0;
    let bought = 0;
    const byCategory: Record<StyleCategory, number> = {
      clothes: 0,
      accessories: 0,
      watches: 0,
      haircut: 0,
    };

    items.forEach((item) => {
      if (item.status === 'idea') idea++;
      else if (item.status === 'shortlisted') shortlisted++;
      else if (item.status === 'bought') bought++;

      if (byCategory[item.category] !== undefined) {
        byCategory[item.category]++;
      }
    });

    return {
      total: items.length,
      idea,
      shortlisted,
      bought,
      byCategory,
    };
  },

  subscribeToStyle(userId: string, callback: () => void): () => void {
    if (!isSupabaseConfigured || !userId || userId.startsWith('demo-')) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`style_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'style_items',
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
