import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  BrainCategory,
  BrainItem,
  BrainLink,
  BrainChecklistItem,
} from '../types/brain';

const LS_CATEGORIES = 'orbit_brain_categories_cache_';
const LS_ITEMS = 'orbit_brain_items_cache_';

export const BRAIN_SQL_SCHEMA = `-- Tables for the ORBIT Second Brain Module

-- 1. Brain Categories
CREATE TABLE IF NOT EXISTS public.brain_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Folder',
  color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brain_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own brain categories"
  ON public.brain_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brain_cat_user ON public.brain_categories(user_id);

-- 2. Brain Items
CREATE TABLE IF NOT EXISTS public.brain_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.brain_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brain_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own brain items"
  ON public.brain_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brain_items_cat ON public.brain_items(category_id);
CREATE INDEX IF NOT EXISTS idx_brain_items_user ON public.brain_items(user_id);
`;

const INITIAL_CATEGORIES: Omit<BrainCategory, 'user_id'>[] = [
  {
    id: 'bcat_1',
    name: 'Personal Grooming',
    icon: 'Heart',
    color: 'rose',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'bcat_2',
    name: 'Pipeline & Projects',
    icon: 'Target',
    color: 'indigo',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'bcat_3',
    name: 'Learning & Books',
    icon: 'Book',
    color: 'emerald',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'bcat_4',
    name: 'Ideas & Sparks',
    icon: 'Lightbulb',
    color: 'amber',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const INITIAL_ITEMS: Omit<BrainItem, 'user_id'>[] = [
  {
    id: 'bitem_1',
    category_id: 'bcat_1',
    title: 'Morning Skincare Protocol',
    notes: 'Gentle cleanser -> Vitamin C serum -> Hyaluronic moisturizer -> SPF 50 sunscreen.',
    links: [
      { url: 'https://dermnetnz.org', label: 'DermNet Guide' },
    ],
    checklist: [
      { text: 'Sunscreen everyday before 9 AM', done: true },
      { text: 'Retinol on Tuesday and Friday nights', done: false },
    ],
    is_pinned: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'bitem_2',
    category_id: 'bcat_1',
    title: 'Haircare & Beard Trim Routine',
    notes: 'Bi-weekly trim on Sundays with guard 3. Argan oil on beard mornings.',
    links: [],
    checklist: [
      { text: 'Deep conditioning mask weekly', done: false },
      { text: 'Disinfect trimmer blades', done: true },
    ],
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'bitem_3',
    category_id: 'bcat_2',
    title: 'Q4 Product Launch Roadmap',
    notes: 'Focus on frictionless mobile capture and database realtime sync.',
    links: [
      { url: 'https://github.com', label: 'Repo Milestones' },
      { url: 'https://figma.com', label: 'Design System' },
    ],
    checklist: [
      { text: 'Polish mobile responsive layout', done: true },
      { text: 'Implement offline fallback cache', done: true },
      { text: 'Add toast notification triggers', done: false },
    ],
    is_pinned: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bitem_4',
    category_id: 'bcat_3',
    title: 'Atomic Habits Key Takeaways',
    notes: 'Make it obvious, make it attractive, make it easy, make it satisfying.',
    links: [],
    checklist: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

class BrainService {
  // ================= CATEGORIES =================

  async fetchCategories(userId: string): Promise<BrainCategory[]> {
    const catCacheKey = `${LS_CATEGORIES}${userId}`;
    const items = await this.fetchAllItems(userId);
    const cachedCatsStr = localStorage.getItem(catCacheKey);

    let categories: BrainCategory[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('brain_categories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          categories = data as BrainCategory[];
          localStorage.setItem(catCacheKey, JSON.stringify(categories));
        }
      } catch (err) {
        console.warn('Supabase fetch brain categories failed, using cache:', err);
      }
    }

    if (categories.length === 0 && cachedCatsStr) {
      try {
        categories = JSON.parse(cachedCatsStr);
      } catch {}
    }

    if (categories.length === 0 && !cachedCatsStr) {
      categories = INITIAL_CATEGORIES.map((cat) => ({
        ...cat,
        user_id: userId,
      }));
      localStorage.setItem(catCacheKey, JSON.stringify(categories));

      // Also prime items cache if empty
      const itemCacheKey = `${LS_ITEMS}${userId}`;
      if (!localStorage.getItem(itemCacheKey)) {
        const initialItemsWithUser = INITIAL_ITEMS.map((it) => ({
          ...it,
          user_id: userId,
        }));
        localStorage.setItem(itemCacheKey, JSON.stringify(initialItemsWithUser));
      }
    }

    // Attach item_count to each category
    const countMap: Record<string, number> = {};
    items.forEach((item) => {
      countMap[item.category_id] = (countMap[item.category_id] || 0) + 1;
    });

    return categories.map((cat) => ({
      ...cat,
      item_count: countMap[cat.id] || 0,
    }));
  }

  async addCategory(
    userId: string,
    data: { name: string; icon: string; color: string }
  ): Promise<BrainCategory> {
    const newCategory: BrainCategory = {
      id: `bcat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      name: data.name.trim(),
      icon: data.icon || 'Folder',
      color: data.color || 'purple',
      item_count: 0,
      created_at: new Date().toISOString(),
    };

    const catCacheKey = `${LS_CATEGORIES}${userId}`;
    const all = await this.fetchCategories(userId);
    const updated = [...all, newCategory];
    localStorage.setItem(catCacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data: created, error } = await supabase
          .from('brain_categories')
          .insert({
            user_id: userId,
            name: newCategory.name,
            icon: newCategory.icon,
            color: newCategory.color,
          })
          .select()
          .single();

        if (!error && created) {
          return { ...created, item_count: 0 } as BrainCategory;
        }
      } catch (err) {
        console.warn('Supabase add category failed:', err);
      }
    }

    return newCategory;
  }

  async updateCategory(
    userId: string,
    id: string,
    updates: Partial<Pick<BrainCategory, 'name' | 'icon' | 'color'>>
  ): Promise<BrainCategory> {
    const catCacheKey = `${LS_CATEGORIES}${userId}`;
    const all = await this.fetchCategories(userId);
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(catCacheKey, JSON.stringify(all));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('brain_categories')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return { ...data, item_count: updated.item_count } as BrainCategory;
        }
      } catch (err) {
        console.warn('Supabase update category failed:', err);
      }
    }

    return updated;
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const catCacheKey = `${LS_CATEGORIES}${userId}`;
    const itemCacheKey = `${LS_ITEMS}${userId}`;

    // Remove category
    const allCats = await this.fetchCategories(userId);
    const filteredCats = allCats.filter((c) => c.id !== id);
    localStorage.setItem(catCacheKey, JSON.stringify(filteredCats));

    // Remove all associated items
    const allItems = await this.fetchAllItems(userId);
    const filteredItems = allItems.filter((i) => i.category_id !== id);
    localStorage.setItem(itemCacheKey, JSON.stringify(filteredItems));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('brain_categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete category failed:', err);
      }
    }
  }

  // ================= ITEMS =================

  async fetchAllItems(userId: string): Promise<BrainItem[]> {
    const itemCacheKey = `${LS_ITEMS}${userId}`;
    const cachedStr = localStorage.getItem(itemCacheKey);

    let items: BrainItem[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('brain_items')
          .select('*')
          .eq('user_id', userId)
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false });

        if (!error && data) {
          items = data.map((d) => ({
            ...d,
            links: Array.isArray(d.links) ? d.links : [],
            checklist: Array.isArray(d.checklist) ? d.checklist : [],
          })) as BrainItem[];
          localStorage.setItem(itemCacheKey, JSON.stringify(items));
        }
      } catch (err) {
        console.warn('Supabase fetch items failed, using cache:', err);
      }
    }

    if (items.length === 0 && cachedStr) {
      try {
        items = JSON.parse(cachedStr);
      } catch {}
    }

    if (items.length === 0 && !cachedStr) {
      items = INITIAL_ITEMS.map((it) => ({
        ...it,
        user_id: userId,
      }));
      localStorage.setItem(itemCacheKey, JSON.stringify(items));
    }

    return items;
  }

  async fetchItems(userId: string, categoryId?: string): Promise<BrainItem[]> {
    const all = await this.fetchAllItems(userId);
    const filtered = categoryId ? all.filter((i) => i.category_id === categoryId) : all;

    // Sort: Pinned first, then updated_at DESC
    return filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  }

  async addItem(
    userId: string,
    data: {
      category_id: string;
      title: string;
      notes?: string | null;
      links?: BrainLink[];
      checklist?: BrainChecklistItem[];
      is_pinned?: boolean;
    }
  ): Promise<BrainItem> {
    const now = new Date().toISOString();
    const newItem: BrainItem = {
      id: `bitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      category_id: data.category_id,
      title: data.title.trim(),
      notes: data.notes?.trim() || null,
      links: data.links || [],
      checklist: data.checklist || [],
      is_pinned: !!data.is_pinned,
      created_at: now,
      updated_at: now,
    };

    const itemCacheKey = `${LS_ITEMS}${userId}`;
    const all = await this.fetchAllItems(userId);
    const updated = [newItem, ...all];
    localStorage.setItem(itemCacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { data: created, error } = await supabase
          .from('brain_items')
          .insert({
            user_id: userId,
            category_id: newItem.category_id,
            title: newItem.title,
            notes: newItem.notes,
            links: newItem.links,
            checklist: newItem.checklist,
            is_pinned: newItem.is_pinned,
            created_at: newItem.created_at,
            updated_at: newItem.updated_at,
          })
          .select()
          .single();

        if (!error && created) {
          return {
            ...created,
            links: Array.isArray(created.links) ? created.links : [],
            checklist: Array.isArray(created.checklist) ? created.checklist : [],
          } as BrainItem;
        }
      } catch (err) {
        console.warn('Supabase add brain item failed:', err);
      }
    }

    return newItem;
  }

  async updateItem(
    userId: string,
    id: string,
    updates: Partial<BrainItem>
  ): Promise<BrainItem> {
    const itemCacheKey = `${LS_ITEMS}${userId}`;
    const all = await this.fetchAllItems(userId);
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Item not found');

    const updated: BrainItem = {
      ...all[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    all[idx] = updated;
    localStorage.setItem(itemCacheKey, JSON.stringify(all));

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('brain_items')
          .update({
            ...updates,
            updated_at: updated.updated_at,
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            links: Array.isArray(data.links) ? data.links : [],
            checklist: Array.isArray(data.checklist) ? data.checklist : [],
          } as BrainItem;
        }
      } catch (err) {
        console.warn('Supabase update brain item failed:', err);
      }
    }

    return updated;
  }

  async deleteItem(userId: string, id: string): Promise<void> {
    const itemCacheKey = `${LS_ITEMS}${userId}`;
    const all = await this.fetchAllItems(userId);
    const filtered = all.filter((i) => i.id !== id);
    localStorage.setItem(itemCacheKey, JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('brain_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete brain item failed:', err);
      }
    }
  }

  async togglePin(userId: string, itemId: string): Promise<BrainItem> {
    const all = await this.fetchAllItems(userId);
    const found = all.find((i) => i.id === itemId);
    if (!found) throw new Error('Item not found');

    return this.updateItem(userId, itemId, { is_pinned: !found.is_pinned });
  }

  // ================= REALTIME =================

  subscribeToBrain(userId: string, callback: () => void) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`brain_changes_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'brain_categories', filter: `user_id=eq.${userId}` },
        () => callback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'brain_items', filter: `user_id=eq.${userId}` },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const brainService = new BrainService();
